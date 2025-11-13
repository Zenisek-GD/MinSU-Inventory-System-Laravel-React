<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ItemController extends Controller
{
    public function index(Request $request)
    {
        $query = Item::with(['office', 'category', 'currentBorrow.user']);

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

        return response()->json($items);
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
            ...$request->all(),
            'qr_code' => $qrCode,
            'status' => 'Available'
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
            'borrowRecords.user', 
            'conditionAudits' => function($query) {
                $query->latest()->limit(5);
            },
            'currentBorrow.user'
        ])->where('qr_code', $qr_code)->firstOrFail();
        
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

        $item->update($request->all());
        $item->load(['office', 'category']);

        return response()->json([
            'message' => 'Item updated successfully',
            'item' => $item
        ]);
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

    public function generateQr(Item $item)
    {
        $qrCode = QrCode::size(300)->generate($item->qr_code);
        
        return response()->json([
            'qr_code' => $item->qr_code,
            'qr_image' => $qrCode
        ]);
    }


}
