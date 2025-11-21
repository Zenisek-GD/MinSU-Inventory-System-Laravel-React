import React, { useEffect, useState } from "react";
import { fetchUsers, createUser, updateUser, deleteUser } from "../api/user";
import DashboardLayout from "../components/Layout/DashboardLayout";

const roles = [
  { value: "admin", label: "Admin" },
  { value: "supply_officer", label: "Supply Officer" },
  { value: "staff", label: "Staff" },
];

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "staff" });
  const [editing, setEditing] = useState(null);
  const [editUser, setEditUser] = useState({ name: "", email: "", role: "staff", is_active: true });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
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
      await createUser(newUser);
      setNewUser({ name: "", email: "", password: "", role: "staff" });
      loadUsers();
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
    });
  };

  const handleUpdate = async (id) => {
    try {
      await updateUser(id, editUser);
      setEditing(null);
      setEditUser({ name: "", email: "", role: "staff", is_active: true });
      loadUsers();
    } catch {
      setError("Failed to update user");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await deleteUser(id);
      loadUsers();
    } catch {
      setError("Failed to delete user");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Manage Users</h1>
        <form onSubmit={handleCreate} className="mb-4 flex flex-col md:flex-row gap-2">
          <input
            className="border px-2 py-1 rounded flex-1"
            value={newUser.name}
            onChange={e => setNewUser({ ...newUser, name: e.target.value })}
            placeholder="Name"
            required
          />
          <input
            className="border px-2 py-1 rounded flex-1"
            value={newUser.email}
            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
            placeholder="Email"
            type="email"
            required
          />
          <input
            className="border px-2 py-1 rounded flex-1"
            value={newUser.password}
            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
            placeholder="Password"
            type="password"
            required
          />
          <select
            className="border px-2 py-1 rounded flex-1"
            value={newUser.role}
            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
          >
            {roles.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <button className="bg-green-700 text-white px-4 py-1 rounded" type="submit">Add</button>
        </form>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <ul className="divide-y">
            {users.map(user => (
              <li key={user.id} className="py-4 flex flex-col md:flex-row md:items-center gap-4 border-b">
                <div className="flex-1">
                  <div className="font-semibold text-lg">{user.name}</div>
                  <div className="text-gray-500 text-sm">{user.email}</div>
                  <div className="text-gray-400 text-xs">Role: {user.role}</div>
                  <div className="text-gray-400 text-xs">Active: {user.is_active ? "Yes" : "No"}</div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  {editing === user.id ? (
                    <div className="flex flex-col gap-2 mt-2">
                      <input
                        className="border px-2 py-1 rounded flex-1"
                        value={editUser.name}
                        onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                        placeholder="Name"
                      />
                      <input
                        className="border px-2 py-1 rounded flex-1"
                        value={editUser.email}
                        onChange={e => setEditUser({ ...editUser, email: e.target.value })}
                        placeholder="Email"
                        type="email"
                      />
                      <select
                        className="border px-2 py-1 rounded flex-1"
                        value={editUser.role}
                        onChange={e => setEditUser({ ...editUser, role: e.target.value })}
                      >
                        {roles.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editUser.is_active}
                          onChange={e => setEditUser({ ...editUser, is_active: e.target.checked })}
                        />
                        Active
                      </label>
                      <div className="flex gap-2">
                        <button className="bg-blue-600 text-white px-2 py-1 rounded" onClick={() => handleUpdate(user.id)}>Save</button>
                        <button className="bg-gray-400 text-white px-2 py-1 rounded" onClick={() => setEditing(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-2">
                      <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={() => handleEdit(user)}>Edit</button>
                      <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={() => handleDelete(user.id)}>Delete</button>
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

export default UsersPage;
