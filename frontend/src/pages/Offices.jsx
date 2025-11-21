import React, { useEffect, useState } from "react";
import { fetchOffices, createOffice, updateOffice, deleteOffice } from "../api/office";
import DashboardLayout from "../components/Layout/DashboardLayout";
import QRCode from "react-qr-code";

const OfficesPage = () => {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newOffice, setNewOffice] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocation, setEditLocation] = useState("");

  useEffect(() => {
    loadOffices();
  }, []);

  const loadOffices = async () => {
    setLoading(true);
    try {
      const data = await fetchOffices();
      setOffices(data.data || []);
    } catch (err) {
      setError("Failed to load offices");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newOffice.trim()) return;
    try {
      const created = await createOffice({ name: newOffice, description: newDescription, location: newLocation });
      setOffices(prev => [...prev, created.data.data]);
      setNewOffice("");
      setNewDescription("");
      setNewLocation("");
    } catch {
      setError("Failed to create office");
    }
  };

  const handleEdit = (office) => {
    setEditing(office.id);
    setEditName(office.name);
    setEditDescription(office.description || "");
    setEditLocation(office.location || "");
  };

  const handleUpdate = async (id) => {
    try {
      const updated = await updateOffice(id, { name: editName, description: editDescription, location: editLocation });
      setOffices(prev => prev.map(o => o.id === id ? updated.data.data : o));
      setEditing(null);
      setEditName("");
      setEditDescription("");
      setEditLocation("");
    } catch {
      setError("Failed to update office");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this office?")) return;
    try {
      await deleteOffice(id);
      setOffices(prev => prev.filter(o => o.id !== id));
    } catch {
      setError("Failed to delete office");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Manage Offices</h1>
        <form onSubmit={handleCreate} className="mb-4 flex flex-col md:flex-row gap-2">
          <input
            className="border px-2 py-1 rounded flex-1"
            value={newOffice}
            onChange={e => setNewOffice(e.target.value)}
            placeholder="New office name"
          />
          <input
            className="border px-2 py-1 rounded flex-1"
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
            placeholder="Description (optional)"
          />
          <input
            className="border px-2 py-1 rounded flex-1"
            value={newLocation}
            onChange={e => setNewLocation(e.target.value)}
            placeholder="Location (optional)"
          />
          <button className="bg-green-700 text-white px-4 py-1 rounded" type="submit">Add</button>
        </form>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <ul className="divide-y">
            {offices.map(office => (
              <li key={office.id} className="py-4 flex flex-col md:flex-row md:items-center gap-4 border-b">
                <div className="flex-1">
                  <div className="font-semibold text-lg">{office.name}</div>
                  {office.description && <div className="text-gray-500 text-sm">{office.description}</div>}
                  {office.location && <div className="text-gray-400 text-xs">Location: {office.location}</div>}
                  <div className="text-xs text-gray-500 mt-1">QR Code: <span className="font-mono">{office.qr_code}</span></div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  {office.qr_code && (
                    <div style={{ background: 'white', padding: 4, borderRadius: 8 }}>
                      <QRCode value={office.qr_code} size={64} />
                    </div>
                  )}
                  {editing === office.id ? (
                    <div className="flex flex-col gap-2 mt-2">
                      <input
                        className="border px-2 py-1 rounded flex-1"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        placeholder="Office name"
                      />
                      <input
                        className="border px-2 py-1 rounded flex-1"
                        value={editDescription}
                        onChange={e => setEditDescription(e.target.value)}
                        placeholder="Description (optional)"
                      />
                      <input
                        className="border px-2 py-1 rounded flex-1"
                        value={editLocation}
                        onChange={e => setEditLocation(e.target.value)}
                        placeholder="Location (optional)"
                      />
                      <div className="flex gap-2">
                        <button className="bg-blue-600 text-white px-2 py-1 rounded" onClick={() => handleUpdate(office.id)}>Save</button>
                        <button className="bg-gray-400 text-white px-2 py-1 rounded" onClick={() => setEditing(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-2">
                      <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={() => handleEdit(office)}>Edit</button>
                      <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={() => handleDelete(office.id)}>Delete</button>
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

export default OfficesPage;
