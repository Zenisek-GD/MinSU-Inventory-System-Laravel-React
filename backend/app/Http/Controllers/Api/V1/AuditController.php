<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ConditionAudit;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AuditController extends Controller
{
     public function index(Request $request)
    {
        $query = ConditionAudit::with(['item.office', 'item.category', 'checkedBy']);

        // Filter by audit year
        if ($request->has('audit_year')) {
            $query->where('audit_year', $request->audit_year);
        }

        // Filter by condition
        if ($request->has('condition')) {
            $query->where('condition', $request->condition);
        }

        $audits = $query->latest()->get();

        return response()->json($audits);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'item_id' => 'required|exists:items,id',
            'audit_year' => 'required|digits:4|integer|min:2020|max:' . (date('Y') + 1),
            'condition' => 'required|in:Excellent,Good,Fair,Needs Repair,Damaged,Disposed',
            'remarks' => 'nullable|string',
            'recommendations' => 'nullable|string',
            'next_audit_date' => 'nullable|date|after:today',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if audit already exists for this item and year
        $existingAudit = ConditionAudit::where('item_id', $request->item_id)
            ->where('audit_year', $request->audit_year)
            ->first();

        if ($existingAudit) {
            return response()->json([
                'message' => 'Audit already exists for this item and year'
            ], 422);
        }

        $audit = ConditionAudit::create([
            'item_id' => $request->item_id,
            'checked_by' => $request->user()->id,
            'audit_year' => $request->audit_year,
            'condition' => $request->condition,
            'remarks' => $request->remarks,
            'recommendations' => $request->recommendations,
            'next_audit_date' => $request->next_audit_date,
        ]);

        // Update item condition if different
        $item = Item::find($request->item_id);
        if ($item->condition !== $request->condition) {
            $item->update(['condition' => $request->condition]);
        }

        $audit->load(['item.office', 'item.category', 'checkedBy']);

        return response()->json([
            'message' => 'Condition audit recorded successfully',
            'audit' => $audit
        ], 201);
    }

    public function show(ConditionAudit $audit)
    {
        $audit->load(['item.office', 'item.category', 'checkedBy']);
        
        return response()->json($audit);
    }

    public function update(Request $request, ConditionAudit $audit)
    {
        $validator = Validator::make($request->all(), [
            'condition' => 'sometimes|required|in:Excellent,Good,Fair,Needs Repair,Damaged,Disposed',
            'remarks' => 'nullable|string',
            'recommendations' => 'nullable|string',
            'next_audit_date' => 'nullable|date|after:today',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $audit->update($request->all());

        // Update item condition if changed
        if ($request->has('condition')) {
            $audit->item->update(['condition' => $request->condition]);
        }

        $audit->load(['item.office', 'item.category', 'checkedBy']);

        return response()->json([
            'message' => 'Condition audit updated successfully',
            'audit' => $audit
        ]);
    }

    public function destroy(ConditionAudit $audit)
    {
        $audit->delete();

        return response()->json(['message' => 'Condition audit deleted successfully']);
    }

    public function itemAudits(Item $item)
    {
        $audits = ConditionAudit::with('checkedBy')
            ->where('item_id', $item->id)
            ->orderBy('audit_year', 'desc')
            ->get();

        return response()->json($audits);
    }

}
