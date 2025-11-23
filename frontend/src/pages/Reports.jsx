import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { fetchItemsReport } from '../api/reports';
import { fetchOffices } from '../api/office';
import { fetchCategories } from '../api/category';

const ReportsPage = () => {
  const [filters, setFilters] = useState({ start_date: '', end_date: '', office_id: '', category_id: '', status: '' });
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [offices, setOffices] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadLookups();
  }, []);

  const loadLookups = async () => {
    try {
      const off = await fetchOffices();
      setOffices(off?.data || off || []);
    } catch (e) {
      setOffices([]);
    }
    try {
      const cat = await fetchCategories();
      setCategories(cat?.data || cat || []);
    } catch (e) {
      setCategories([]);
    }
  };

  const runReport = async () => {
    setLoading(true);
    try {
      const res = await fetchItemsReport(filters);
      setData(res?.data || res || []);
      setStats(res?.stats || null);
    } catch (e) {
      setData([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (!data || data.length === 0) return;
    const headers = ['ID', 'Name', 'Category', 'Office', 'Serial Number', 'Status', 'Purchase Date', 'Purchase Price'];
    const rows = data.map(r => [
      r.id,
      r.name,
      r.category?.name || '',
      r.office?.name || '',
      r.serial_number || '',
      r.status || '',
      r.purchase_date || '',
      r.purchase_price || ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `items-report-${new Date().toISOString().slice(0,10)}.csv`);
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Admin Reports</h1>
        <p className="text-gray-600 mb-6">Generate and export inventory reports with filters</p>

        {/* Filter Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Report Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input 
                type="date" 
                value={filters.start_date} 
                onChange={e => setFilters({...filters, start_date: e.target.value})} 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input 
                type="date" 
                value={filters.end_date} 
                onChange={e => setFilters({...filters, end_date: e.target.value})} 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Office</label>
              <select 
                value={filters.office_id} 
                onChange={e => setFilters({...filters, office_id: e.target.value})} 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Offices</option>
                {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select 
                value={filters.category_id} 
                onChange={e => setFilters({...filters, category_id: e.target.value})} 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                value={filters.status} 
                onChange={e => setFilters({...filters, status: e.target.value})} 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Borrowed">Borrowed</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            <button 
              onClick={runReport} 
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              📊 Run Report
            </button>
            <button 
              onClick={exportCsv} 
              disabled={!data || data.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              📥 Export CSV
            </button>
            <button 
              onClick={handlePrint}
              disabled={!data || data.length === 0}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              🖨️ Print / PDF
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-gray-600 text-sm font-medium">Total Items</div>
              <div className="text-2xl font-bold text-blue-600">{stats.total_items}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-gray-600 text-sm font-medium">Available</div>
              <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-gray-600 text-sm font-medium">Borrowed</div>
              <div className="text-2xl font-bold text-orange-600">{stats.borrowed}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-gray-600 text-sm font-medium">Inactive</div>
              <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            </div>
          </div>
        )}

        {/* Report Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Items Data</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-2">Loading report...</p>
              </div>
            ) : data.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No data found. Run a report to see results.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">#</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Category</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Office</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Serial #</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Purchase Date</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={row.id || idx} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 text-gray-900">{idx+1}</td>
                      <td className="px-6 py-3 text-gray-900 font-medium">{row.name}</td>
                      <td className="px-6 py-3 text-gray-700">{row.category?.name || '-'}</td>
                      <td className="px-6 py-3 text-gray-700">{row.office?.name || '-'}</td>
                      <td className="px-6 py-3 text-gray-700">{row.serial_number || '-'}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          row.status === 'Available' ? 'bg-green-100 text-green-800' :
                          row.status === 'Borrowed' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-700">{row.purchase_date || '-'}</td>
                      <td className="px-6 py-3 text-gray-700 font-medium">₱{row.purchase_price || '0'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            .no-print { display: none; }
            body { background: white; }
            .bg-white { page-break-inside: avoid; }
            table { page-break-inside: avoid; }
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
