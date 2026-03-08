<?php

namespace App\Http\Controllers;

use App\Models\BorrowRequest;
use App\Models\Item;
use Illuminate\Http\Request;

class BorrowRequestController extends Controller
{
    // User creates a borrow request
    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_id' => 'required|exists:items,id',
            'office_id' => 'required|exists:offices,id',
            'reason' => 'nullable|string|max:500',
        ]);

        // Check if item is available
        $item = Item::find($validated['item_id']);
        if ($item->status !== 'Available') {
            return response()->json(['message' => 'Item is not available for borrowing'], 422);
        }

        $validated['user_id'] = auth()->id();
        $validated['requested_at'] = now();

        $borrowRequest = BorrowRequest::create($validated);
        $borrowRequest->load(['user', 'item', 'office']);

        return response()->json($borrowRequest, 201);
    }

    // Get user's own borrow requests
    public function myRequests()
    {
        $requests = BorrowRequest::where('user_id', auth()->id())
            ->with(['item', 'office', 'user'])
            ->orderBy('requested_at', 'desc')
            ->get();

        return response()->json($requests);
    }

    // Admin: Get all pending requests
    public function pending()
    {
        $requests = BorrowRequest::where('status', 'pending')
            ->with(['user', 'item', 'office'])
            ->orderBy('requested_at', 'desc')
            ->get();

        return response()->json($requests);
    }

    // Admin: Approve a request
    public function approve(BorrowRequest $borrowRequest, Request $request)
    {
        $validated = $request->validate([
            'approver_notes' => 'nullable|string|max:500',
        ]);

        $borrowRequest->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approver_notes' => $validated['approver_notes'] ?? null,
        ]);

        // Update item status to borrowed
        $borrowRequest->item()->update(['status' => 'Borrowed']);

        $borrowRequest->load(['user', 'item', 'office']);
        return response()->json($borrowRequest);
    }

    // Admin: Reject a request
    public function reject(BorrowRequest $borrowRequest, Request $request)
    {
        $validated = $request->validate([
            'approver_notes' => 'nullable|string|max:500',
        ]);

        $borrowRequest->update([
            'status' => 'rejected',
            'approver_notes' => $validated['approver_notes'] ?? null,
        ]);

        $borrowRequest->load(['user', 'item', 'office']);
        return response()->json($borrowRequest);
    }

    // Admin: Mark as borrowed (item has been picked up)
    public function markBorrowed(BorrowRequest $borrowRequest)
    {
        if ($borrowRequest->status !== 'approved') {
            return response()->json(['message' => 'Request must be approved first'], 422);
        }

        $borrowRequest->update([
            'status' => 'borrowed',
            'borrowed_at' => now(),
        ]);

        $borrowRequest->load(['user', 'item', 'office']);
        return response()->json($borrowRequest);
    }

    // Admin: Mark as returned
    public function markReturned(BorrowRequest $borrowRequest)
    {
        if ($borrowRequest->status !== 'borrowed') {
            return response()->json(['message' => 'Request must be borrowed first'], 422);
        }

        $borrowRequest->update([
            'status' => 'returned',
            'returned_at' => now(),
        ]);

        // Update item status back to available
        $borrowRequest->item()->update(['status' => 'Available']);

        $borrowRequest->load(['user', 'item', 'office']);
        return response()->json($borrowRequest);
    }

    // Get borrow history for a specific item
    public function itemHistory($itemId)
    {
        $history = BorrowRequest::where('item_id', $itemId)
            ->with(['user', 'office'])
            ->orderBy('requested_at', 'desc')
            ->get();

        return response()->json($history);
    }

    // Get borrow history for a specific location
    public function locationHistory($officeId)
    {
        $history = BorrowRequest::where('office_id', $officeId)
            ->with(['user', 'item'])
            ->orderBy('requested_at', 'desc')
            ->get();

        return response()->json($history);
    }

    public function show(BorrowRequest $borrowRequest)
    {
        $borrowRequest->load(['user', 'item', 'office']);
        return response()->json($borrowRequest);
    }
}
