import React, { useEffect, useState } from "react";
import { fetchCategories, createCategory, updateCategory, deleteCategory } from "../api/category";
import DashboardLayout from "../components/Layout/DashboardLayout";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert,
  IconButton,
} from "@mui/material";
import { Edit, Delete, Add, Close } from "@mui/icons-material";

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

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
    if (!newCategory.trim()) {
      setError("Category name is required");
      return;
    }
    try {
      const result = await createCategory({ name: newCategory });
      setCategories(prev => [result.category, ...prev]);
      setNewCategory("");
      setIsModalOpen(false);
      setSuccessMessage("Category created successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
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
      const result = await updateCategory(id, { name: editName });
      setCategories(prev => prev.map(cat => cat.id === id ? result.category : cat));
      setEditing(null);
      setEditName("");
      setSuccessMessage("Category updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setError("Failed to update category");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCategory(id);
      setCategories(prev => prev.filter(cat => cat.id !== id));
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
      setSuccessMessage("Category deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setError("Failed to delete category");
    }
  };

  const confirmDelete = (category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Categories</h1>
            <p className="text-gray-600 mt-2">Manage your product categories</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-md hover:shadow-lg"
          >
            <Add /> Add New Category
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Categories List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Category Name</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">ID</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map(category => (
                    <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        {editing === category.id ? (
                          <div className="flex gap-2">
                            <input
                              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition w-full"
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div className="font-medium text-gray-800">{category.name}</div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-gray-500 text-sm font-mono">
                        #{category.id}
                      </td>
                      <td className="py-4 px-6">
                        {editing === category.id ? (
                          <div className="flex gap-2">
                            <button
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                              onClick={() => handleUpdate(category.id)}
                            >
                              Save
                            </button>
                            <button
                              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                              onClick={() => setEditing(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                              onClick={() => handleEdit(category)}
                            >
                              <Edit /> Edit
                            </button>
                            <button
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                              onClick={() => confirmDelete(category)}
                            >
                              <Delete /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Category Modal */}
        <Dialog 
          open={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 }
          }}
        >
          <DialogTitle sx={{ pb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#006400' }}>
                Add New Category
              </Typography>
              <IconButton 
                onClick={() => setIsModalOpen(false)}
                size="small"
                sx={{ color: 'text.secondary' }}
              >
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <form onSubmit={handleCreate}>
            <DialogContent sx={{ pt: 3 }}>
              <TextField
                fullWidth
                label="Category Name"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                placeholder="Enter category name"
                autoFocus
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#006400',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#006400',
                    },
                  },
                }}
              />
            </DialogContent>
            
            <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
              <Button 
                onClick={() => setIsModalOpen(false)}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                variant="contained"
                sx={{ 
                  borderRadius: 2,
                  bgcolor: '#006400',
                  '&:hover': { bgcolor: '#004d00' }
                }}
              >
                Create Category
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog 
          open={isDeleteModalOpen && categoryToDelete !== null}
          onClose={() => setIsDeleteModalOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 }
          }}
        >
          <DialogTitle sx={{ pb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Delete color="error" />
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'error.main' }}>
                Delete Category
              </Typography>
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ pt: 3 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              This action cannot be undone!
            </Alert>
            <Typography variant="body1" color="text.secondary">
              Are you sure you want to delete the category <strong>{categoryToDelete?.name}</strong>?
            </Typography>
          </DialogContent>
          
          <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
            <Button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setCategoryToDelete(null);
              }}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleDelete(categoryToDelete.id)}
              variant="contained"
              color="error"
              sx={{ borderRadius: 2 }}
            >
              Delete Category
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default CategoriesPage;
