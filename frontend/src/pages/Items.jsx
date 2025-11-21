import React, { useEffect, useState } from "react";
import { fetchItems, createItem, updateItem, deleteItem } from "../api/item";
import { fetchCategories } from "../api/category";
import { fetchOffices } from "../api/office";
import DashboardLayout from "../components/Layout/DashboardLayout";
import ItemQrCode from "../components/ItemQrCode";

const statusOptions = [
  { value: "available", label: "Available" },
  { value: "borrowed", label: "Borrowed" },
  { value: "damaged", label: "Damaged" },
  { value: "disposed", label: "Disposed" },
];

const ItemsPage = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    category_id: "",
    office_id: "",
    status: "available",
    serial_number: "",
    condition: "Good",
    purchase_date: "",
    purchase_price: "",
    warranty_expiry: "",
    notes: ""
  });
  const [editing, setEditing] = useState(null);
  const [editItem, setEditItem] = useState({
    name: "",
    description: "",
    category_id: "",
    office_id: "",
    status: "available",
    serial_number: "",
    condition: "Good",
    purchase_date: "",
    purchase_price: "",
    warranty_expiry: "",
    notes: ""
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    console.log('loadAll called');
    setLoading(true);
    try {
      const [itemData, catData, officeData] = await Promise.all([
        fetchItems(),
        fetchCategories(),
        fetchOffices(),
      ]);
      setItems(itemData.data || []);
      setCategories(catData.data || []);
      setOffices(officeData.data || []);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const result = await createItem(newItem);
      setItems(prev => [result.item, ...prev]);
      setNewItem({
        name: "", description: "", category_id: "", office_id: "", status: "available",
        serial_number: "", condition: "Good", purchase_date: "", purchase_price: "", warranty_expiry: "", notes: ""
      });
    } catch {
      setError("Failed to create item");
    }
  };

  const handleEdit = (item) => {
    setEditing(item.id);
    setEditItem({
      name: item.name,
      description: item.description,
      category_id: item.category_id,
      office_id: item.office_id,
      status: item.status,
    });
  };

  const handleUpdate = async (id) => {
    try {
      const result = await updateItem(id, editItem);
      setItems(prev => prev.map(item => item.id === id ? result.item : item));
      setEditing(null);
      setEditItem({
        name: "", description: "", category_id: "", office_id: "", status: "available",
        serial_number: "", condition: "Good", purchase_date: "", purchase_price: "", warranty_expiry: "", notes: ""
      });
    } catch {
      setError("Failed to update item");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await deleteItem(id);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch {
      setError("Failed to delete item");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Manage Items</h1>
        <form onSubmit={handleCreate} className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
          <input className="border px-2 py-1 rounded" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="Item name" required />
          <input className="border px-2 py-1 rounded" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} placeholder="Description" />
          <input className="border px-2 py-1 rounded" value={newItem.serial_number} onChange={e => setNewItem({ ...newItem, serial_number: e.target.value })} placeholder="Serial Number" />
          <select className="border px-2 py-1 rounded" value={newItem.condition} onChange={e => setNewItem({ ...newItem, condition: e.target.value })} required>
            {['Excellent','Good','Fair','Needs Repair','Damaged','Disposed'].map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <select className="border px-2 py-1 rounded" value={newItem.status} onChange={e => setNewItem({ ...newItem, status: e.target.value })} required>
            {['Available','Borrowed','Under Maintenance','Lost','Disposed'].map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <input className="border px-2 py-1 rounded" type="date" value={newItem.purchase_date} onChange={e => setNewItem({ ...newItem, purchase_date: e.target.value })} placeholder="Purchase Date" />
          <input className="border px-2 py-1 rounded" type="number" step="0.01" value={newItem.purchase_price} onChange={e => setNewItem({ ...newItem, purchase_price: e.target.value })} placeholder="Purchase Price" />
          <input className="border px-2 py-1 rounded" type="date" value={newItem.warranty_expiry} onChange={e => setNewItem({ ...newItem, warranty_expiry: e.target.value })} placeholder="Warranty Expiry" />
          <textarea className="border px-2 py-1 rounded" value={newItem.notes} onChange={e => setNewItem({ ...newItem, notes: e.target.value })} placeholder="Notes" />
          <select className="border px-2 py-1 rounded" value={newItem.category_id} onChange={e => setNewItem({ ...newItem, category_id: e.target.value })} required>
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select className="border px-2 py-1 rounded" value={newItem.office_id} onChange={e => setNewItem({ ...newItem, office_id: e.target.value })} required>
            <option value="">Select Office</option>
            {offices.map(office => (
              <option key={office.id} value={office.id}>{office.name}</option>
            ))}
          </select>
          <button className="bg-green-700 text-white px-4 py-1 rounded col-span-1 md:col-span-2" type="submit">Add</button>
        </form>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <ul className="divide-y">
            {items.map(item => (
              <li key={item.id} className="py-4 flex flex-col md:flex-row md:items-center gap-4 border-b">
                <div className="flex-1">
                  <div className="font-semibold text-lg">{item.name}</div>
                  <div className="text-gray-500 text-sm">{item.description}</div>
                  <div className="text-gray-400 text-xs">Category: {item.category?.name || categories.find(c => c.id === item.category_id)?.name || "-"}</div>
                  <div className="text-gray-400 text-xs">Office: {item.office?.name || offices.find(o => o.id === item.office_id)?.name || "-"}</div>
                  <div className="text-gray-400 text-xs">Status: {item.status}</div>
                  <ItemQrCode value={item.qr_code} />
                </div>
                <div className="flex flex-col items-center gap-2">
                  {editing === item.id ? (
                    <div className="flex flex-col gap-2 mt-2">
                      <input
                        className="border px-2 py-1 rounded flex-1"
                        value={editItem.name}
                        onChange={e => setEditItem({ ...editItem, name: e.target.value })}
                        placeholder="Item name"
                      />
                      <input
                        className="border px-2 py-1 rounded flex-1"
                        value={editItem.description}
                        onChange={e => setEditItem({ ...editItem, description: e.target.value })}
                        placeholder="Description"
                      />
                      <select
                        className="border px-2 py-1 rounded flex-1"
                        value={editItem.category_id}
                        onChange={e => setEditItem({ ...editItem, category_id: e.target.value })}
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <select
                        className="border px-2 py-1 rounded flex-1"
                        value={editItem.office_id}
                        onChange={e => setEditItem({ ...editItem, office_id: e.target.value })}
                      >
                        <option value="">Select Office</option>
                        {offices.map(office => (
                          <option key={office.id} value={office.id}>{office.name}</option>
                        ))}
                      </select>
                      <select
                        className="border px-2 py-1 rounded flex-1"
                        value={editItem.status}
                        onChange={e => setEditItem({ ...editItem, status: e.target.value })}
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button className="bg-blue-600 text-white px-2 py-1 rounded" onClick={() => handleUpdate(item.id)}>Save</button>
                        <button className="bg-gray-400 text-white px-2 py-1 rounded" onClick={() => setEditing(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-2">
                      <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={() => handleEdit(item)}>Edit</button>
                      <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={() => handleDelete(item.id)}>Delete</button>
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

export default ItemsPage;
