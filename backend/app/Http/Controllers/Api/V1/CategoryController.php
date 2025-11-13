<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Validator;


class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
     public function index()
    {
        $categories = Category::with('parent', 'children')
            ->whereNull('parent_id')
            ->withCount('items')
            ->get();
            
        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:categories,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $category = Category::create($request->all());

        return response()->json([
            'message' => 'Category created successfully',
            'category' => $category
        ], 201);
    }

    public function show(Category $category)
    {
        $category->load(['parent', 'children', 'items.office']);
        
        return response()->json($category);
    }

    public function update(Request $request, Category $category)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:categories,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Prevent circular reference
        if ($request->parent_id == $category->id) {
            return response()->json([
                'message' => 'Category cannot be its own parent'
            ], 422);
        }

        $category->update($request->all());

        return response()->json([
            'message' => 'Category updated successfully',
            'category' => $category
        ]);
    }

    public function destroy(Category $category)
    {
        if ($category->items()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete category with associated items'
            ], 422);
        }

        // Update child categories to null parent
        Category::where('parent_id', $category->id)->update(['parent_id' => null]);

        $category->delete();

        return response()->json(['message' => 'Category deleted successfully']);
    }
}