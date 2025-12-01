<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\StockService;
use App\Models\StockMovement;
use Illuminate\Support\Facades\Validator;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class StockMovementController extends Controller
{
    use AuthorizesRequests;

    protected $service;

    public function __construct(StockService $service)
    {
        $this->service = $service;
    }

    /**
     * Get all stock movements with filtering
     */
    public function index(Request $request)
    {
        try {
            $this->authorize('viewAny', StockMovement::class);

            $query = StockMovement::with(['item', 'performedBy', 'fromOffice', 'toOffice'])
                ->latest();

            // Filter by item if specified
            if ($request->has('item_id')) {
                $query->where('item_id', $request->item_id);
            }

            // Filter by type if specified
            if ($request->has('type')) {
                $query->where('type', $request->type);
            }

            // Filter by date range
            if ($request->has('from_date')) {
                $query->where('created_at', '>=', $request->from_date);
            }
            if ($request->has('to_date')) {
                $query->where('created_at', '<=', $request->to_date);
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

    /**
     * Create a new stock movement (ledger entry)
     */
    public function store(Request $request)
    {
        try {
            $this->authorize('create', StockMovement::class);

            $validator = Validator::make($request->all(), [
                'item_id' => 'required|exists:items,id',
                'type' => 'required|in:purchase,transfer,adjustment,damage,disposal',
                'quantity' => 'required|numeric',
                'from_office_id' => 'nullable|exists:offices,id',
                'to_office_id' => 'nullable|exists:offices,id',
                'reference_number' => 'nullable|string|max:255',
                'notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->only([
                'item_id',
                'type',
                'quantity',
                'from_office_id',
                'to_office_id',
                'reference_number',
                'notes'
            ]);

            $data['performed_by'] = $request->user()->id;

            $movement = $this->service->recordMovement($data);

            return response()->json([
                'message' => 'Stock movement recorded successfully',
                'stock_movement' => $movement
            ], 201);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'message' => 'Unauthorized to create stock movements'
            ], 403);
        } catch (\Exception $e) {
            \Log::error('Stock movement store error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to record stock movement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get stock summary for an item (ledger totals)
     */
    public function itemSummary($itemId)
    {
        try {
            $this->authorize('viewAny', StockMovement::class);

            $movements = StockMovement::where('item_id', $itemId)->get();

            $summary = [
                'item_id' => $itemId,
                'total_movements' => $movements->count(),
                'purchases' => $movements->where('type', 'purchase')->sum('quantity'),
                'transfers' => $movements->where('type', 'transfer')->sum('quantity'),
                'adjustments' => $movements->where('type', 'adjustment')->sum('quantity'),
                'damages' => $movements->where('type', 'damage')->sum('quantity'),
                'disposals' => $movements->where('type', 'disposal')->sum('quantity'),
                'calculated_stock' => $movements->sum('quantity'),
            ];

            return response()->json($summary);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch item summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reconcile item stock (fix discrepancies between current_stock and ledger)
     */
    public function reconcile($itemId)
    {
        try {
            $this->authorize('create', StockMovement::class);

            $result = $this->service->reconcileStock($itemId);

            return response()->json([
                'message' => 'Stock reconciliation completed',
                'result' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to reconcile stock',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
