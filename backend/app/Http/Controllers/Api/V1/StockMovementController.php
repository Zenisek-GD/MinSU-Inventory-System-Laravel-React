<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\StockService;
use App\Models\StockMovement;
use Illuminate\Support\Facades\Validator;

class StockMovementController extends Controller
{
    protected $service;

    public function __construct(StockService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        try {
            $this->authorize('viewAny', StockMovement::class);
            $query = StockMovement::with('item')->latest();

            if ($request->has('item_id')) {
                $query->where('item_id', $request->item_id);
            }

            $movements = $query->get();
            return response()->json($movements);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'message' => 'Unauthorized to view stock movements'
            ], 403);
        } catch (\Exception $e) {
            \Log::error('Stock movements index error: ' . $e->getMessage() . ' at ' . $e->getFile() . ':' . $e->getLine());
            return response()->json([
                'message' => 'Failed to fetch stock movements',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $this->authorize('create', StockMovement::class);
        $validator = Validator::make($request->all(), [
            'item_id' => 'required|exists:items,id',
            'change_qty' => 'required|numeric',
            'movement_type' => 'required|in:incoming,outgoing,adjustment',
            'reason' => 'nullable|string',
            'from_office_id' => 'nullable|exists:offices,id',
            'to_office_id' => 'nullable|exists:offices,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        $data = $request->only(['item_id', 'change_qty', 'movement_type', 'reason', 'reference_type', 'reference_id', 'from_office_id', 'to_office_id', 'notes']);
        $data['performed_by'] = $request->user()->id;

        $movement = $this->service->recordMovement($data);

        return response()->json(['message' => 'Stock movement recorded', 'stock_movement' => $movement], 201);
    }
}
