import React, { useEffect, useState } from "react";
import { fetchOffices, createOffice, updateOffice, deleteOffice } from "../api/office";
import DashboardLayout from "../components/Layout/DashboardLayout";
import QRCode from "react-qr-code";
import { 
  Edit as FiEdit2, 
  Delete as FiTrash2, 
  Add as FiPlus, 
  Close as FiX, 
  LocationOn as FiMapPin, 
  Info as FiInfo 
} from "@mui/icons-material";

const OfficesPage = () => {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
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
      setError(null);
    } catch (err) {
      setError("Failed to load offices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newOffice.trim()) {
      setError("Office name is required");
      return;
    }
    try {
      const created = await createOffice({ 
        name: newOffice, 
        description: newDescription, 
        location: newLocation 
      });
      const newOfficeData = created.data?.data || created.data || created;
      setOffices(prev => [...prev, newOfficeData]);
      setNewOffice("");
      setNewDescription("");
      setNewLocation("");
      setShowAddModal(false);
      setError(null);
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
    if (!editName.trim()) {
      setError("Office name is required");
      return;
    }
    try {
      const updated = await updateOffice(id, { 
        name: editName, 
        description: editDescription, 
        location: editLocation 
      });
      const updatedOfficeData = updated.data?.data || updated.data || updated;
      setOffices(prev => prev.map(o => o.id === id ? updatedOfficeData : o));
      setEditing(null);
      setEditName("");
      setEditDescription("");
      setEditLocation("");
      setError(null);
    } catch {
      setError("Failed to update office");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this office?")) return;
    try {
      await deleteOffice(id);
      setOffices(prev => prev.filter(o => o.id !== id));
    } catch {
      setError("Failed to delete office");
    }
  };

  const resetAddForm = () => {
    setNewOffice("");
    setNewDescription("");
    setNewLocation("");
    setError(null);
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Office Management</h1>
            <p className="text-gray-600 mt-2">Manage your office locations and QR codes</p>
          </div>
          <button
            onClick={() => {
              resetAddForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            <FiPlus size={20} />
            Add New Office
          </button>
        </div>

        {/* Add Office Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">Add New Office</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>
              
              <form onSubmit={handleCreate} className="p-6">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Office Name *
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      value={newOffice}
                      onChange={e => setNewOffice(e.target.value)}
                      placeholder="Enter office name"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FiInfo className="inline mr-1" />
                      Description (Optional)
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                      value={newDescription}
                      onChange={e => setNewDescription(e.target.value)}
                      placeholder="Enter description"
                      rows="3"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FiMapPin className="inline mr-1" />
                      Location (Optional)
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      value={newLocation}
                      onChange={e => setNewLocation(e.target.value)}
                      placeholder="Enter location"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-8">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    Create Office
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && !showAddModal && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center text-red-700">
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Offices List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading offices...</p>
            </div>
          </div>
        ) : offices.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl">
            <div className="text-gray-400 mb-4">
              <FiPlus size={48} className="mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Offices Yet</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first office</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <FiPlus size={18} />
              Add First Office
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offices.map(office => (
              <div key={office.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      {editing === office.id ? (
                        <div className="space-y-3">
                          <input
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            placeholder="Office name"
                          />
                          <input
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={editDescription}
                            onChange={e => setEditDescription(e.target.value)}
                            placeholder="Description"
                          />
                          <input
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={editLocation}
                            onChange={e => setEditLocation(e.target.value)}
                            placeholder="Location"
                          />
                        </div>
                      ) : (
                        <>
                          <h3 className="text-xl font-bold text-gray-800 mb-2">{office.name}</h3>
                          {office.description && (
                            <p className="text-gray-600 mb-3">{office.description}</p>
                          )}
                          {office.location && (
                            <div className="flex items-center text-gray-500 text-sm">
                              <FiMapPin className="mr-1" />
                              {office.location}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* QR Code */}
                    {office.qr_code && !editing && (
                      <div className="ml-4">
                        <div className="bg-white p-2 rounded-lg border">
                          <QRCode value={office.qr_code} size={80} />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* QR Code Text */}
                  {office.qr_code && (
                    <div className="mb-6">
                      <div className="text-xs text-gray-500 mb-1">QR Code Identifier</div>
                      <div className="font-mono text-sm bg-gray-50 px-3 py-2 rounded border break-all">
                        {office.qr_code}
                      </div>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    {editing === office.id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(office.id)}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(office)}
                          className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          <FiEdit2 size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(office.id)}
                          className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          <FiTrash2 size={16} />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OfficesPage;