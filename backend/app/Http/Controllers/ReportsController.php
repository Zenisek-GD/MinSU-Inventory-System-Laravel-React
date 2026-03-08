<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\BorrowRecord;
use App\Models\PurchaseRequest;
use App\Models\MemorandumReceipt;
use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReportsController extends Controller
{
    /**
     * Get items report with filters
     */
    public function itemsReport(Request $request)
    {
        $query = Item::query();

        if ($request->has('start_date') && $request->start_date) {
            $query->where('purchase_date', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date) {
            $query->where('purchase_date', '<=', $request->end_date);
        }
        if ($request->has('office_id') && $request->office_id) {
            $query->where('office_id', $request->office_id);
        }
        if ($request->has('category_id') && $request->category_id) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $items = $query->with(['category', 'office'])->get();

        return response()->json([
            'success' => true,
            'data' => $items,
            'stats' => [
                'total_items' => $items->count(),
                'available' => $items->where('status', 'Available')->count(),
                'borrowed' => $items->where('status', 'Borrowed')->count(),
                'inactive' => $items->where('status', 'Inactive')->count(),
                'total_value' => $items->sum('purchase_price'),
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
        $query = BorrowRecord::query();

        if ($request->has('start_date') && $request->start_date) {
            $query->where('borrow_date', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date) {
            $query->where('borrow_date', '<=', $request->end_date);
        }
        if ($request->has('office_id') && $request->office_id) {
            $query->whereHas('item', fn($q) => $q->where('office_id', $request->office_id));
        }
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $borrows = $query->with(['item.category', 'item.office', 'borrowedBy', 'approvedBy'])
            ->orderByDesc('borrow_date')
            ->get();

        $now = Carbon::now();

        return response()->json([
            'success' => true,
            'data' => $borrows,
            'stats' => [
                'total_borrows' => $borrows->count(),
                'pending' => $borrows->where('status', 'Pending')->count(),
                'approved' => $borrows->where('status', 'Approved')->count(),
                'borrowed' => $borrows->where('status', 'Borrowed')->count(),
                'returned' => $borrows->where('status', 'Returned')->count(),
                'overdue' => $borrows->filter(function ($b) use ($now) {
                    return $b->status === 'Approved'
                        && $b->expected_return_date
                        && Carbon::parse($b->expected_return_date)->lt($now);
                })->count(),
            ],
        ]);
    }

    /**
     * Get purchase requests report
     */
    public function purchaseRequestsReport(Request $request)
    {
        $query = PurchaseRequest::query();

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

    /**
     * Get consumable stock levels report
     */
    public function stockLevelsReport(Request $request)
    {
        $query = Item::where('item_type', 'consumable');

        if ($request->has('office_id') && $request->office_id) {
            $query->where('office_id', $request->office_id);
        }
        if ($request->has('category_id') && $request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        $items = $query->with(['category', 'office'])->orderBy('name')->get();

        // Compute stock_status for each item
        $items = $items->map(function ($item) {
            $stock = (int) ($item->stock ?? 0);
            $reorder = $item->reorder_level !== null ? (int) $item->reorder_level : null;
            $safetyStock = $item->safety_stock !== null ? (int) $item->safety_stock : null;

            if ($safetyStock !== null && $stock <= $safetyStock) {
                $item->stock_status = 'Critical';
            } elseif ($reorder !== null && $stock <= $reorder) {
                $item->stock_status = 'Low';
            } else {
                $item->stock_status = 'OK';
            }

            return $item;
        });

        // Apply stock_status filter after computing
        if ($request->has('stock_status') && $request->stock_status) {
            $items = $items->where('stock_status', $request->stock_status)->values();
        }

        return response()->json([
            'success' => true,
            'data' => $items,
            'stats' => [
                'total_consumables' => $items->count(),
                'critical' => $items->where('stock_status', 'Critical')->count(),
                'low' => $items->where('stock_status', 'Low')->count(),
                'ok' => $items->where('stock_status', 'OK')->count(),
            ],
        ]);
    }

    /**
     * Aggregated notification alerts for the Navbar bell icon.
     * Covers: pending borrows, overdue borrows, low-stock consumables, items needing maintenance.
     */
    public function notificationAlerts()
    {
        $now = Carbon::now();
        $alerts = [];

        // --- Pending borrow requests ---
        $pendingBorrows = BorrowRecord::where('status', 'Pending')
            ->with(['item', 'borrowedBy'])
            ->orderByDesc('created_at')
            ->get();

        foreach ($pendingBorrows as $b) {
            $alerts[] = [
                'id' => 'borrow-' . $b->id,
                'type' => 'borrow_pending',
                'title' => 'New Borrow Request',
                'message' => ($b->borrowedBy->name ?? 'Someone') . ' requested to borrow ' . ($b->item->name ?? 'an item'),
                'time' => $b->created_at,
                'color' => 'warning',
                'link' => '/borrows',
            ];
        }

        // --- Overdue borrows ---
        $overdueBorrows = BorrowRecord::where('status', 'Approved')
            ->whereNotNull('expected_return_date')
            ->where('expected_return_date', '<', $now)
            ->with(['item', 'borrowedBy'])
            ->get();

        foreach ($overdueBorrows as $b) {
            $days = $now->diffInDays(Carbon::parse($b->expected_return_date));
            $alerts[] = [
                'id' => 'overdue-' . $b->id,
                'type' => 'borrow_overdue',
                'title' => 'Overdue Borrow',
                'message' => ($b->item->name ?? 'Item') . ' is overdue by ' . $days . ' day' . ($days !== 1 ? 's' : ''),
                'time' => $b->expected_return_date,
                'color' => 'error',
                'link' => '/borrows',
            ];
        }

        // --- Low-stock consumables ---
        $lowStockItems = Item::where('item_type', 'consumable')
            ->whereNotNull('reorder_level')
            ->whereRaw('stock <= reorder_level')
            ->with(['category'])
            ->get();

        foreach ($lowStockItems as $item) {
            $isCritical = $item->safety_stock !== null && $item->stock <= $item->safety_stock;
            $alerts[] = [
                'id' => 'lowstock-' . $item->id,
                'type' => 'low_stock',
                'title' => $isCritical ? 'Critical Stock Level' : 'Low Stock Alert',
                'message' => $item->name . ' — only ' . $item->stock . ' ' . ($item->unit ?? 'units') . ' remaining',
                'time' => $item->updated_at,
                'color' => $isCritical ? 'error' : 'warning',
                'link' => '/items',
            ];
        }

        // --- Items needing maintenance ---
        $maintenanceItems = Item::where(function ($q) {
            $q->whereIn('condition', ['Needs Repair', 'Damaged'])
                ->orWhere('status', 'Under Maintenance');
        })->with(['office'])->get();

        foreach ($maintenanceItems as $item) {
            $alerts[] = [
                'id' => 'maintenance-' . $item->id,
                'type' => 'needs_maintenance',
                'title' => 'Item Needs Maintenance',
                'message' => $item->name . ' (' . ($item->serial_number ?? 'No S/N') . ') — Condition: ' . $item->condition,
                'time' => $item->updated_at,
                'color' => 'info',
                'link' => '/items',
            ];
        }

        // --- MR Notifications for Supply Officers and Admins ---
        $user = auth()->user();
        if ($user && in_array($user->role, ['admin', 'supply_officer'])) {
            // Get unread MR-related notifications
            $mrNotifications = Notification::where('user_id', $user->id)
                ->whereIn('type', ['mr_created', 'mr_pending_approval'])
                ->whereNull('read_at')
                ->orderByDesc('created_at')
                ->get();

            foreach ($mrNotifications as $notif) {
                $alerts[] = [
                    'id' => 'notification-' . $notif->id,
                    'type' => $notif->type,
                    'title' => $notif->title,
                    'message' => $notif->message,
                    'time' => $notif->created_at,
                    'color' => $notif->color,
                    'link' => $notif->action_link ?? '/memorandum-receipts',
                ];
            }
        } elseif ($user && $user->role === 'staff') {
            // Get MR-related notifications for staff (approvals/rejections of their MRs)
            $mrNotifications = Notification::where('user_id', $user->id)
                ->whereIn('type', ['mr_approved', 'mr_rejected'])
                ->whereNull('read_at')
                ->orderByDesc('created_at')
                ->get();

            foreach ($mrNotifications as $notif) {
                $alerts[] = [
                    'id' => 'notification-' . $notif->id,
                    'type' => $notif->type,
                    'title' => $notif->title,
                    'message' => $notif->message,
                    'time' => $notif->created_at,
                    'color' => $notif->color,
                    'link' => $notif->action_link ?? '/memorandum-receipts',
                ];
            }
        }

        // Sort newest-first
        usort($alerts, fn($a, $b) => strtotime((string) $b['time']) - strtotime((string) $a['time']));

        return response()->json([
            'success' => true,
            'data' => array_slice($alerts, 0, 20),
            'counts' => [
                'pending_borrows' => $pendingBorrows->count(),
                'overdue_borrows' => $overdueBorrows->count(),
                'low_stock' => $lowStockItems->count(),
                'needs_maintenance' => $maintenanceItems->count(),
                'total' => count($alerts),
            ],
        ]);
    }

    /**
     * Get unread notifications for the current user
     */
    public function getUserNotifications(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        // Get unread notifications for the user
        $notifications = Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $notifications,
            'count' => $notifications->count(),
        ]);
    }

    /**
     * Mark a notification as read
     */
    public function markNotificationRead(Request $request, $notificationId)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        $notification = Notification::where('id', $notificationId)
            ->where('user_id', $user->id)
            ->first();

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found',
            ], 404);
        }

        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read',
        ]);
    }

    /**
     * Mark all notifications as read for current user
     */
    public function markAllNotificationsRead(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read',
        ]);
    }
}

