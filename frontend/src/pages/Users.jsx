import React, { useEffect, useState } from "react";
import { fetchUsers, createUser, updateUser, deleteUser } from "../api/user";
import { listOffices } from "../api/offices";
import DashboardLayout from "../components/Layout/DashboardLayout";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
  Box,
  IconButton,
  Alert,
  Chip,
} from "@mui/material";
import { Close, PersonAdd, Business } from "@mui/icons-material";

const roles = [
  { value: "admin", label: "Admin" },
  { value: "supply_officer", label: "Supply Officer" },
  { value: "staff", label: "Staff" },
];

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "staff", office_id: "" });
  const [editing, setEditing] = useState(null);
  const [editUser, setEditUser] = useState({ name: "", email: "", role: "staff", is_active: true, office_id: null });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    loadUsers();
    loadOffices();
  }, []);

  const loadOffices = async () => {
    try {
      const data = await listOffices();
      setOffices(data || []);
    } catch (err) {
      console.error('Failed to load offices:', err);
      setOffices([]);
    }
  };

  const loadUsers = async () => {
    console.log('loadUsers called');
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data.data || []);
    } catch (err) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...newUser,
        office_id: newUser.office_id === "" ? null : newUser.office_id
      };
      const created = await createUser(dataToSend);
      setUsers(prev => [...prev, created?.data?.data || created?.data || created || {}]);
      setNewUser({ name: "", email: "", password: "", role: "staff", office_id: "" });
      setIsAddModalOpen(false);
    } catch {
      setError("Failed to create user");
    }
  };

  const handleEdit = (user) => {
    setEditing(user.id);
    setEditUser({
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      office_id: user.office_id || "",
    });
  };

  const handleUpdate = async (id) => {
    try {
      const dataToSend = {
        ...editUser,
        office_id: editUser.office_id === "" ? null : editUser.office_id
      };
      await updateUser(id, dataToSend);
      await loadUsers();
      setEditing(null);
      setEditUser({ name: "", email: "", role: "staff", is_active: true, office_id: null });
    } catch {
      setError("Failed to update user");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch {
      setError("Failed to delete user");
    }
  };

  const openAddModal = () => {
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setNewUser({ name: "", email: "", password: "", role: "staff", office_id: "" });
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Manage system users and their permissions</p>
          </div>
          <Button
            onClick={openAddModal}
            variant="contained"
            startIcon={<PersonAdd />}
            sx={{
              bgcolor: '#006400',
              '&:hover': { bgcolor: '#004d00' },
              borderRadius: 2,
              px: 3,
              py: 1.5,
            }}
          >
            Add User
          </Button>
        </div>

        {/* Add User Modal */}
        <Dialog
          open={isAddModalOpen}
          onClose={closeAddModal}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 }
          }}
        >
          <DialogTitle sx={{ pb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#006400' }}>
                Add New User
              </Typography>
              <IconButton
                onClick={closeAddModal}
                size="small"
                sx={{ color: 'text.secondary' }}
              >
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>

          <form onSubmit={handleCreate}>
            <DialogContent sx={{ pt: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Enter full name"
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

                <TextField
                  fullWidth
                  label="Email Address"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="email@example.com"
                  type="email"
                  required
                  variant="outlined"
                />

                <TextField
                  fullWidth
                  label="Password"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter password"
                  type="password"
                  required
                  variant="outlined"
                />

                <TextField
                  fullWidth
                  select
                  label="Role"
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  variant="outlined"
                >
                  {roles.map(r => (
                    <MenuItem key={r.value} value={r.value}>
                      {r.label}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  fullWidth
                  select
                  label="Room (Optional)"
                  value={newUser.office_id}
                  onChange={e => setNewUser({ ...newUser, office_id: e.target.value })}
                  variant="outlined"
                  helperText="Assign this user to a room or department location"
                >
                  <MenuItem value="">None - No specific room</MenuItem>
                  {offices.map(office => (
                    <MenuItem key={office.id} value={office.id}>
                      {office.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
              <Button
                onClick={closeAddModal}
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
                Create User
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Users List</h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-red-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-red-800 font-medium">{error}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {users.map(user => (
                <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                  {editing === user.id ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      <div className="lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={editUser.name}
                          onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                          placeholder="Name"
                        />
                      </div>
                      <div className="lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={editUser.email}
                          onChange={e => setEditUser({ ...editUser, email: e.target.value })}
                          placeholder="Email"
                          type="email"
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={editUser.role}
                          onChange={e => setEditUser({ ...editUser, role: e.target.value })}
                        >
                          {roles.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                        <select
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={editUser.office_id}
                          onChange={e => setEditUser({ ...editUser, office_id: e.target.value })}
                        >
                          <option value="">None</option>
                          {offices.map(office => (
                            <option key={office.id} value={office.id}>{office.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="lg:col-span-2 flex items-center">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={editUser.is_active}
                            onChange={e => setEditUser({ ...editUser, is_active: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Active</span>
                        </label>
                      </div>
                      <div className="lg:col-span-12 flex space-x-2">
                        <button
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg transition-colors duration-200 text-sm"
                          onClick={() => handleUpdate(user.id)}
                        >
                          Save
                        </button>
                        <button
                          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-3 rounded-lg transition-colors duration-200 text-sm"
                          onClick={() => setEditing(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                            <p className="text-gray-600">{user.email}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'supply_officer' ? 'bg-green-100 text-green-800' :
                                'bg-blue-100 text-blue-800'
                            }`}>
                            {roles.find(r => r.value === user.role)?.label}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {user.office && (
                            <Chip
                              icon={<Business />}
                              label={user.office?.name || 'No room assigned'}
                              size="small"
                              variant="outlined"
                              sx={{ borderColor: '#006400', color: '#006400' }}
                            />
                          )}
                          {!user.office && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              No room assigned
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 lg:mt-0 flex space-x-2">
                        <button
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm border border-blue-200"
                          onClick={() => handleEdit(user)}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-red-50 hover:bg-red-100 text-red-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm border border-red-200"
                          onClick={() => handleDelete(user.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UsersPage;