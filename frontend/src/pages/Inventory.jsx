import React, { useEffect, useState } from "react";
import { fetchItems } from "../api/item";
import { fetchCategories } from "../api/category";
import { fetchOffices } from "../api/office";
import DashboardLayout from "../components/Layout/DashboardLayout";

const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAll();
    // Only fetch once on mount
  }, []);

  const loadAll = async () => {
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
      setError("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  // Simple stats
  const totalItems = items.length;
  const totalCategories = categories.length;
  const totalOffices = offices.length;
  const availableItems = items.filter(i => i.status === "available").length;
  const borrowedItems = items.filter(i => i.status === "borrowed").length;
  const damagedItems = items.filter(i => i.status === "damaged").length;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Inventory Overview</h1>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white shadow rounded p-4 text-center">
                <div className="text-3xl font-bold text-green-700">{totalItems}</div>
                <div className="text-gray-600">Total Items</div>
              </div>
              <div className="bg-white shadow rounded p-4 text-center">
                <div className="text-3xl font-bold text-blue-700">{totalCategories}</div>
                <div className="text-gray-600">Categories</div>
              </div>
              <div className="bg-white shadow rounded p-4 text-center">
                <div className="text-3xl font-bold text-yellow-700">{totalOffices}</div>
                <div className="text-gray-600">Offices</div>
              </div>
              <div className="bg-white shadow rounded p-4 text-center">
                <div className="text-3xl font-bold text-gray-700">{availableItems}</div>
                <div className="text-gray-600">Available</div>
              </div>
              <div className="bg-white shadow rounded p-4 text-center">
                <div className="text-3xl font-bold text-red-700">{borrowedItems}</div>
                <div className="text-gray-600">Borrowed</div>
              </div>
              <div className="bg-white shadow rounded p-4 text-center">
                <div className="text-3xl font-bold text-pink-700">{damagedItems}</div>
                <div className="text-gray-600">Damaged</div>
              </div>
            </div>
            <div className="bg-white shadow rounded p-4">
              <h2 className="text-lg font-semibold mb-2">Recent Items</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 text-left">Name</th>
                      <th className="px-2 py-1 text-left">Category</th>
                      <th className="px-2 py-1 text-left">Office</th>
                      <th className="px-2 py-1 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.slice(0, 10).map(item => (
                      <tr key={item.id} className="border-t">
                        <td className="px-2 py-1">{item.name}</td>
                        <td className="px-2 py-1">{categories.find(c => c.id === item.category_id)?.name || '-'}</td>
                        <td className="px-2 py-1">{offices.find(o => o.id === item.office_id)?.name || '-'}</td>
                        <td className="px-2 py-1">{item.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InventoryPage;
