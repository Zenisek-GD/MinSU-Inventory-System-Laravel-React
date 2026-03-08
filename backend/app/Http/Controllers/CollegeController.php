<?php

namespace App\Http\Controllers;

use App\Models\College;
use Illuminate\Http\Request;

class CollegeController extends Controller
{
    public function index()
    {
        return response()->json(College::query()->orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:colleges,name',
        ]);
        $college = College::create($validated);
        return response()->json($college, 201);
    }

    public function show(College $college)
    {
        $college->load('departments');
        return response()->json($college);
    }

    public function update(Request $request, College $college)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:colleges,name,' . $college->id,
        ]);
        $college->update($validated);
        return response()->json($college);
    }

    public function destroy(College $college)
    {
        $college->delete();
        return response()->json(null, 204);
    }
}
