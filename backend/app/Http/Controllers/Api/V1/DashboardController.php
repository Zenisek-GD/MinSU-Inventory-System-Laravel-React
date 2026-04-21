<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\MRAuditLog;
use App\Models\MemorandumReceipt;
use App\Models\Office;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats()
    {
        $roleCounts = User::groupBy('role')
            ->selectRaw('role, COUNT(*) as count')
            ->pluck('count', 'role');

        $recentMemorandumReceipts = MemorandumReceipt::query()
            ->select([
                'id',
                'mr_number',
                'office',
                'accountable_officer',
                'status',
                'form_type',
                'created_at',
            ])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        return response()->json([
            'users' => [
                'admin' => (int) $roleCounts->get('admin', 0),
                'supply_officer' => (int) $roleCounts->get('supply_officer', 0),
                'staff' => (int) $roleCounts->get('staff', 0),
            ],
            'officesCount' => (int) Office::count(),
            'itemsCount' => (int) Item::count(),
            // Matches current UI logic: treat status 'Issued' as pending.
            'pendingMemorandumReceiptsCount' => (int) MemorandumReceipt::where('status', 'Issued')->count(),
            'recentMemorandumReceipts' => $recentMemorandumReceipts,
        ]);
    }

    /**
     * Recent MR audit-log timeline entries visible to current user.
     *
     * Query parameters:
     * - limit: number of entries (default 10, max 30)
     */
    public function mrTimeline(Request $request)
    {
        $user = $request->user();
        $userRole = strtolower($user->role ?? '');
        $isManagement = in_array($userRole, ['admin', 'supply_officer', 'supply officer', 'property_custodia']);

        $limit = (int) $request->query('limit', 10);
        if ($limit < 1) {
            $limit = 10;
        }
        $limit = min($limit, 30);

        $logsQuery = MRAuditLog::query()
            ->with([
                'memorandumReceipt:id,mr_number,office,status,purpose,created_by,accountable_officer',
            ])
            ->orderByDesc('created_at');

        if (!$isManagement) {
            $logsQuery->whereHas('memorandumReceipt', function ($q) use ($user) {
                $q->where('created_by', $user->id)
                    ->orWhereRaw('LOWER(accountable_officer) = ?', [strtolower($user->name ?? '')]);
            });
        }

        $logs = $logsQuery->limit($limit)->get();

        $timeline = $logs->map(function (MRAuditLog $log) {
            $mr = $log->memorandumReceipt;
            return [
                'id' => $log->id,
                'mr_id' => $log->mr_id,
                'mr_number' => $mr?->mr_number,
                'mr_status' => $mr?->status,
                'mr_office' => $mr?->office,
                'mr_purpose' => $mr?->purpose,
                'action' => $log->action,
                'description' => $log->description,
                'user_name' => $log->user_name,
                'user_role' => $log->user_role,
                'created_at' => optional($log->created_at)->toISOString(),
            ];
        })->values();

        return response()->json([
            'data' => $timeline,
        ]);
    }
}
