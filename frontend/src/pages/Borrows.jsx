import React, { useEffect, useState } from "react";
import {
  fetchBorrows,
  createBorrow,
  deleteBorrow,
} from "../api/borrow";
import { fetchItems } from "../api/item";
import DashboardLayout from "../components/Layout/DashboardLayout";

const BorrowsPage = () => {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    item_id: "",
    borrow_date: "",
    expected_return_date: "",
    purpose: "",
  });
  const [items, setItems] = useState([]);

  useEffect(() => {
    loadBorrows();
    loadItems();
  }, []);

  const loadBorrows = async () => {
    setLoading(true);
    try {
      const data = await fetchBorrows();
      setBorrows(data);
    } catch {
      setError("Failed to load borrow records");
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const data = await fetchItems();
      setItems(data.data || []);
    } catch {
      setItems([]);
    }
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await createBorrow(form);
      setBorrows((prev) => [result.borrow_record, ...prev]);
      setForm({ item_id: "", borrow_date: "", expected_return_date: "", purpose: "" });
    } catch {
      setError("Failed to create borrow record");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this borrow record?")) return;
    try {
      await deleteBorrow(id);
      setBorrows((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("Failed to delete borrow record");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Borrow Records</h1>
        <form onSubmit={handleSubmit} className="mb-6 border p-4 rounded bg-white">
          <select
            className="border px-2 py-1 rounded mb-2 w-full"
            name="item_id"
            value={form.item_id}
            onChange={handleFormChange}
            required
          >
            <option value="">Select Item</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <input
            className="border px-2 py-1 rounded mb-2 w-full"
            name="borrow_date"
            type="date"
            value={form.borrow_date}
            onChange={handleFormChange}
            required
          />
          <input
            className="border px-2 py-1 rounded mb-2 w-full"
            name="expected_return_date"
            type="date"
            value={form.expected_return_date}
            onChange={handleFormChange}
            required
          />
          <input
            className="border px-2 py-1 rounded mb-2 w-full"
            name="purpose"
            value={form.purpose}
            onChange={handleFormChange}
            placeholder="Purpose"
            required
          />
          <button className="bg-green-700 text-white px-4 py-1 rounded" type="submit">
            Submit Borrow
          </button>
        </form>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <ul className="divide-y">
            {borrows.map((br) => (
              <li key={br.id} className="py-4 border-b">
                <div className="font-semibold text-lg mb-1">Borrower: {br.borrowedBy?.name || br.borrowed_by?.name || br.borrowed_by}</div>
                <div className="mb-1">Purpose: {br.purpose}</div>
                <div className="mb-1">Status: {br.status}</div>
                <div className="mb-1">Borrow Date: {br.borrow_date ? new Date(br.borrow_date).toLocaleDateString() : ''}</div>
                <div className="mb-1">Expected Return: {br.expected_return_date ? new Date(br.expected_return_date).toLocaleDateString() : ''}</div>
                <div className="mb-1">Condition: {br.condition_before || br.condition_after || 'N/A'}</div>
                <div className="mt-2 font-semibold">Borrow Record Details:</div>
                <div className="ml-4">Item: {br.item?.name || br.item_id}</div>
                <button className="bg-red-600 text-white px-2 py-1 rounded mt-2" onClick={() => handleDelete(br.id)}>
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

export default BorrowsPage;
