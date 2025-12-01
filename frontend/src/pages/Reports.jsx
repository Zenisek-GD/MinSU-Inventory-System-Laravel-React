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
        <div className="mb-4">
          <nav className="text-sm text-gray-500 mb-2" aria-label="Breadcrumb">
            <ol className="list-none p-0 inline-flex">
              <li className="flex items-center">
                <span className="text-gray-400">Dashboard</span>
                <svg className="w-3 h-3 mx-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </li>
              <li className="flex items-center text-gray-700 font-semibold">Reports</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold mb-2">Admin Reports</h1>
          <p className="text-gray-600 mb-6">Generate and export inventory reports with filters</p>
        </div>

        {/* Filter Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18"/></svg>
            Report Filters
          </h2>
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
          <div className="mt-4 flex gap-2 flex-wrap items-center">
            <button 
              onClick={runReport} 
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17a4 4 0 100-8 4 4 0 000 8zM21 21l-4.35-4.35"/></svg>
              Run Report
            </button>
            <button 
              onClick={exportCsv} 
              disabled={!data || data.length === 0}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14"/></svg>
              Export CSV
            </button>
            <button 
              onClick={handlePrint}
              disabled={!data || data.length === 0}
              className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V2h12v7M6 22h12v-7H6v7z"/></svg>
              Print / PDF
            </button>
            <div className="ml-auto text-sm text-gray-500">{data?.length ? `${data.length} results` : 'No results'}</div>
          </div>
        </div>

        {/* Summary Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18"/></svg>
              </div>
              <div>
                <div className="text-gray-600 text-sm font-medium">Total Items</div>
                <div className="text-2xl font-bold text-blue-600">{stats.total_items}</div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-green-50 flex items-center justify-center text-green-600">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3"/></svg>
              </div>
              <div>
                <div className="text-gray-600 text-sm font-medium">Available</div>
                <div className="text-2xl font-bold text-green-600">{stats.available}</div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-orange-50 flex items-center justify-center text-orange-600">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18"/></svg>
              </div>
              <div>
                <div className="text-gray-600 text-sm font-medium">Borrowed</div>
                <div className="text-2xl font-bold text-orange-600">{stats.borrowed}</div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-red-50 flex items-center justify-center text-red-600">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.36 6.64l-12.72 12.72"/></svg>
              </div>
              <div>
                <div className="text-gray-600 text-sm font-medium">Inactive</div>
                <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
              </div>
            </div>
          </div>
        )}

        {/* Report Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center">
            <h2 className="text-lg font-semibold text-gray-800">Items Data</h2>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={exportCsv} disabled={!data || data.length === 0} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-3 py-1.5 rounded-md text-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14"/></svg>
                Export
              </button>
              <button onClick={handlePrint} disabled={!data || data.length === 0} className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white px-3 py-1.5 rounded-md text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V2h12v7M6 22h12v-7H6v7z"/></svg>
                Print
              </button>
            </div>
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
              <table className="w-full min-w-full text-sm table-auto">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-700 sticky top-0 bg-white z-10">#</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700 sticky top-0 bg-white z-10">Name</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700 sticky top-0 bg-white z-10">Category</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700 sticky top-0 bg-white z-10">Office</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700 sticky top-0 bg-white z-10">Serial #</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700 sticky top-0 bg-white z-10">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700 sticky top-0 bg-white z-10">Purchase Date</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700 sticky top-0 bg-white z-10">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={row.id || idx} className={`border-b transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
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
