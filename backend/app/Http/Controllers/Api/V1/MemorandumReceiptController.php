<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\MemorandumReceipt;
use App\Models\MRItem;
use App\Models\MRSignature;
use App\Models\MRAuditLog;
use App\Traits\ApiResponses;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class MemorandumReceiptController extends Controller
{
    use ApiResponses;

    /**
     * Get list of Memorandum Receipts with filters
     * 
     * Query parameters:
     * - status: Filter by status (Draft, Pending Signature, Approved, Released, Rejected, Cancelled)
     * - office: Filter by office
     * - search: Search by MR number, entity name, or accountable officer
     * - per_page: Items per page (default: 15)
     * - page: Page number
     */
    public function index(Request $request): JsonResponse
    {
        $query = MemorandumReceipt::with('items');

        // Filter by status
        if ($request->has('status')) {
            $query->byStatus($request->status);
        }

        // Filter by office
        if ($request->has('office')) {
            $query->byOffice($request->office);
        }

        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('mr_number', 'like', "%{$search}%")
                    ->orWhere('entity_name', 'like', "%{$search}%")
                    ->orWhere('accountable_officer', 'like', "%{$search}%");
            });
        }

        // Order by most recent first
        $query->orderBy('created_at', 'desc');

        // Paginate results
        $perPage = $request->query('per_page', 15);
        $memorandumReceipts = $query->paginate($perPage);

        return $this->ok('Memorandum Receipts retrieved successfully', [
            'data' => $memorandumReceipts->items(),
            'pagination' => [
                'total' => $memorandumReceipts->total(),
                'count' => $memorandumReceipts->count(),
                'per_page' => $memorandumReceipts->perPage(),
                'current_page' => $memorandumReceipts->currentPage(),
                'last_page' => $memorandumReceipts->lastPage(),
            ],
        ]);
    }

    /**
     * Get a specific Memorandum Receipt with items and signatures
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $mr = MemorandumReceipt::with([
            'items' => function ($q) {
                $q->with('inventoryItem');
            },
            'signatures',
            'createdBy',
            'updatedBy'
        ])->find($id);

        if (!$mr) {
            return $this->notFound('Memorandum Receipt not found');
        }

        // Check authorization
        if (!$this->canViewMR($request->user(), $mr)) {
            return $this->unauthorized('Not authorized to view this Memorandum Receipt');
        }

        // Get audit log
        $auditLog = $mr->auditLogs()->take(20)->get();

        // Calculate totals
        $totalCost = $mr->calculateTotalCost();
        $itemCount = $mr->getItemCount();

        return $this->ok('Memorandum Receipt retrieved successfully', [
            'mr' => $mr,
            'items' => $mr->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'item_name' => $item->item_name,
                    'item_id' => $item->item_id,
                    'inventory_item' => $item->inventoryItem,
                    'qty' => $item->qty,
                    'unit' => $item->unit,
                    'property_number' => $item->property_number,
                    'acquisition_date' => $item->acquisition_date,
                    'unit_cost' => $item->unit_cost,
                    'total_cost' => $item->total_cost,
                    'condition' => $item->condition,
                    'remarks' => $item->remarks,
                ];
            }),
            'signatures' => $mr->signatures,
            'audit_log' => $auditLog,
            'summary' => [
                'total_cost' => $totalCost,
                'item_count' => $itemCount,
                'is_editable' => $mr->isEditable(),
                'pending_signatories' => $mr->getNextSignatories(),
            ],
        ]);
    }

    /**
     * Create a new Memorandum Receipt
     */
    public function store(Request $request): JsonResponse
    {
        // Validate input
        $validated = $request->validate([
            'entity_name' => 'required|string|max:255',
            'fund_cluster' => 'required|string|max:100',
            'office' => 'required|string|max:255',
            'accountable_officer' => 'required|string|max:255',
            'position' => 'required|string|max:255',
            'date_issued' => 'required|date',
            'received_from' => 'required|string|max:255',
            'purpose' => 'nullable|string|max:1000',
            'notes' => 'nullable|string|max:1000',
            'form_type' => 'nullable|in:ics,par',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'nullable|exists:items,id',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.unit' => 'required|string|max:50',
            'items.*.property_number' => 'required|string|max:100|unique:mr_items',
            'items.*.acquisition_date' => 'required|date',
            'items.*.unit_cost' => 'required|numeric|min:0',
            'items.*.condition' => 'required|in:Good,Fair,Poor,Damaged,Non-functional',
            'items.*.remarks' => 'nullable|string|max:500',
            'items.*.estimated_useful_life' => 'nullable|string|max:100',
        ]);

        DB::beginTransaction();

        try {
            // Determine form_type: use provided value, or auto-detect based on item costs
            $formType = $validated['form_type'] ?? MemorandumReceipt::FORM_TYPE_ICS;
            if (empty($validated['form_type'])) {
                // Auto-detect: if any item unit cost >= 50,000 → PAR
                foreach ($validated['items'] as $item) {
                    if ((float) $item['unit_cost'] >= MemorandumReceipt::PAR_THRESHOLD) {
                        $formType = MemorandumReceipt::FORM_TYPE_PAR;
                        break;
                    }
                }
            }

            // Create MR record
            $mr = MemorandumReceipt::create([
                'entity_name' => $validated['entity_name'],
                'fund_cluster' => $validated['fund_cluster'],
                'office' => $validated['office'],
                'accountable_officer' => $validated['accountable_officer'],
                'position' => $validated['position'],
                'date_issued' => $validated['date_issued'],
                'received_from' => $validated['received_from'],
                'purpose' => $validated['purpose'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'form_type' => $formType,
                'status' => MemorandumReceipt::STATUS_PENDING_REVIEW,
            ]);

            // Create items with tracking
            foreach ($validated['items'] as $itemData) {
                MRItem::create([
                    'mr_id' => $mr->id,
                    'item_id' => $itemData['item_id'] ?? null,
                    'item_name' => $itemData['item_name'],
                    'qty' => $itemData['qty'],
                    'unit' => $itemData['unit'],
                    'property_number' => $itemData['property_number'],
                    'acquisition_date' => $itemData['acquisition_date'],
                    'unit_cost' => $itemData['unit_cost'],
                    'condition' => $itemData['condition'],
                    'remarks' => $itemData['remarks'] ?? null,
                    'estimated_useful_life' => $itemData['estimated_useful_life'] ?? null,
                ]);
            }

            // Signatures handled differently in 2-actor system. Not actively needed at creation.

            // Log action
            MRAuditLog::logAction(
                $mr->id,
                MRAuditLog::ACTION_CREATED,
                "Memorandum Receipt {$mr->mr_number} created with " . count($validated['items']) . ' items'
            );

            DB::commit();

            return $this->created('Memorandum Receipt created successfully', [
                'mr_number' => $mr->mr_number,
                'id' => $mr->id,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to create Memorandum Receipt: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update a Memorandum Receipt (only in Draft status)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $mr = MemorandumReceipt::find($id);

        if (!$mr) {
            return $this->notFound('Memorandum Receipt not found');
        }

        // Check authorization
        if (!$this->canEditMR($request->user(), $mr)) {
            return $this->unauthorized('Not authorized to edit this Memorandum Receipt');
        }

        // Only allow editing in editable state
        if (!$mr->isEditable()) {
            return $this->error('Only Pending Review Memorandum Receipts can be edited', 422);
        }

        // Validate input
        $validated = $request->validate([
            'entity_name' => 'sometimes|string|max:255',
            'fund_cluster' => 'sometimes|string|max:100',
            'office' => 'sometimes|string|max:255',
            'accountable_officer' => 'sometimes|string|max:255',
            'position' => 'sometimes|string|max:255',
            'date_issued' => 'sometimes|date',
            'received_from' => 'sometimes|string|max:255',
            'purpose' => 'nullable|string|max:1000',
            'notes' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();

        try {
            // Log changes
            foreach ($validated as $field => $value) {
                if ($mr->$field !== $value) {
                    MRAuditLog::create([
                        'mr_id' => $mr->id,
                        'user_id' => $request->user()->id,
                        'action' => MRAuditLog::ACTION_UPDATED,
                        'field_name' => $field,
                        'old_value' => $mr->$field,
                        'new_value' => $value,
                        'description' => "Updated {$field}",
                        'user_name' => $request->user()->name,
                        'user_role' => $request->user()->role,
                        'user_ip' => $request->ip(),
                        'created_at' => now(),
                    ]);
                }
            }

            // Update MR
            $mr->update($validated);

            DB::commit();

            return $this->ok('Memorandum Receipt updated successfully', [
                'id' => $mr->id,
                'mr_number' => $mr->mr_number,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to update Memorandum Receipt: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete a Memorandum Receipt (only in Draft or Rejected status)
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $mr = MemorandumReceipt::find($id);

        if (!$mr) {
            return $this->notFound('Memorandum Receipt not found');
        }

        // Check authorization
        if (!$this->canDeleteMR($request->user(), $mr)) {
            return $this->unauthorized('Not authorized to delete this Memorandum Receipt');
        }

        // Only allow deletion in Draft or Rejected status
        if (!in_array($mr->status, [MemorandumReceipt::STATUS_PENDING_REVIEW, MemorandumReceipt::STATUS_REJECTED])) {
            return $this->error('Only Pending Review or Rejected Memorandum Receipts can be deleted', 422);
        }

        // Log deletion
        MRAuditLog::logAction(
            $mr->id,
            MRAuditLog::ACTION_DELETED,
            "Memorandum Receipt {$mr->mr_number} deleted"
        );

        $mr->delete();

        return $this->ok('Memorandum Receipt deleted successfully');
    }

    /**
     * Provide a generic workflow update function for the Supply Officer
     */
    public function updateProgress(Request $request, int $id): JsonResponse
    {
        $mr = MemorandumReceipt::find($id);

        if (!$mr) {
            return $this->notFound('Memorandum Receipt not found');
        }

        // Check authorization (Admin or Supply Officer)
        $userRole = strtolower($request->user()->role ?? '');
        if (!in_array($userRole, ['admin', 'supply_officer', 'supply officer'])) {
            return $this->unauthorized('Only Supply Officers can update MR progress');
        }

        $validated = $request->validate([
            'new_status' => 'required|string',
            'note' => 'required|string|max:1000',
            'external_reference' => 'nullable|string|max:255',
        ]);

        DB::beginTransaction();
        try {
            // Attempt transition
            if (!$mr->transitionStatus($validated['new_status'], user: $request->user())) {
                return $this->error("Invalid status transition to {$validated['new_status']}", 422);
            }

            // Record progress note
            $noteDesc = $validated['note'];
            if (!empty($validated['external_reference'])) {
                $noteDesc .= " [Ref: {$validated['external_reference']}]";
            }

            MRAuditLog::logAction(
                $mr->id,
                'progress_update',
                $noteDesc
            );

            DB::commit();

            return $this->ok('Progress updated successfully', [
                'mr_number' => $mr->mr_number,
                'status' => $mr->status,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to update progress: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Return equipment (create return record)
     */
    public function returnEquipment(Request $request, int $id): JsonResponse
    {
        $mr = MemorandumReceipt::find($id);

        if (!$mr) {
            return $this->notFound('Memorandum Receipt not found');
        }

        // Validate input
        $validated = $request->validate([
            'return_date' => 'required|date',
            'return_condition' => 'nullable|in:Good,Fair,Poor,Damaged,Non-functional',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Log the return
        MRAuditLog::logAction(
            $mr->id,
            'equipment_returned',
            "Equipment returned on {$validated['return_date']}. Condition: {$validated['return_condition']}. Notes: {$validated['notes']}"
        );

        return $this->ok('Equipment return recorded successfully', [
            'mr_number' => $mr->mr_number,
        ]);
    }

    /**
     * Get audit log for a specific MR
     */
    public function auditLog(Request $request, int $id): JsonResponse
    {
        $mr = MemorandumReceipt::find($id);

        if (!$mr) {
            return $this->notFound('Memorandum Receipt not found');
        }

        $logs = $mr->auditLogs()->paginate(50);

        return $this->ok('Audit logs retrieved successfully', [
            'data' => $logs->items(),
            'pagination' => [
                'total' => $logs->total(),
                'count' => $logs->count(),
                'per_page' => $logs->perPage(),
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
            ],
        ]);
    }

    /**
     * Create required signatures based on MR configuration
     */
    private function createRequiredSignatures(MemorandumReceipt $mr): void
    {
        // Define required signatories based on office/entity
        // This is a basic example - customize based on your business rules
        $requiredRoles = [
            MRSignature::ROLE_RECEIVER,
            MRSignature::ROLE_DEPARTMENT_HEAD,
            MRSignature::ROLE_PRINCIPAL,
        ];

        foreach ($requiredRoles as $role) {
            MRSignature::create([
                'mr_id' => $mr->id,
                'role' => $role,
                'status' => MRSignature::STATUS_PENDING,
            ]);
        }
    }

    /**
     * Authorization checks
     */
    private function canViewMR($user, MemorandumReceipt $mr): bool
    {
        // Admin, supply officer, and creator can view any MR
        // Staff can view MRs they created
        $userRoleStr = strtolower($user->role ?? '');
        return in_array($userRoleStr, ['admin', 'supply_officer', 'supply officer'])
            || $user->id === $mr->created_by;
    }

    private function canEditMR($user, MemorandumReceipt $mr): bool
    {
        $userRoleStr = strtolower($user->role ?? '');
        $isAdmin = in_array($userRoleStr, ['admin', 'supply_officer', 'supply officer']);
        return ($isAdmin || $user->id === $mr->created_by) && $mr->isEditable();
    }

    private function canDeleteMR($user, MemorandumReceipt $mr): bool
    {
        $userRoleStr = strtolower($user->role ?? '');
        return in_array($userRoleStr, ['admin', 'supply_officer', 'supply officer']) || $user->id === $mr->created_by;
    }

    /**
     * Export Memorandum Receipt as PDF
     */
    public function exportPDF(Request $request, int $id)
    {
        try {
            $mr = MemorandumReceipt::with(['items.inventoryItem', 'office', 'officer'])->find($id);

            if (!$mr) {
                return response()->json(['message' => 'Memorandum Receipt not found'], 404);
            }

            // Check authorization
            if (!$this->canViewMR($request->user(), $mr)) {
                return response()->json(['message' => 'Not authorized'], 403);
            }

            // Generate PDF
            $pdf = Pdf::loadView('memorandum_receipt_pdf', compact('mr'));

            $filename = 'MR-' . str_pad($mr->id, 6, '0', STR_PAD_LEFT) . '.pdf';

            return $pdf->download($filename);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate PDF',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Sign a Memorandum Receipt (alias for acknowledge)
     */
    public function sign(Request $request, int $id): JsonResponse
    {
        return $this->acknowledge($request, $id);
    }

    /**
     * Approve a Memorandum Receipt and notify staff
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $mr = MemorandumReceipt::with('items')->find($id);

        if (!$mr) {
            return $this->notFound('Memorandum Receipt not found');
        }

        // Check authorization - only admins and supply officers can approve
        $userRole = strtolower($request->user()->role ?? '');
        if (!in_array($userRole, ['admin', 'supply_officer', 'supply officer'])) {
            return $this->unauthorized('Only Supply Officers and Admins can approve MRs');
        }

        DB::beginTransaction();

        try {
            // Transition to Approved status
            $mr->transitionStatus(MemorandumReceipt::STATUS_APPROVED, user: $request->user());

            // Log the approval
            MRAuditLog::logAction(
                $mr->id,
                'approved',
                "Memorandum Receipt {$mr->mr_number} approved by {$request->user()->name}"
            );

            // Notify all staff who requested items (send to all users)
            $this->notifyAllStaffOfApproval($mr, $request->user());

            DB::commit();

            return $this->ok('Memorandum Receipt approved successfully', [
                'mr_number' => $mr->mr_number,
                'status' => $mr->status,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to approve Memorandum Receipt: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Notify all staff members of MR approval
     */
    private function notifyAllStaffOfApproval(MemorandumReceipt $mr, $approver): void
    {
        // Get all users (staff) - customize based on your user roles
        $staffUsers = \App\Models\User::whereIn('role', ['staff', 'Staff', 'employee', 'Employee'])->get();

        if ($staffUsers->isNotEmpty()) {
            foreach ($staffUsers as $staffMember) {
                // Store notification in database for real-time updates
                // This could be expanded to use Laravel notifications, queued jobs, etc.

                // Log the notification
                MRAuditLog::logAction(
                    $mr->id,
                    'notified_staff',
                    "Staff {$staffMember->name} notified of approval"
                );
            }

            // Also notify admin users
            $adminUsers = \App\Models\User::whereIn('role', ['admin', 'Admin', 'director', 'Director'])->get();
            foreach ($adminUsers as $adminMember) {
                MRAuditLog::logAction(
                    $mr->id,
                    'notified_admin',
                    "Admin {$adminMember->name} notified of approval"
                );
            }
        }
    }

    /**
     * Accept Memorandum Receipt (Recipient acknowledgment)
     * Updates item statuses to "Borrowed" and records acceptance
     */
    public function accept(Request $request, int $id): JsonResponse
    {
        $mr = MemorandumReceipt::with('items')->find($id);

        if (!$mr) {
            return $this->notFound('Memorandum Receipt not found');
        }

        // Check authorization - must be the accountable officer or the person assigned to items
        $userRole = strtolower($request->user()->role ?? '');
        $isAccountableOfficer = strcasecmp($mr->accountable_officer, $request->user()->name) === 0;
        $isAdmin = in_array($userRole, ['admin', 'supply_officer', 'supply officer']);

        if (!$isAccountableOfficer && !$isAdmin) {
            return $this->unauthorized('Only the accountable officer can accept this MR');
        }

        // MR must be in Ready for Release or Out for Delivery status to accept
        if (!in_array($mr->status, [MemorandumReceipt::STATUS_READY_FOR_RELEASE, MemorandumReceipt::STATUS_OUT_FOR_DELIVERY, MemorandumReceipt::STATUS_FOR_RECEIVING])) {
            return $this->error('Memorandum Receipt must be ready for receiving before acceptance', 422);
        }

        DB::beginTransaction();

        try {
            // Update all items in this MR to "Borrowed" status
            if ($mr->items->isNotEmpty()) {
                foreach ($mr->items as $mrItem) {
                    // If item exists in inventory system, update its status
                    if ($mrItem->item_id) {
                        $inventoryItem = Item::find($mrItem->item_id);
                        if ($inventoryItem) {
                            $inventoryItem->status = 'Borrowed';
                            // Link the item to the accountable officer
                            $inventoryItem->assigned_to = $mr->accountable_officer;
                            $inventoryItem->save();
                        }
                    }
                }
            }

            // Find or create signature for receiver
            $signature = $mr->signatures()->firstOrCreate(
                ['role' => MRSignature::ROLE_RECEIVER],
                ['status' => MRSignature::STATUS_PENDING]
            );

            $signatureData = $request->input('signature_data');
            $signature->markAsSigned($signatureData);

            // Update MR to reflect acceptance
            $mr->transitionStatus(MemorandumReceipt::STATUS_COMPLETED, user: $request->user());

            // Log the acceptance
            MRAuditLog::logAction(
                $mr->id,
                'accepted',
                "Memorandum Receipt {$mr->mr_number} accepted & signed by {$request->user()->name} ({$mr->accountable_officer}). All items marked as Borrowed."
            );

            DB::commit();

            return $this->ok('Memorandum Receipt accepted successfully', [
                'mr_number' => $mr->mr_number,
                'status' => $mr->status,
                'items_borrowed' => $mr->items->count(),
                'accountable_officer' => $mr->accountable_officer,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to accept Memorandum Receipt: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Batch approve multiple Memorandum Receipts
     */
    public function batchApprove(Request $request): JsonResponse
    {
        // Validate input
        $validated = $request->validate([
            'mr_ids' => 'required|array|min:1',
            'mr_ids.*' => 'integer|exists:memorandum_receipts,id'
        ]);

        // Check authorization
        $userRole = strtolower($request->user()->role ?? '');
        if (!in_array($userRole, ['admin', 'supply_officer', 'supply officer'])) {
            return $this->unauthorized('Only Supply Officers and Admins can approve MRs');
        }

        DB::beginTransaction();

        try {
            $approved = [];
            $failed = [];

            foreach ($validated['mr_ids'] as $mrId) {
                try {
                    $mr = MemorandumReceipt::with('items')->find($mrId);

                    if (!$mr) {
                        $failed[] = ['id' => $mrId, 'error' => 'Not found'];
                        continue;
                    }

                    // Transition to Approved status
                    $mr->transitionStatus(MemorandumReceipt::STATUS_APPROVED, user: $request->user());

                    // Log the approval
                    MRAuditLog::logAction(
                        $mr->id,
                        'approved',
                        "Memorandum Receipt {$mr->mr_number} batch approved by {$request->user()->name}"
                    );

                    $approved[] = [
                        'id' => $mr->id,
                        'mr_number' => $mr->mr_number,
                        'status' => $mr->status,
                    ];

                    // Notify staff
                    $this->notifyAllStaffOfApproval($mr, $request->user());
                } catch (\Exception $e) {
                    $failed[] = ['id' => $mrId, 'error' => $e->getMessage()];
                }
            }

            DB::commit();

            return $this->ok('Batch approval completed', [
                'approved_count' => count($approved),
                'failed_count' => count($failed),
                'approved' => $approved,
                'failed' => $failed,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Batch approval failed: ' . $e->getMessage(), 500);
        }
    }
}

