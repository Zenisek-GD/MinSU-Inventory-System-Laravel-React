import React, { useEffect, useState } from "react";
import {
  fetchPurchaseRequests,
  createPurchaseRequest,
  deletePurchaseRequest,
} from "../api/purchaseRequest";
import DashboardLayout from "../components/Layout/DashboardLayout";
import { fetchOffices } from "../api/office";
import { useUser } from "../context/UserContext";

const defaultItem = {
  item_name: "",
  description: "",
  quantity: 1,
  unit: "",
  estimated_unit_price: 0,
  urgency: "Medium",
  specifications: "",
};

const PurchaseRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    office_id: "",
    purpose: "",
    items: [{ ...defaultItem }],
  });
  const [offices, setOffices] = useState([]);
  const [notif, setNotif] = useState("");
  const { user } = useUser();

  useEffect(() => {
    loadRequests();
    loadOffices();
  }, []);

  const loadOffices = async () => {
    try {
      const data = await fetchOffices();
      setOffices(data.data || []);
    } catch {
      setOffices([]);
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await fetchPurchaseRequests();
      setRequests(data);
    } catch {
      setError("Failed to load purchase requests");
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleItemChange = (idx, e) => {
    const items = [...form.items];
    items[idx][e.target.name] = e.target.value;
    setForm({ ...form, items });
  };

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { ...defaultItem }] });
  };

  const removeItem = (idx) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await createPurchaseRequest(form);
      setRequests((prev) => [result.purchase_request, ...prev]);
      setForm({ office_id: "", purpose: "", items: [{ ...defaultItem }] });
    } catch {
      setError("Failed to create purchase request");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this purchase request?")) return;
    try {
      await deletePurchaseRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("Failed to delete purchase request");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Purchase Requests</h1>
        {notif && (
          <div className="mb-4 p-2 bg-green-100 text-green-800 rounded">{notif}</div>
        )}
        <form onSubmit={handleSubmit} className="mb-6 border p-4 rounded bg-white">
          <select
            className="border px-2 py-1 rounded mb-2 w-full"
            name="office_id"
            value={form.office_id}
            onChange={handleFormChange}
            required
          >
            <option value="">Select Office</option>
            {offices.map((office) => (
              <option key={office.id} value={office.id}>{office.name}</option>
            ))}
          </select>
          <input
            className="border px-2 py-1 rounded mb-2 w-full"
            name="purpose"
            value={form.purpose}
            onChange={handleFormChange}
            placeholder="Purpose"
            required
          />
          <h2 className="font-semibold mb-2">Items</h2>
          {form.items.map((item, idx) => (
            <div key={idx} className="mb-2 border p-2 rounded">
              <input
                className="border px-2 py-1 rounded mr-2"
                name="item_name"
                value={item.item_name}
                onChange={(e) => handleItemChange(idx, e)}
                placeholder="Item Name"
                required
              />
              <input
                className="border px-2 py-1 rounded mr-2"
                name="description"
                value={item.description}
                onChange={(e) => handleItemChange(idx, e)}
                placeholder="Description"
              />
              <input
                className="border px-2 py-1 rounded mr-2"
                name="quantity"
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => handleItemChange(idx, e)}
                placeholder="Quantity"
                required
              />
              <input
                className="border px-2 py-1 rounded mr-2"
                name="unit"
                value={item.unit}
                onChange={(e) => handleItemChange(idx, e)}
                placeholder="Unit"
                required
              />
              <input
                className="border px-2 py-1 rounded mr-2"
                name="estimated_unit_price"
                type="number"
                min="0"
                value={item.estimated_unit_price}
                onChange={(e) => handleItemChange(idx, e)}
                placeholder="Unit Price"
                required
              />
              <select
                className="border px-2 py-1 rounded mr-2"
                name="urgency"
                value={item.urgency}
                onChange={(e) => handleItemChange(idx, e)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              <input
                className="border px-2 py-1 rounded mr-2"
                name="specifications"
                value={item.specifications}
                onChange={(e) => handleItemChange(idx, e)}
                placeholder="Specifications"
              />
              {form.items.length > 1 && (
                <button type="button" className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => removeItem(idx)}>
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" className="bg-blue-500 text-white px-2 py-1 rounded mb-2" onClick={addItem}>
            Add Item
          </button>
          <button className="bg-green-700 text-white px-4 py-1 rounded" type="submit">
            Submit Request
          </button>
        </form>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <ul className="divide-y">
            {requests.map((req) => (
              <li key={req.id} className="py-4 border-b">
                <div className="font-semibold">PR#: {req.pr_number}</div>
                <div>
                  Office: {
                    req.office?.name
                    || (offices.find(o => o.id === req.office_id)?.name || req.office_id)
                  }
                  {(() => {
                    const office = req.office || offices.find(o => o.id === req.office_id);
                    if (office) {
                      return (
                        <>
                          <div className="text-sm text-gray-500">{office.description}</div>
                          <div className="text-sm text-gray-500">Location: {office.location}</div>
                          {office.qr_code && <div className="text-xs text-gray-400">QR: {office.qr_code}</div>}
                        </>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div>Purpose: {req.purpose}</div>
                <div>Status: {req.status}</div>
                <div>Total Cost: ₱{req.total_estimated_cost}</div>
                <div>Requested By: {
                  typeof req.requested_by === 'object'
                    ? req.requested_by.name
                    : req.requested_by
                }</div>
                <div>Items:
                  <ul className="ml-4 list-disc">
                    {req.items?.map((item) => (
                      <li key={item.id}>
                        {item.item_name} ({item.quantity} {item.unit}) - ₱{item.estimated_total_price} [{item.urgency}]
                      </li>
                    ))}
                  </ul>
                </div>
                {req.status === "Pending" && user?.role === "supply_officer" && (
                  <div className="flex gap-2 mt-2">
                    <button
                      className="bg-green-600 text-white px-2 py-1 rounded"
                      onClick={async () => {
                        try {
                          await updatePurchaseRequest(req.id, { status: "Approved" });
                          setNotif("Request approved. Staff will be notified.");
                          setRequests((prev) => prev.map(r => r.id === req.id ? { ...r, status: "Approved" } : r));
                        } catch {
                          setNotif("Failed to approve request.");
                        }
                      }}
                    >Approve</button>
                    <button
                      className="bg-red-600 text-white px-2 py-1 rounded"
                      onClick={async () => {
                        try {
                          await updatePurchaseRequest(req.id, { status: "Rejected" });
                          setNotif("Request rejected. Staff will be notified.");
                          setRequests((prev) => prev.map(r => r.id === req.id ? { ...r, status: "Rejected" } : r));
                        } catch {
                          setNotif("Failed to reject request.");
                        }
                      }}
                    >Reject</button>
                  </div>
                )}
                <button className="bg-red-600 text-white px-2 py-1 rounded mt-2" onClick={() => handleDelete(req.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PurchaseRequestsPage;
