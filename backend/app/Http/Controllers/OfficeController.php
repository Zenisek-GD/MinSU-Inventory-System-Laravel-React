<?php

namespace App\Http\Controllers;

use App\Models\Office;
use App\Services\LocationService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OfficeController extends Controller
{
    private const OFFICE_TYPES = [
        'office',
        'classroom',
        'laboratory',
        'studio',
        'lecture_hall',
        'registrar',
        'business_center',
        'admin',
        'dean',
        'faculty',
        'department',
        'student_center',
        'counseling',
        'clinic',
        'library',
        'lounge',
        'storage',
        'conference',
        'cafeteria',
        'maintenance',
        'security',
        'other',
    ];

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
            'type' => ['required', Rule::in(self::OFFICE_TYPES)],
            'category' => 'required|in:facility,departmental',
            'department_id' => 'nullable|exists:departments,id',
            'room_number' => 'nullable|string|max:64',
            'building' => 'nullable|string|max:255',
            'floor' => 'nullable|string|max:64',
            'room_id' => ['nullable', 'string', 'max:64', 'unique:offices,room_id'],
            'year_level' => 'nullable|integer|min:1|max:4',
            'assigned_professor' => 'nullable|string|max:255',
        ]);

        $validated['room_id'] = LocationService::inferRoomId($validated);
        if (!LocationService::isValidRoomId($validated['room_id'] ?? null)) {
            return response()->json(['error' => 'Invalid room_id format'], 422);
        }

        if (!empty($validated['room_id']) && Office::where('room_id', $validated['room_id'])->exists()) {
            return response()->json(['error' => 'room_id already exists'], 422);
        }

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
            'type' => ['required', Rule::in(self::OFFICE_TYPES)],
            'category' => 'required|in:facility,departmental',
            'department_id' => 'nullable|exists:departments,id',
            'room_number' => 'nullable|string|max:64',
            'building' => 'nullable|string|max:255',
            'floor' => 'nullable|string|max:64',
            'room_id' => ['nullable', 'string', 'max:64', Rule::unique('offices', 'room_id')->ignore($office->id)],
            'year_level' => 'nullable|integer|min:1|max:4',
            'assigned_professor' => 'nullable|string|max:255',
        ]);

        $validated['room_id'] = LocationService::inferRoomId($validated);
        if (!LocationService::isValidRoomId($validated['room_id'] ?? null)) {
            return response()->json(['error' => 'Invalid room_id format'], 422);
        }

        if (!empty($validated['room_id']) && Office::where('room_id', $validated['room_id'])->where('id', '!=', $office->id)->exists()) {
            return response()->json(['error' => 'room_id already exists'], 422);
        }

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
