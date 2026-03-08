import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { fetchItemsReport, fetchBorrowsReport, fetchStockLevelsReport } from '../api/reports';
import { fetchOffices } from '../api/office';
import { fetchCategories } from '../api/category';
import {
  Box, Typography, Card, CardContent, Grid, TextField, MenuItem,
  Button, IconButton, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Stack, Divider,
  alpha, useTheme, ToggleButton, ToggleButtonGroup, Tooltip,
  TablePagination, Fade, LinearProgress, InputAdornment, Avatar,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  BarChart as ChartIcon,
  Refresh as RefreshIcon,
  DateRange as DateIcon,
  Business as OfficeIcon,
  Category as CategoryIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Block as BlockIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon,
  Description as DescriptionIcon,
  CloudDownload as CloudDownloadIcon,
  Assessment as AssessmentIcon,
  SwapHoriz as BorrowIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (date) =>
  date ? new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

const fmtPrice = (val) =>
  val != null ? `₱${parseFloat(val).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '₱0.00';

const stockColor = (status) => {
  if (status === 'Critical') return 'error';
  if (status === 'Low') return 'warning';
  return 'success';
};

const statusChipColor = (status) => {
  const map = {
    Available: 'success', Borrowed: 'warning', Inactive: 'error',
    Pending: 'warning', Approved: 'info', Returned: 'success',
    Rejected: 'error',
  };
  return map[status] || 'default';
};

// ─── Stats bar ──────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon }) => {
  const theme = useTheme();
  return (
    <Card elevation={0} sx={{
      p: 2.5, borderRadius: 3,
      border: `1px solid ${alpha(theme.palette[color].main, 0.15)}`,
      bgcolor: alpha(theme.palette[color].main, 0.05),
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: alpha(theme.palette[color].main, 0.15), color: `${color}.main` }}>
          {icon}
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={800}>{value ?? 0}</Typography>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Box>
      </Box>
    </Card>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const ReportsPage = () => {
  const theme = useTheme();
  const printRef = useRef(null);

  // shared state
  const [tab, setTab] = useState('detailed');       // 'detailed' | 'borrows' | 'stock'
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [offices, setOffices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // detailed (items) report
  const [itemFilters, setItemFilters] = useState({ start_date: null, end_date: null, office_id: '', category_id: '', status: '' });
  const [itemData, setItemData] = useState([]);
  const [itemStats, setItemStats] = useState(null);

  // borrows report
  const [borrowFilters, setBorrowFilters] = useState({ start_date: null, end_date: null, office_id: '', status: '' });
  const [borrowData, setBorrowData] = useState([]);
  const [borrowStats, setBorrowStats] = useState(null);

  // stock levels report
  const [stockFilters, setStockFilters] = useState({ office_id: '', category_id: '', stock_status: '' });
  const [stockData, setStockData] = useState([]);
  const [stockStats, setStockStats] = useState(null);

  useEffect(() => { loadLookups(); }, []);

  const loadLookups = async () => {
    try { const r = await fetchOffices(); setOffices(r?.data || r || []); } catch { setOffices([]); }
    try { const r = await fetchCategories(); setCategories(r?.data || r || []); } catch { setCategories([]); }
  };

  const fmtDate = (d) => d ? new Date(d).toISOString().split('T')[0] : '';

  // ── Run report ─────────────────────────────────────────────────────────────
  const runReport = async () => {
    setLoading(true);
    setPage(0);
    try {
      if (tab === 'detailed') {
        const res = await fetchItemsReport({
          ...itemFilters,
          start_date: fmtDate(itemFilters.start_date),
          end_date: fmtDate(itemFilters.end_date),
        });
        setItemData(res?.data || []);
        setItemStats(res?.stats || null);
      } else if (tab === 'borrows') {
        const res = await fetchBorrowsReport({
          ...borrowFilters,
          start_date: fmtDate(borrowFilters.start_date),
          end_date: fmtDate(borrowFilters.end_date),
        });
        setBorrowData(res?.data || []);
        setBorrowStats(res?.stats || null);
      } else if (tab === 'stock') {
        const res = await fetchStockLevelsReport(stockFilters);
        setStockData(res?.data || []);
        setStockStats(res?.stats || null);
      }
    } catch (e) {
      console.error('Report error:', e);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setPage(0);
    if (tab === 'detailed') setItemFilters({ start_date: null, end_date: null, office_id: '', category_id: '', status: '' });
    else if (tab === 'borrows') setBorrowFilters({ start_date: null, end_date: null, office_id: '', status: '' });
    else setStockFilters({ office_id: '', category_id: '', stock_status: '' });
  };

  // ── CSV export ─────────────────────────────────────────────────────────────
  const exportCsv = () => {
    setExportLoading(true);
    try {
      let headers, rows;
      if (tab === 'detailed') {
        headers = ['#', 'Item Name', 'Category', 'Office', 'Serial No.', 'Status', 'Purchase Date', 'Purchase Price'];
        rows = itemData.map((r, i) => [i + 1, r.name, r.category?.name || '', r.office?.name || '', r.serial_number || '', r.status || '', r.purchase_date || '', r.purchase_price || '']);
      } else if (tab === 'borrows') {
        headers = ['#', 'Borrower', 'Item', 'Serial No.', 'Office', 'Borrow Date', 'Expected Return', 'Status'];
        rows = borrowData.map((r, i) => [i + 1, r.borrowed_by?.name || r.borrowedBy?.name || '', r.item?.name || '', r.item?.serial_number || '', r.item?.office?.name || '', r.borrow_date || '', r.expected_return_date || '', r.status || '']);
      } else {
        headers = ['#', 'Item', 'Category', 'Office', 'Stock', 'Reorder Level', 'Safety Stock', 'Unit', 'Status'];
        rows = stockData.map((r, i) => [i + 1, r.name, r.category?.name || '', r.office?.name || '', r.stock ?? 0, r.reorder_level ?? 'N/A', r.safety_stock ?? 'N/A', r.unit || '', r.stock_status || '']);
      }
      const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tab}-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setExportLoading(false);
    }
  };

  // ── PDF export (print) ─────────────────────────────────────────────────────
  const exportPdf = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(`
      <!DOCTYPE html><html><head>
        <title>MinSU Inventory Report — ${new Date().toLocaleDateString()}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; color: #222; }
          h2 { color: #006400; margin-bottom: 4px; }
          .sub { color: #555; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #006400; color: white; padding: 6px 8px; text-align: left; font-size: 11px; }
          td { padding: 5px 8px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) td { background: #f9f9f9; }
          .chip { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; }
          .chip-success { background: #e8f5e9; color: #2e7d32; }
          .chip-warning { background: #fff8e1; color: #f57f17; }
          .chip-error   { background: #ffebee; color: #c62828; }
          .chip-info    { background: #e3f2fd; color: #1565c0; }
          .stats { display: flex; gap: 16px; margin-bottom: 16px; }
          .stat { background: #f5f5f5; border-radius: 8px; padding: 10px 14px; text-align: center; flex: 1; }
          .stat-val { font-size: 22px; font-weight: 800; color: #006400; }
          .stat-lbl { font-size: 10px; color: #777; }
          @media print { @page { margin: 1cm; } }
        </style>
      </head><body>
        <h2>MinSU Supply Operations — ${tab === 'detailed' ? 'Inventory Items Report' : tab === 'borrows' ? 'Borrow Records Report' : 'Consumable Stock Levels Report'}</h2>
        <p class="sub">Generated: ${new Date().toLocaleString('en-PH')}</p>
        ${printContent}
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const activeData = tab === 'detailed' ? itemData : tab === 'borrows' ? borrowData : stockData;
  const hasData = activeData.length > 0;

  // ─── Filter Panels ─────────────────────────────────────────────────────────
  const renderFilters = () => {
    if (tab === 'detailed') return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <DatePicker label="Start Date" value={itemFilters.start_date}
            onChange={(d) => setItemFilters(p => ({ ...p, start_date: d }))}
            renderInput={(params) => <TextField {...params} fullWidth size="small" />}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <DatePicker label="End Date" value={itemFilters.end_date}
            onChange={(d) => setItemFilters(p => ({ ...p, end_date: d }))}
            renderInput={(params) => <TextField {...params} fullWidth size="small" />}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={2}>
          <TextField select fullWidth label="Office" size="small" value={itemFilters.office_id}
            onChange={(e) => setItemFilters(p => ({ ...p, office_id: e.target.value }))}>
            <MenuItem value="">All Offices</MenuItem>
            {offices.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} md={6} lg={2}>
          <TextField select fullWidth label="Category" size="small" value={itemFilters.category_id}
            onChange={(e) => setItemFilters(p => ({ ...p, category_id: e.target.value }))}>
            <MenuItem value="">All Categories</MenuItem>
            {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} md={6} lg={2}>
          <TextField select fullWidth label="Status" size="small" value={itemFilters.status}
            onChange={(e) => setItemFilters(p => ({ ...p, status: e.target.value }))}>
            <MenuItem value="">All Status</MenuItem>
            {['Available', 'Borrowed', 'Inactive', 'Under Maintenance'].map(s => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
    );

    if (tab === 'borrows') return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <DatePicker label="Start Date" value={borrowFilters.start_date}
            onChange={(d) => setBorrowFilters(p => ({ ...p, start_date: d }))}
            renderInput={(params) => <TextField {...params} fullWidth size="small" />}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <DatePicker label="End Date" value={borrowFilters.end_date}
            onChange={(d) => setBorrowFilters(p => ({ ...p, end_date: d }))}
            renderInput={(params) => <TextField {...params} fullWidth size="small" />}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <TextField select fullWidth label="Office (Item)" size="small" value={borrowFilters.office_id}
            onChange={(e) => setBorrowFilters(p => ({ ...p, office_id: e.target.value }))}>
            <MenuItem value="">All Offices</MenuItem>
            {offices.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <TextField select fullWidth label="Borrow Status" size="small" value={borrowFilters.status}
            onChange={(e) => setBorrowFilters(p => ({ ...p, status: e.target.value }))}>
            <MenuItem value="">All Status</MenuItem>
            {['Pending', 'Approved', 'Borrowed', 'Returned', 'Rejected'].map(s => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
    );

    // stock
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <TextField select fullWidth label="Office" size="small" value={stockFilters.office_id}
            onChange={(e) => setStockFilters(p => ({ ...p, office_id: e.target.value }))}>
            <MenuItem value="">All Offices</MenuItem>
            {offices.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField select fullWidth label="Category" size="small" value={stockFilters.category_id}
            onChange={(e) => setStockFilters(p => ({ ...p, category_id: e.target.value }))}>
            <MenuItem value="">All Categories</MenuItem>
            {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField select fullWidth label="Stock Status" size="small" value={stockFilters.stock_status}
            onChange={(e) => setStockFilters(p => ({ ...p, stock_status: e.target.value }))}>
            <MenuItem value="">All Levels</MenuItem>
            <MenuItem value="OK">OK</MenuItem>
            <MenuItem value="Low">Low</MenuItem>
            <MenuItem value="Critical">Critical</MenuItem>
          </TextField>
        </Grid>
      </Grid>
    );
  };

  // ─── Stats row ─────────────────────────────────────────────────────────────
  const renderStats = () => {
    if (tab === 'detailed' && itemStats) return (
      <Fade in>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={4} md={2.4}><StatCard label="Total Items" value={itemStats.total_items} color="info" icon={<InventoryIcon />} /></Grid>
          <Grid item xs={6} sm={4} md={2.4}><StatCard label="Available" value={itemStats.available} color="success" icon={<CheckIcon />} /></Grid>
          <Grid item xs={6} sm={4} md={2.4}><StatCard label="Borrowed" value={itemStats.borrowed} color="warning" icon={<ScheduleIcon />} /></Grid>
          <Grid item xs={6} sm={4} md={2.4}><StatCard label="Inactive" value={itemStats.inactive} color="error" icon={<BlockIcon />} /></Grid>
          <Grid item xs={12} sm={4} md={2.4}>
            <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.15), color: 'success.main' }}><MoneyIcon /></Avatar>
                <Box>
                  <Typography variant="body1" fontWeight={800} fontSize="0.95rem">
                    {fmtPrice(itemStats.total_value)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Total Value</Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Fade>
    );

    if (tab === 'borrows' && borrowStats) return (
      <Fade in>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={4} md={2}><StatCard label="Total Borrows" value={borrowStats.total_borrows} color="info" icon={<BorrowIcon />} /></Grid>
          <Grid item xs={6} sm={4} md={2}><StatCard label="Pending" value={borrowStats.pending} color="warning" icon={<ScheduleIcon />} /></Grid>
          <Grid item xs={6} sm={4} md={2}><StatCard label="Approved" value={borrowStats.approved} color="info" icon={<CheckIcon />} /></Grid>
          <Grid item xs={6} sm={4} md={2}><StatCard label="Returned" value={borrowStats.returned} color="success" icon={<CheckIcon />} /></Grid>
          <Grid item xs={6} sm={4} md={2}><StatCard label="Overdue" value={borrowStats.overdue} color="error" icon={<WarningIcon />} /></Grid>
          <Grid item xs={6} sm={4} md={2}><StatCard label="Rejected" value={borrowStats.rejected || 0} color="error" icon={<BlockIcon />} /></Grid>
        </Grid>
      </Fade>
    );

    if (tab === 'stock' && stockStats) return (
      <Fade in>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={6} md={3}><StatCard label="Total Consumables" value={stockStats.total_consumables} color="info" icon={<InventoryIcon />} /></Grid>
          <Grid item xs={6} md={3}><StatCard label="OK" value={stockStats.ok} color="success" icon={<CheckIcon />} /></Grid>
          <Grid item xs={6} md={3}><StatCard label="Low Stock" value={stockStats.low} color="warning" icon={<WarningIcon />} /></Grid>
          <Grid item xs={6} md={3}><StatCard label="Critical" value={stockStats.critical} color="error" icon={<ErrorIcon />} /></Grid>
        </Grid>
      </Fade>
    );

    return null;
  };

  // ─── Table content ─────────────────────────────────────────────────────────
  const renderTable = () => {
    if (tab === 'detailed') return (
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
            {['#', 'Item Name', 'Category', 'Office / Dept.', 'Serial No.', 'Status', 'Purchase Date', 'Purchase Price'].map(h => (
              <TableCell key={h} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {itemData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, i) => (
            <TableRow key={row.id || i} hover sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}>
              <TableCell><Typography variant="caption" color="text.secondary">{page * rowsPerPage + i + 1}</Typography></TableCell>
              <TableCell><Typography variant="body2" fontWeight={600}>{row.name}</Typography></TableCell>
              <TableCell><Chip label={row.category?.name || 'N/A'} size="small" sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', fontSize: '0.7rem' }} /></TableCell>
              <TableCell><Typography variant="body2">{row.office?.name || 'N/A'}</Typography></TableCell>
              <TableCell><Typography variant="body2" fontFamily="monospace">{row.serial_number || 'N/A'}</Typography></TableCell>
              <TableCell><Chip label={row.status || 'N/A'} size="small" color={statusChipColor(row.status)} sx={{ fontWeight: 600, fontSize: '0.7rem' }} /></TableCell>
              <TableCell><Typography variant="body2">{fmt(row.purchase_date)}</Typography></TableCell>
              <TableCell><Typography variant="body2" fontWeight={700} color="success.main">{fmtPrice(row.purchase_price)}</Typography></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );

    if (tab === 'borrows') return (
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
            {['#', 'Borrower', 'Item', 'Serial No.', 'Office', 'Borrow Date', 'Expected Return', 'Approved By', 'Status'].map(h => (
              <TableCell key={h} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {borrowData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, i) => {
            const isOverdue = row.status === 'Approved' && row.expected_return_date && new Date(row.expected_return_date) < new Date();
            return (
              <TableRow key={row.id || i} hover sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}>
                <TableCell><Typography variant="caption" color="text.secondary">{page * rowsPerPage + i + 1}</Typography></TableCell>
                <TableCell><Typography variant="body2" fontWeight={600}>{row.borrowed_by?.name || row.borrowedBy?.name || 'N/A'}</Typography></TableCell>
                <TableCell><Typography variant="body2">{row.item?.name || 'N/A'}</Typography></TableCell>
                <TableCell><Typography variant="body2" fontFamily="monospace">{row.item?.serial_number || 'N/A'}</Typography></TableCell>
                <TableCell><Typography variant="body2">{row.item?.office?.name || 'N/A'}</Typography></TableCell>
                <TableCell><Typography variant="body2">{fmt(row.borrow_date)}</Typography></TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {isOverdue && <WarningIcon fontSize="small" color="error" />}
                    <Typography variant="body2" color={isOverdue ? 'error.main' : 'text.primary'} fontWeight={isOverdue ? 700 : 400}>
                      {fmt(row.expected_return_date)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell><Typography variant="body2">{row.approved_by?.name || row.approvedBy?.name || '—'}</Typography></TableCell>
                <TableCell>
                  <Chip label={isOverdue ? 'Overdue' : (row.status || 'N/A')} size="small"
                    color={isOverdue ? 'error' : statusChipColor(row.status)} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );

    // stock levels
    return (
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
            {['#', 'Item Name', 'Category', 'Office', 'Current Stock', 'Reorder Level', 'Safety Stock', 'Unit', 'Stock Status'].map(h => (
              <TableCell key={h} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {stockData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, i) => {
            const pct = row.reorder_level ? Math.min(100, Math.round((row.stock / row.reorder_level) * 100)) : 100;
            return (
              <TableRow key={row.id || i} hover sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}>
                <TableCell><Typography variant="caption" color="text.secondary">{page * rowsPerPage + i + 1}</Typography></TableCell>
                <TableCell><Typography variant="body2" fontWeight={600}>{row.name}</Typography></TableCell>
                <TableCell><Chip label={row.category?.name || 'N/A'} size="small" sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', fontSize: '0.7rem' }} /></TableCell>
                <TableCell><Typography variant="body2">{row.office?.name || 'N/A'}</Typography></TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight={700}>{row.stock ?? 0}</Typography>
                    {row.reorder_level != null && (
                      <LinearProgress variant="determinate" value={pct}
                        color={stockColor(row.stock_status)} sx={{ mt: 0.5, height: 4, borderRadius: 2 }} />
                    )}
                  </Box>
                </TableCell>
                <TableCell><Typography variant="body2">{row.reorder_level ?? '—'}</Typography></TableCell>
                <TableCell><Typography variant="body2">{row.safety_stock ?? '—'}</Typography></TableCell>
                <TableCell><Typography variant="body2">{row.unit || '—'}</Typography></TableCell>
                <TableCell>
                  <Chip label={row.stock_status || 'OK'} size="small" color={stockColor(row.stock_status)}
                    sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  // ─── Print-friendly table (used by PDF export) ────────────────────────────
  const renderPrintTable = () => {
    if (!hasData) return null;
    if (tab === 'detailed') return (
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>{['#', 'Item Name', 'Category', 'Office', 'Serial No.', 'Status', 'Purchase Date', 'Purchase Price'].map(h => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>{itemData.map((r, i) => (
          <tr key={i}>
            <td>{i + 1}</td><td>{r.name}</td><td>{r.category?.name || 'N/A'}</td><td>{r.office?.name || 'N/A'}</td>
            <td>{r.serial_number || 'N/A'}</td>
            <td><span className={`chip chip-${statusChipColor(r.status) === 'success' ? 'success' : statusChipColor(r.status) === 'warning' ? 'warning' : 'error'}`}>{r.status}</span></td>
            <td>{fmt(r.purchase_date)}</td><td>{fmtPrice(r.purchase_price)}</td>
          </tr>
        ))}</tbody>
      </table>
    );

    if (tab === 'borrows') return (
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>{['#', 'Borrower', 'Item', 'Serial No.', 'Office', 'Borrow Date', 'Expected Return', 'Status'].map(h => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>{borrowData.map((r, i) => {
          const isOverdue = r.status === 'Approved' && r.expected_return_date && new Date(r.expected_return_date) < new Date();
          return (
            <tr key={i}>
              <td>{i + 1}</td><td>{r.borrowed_by?.name || r.borrowedBy?.name || 'N/A'}</td>
              <td>{r.item?.name || 'N/A'}</td><td>{r.item?.serial_number || 'N/A'}</td>
              <td>{r.item?.office?.name || 'N/A'}</td>
              <td>{fmt(r.borrow_date)}</td><td>{fmt(r.expected_return_date)}</td>
              <td><span className={`chip chip-${isOverdue ? 'error' : 'info'}`}>{isOverdue ? 'Overdue' : r.status}</span></td>
            </tr>
          );
        })}</tbody>
      </table>
    );

    return (
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>{['#', 'Item', 'Category', 'Office', 'Stock', 'Reorder Level', 'Unit', 'Stock Status'].map(h => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>{stockData.map((r, i) => (
          <tr key={i}>
            <td>{i + 1}</td><td>{r.name}</td><td>{r.category?.name || 'N/A'}</td><td>{r.office?.name || 'N/A'}</td>
            <td>{r.stock ?? 0}</td><td>{r.reorder_level ?? 'N/A'}</td><td>{r.unit || 'N/A'}</td>
            <td><span className={`chip chip-${r.stock_status === 'OK' ? 'success' : r.stock_status === 'Low' ? 'warning' : 'error'}`}>{r.stock_status}</span></td>
          </tr>
        ))}</tbody>
      </table>
    );
  };

  const tabTitle = tab === 'detailed' ? 'Detailed Inventory Report' : tab === 'borrows' ? 'Borrow Records Report' : 'Consumable Stock Levels';

  return (
    <DashboardLayout>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  Reports Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  Generate analytical inventory reports with real-time data
                </Typography>
              </Box>
              <Stack direction="row" spacing={1.5}>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={clearFilters} sx={{ borderRadius: 2.5 }}>
                  Clear
                </Button>
                <Button variant="contained" startIcon={<AssessmentIcon />} onClick={runReport} disabled={loading}
                  sx={{ borderRadius: 2.5, fontWeight: 600 }}>
                  {loading ? 'Running…' : 'Generate Report'}
                </Button>
              </Stack>
            </Box>

            {/* Tab selector */}
            <ToggleButtonGroup value={tab} exclusive onChange={(e, v) => { if (v) { setTab(v); setPage(0); } }}
              sx={{
                '& .MuiToggleButton-root': {
                  px: 3, py: 1, borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.25)}`,
                  '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main', borderColor: 'primary.main', fontWeight: 700 }
                }
              }}>
              <ToggleButton value="detailed"><DescriptionIcon sx={{ mr: 1 }} />Inventory Report</ToggleButton>
              <ToggleButton value="borrows"><BorrowIcon sx={{ mr: 1 }} />Borrows Report</ToggleButton>
              <ToggleButton value="stock"><InventoryIcon sx={{ mr: 1 }} />Stock Levels</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Filters */}
          <Card elevation={0} sx={{ mb: 3, borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.12)}`, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                <FilterIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={700}>Report Filters</Typography>
              </Box>
              {renderFilters()}
            </CardContent>
          </Card>

          {/* Stats */}
          {renderStats()}

          {/* Data Table */}
          <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.12)}`, overflow: 'hidden' }}>
            {/* Table toolbar */}
            <Box sx={{
              px: 3, py: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`, bgcolor: alpha(theme.palette.background.default, 0.6),
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AssessmentIcon sx={{ color: 'primary.main' }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>{tabTitle}</Typography>
                  <Typography variant="caption" color="text.secondary">{activeData.length} record{activeData.length !== 1 ? 's' : ''} found</Typography>
                </Box>
              </Box>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Export CSV">
                  <span>
                    <IconButton onClick={exportCsv} disabled={!hasData || exportLoading}
                      sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) } }}>
                      {exportLoading ? <CircularProgress size={20} /> : <CloudDownloadIcon fontSize="small" />}
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Export PDF">
                  <span>
                    <IconButton onClick={exportPdf} disabled={!hasData}
                      sx={{ bgcolor: alpha(theme.palette.error.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.16) } }}>
                      <PdfIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Box>

            {/* Table body */}
            <TableContainer>
              {loading ? (
                <Box sx={{ p: 8, textAlign: 'center' }}>
                  <CircularProgress size={52} sx={{ mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">Generating Report…</Typography>
                  <LinearProgress sx={{ mt: 2, maxWidth: 360, mx: 'auto' }} />
                </Box>
              ) : !hasData ? (
                <Box sx={{ p: 8, textAlign: 'center' }}>
                  <Box sx={{ display: 'inline-flex', p: 3, borderRadius: '50%', bgcolor: alpha(theme.palette.divider, 0.1), mb: 3 }}>
                    <AssessmentIcon sx={{ fontSize: 56, color: alpha(theme.palette.text.secondary, 0.25) }} />
                  </Box>
                  <Typography variant="h6" color="text.secondary" fontWeight={600} gutterBottom>No Data Available</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 380, mx: 'auto' }}>
                    Select your filters above and click "Generate Report" to view data.
                  </Typography>
                  <Button variant="contained" startIcon={<AssessmentIcon />} onClick={runReport} sx={{ borderRadius: 2.5 }}>
                    Generate Report
                  </Button>
                </Box>
              ) : (
                <>
                  {renderTable()}
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={activeData.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, p) => setPage(p)}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                  />
                </>
              )}
            </TableContainer>
          </Card>

          {/* Footer export buttons */}
          {hasData && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="outlined" startIcon={<CloudDownloadIcon />} onClick={exportCsv} disabled={exportLoading}
                sx={{ px: 4, borderRadius: 2.5 }}>
                {exportLoading ? 'Exporting…' : 'Export CSV'}
              </Button>
              <Button variant="contained" startIcon={<PdfIcon />} onClick={exportPdf}
                sx={{ px: 4, borderRadius: 2.5, bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' } }}>
                Export PDF
              </Button>
            </Box>
          )}
        </Box>

        {/* Hidden print DOM — used by exportPdf */}
        <Box sx={{ display: 'none' }}>
          <Box ref={printRef}>
            {renderPrintTable()}
          </Box>
        </Box>
      </LocalizationProvider>
    </DashboardLayout>
  );
};

export default ReportsPage;