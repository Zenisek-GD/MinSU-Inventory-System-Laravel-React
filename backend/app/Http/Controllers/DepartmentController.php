<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Department::query()->with('college')->orderBy('name');
        if ($request->has('college_id')) {
            $query->where('college_id', $request->get('college_id'));
        }
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'college_id' => 'required|exists:colleges,id',
            'name' => 'required|string|max:255',
            'room_number' => 'nullable|string|max:64',
            'building' => 'nullable|string|max:255',
            'floor' => 'nullable|string|max:64',
        ]);
        // uniqueness per college
        $exists = Department::where('college_id', $validated['college_id'])
            ->where('name', $validated['name'])->exists();
        if ($exists) {
            return response()->json(['message' => 'Department name must be unique within the college'], 422);
        }
        $department = Department::create($validated);
        return response()->json($department, 201);
    }

    public function show(Department $department)
    {
        $department->load(['college', 'offices']);
        return response()->json($department);
    }

    public function update(Request $request, Department $department)
    {
        $validated = $request->validate([
            'college_id' => 'required|exists:colleges,id',
            'name' => 'required|string|max:255',
            'room_number' => 'nullable|string|max:64',
            'building' => 'nullable|string|max:255',
            'floor' => 'nullable|string|max:64',
        ]);
        $exists = Department::where('college_id', $validated['college_id'])
            ->where('name', $validated['name'])
            ->where('id', '<>', $department->id)
            ->exists();
        if ($exists) {
            return response()->json(['message' => 'Department name must be unique within the college'], 422);
        }
        $department->update($validated);
        return response()->json($department);
    }

    public function destroy(Department $department)
    {
        $department->delete();
        return response()->json(null, 204);
    }
}
