<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class PurchaseRequestController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchaseRequest::with(['office', 'requestedBy', 'approvedBy', 'items']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by office
        if ($request->has('office_id')) {
            $query->where('office_id', $request->office_id);
        }

        // Filter by requested_by (user who submitted the request)
        if ($request->has('requested_by')) {
            $query->where('requested_by', $request->requested_by);
        }

        $purchaseRequests = $query->latest()->get();

        return response()->json($purchaseRequests);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'office_id' => 'required|exists:offices,id',
            'purpose' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit' => 'required|string|max:50',
            'items.*.estimated_unit_price' => 'required|numeric|min:0',
            'items.*.urgency' => 'required|in:Low,Medium,High,Critical',
            'items.*.specifications' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {
            // Generate PR number
            $prNumber = 'PR-' . date('Ymd') . '-' . str_pad(PurchaseRequest::count() + 1, 4, '0', STR_PAD_LEFT);

            $purchaseRequest = PurchaseRequest::create([
                'pr_number' => $prNumber,
                'office_id' => $request->office_id,
                'requested_by' => $request->user()->id,
                'purpose' => $request->purpose,
                'status' => 'Pending',
                'total_estimated_cost' => 0,
            ]);

            $totalCost = 0;

            // Create purchase request items
            foreach ($request->items as $itemData) {
                $itemTotal = $itemData['quantity'] * $itemData['estimated_unit_price'];
                $totalCost += $itemTotal;

                PurchaseRequestItem::create([
                    'purchase_request_id' => $purchaseRequest->id,
                    'item_name' => $itemData['item_name'],
                    'description' => $itemData['description'] ?? null,
                    'quantity' => $itemData['quantity'],
                    'unit' => $itemData['unit'],
                    'estimated_unit_price' => $itemData['estimated_unit_price'],
                    'estimated_total_price' => $itemTotal,
                    'urgency' => $itemData['urgency'],
                    'specifications' => $itemData['specifications'] ?? null,
                ]);
            }

            // Update total cost
            $purchaseRequest->update(['total_estimated_cost' => $totalCost]);

            DB::commit();

            $purchaseRequest->load(['office', 'requestedBy', 'items']);

            return response()->json([
                'message' => 'Purchase request created successfully',
                'purchase_request' => $purchaseRequest
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create purchase request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(PurchaseRequest $purchaseRequest)
    {
        $purchaseRequest->load(['office', 'requestedBy', 'approvedBy', 'items']);

        return response()->json($purchaseRequest);
    }

    public function update(Request $request, PurchaseRequest $purchaseRequest)
    {
        // Only allow updates for draft or pending PRs
        if (!in_array($purchaseRequest->status, ['Draft', 'Pending'])) {
            return response()->json([
                'message' => 'Cannot update purchase request in current status'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'purpose' => 'sometimes|required|string',
            'items' => 'sometimes|array|min:1',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit' => 'required|string|max:50',
            'items.*.estimated_unit_price' => 'required|numeric|min:0',
            'items.*.urgency' => 'required|in:Low,Medium,High,Critical',
            'items.*.specifications' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {
            $purchaseRequest->update([
                'purpose' => $request->purpose ?? $purchaseRequest->purpose,
            ]);

            // Update items if provided
            if ($request->has('items')) {
                // Delete existing items
                $purchaseRequest->items()->delete();

                $totalCost = 0;

                // Create new items
                foreach ($request->items as $itemData) {
                    $itemTotal = $itemData['quantity'] * $itemData['estimated_unit_price'];
                    $totalCost += $itemTotal;

                    PurchaseRequestItem::create([
                        'purchase_request_id' => $purchaseRequest->id,
                        ...$itemData,
                        'estimated_total_price' => $itemTotal,
                    ]);
                }

                // Update total cost
                $purchaseRequest->update(['total_estimated_cost' => $totalCost]);
            }

            DB::commit();

            $purchaseRequest->load(['office', 'requestedBy', 'items']);

            return response()->json([
                'message' => 'Purchase request updated successfully',
                'purchase_request' => $purchaseRequest
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update purchase request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(PurchaseRequest $purchaseRequest)
    {
        // Only allow deletion for draft PRs
        if ($purchaseRequest->status !== 'Draft') {
            return response()->json([
                'message' => 'Cannot delete purchase request in current status'
            ], 422);
        }

        $purchaseRequest->delete();

        return response()->json(['message' => 'Purchase request deleted successfully']);
    }

    public function approve(Request $request, PurchaseRequest $purchaseRequestRecord)
    {
        if ($purchaseRequestRecord->status !== 'Pending') {
            return response()->json([
                'message' => 'Purchase request is not pending approval',
                'debug' => [
                    'purchase_request_id' => $purchaseRequestRecord->id ?? null,
                    'status' => $purchaseRequestRecord->status ?? null,
                    'requested_by' => $purchaseRequestRecord->requested_by ?? null,
                ]
            ], 422);
        }

        $purchaseRequestRecord->update([
            'status' => 'Approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        $purchaseRequestRecord->load(['office', 'requestedBy', 'approvedBy', 'items']);

        return response()->json([
            'message' => 'Purchase request approved successfully',
            'purchase_request' => $purchaseRequestRecord
        ]);
    }

    public function reject(Request $request, PurchaseRequest $purchaseRequestRecord)
    {
        if ($purchaseRequestRecord->status !== 'Pending') {
            return response()->json([
                'message' => 'Purchase request is not pending approval',
                'debug' => [
                    'purchase_request_id' => $purchaseRequestRecord->id ?? null,
                    'status' => $purchaseRequestRecord->status ?? null,
                    'requested_by' => $purchaseRequestRecord->requested_by ?? null,
                ]
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

        $purchaseRequestRecord->update([
            'status' => 'Rejected',
            'notes' => $request->notes,
        ]);

        return response()->json([
            'message' => 'Purchase request rejected successfully',
            'purchase_request' => $purchaseRequestRecord
        ]);
    }
}