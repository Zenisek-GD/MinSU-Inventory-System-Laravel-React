<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Item;
use Illuminate\Http\Request;
use Validator;
use App\Services\StockService;
use Illuminate\Support\Facades\DB;

class ItemController extends Controller
{
    protected $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    public function index(Request $request)
    {
        $query = Item::with(['office', 'category', 'borrowRecords.borrowedBy']);

        // Filter by office
        if ($request->has('office_id')) {
            $query->where('office_id', $request->office_id);
        }

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by condition
        if ($request->has('condition')) {
            $query->where('condition', $request->condition);
        }

        $items = $query->latest()->get();

        // Add current borrow information to each item
        $items->each(function ($item) {
            $currentBorrow = $item->borrowRecords->where('status', 'Approved')->first();
            $item->currentBorrow = $currentBorrow ? [
                'id' => $currentBorrow->id,
                'status' => $currentBorrow->status,
                'borrowedBy' => $currentBorrow->borrowedBy,
                'borrowed_at' => $currentBorrow->created_at,
                'expected_return_date' => $currentBorrow->expected_return_date
            ] : null;

            // Update display status based on borrow records
            if ($currentBorrow) {
                $item->display_status = 'Borrowed';
            } else {
                $item->display_status = $item->status;
            }
        });

        return response()->json(['data' => $items]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_id' => 'required|exists:categories,id',
            'office_id' => 'required|exists:offices,id',
            'serial_number' => 'nullable|string|max:255|unique:items,serial_number',
            'condition' => 'required|in:Excellent,Good,Fair,Needs Repair,Damaged,Disposed',
            'purchase_date' => 'nullable|date',
            'purchase_price' => 'nullable|numeric|min:0',
            'warranty_expiry' => 'nullable|date|after_or_equal:purchase_date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Generate unique QR code
        $qrCode = 'ITEM-' . strtoupper(uniqid());

        $item = Item::create([
            'name' => $request->name,
            'description' => $request->description,
            'category_id' => $request->category_id,
            'qr_code' => $qrCode,
            'serial_number' => $request->serial_number,
            'condition' => $request->condition,
            'status' => $request->status ?? 'Available',
            'office_id' => $request->office_id,
            'purchase_date' => $request->purchase_date,
            'purchase_price' => $request->purchase_price,
            'warranty_expiry' => $request->warranty_expiry,
            'notes' => $request->notes,
        ]);

        $item->load(['office', 'category']);

        return response()->json([
            'message' => 'Item created successfully',
            'item' => $item
        ], 201);
    }

    public function show(Item $item)
    {
        $item->load([
            'office',
            'category',
            'borrowRecords.user',
            'conditionAudits.checkedBy',
            'currentBorrow.user'
        ]);

        return response()->json($item);
    }

    public function showByQr($qr_code)
    {
        $item = Item::with([
            'office',
            'category',
            'borrowRecords.borrowedBy',
            'conditionAudits' => function ($query) {
                $query->latest()->limit(5);
            }
        ])->where('qr_code', $qr_code)->firstOrFail();

        // Add current borrow as an accessor (not eager loaded)
        $item->current_borrow = $item->getCurrentBorrowAttribute();

        return response()->json($item);
    }

    public function update(Request $request, Item $item)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'category_id' => 'sometimes|required|exists:categories,id',
            'office_id' => 'sometimes|required|exists:offices,id',
            'serial_number' => 'nullable|string|max:255|unique:items,serial_number,' . $item->id,
            'condition' => 'sometimes|required|in:Excellent,Good,Fair,Needs Repair,Damaged,Disposed',
            'status' => 'sometimes|required|in:Available,Borrowed,Under Maintenance,Lost,Disposed',
            'purchase_date' => 'nullable|date',
            'purchase_price' => 'nullable|numeric|min:0',
            'warranty_expiry' => 'nullable|date|after_or_equal:purchase_date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Check if office is changing (automatic transfer)
            if ($request->has('office_id') && $item->office_id != $request->office_id) {
                $oldOfficeId = $item->office_id;
                $newOfficeId = $request->office_id;

                // Auto-create transfer stock movement
                $this->stockService->recordMovement([
                    'item_id' => $item->id,
                    'type' => 'transfer',
                    'quantity' => 1, // Assuming single item transfer
                    'from_office_id' => $oldOfficeId,
                    'to_office_id' => $newOfficeId,
                    'reference_number' => 'AUTO-TRANSFER-' . time(),
                    'notes' => 'Automatic transfer: Office changed from ' . $item->office->name . ' to office #' . $newOfficeId,
                    'performed_by' => $request->user()->id,
                ]);
            }

            // Check if status is changing to Disposed (automatic disposal)
            if ($request->has('status') && $request->status === 'Disposed' && $item->status !== 'Disposed') {
                $this->stockService->recordMovement([
                    'item_id' => $item->id,
                    'type' => 'disposal',
                    'quantity' => -1,
                    'reference_number' => 'AUTO-DISPOSAL-' . time(),
                    'notes' => 'Automatic disposal: Item status changed to Disposed. Reason: ' . ($request->notes ?? 'Not specified'),
                    'performed_by' => $request->user()->id,
                ]);
            }

            // Check if condition is changing to Damaged (automatic damage record)
            if ($request->has('condition') && in_array($request->condition, ['Damaged', 'Needs Repair']) && !in_array($item->condition, ['Damaged', 'Needs Repair'])) {
                $this->stockService->recordMovement([
                    'item_id' => $item->id,
                    'type' => 'damage',
                    'quantity' => 0, // Not removing from stock, just recording damage
                    'reference_number' => 'AUTO-DAMAGE-' . time(),
                    'notes' => 'Automatic damage record: Item condition changed to ' . $request->condition . '. ' . ($request->notes ?? ''),
                    'performed_by' => $request->user()->id,
                ]);
            }

            $item->update($request->all());
            $item->load(['office', 'category']);

            DB::commit();

            return response()->json([
                'message' => 'Item updated successfully',
                'item' => $item
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Item update failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to update item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Item $item)
    {
        if ($item->borrowRecords()->whereIn('status', ['Pending', 'Approved', 'Borrowed'])->exists()) {
            return response()->json([
                'message' => 'Cannot delete item with active borrow records'
            ], 422);
        }

        $item->delete();

        return response()->json(['message' => 'Item deleted successfully']);
    }

    //public function generateQr(Item $item)
    //{
    //    $qrCode = QrCode::size(300)->generate($item->qr_code);

    //    return response()->json([
    //        'qr_code' => $item->qr_code,
    //        'qr_image' => $qrCode
    //    ]);
    // }


}
