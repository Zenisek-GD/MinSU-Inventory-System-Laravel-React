<?php

namespace App\Http\Controllers;

use App\Models\Office;
use Illuminate\Http\Request;

class OfficeController extends Controller
{
    public function index(Request $request)
    {
        $query = Office::query()->with(['department.college'])->orderBy('name');
        if ($request->has('department_id')) {
            $query->where('department_id', $request->get('department_id'));
        }
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:office,classroom,laboratory',
            'category' => 'required|in:facility,departmental',
            'department_id' => 'nullable|exists:departments,id',
            'room_number' => 'nullable|string|max:64',
            'building' => 'nullable|string|max:255',
            'floor' => 'nullable|string|max:64',
        ]);

        // Validate: departmental offices must have department_id
        if ($validated['category'] === 'departmental' && !isset($validated['department_id'])) {
            return response()->json(['error' => 'Department is required for departmental offices'], 422);
        }

        // Auto-generate QR code if not provided
        if (!isset($validated['qr_code'])) {
            $validated['qr_code'] = 'OFFICE-' . uniqid() . '-' . time();
        }

        $office = Office::create($validated);
        $office->load(['department.college']);
        return response()->json($office, 201);
    }

    public function show(Office $office)
    {
        $office->load(['department.college']);
        return response()->json($office);
    }

    public function update(Request $request, Office $office)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:office,classroom,laboratory',
            'category' => 'required|in:facility,departmental',
            'department_id' => 'nullable|exists:departments,id',
            'room_number' => 'nullable|string|max:64',
            'building' => 'nullable|string|max:255',
            'floor' => 'nullable|string|max:64',
        ]);

        // Validate: departmental offices must have department_id
        if ($validated['category'] === 'departmental' && !isset($validated['department_id'])) {
            return response()->json(['error' => 'Department is required for departmental offices'], 422);
        }

        $office->update($validated);
        $office->load(['department.college']);
        return response()->json($office);
    }

    public function destroy(Office $office)
    {
        $office->delete();
        return response()->json(null, 204);
    }
}
