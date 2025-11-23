<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Illuminate\Http\Request;

class ReportsController extends Controller
{
    /**
     * Get items report with filters
     */
    public function itemsReport(Request $request)
    {
        $query = Item::query();

        // Filter by date range (purchase_date)
        if ($request->has('start_date') && $request->start_date) {
            $query->where('purchase_date', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date) {
            $query->where('purchase_date', '<=', $request->end_date);
        }

        // Filter by office
        if ($request->has('office_id') && $request->office_id) {
            $query->where('office_id', $request->office_id);
        }

        // Filter by category
        if ($request->has('category_id') && $request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        // Filter by status
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Eager load relationships
        $items = $query->with(['category', 'office'])->get();

        // Count stats
        $totalItems = $items->count();
        $availableCount = $items->where('status', 'Available')->count();
        $borrowedCount = $items->where('status', 'Borrowed')->count();
        $inactiveCount = $items->where('status', 'Inactive')->count();

        return response()->json([
            'success' => true,
            'data' => $items,
            'stats' => [
                'total_items' => $totalItems,
                'available' => $availableCount,
                'borrowed' => $borrowedCount,
                'inactive' => $inactiveCount,
            ],
            'filters' => [
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'office_id' => $request->office_id,
                'category_id' => $request->category_id,
                'status' => $request->status,
            ],
        ]);
    }

    /**
     * Get borrow records report
     */
    public function borrowsReport(Request $request)
    {
        $query = \App\Models\BorrowRecord::query();

        if ($request->has('start_date') && $request->start_date) {
            $query->where('borrow_date', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date) {
            $query->where('borrow_date', '<=', $request->end_date);
        }

        if ($request->has('office_id') && $request->office_id) {
            $query->whereHas('item', fn($q) => $q->where('office_id', $request->office_id));
        }

        $borrows = $query->with(['item', 'borrowedBy', 'approvedBy'])->get();

        return response()->json([
            'success' => true,
            'data' => $borrows,
            'stats' => [
                'total_borrows' => $borrows->count(),
                'pending' => $borrows->where('status', 'pending')->count(),
                'approved' => $borrows->where('status', 'approved')->count(),
                'returned' => $borrows->where('status', 'returned')->count(),
            ],
        ]);
    }

    /**
     * Get purchase requests report
     */
    public function purchaseRequestsReport(Request $request)
    {
        $query = \App\Models\PurchaseRequest::query();

        if ($request->has('start_date') && $request->start_date) {
            $query->where('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date) {
            $query->where('created_at', '<=', $request->end_date);
        }

        $requests = $query->with(['requestedBy', 'approvedBy', 'items'])->get();

        return response()->json([
            'success' => true,
            'data' => $requests,
            'stats' => [
                'total_requests' => $requests->count(),
                'pending' => $requests->where('status', 'pending')->count(),
                'approved' => $requests->where('status', 'approved')->count(),
                'rejected' => $requests->where('status', 'rejected')->count(),
            ],
        ]);
    }
}
