import React, { useEffect, useState } from "react";
import { fetchCategories, createCategory, updateCategory, deleteCategory } from "../api/category";
import DashboardLayout from "../components/Layout/DashboardLayout";

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await fetchCategories();
      setCategories(data.data || []);
    } catch (err) {
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      await createCategory({ name: newCategory });
      setNewCategory("");
      loadCategories();
    } catch {
      setError("Failed to create category");
    }
  };

  const handleEdit = (category) => {
    setEditing(category.id);
    setEditName(category.name);
  };

  const handleUpdate = async (id) => {
    try {
      await updateCategory(id, { name: editName });
      setEditing(null);
      setEditName("");
      loadCategories();
    } catch {
      setError("Failed to update category");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await deleteCategory(id);
      loadCategories();
    } catch {
      setError("Failed to delete category");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Manage Categories</h1>
        <form onSubmit={handleCreate} className="mb-4 flex gap-2">
          <input
            className="border px-2 py-1 rounded flex-1"
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            placeholder="New category name"
          />
          <button className="bg-green-700 text-white px-4 py-1 rounded" type="submit">Add</button>
        </form>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <ul className="divide-y">
            {categories.map(category => (
              <li key={category.id} className="py-4 flex flex-col md:flex-row md:items-center gap-4 border-b">
                <div className="flex-1">
                  <div className="font-semibold text-lg">{category.name}</div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  {editing === category.id ? (
                    <div className="flex gap-2 mt-2">
                      <input
                        className="border px-2 py-1 rounded flex-1"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                      />
                      <button className="bg-blue-600 text-white px-2 py-1 rounded" onClick={() => handleUpdate(category.id)}>Save</button>
                      <button className="bg-gray-400 text-white px-2 py-1 rounded" onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-2">
                      <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={() => handleEdit(category)}>Edit</button>
                      <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={() => handleDelete(category.id)}>Delete</button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CategoriesPage;
