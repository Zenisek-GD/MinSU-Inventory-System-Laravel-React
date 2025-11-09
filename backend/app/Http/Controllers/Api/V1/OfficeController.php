<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Office;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OfficeController extends Controller
{
   
    public function index()
    {
        $offices = Office::withCount(['users', 'items'])->get();
        
        return response()->json($offices);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'location' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Generate unique QR code
        $qrCode = 'OFFICE-' . uniqid();

        $office = Office::create([
            'name' => $request->name,
            'description' => $request->description,
            'location' => $request->location,
            'qr_code' => $qrCode,
        ]);

        return response()->json([
            'message' => 'Office created successfully',
            'office' => $office
        ], 201);
    }

    public function show(Office $office)
    {
        $office->load(['users', 'items.category', 'purchaseRequests']);
        
        return response()->json($office);
    }

    public function update(Request $request, Office $office)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'location' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $office->update($request->all());

        return response()->json([
            'message' => 'Office updated successfully',
            'office' => $office
        ]);
    }

    public function destroy(Office $office)
    {
        // Check if office has users or items
        if ($office->users()->count() > 0 || $office->items()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete office with associated users or items'
            ], 422);
        }

        $office->delete();

        return response()->json(['message' => 'Office deleted successfully']);
    }
}
