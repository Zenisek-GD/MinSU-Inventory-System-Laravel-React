<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\BorrowRecord;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class BorrowController extends Controller
{
    public function index(Request $request)
    {
        $query = BorrowRecord::with(['item.office', 'item.category', 'borrowedBy.office', 'approvedBy']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('borrowed_by', $request->user_id);
        }

        $borrowRecords = $query->latest()->get();

        return response()->json($borrowRecords);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'item_id' => 'required|exists:items,id',
            'borrow_date' => 'required|date|after_or_equal:today',
            'expected_return_date' => 'required|date|after:borrow_date',
            'purpose' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {
            $item = Item::findOrFail($request->item_id);

            // Check if item is available
            if ($item->status !== 'Available') {
                return response()->json([
                    'message' => 'Item is not available for borrowing'
                ], 422);
            }

            // Check item condition
            if (in_array($item->condition, ['Damaged', 'Disposed'])) {
                return response()->json([
                    'message' => 'Item cannot be borrowed in its current condition'
                ], 422);
            }

            $borrowRecord = BorrowRecord::create([
                'item_id' => $request->item_id,
                'borrowed_by' => $request->user()->id,
                'borrow_date' => $request->borrow_date,
                'expected_return_date' => $request->expected_return_date,
                'purpose' => $request->purpose,
                'condition_before' => $item->condition,
                'status' => 'Pending',
            ]);

            DB::commit();

            $borrowRecord->load(['item.office', 'item.category', 'borrowedBy']);

            return response()->json([
                'message' => 'Borrow request submitted successfully',
                'borrow_record' => $borrowRecord
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create borrow request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(BorrowRecord $borrowRecord)
    {
        $borrowRecord->load(['item.office', 'item.category', 'borrowedBy.office', 'approvedBy']);

        return response()->json($borrowRecord);
    }

    public function update(Request $request, BorrowRecord $borrowRecord)
    {
        // Only allow updates for pending requests
        if ($borrowRecord->status !== 'Pending') {
            return response()->json([
                'message' => 'Cannot update borrow request in current status'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'borrow_date' => 'sometimes|required|date|after_or_equal:today',
            'expected_return_date' => 'sometimes|required|date|after:borrow_date',
            'purpose' => 'sometimes|required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $borrowRecord->update($request->all());
        $borrowRecord->load(['item.office', 'item.category', 'borrowedBy']);

        return response()->json([
            'message' => 'Borrow request updated successfully',
            'borrow_record' => $borrowRecord
        ]);
    }

    public function destroy(BorrowRecord $borrowRecord)
    {
        // Only allow deletion for pending requests
        if ($borrowRecord->status !== 'Pending') {
            return response()->json([
                'message' => 'Cannot delete borrow request in current status'
            ], 422);
        }

        $borrowRecord->delete();

        return response()->json(['message' => 'Borrow request deleted successfully']);
    }

    public function approve(Request $request, BorrowRecord $borrowRecord)
    {

        if ($borrowRecord->status !== 'Pending') {
            return response()->json([
                'message' => 'Borrow request is not pending approval',
                'debug' => [
                    'borrow_id' => $borrowRecord->id,
                    'status' => $borrowRecord->status,
                    'item_id' => $borrowRecord->item_id,
                ]
            ], 422);
        }

        DB::beginTransaction();

        try {

            $item = $borrowRecord->item;

            // Check if item is still available
            if ($item->status !== 'Available') {
                return response()->json([
                    'message' => 'Item is no longer available',
                    'debug' => [
                        'item_id' => $item->id,
                        'item_status' => $item->status,
                        'borrow_id' => $borrowRecord->id,
                        'borrow_status' => $borrowRecord->status,
                    ]
                ], 422);
            }

            $borrowRecord->update([
                'status' => 'Approved',
                'approved_by' => $request->user()->id,
            ]);

            // Update item status
            $item->update(['status' => 'Borrowed']);

            DB::commit();

            $borrowRecord->load(['item.office', 'item.category', 'borrowedBy', 'approvedBy']);

            return response()->json([
                'message' => 'Borrow request approved successfully',
                'borrow_record' => $borrowRecord
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to approve borrow request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function reject(Request $request, BorrowRecord $borrowRecord)
    {
        if ($borrowRecord->status !== 'Pending') {
            return response()->json([
                'message' => 'Borrow request is not pending approval'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'notes' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $borrowRecord->update([
            'status' => 'Rejected',
            'notes' => $request->notes,
        ]);

        return response()->json([
            'message' => 'Borrow request rejected successfully',
            'borrow_record' => $borrowRecord
        ]);
    }

    public function returnItem(Request $request, BorrowRecord $borrowRecord)
    {
        if (!in_array($borrowRecord->status, ['Approved', 'Borrowed'])) {
            return response()->json([
                'message' => 'Item is not currently borrowed'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'condition_after' => 'required|in:Excellent,Good,Fair,Needs Repair,Damaged',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {
            $borrowRecord->update([
                'actual_return_date' => now(),
                'condition_after' => $request->condition_after,
                'status' => 'Returned',
                'notes' => $request->notes ?? $borrowRecord->notes,
            ]);

            // Update item status and condition
            $borrowRecord->item->update([
                'status' => 'Available',
                'condition' => $request->condition_after
            ]);

            DB::commit();

            $borrowRecord->load(['item.office', 'item.category', 'borrowedBy', 'approvedBy']);

            return response()->json([
                'message' => 'Item returned successfully',
                'borrow_record' => $borrowRecord
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to return item',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
