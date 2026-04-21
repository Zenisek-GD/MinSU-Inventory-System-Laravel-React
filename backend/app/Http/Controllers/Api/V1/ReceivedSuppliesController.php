<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\MRAuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReceivedSuppliesController extends Controller
{
    /**
     * List all MR acceptance events (faculty/staff received supplies).
     *
     * Query params:
     * - from_date (optional)
     * - to_date (optional)
     * - user_id (optional): receiver user id
     * - mr_number (optional): partial MR number match
     * - per_page (optional)
     */
    public function index(Request $request): JsonResponse
    {
        $userRole = strtolower($request->user()->role ?? '');
        $isManagement = in_array($userRole, ['admin', 'supply_officer', 'supply officer']);

        if (!$isManagement) {
            return response()->json([
                'message' => 'Unauthorized to view received supplies logs',
            ], 403);
        }

        $query = MRAuditLog::query()
            ->where('action', 'accepted')
            ->with([
                'memorandumReceipt' => function ($mrQuery) {
                    $mrQuery->with('items');
                },
            ])
            ->orderBy('created_at', 'desc');

        if ($request->filled('from_date')) {
            $query->where('created_at', '>=', $request->query('from_date'));
        }
        if ($request->filled('to_date')) {
            $query->where('created_at', '<=', $request->query('to_date'));
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', (int) $request->query('user_id'));
        }
        if ($request->filled('mr_number')) {
            $mrNumber = trim((string) $request->query('mr_number'));
            $query->whereHas('memorandumReceipt', function ($mrQuery) use ($mrNumber) {
                $mrQuery->where('mr_number', 'like', "%{$mrNumber}%");
            });
        }

        $perPage = (int) $request->query('per_page', 25);
        $perPage = max(1, min(100, $perPage));

        return response()->json($query->paginate($perPage));
    }
}
