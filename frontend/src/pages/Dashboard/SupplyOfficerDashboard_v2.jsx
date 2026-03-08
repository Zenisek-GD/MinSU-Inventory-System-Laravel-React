import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { fetchMemorandumReceipts, batchApproveMRs } from '../../api/memorandumReceipt';
import { fetchBorrows } from '../../api/borrow';
import { fetchStockMovements } from '../../api/stockMovement';
import { fetchItems } from '../../api/item';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import DashboardHeader from '../../components/Dashboard/DashboardHeader';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend
);

import {
  Grid, Typography, Box, Chip, CircularProgress, LinearProgress,
  alpha, useTheme, Button, Switch, TextField, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TablePagination,
} from '@mui/material';

import {
  RequestQuote as RequestIcon,
  ShoppingCart as CartIcon,
  SwapHoriz as TransferIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Assessment as ReportsIcon,
  ArrowForward as ArrowIcon,
  Inventory2 as InventoryIcon,
  FileDownload as DownloadIcon,
  Shield as ShieldIcon,
  AutorenewRounded as AutoRenewIcon,
} from '@mui/icons-material';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  orange: '#f59e0b',
  green: '#22c55e',
  blue: '#3b82f6',
  red: '#ef4444',
  indigo: '#6366f1',
};

const PANEL_RADIUS = 3;
const PANEL_SHADOW = '0 1px 12px rgba(0,0,0,0.07)';
const CELL_PX = 2.5;
const CELL_PY = 1.5;

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, sub }) {
  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: PANEL_RADIUS,
        border: `1.5px solid ${alpha(color, 0.2)}`,
        background: `linear-gradient(135deg, ${alpha(color, 0.10)} 0%, ${alpha(color, 0.03)} 100%)`,
        boxShadow: `0 4px 20px ${alpha(color, 0.08)}`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 28px ${alpha(color, 0.18)}`,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: -20, right: -20,
          width: 80, height: 80,
          borderRadius: '50%',
          background: alpha(color, 0.08),
        },
      }}
    >
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', height: '100%' }}>
        <Box>
          <Typography
            variant="caption"
            sx={{
              display: 'block', color: 'text.secondary', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.68rem', mb: 1
            }}
          >
            {label}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 800, color, lineHeight: 1, mb: 0.5 }}>
            {value}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
            {sub}
          </Typography>
        </Box>
        <Box
          sx={{
            p: 1.5, borderRadius: 2, flexShrink: 0,
            background: `linear-gradient(135deg, ${alpha(color, 0.22)} 0%, ${alpha(color, 0.10)} 100%)`,
            boxShadow: `0 4px 12px ${alpha(color, 0.2)}`,
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: 26, color } })}
        </Box>
      </Box>
    </Paper>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionTitle({ title, color, icon }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{
        width: 4, height: 26, borderRadius: 2, flexShrink: 0,
        background: `linear-gradient(180deg, ${color}, ${alpha(color, 0.3)})`,
      }} />
      {icon && React.cloneElement(icon, { sx: { fontSize: 20, color } })}
      <Typography variant="subtitle1" sx={{ fontWeight: 800, color, letterSpacing: 0.1 }}>
        {title}
      </Typography>
    </Box>
  );
}

// ─── Panel card ───────────────────────────────────────────────────────────────
function PanelCard({ children, header, headerColor, headerRight, noPadding = false, sx = {} }) {
  const theme = useTheme();
  const hc = headerColor || theme.palette.primary.main;
  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: PANEL_RADIUS,
        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        boxShadow: PANEL_SHADOW,
        overflow: 'hidden',
        ...sx,
      }}
    >
      {header && (
        <Box sx={{
          px: CELL_PX, py: 1.8, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${alpha(hc, 0.14)}`,
          background: `linear-gradient(90deg, ${alpha(hc, 0.06)} 0%, transparent 70%)`,
        }}>
          <Typography variant="body1" sx={{ fontWeight: 700, color: hc }}>
            {header}
          </Typography>
          {headerRight}
        </Box>
      )}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', ...(noPadding ? {} : { p: CELL_PX }) }}>
        {children}
      </Box>
    </Paper>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ icon, message, color = '#9e9e9e' }) {
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6 }}>
      <Box sx={{ p: 2, borderRadius: '50%', bgcolor: alpha(color, 0.1), mb: 1.5 }}>
        {React.cloneElement(icon, { sx: { fontSize: 32, color } })}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
        {message}
      </Typography>
    </Box>
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────
const STATUS_MAP = {
  Pending: { color: C.orange },
  Approved: { color: C.blue },
  Active: { color: C.green },
  Issued: { color: C.orange },
  Draft: { color: '#94a3b8' },
  Rejected: { color: C.red },
  Returned: { color: C.green },
  Completed: { color: C.green },
};
function StatusPill({ status }) {
  const { color } = STATUS_MAP[status] || { color: '#94a3b8' };
  return (
    <Typography
      component="span"
      sx={{
        display: 'inline-block', px: 1.5, py: 0.25, borderRadius: 6,
        fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.8,
        color, bgcolor: alpha(color, 0.1),
      }}
    >
      {status}
    </Typography>
  );
}

// ─── Shared chart options ─────────────────────────────────────────────────────
const makeChartOpts = (overrides = {}) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 16, boxWidth: 10, boxHeight: 10 } },
    tooltip: { cornerRadius: 8, padding: 10 },
  },
  ...overrides,
});

// ─── Main dashboard ───────────────────────────────────────────────────────────
export default function SupplyOfficerDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useUser();

  const [memorandumReceipts, setMemorandumReceipts] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [movements, setMovements] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [selectedMRs, setSelectedMRs] = useState(new Set());
  const [approvingMRs, setApprovingMRs] = useState(false);
  const [maintenanceDueItems, setMaintenanceDueItems] = useState([]);
  const [warrantyItems, setWarrantyItems] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [scheduleDialog, setScheduleDialog] = useState({ open: false, itemId: null, itemName: '' });

  const [mrPage, setMrPage] = useState(0);
  const [mrRpp, setMrRpp] = useState(5);
  const [borrowPage, setBorrowPage] = useState(0);
  const [borrowRpp, setBorrowRpp] = useState(5);
  const [stockPage, setStockPage] = useState(0);
  const [stockRpp, setStockRpp] = useState(5);

  // helpers ──────────────────────────────────────────────────────────────────
  const oneYearAgo = () => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d; };

  const calcMaintenance = (its) => its.filter(i => {
    const ref = i.last_condition_check
      ? new Date(i.last_condition_check)
      : i.purchase_date ? new Date(i.purchase_date) : null;
    return ref && ref < oneYearAgo();
  });

  const calcWarranty = (its) => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + 90);
    return its.filter(i => i.warranty_expiry && new Date(i.warranty_expiry) <= cutoff);
  };

  // data load ────────────────────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      const [prs, bs, ms, is] = await Promise.all([
        fetchMemorandumReceipts().catch(() => []),
        fetchBorrows().catch(() => []),
        fetchStockMovements().catch(() => []),
        fetchItems().catch(() => []),
      ]);
      const safeArray = (v) => Array.isArray(v) ? v : (v?.data || []);
      const itemsArr = safeArray(is);
      setMemorandumReceipts(safeArray(prs));
      setBorrows(safeArray(bs));
      setMovements(safeArray(ms));
      setItems(itemsArr);
      setMaintenanceDueItems(calcMaintenance(itemsArr));
      setWarrantyItems(calcWarranty(itemsArr));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user]);

  useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(loadData, Math.max(15, Number(refreshInterval) || 30) * 1000);
    return () => clearInterval(iv);
  }, [autoRefresh, refreshInterval]);

  // ── loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 2 }}>
          <CircularProgress size={48} thickness={3} />
          <Typography variant="body2" color="text.secondary">Loading dashboard…</Typography>
        </Box>
      </DashboardLayout>
    );
  }

  // ── derived data ─────────────────────────────────────────────────────────
  const pendingMRs = memorandumReceipts.filter(m => m.status === 'Issued' || m.status === 'Draft');
  const activeMRs = memorandumReceipts.filter(m => m.status === 'Active');
  const pendingBorrow = borrows.filter(b => b.status === 'Pending' || b.status === 'Approved');
  const lowStock = items.filter(i => (i.quantity || 0) < (i.reorder_level || 10));

  // ── handlers ─────────────────────────────────────────────────────────────
  const handleExport = () => {
    const rows = [
      ['Item Name', 'Category', 'Status', 'Quantity', 'Location', 'Fund Cluster'],
      ...items.map(i => [i.name, i.category?.name || '-', i.status, i.quantity || 0, i.office?.name || '-', i.fund_cluster || 'General Trust Fund']),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    Object.assign(document.createElement('a'), { href: url, download: `inventory-${new Date().toISOString().slice(0, 10)}.csv` }).click();
    URL.revokeObjectURL(url);
  };

  const toggleMR = (id) => {
    const s = new Set(selectedMRs);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedMRs(s);
  };

  const handleBatchApprove = async () => {
    setApprovingMRs(true);
    try {
      const res = await batchApproveMRs(Array.from(selectedMRs));
      setSnackbar({ open: true, severity: 'success', message: `Approved ${res.data?.approved_count || selectedMRs.size} receipt(s)` });
      setSelectedMRs(new Set());
      await loadData();
    } catch (e) {
      setSnackbar({ open: true, severity: 'error', message: e.response?.data?.message || 'Failed to approve receipts.' });
    } finally {
      setApprovingMRs(false);
    }
  };

  const handleConfirmSchedule = () => {
    setSnackbar({ open: true, severity: 'success', message: `Check scheduled for "${scheduleDialog.itemName}".` });
    setScheduleDialog({ open: false, itemId: null, itemName: '' });
  };

  // ── shared table sx ───────────────────────────────────────────────────────
  const TH = (color) => ({
    '& th': {
      fontWeight: 700, fontSize: '0.70rem', textTransform: 'uppercase',
      letterSpacing: 0.7, color,
      px: CELL_PX, py: CELL_PY,
      bgcolor: alpha(color, 0.05),
      borderBottom: `2px solid ${alpha(color, 0.15)}`,
      whiteSpace: 'nowrap',
    },
  });

  const TD = {
    '& td': { px: CELL_PX, py: CELL_PY, fontSize: '0.83rem', borderBottom: `1px solid ${alpha(theme.palette.divider, 0.35)}` },
    '& tr:last-child td': { borderBottom: 'none' },
    '& tr': { transition: 'background 0.15s' },
  };

  // ── render ────────────────────────────────────────────────────────────────
  const GAP = 3;   // Grid spacing token (3 × 8 = 24 px)

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, minHeight: '100vh' }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <DashboardHeader
          title="Supply Officer Dashboard"
          subtitle="Manage Requests, Stock & Inventory"
          onRefresh={loadData}
          loading={loading}
          actions={[
            { label: 'Export Report', icon: <DownloadIcon />, onClick: handleExport },
            { label: 'New Movement', icon: <TransferIcon />, onClick: () => navigate('/stock-movements') },
          ]}
        />

        {/* ── 4 Stat Cards ───────────────────────────────────────────────── */}
        <Grid container spacing={GAP} sx={{ mb: GAP }}>
          {[
            { label: 'Pending Requests', value: pendingMRs.length, icon: <RequestIcon />, color: C.orange, sub: 'Awaiting action' },
            { label: 'Active Receipts', value: activeMRs.length, icon: <CheckIcon />, color: C.green, sub: 'Approved & active' },
            { label: 'Borrow Requests', value: pendingBorrow.length, icon: <CartIcon />, color: C.blue, sub: 'Pending & approved' },
            { label: 'Low Stock Items', value: lowStock.length, icon: <WarningIcon />, color: C.red, sub: 'Below reorder level' },
          ].map(card => (
            <Grid key={card.label} item xs={12} sm={6} md={3}>
              <StatCard {...card} />
            </Grid>
          ))}
        </Grid>

        {/* ── Auto-refresh bar ────────────────────────────────────────────── */}
        <Box
          sx={{
            mb: GAP,
            px: 2.5, py: 1.5,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            bgcolor: alpha(theme.palette.primary.main, 0.03),
            display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
          }}
        >
          <AutoRenewIcon sx={{ fontSize: 18, color: autoRefresh ? 'primary.main' : 'text.disabled' }} />
          <Typography variant="body2" fontWeight={600} color={autoRefresh ? 'primary.main' : 'text.secondary'}>
            Auto-Refresh
          </Typography>
          <Switch
            size="small" checked={autoRefresh}
            onChange={e => setAutoRefresh(e.target.checked)} color="primary"
          />
          {autoRefresh && (
            <TextField
              type="number" size="small" label="Interval (s)"
              value={refreshInterval} onChange={e => setRefreshInterval(e.target.value)}
              inputProps={{ min: 15, max: 300 }} sx={{ width: 130 }}
            />
          )}
          <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
            Last updated: {new Date().toLocaleTimeString()}
          </Typography>
        </Box>

        {/* ════════════════ SECTION 1 — Requests & Approvals ═══════════════ */}
        <Box sx={{ mb: 2 }}>
          <SectionTitle title="Request & Approval Management" color={theme.palette.primary.main} icon={<RequestIcon />} />
        </Box>

        {/* MR Table + Pie chart */}
        <Grid container spacing={GAP} alignItems="stretch" sx={{ mb: GAP }}>

          {/* Pending MR Table — 8/12 */}
          <Grid item xs={12} lg={8}>
            <PanelCard
              header="Pending Memorandum Receipts"
              headerColor={theme.palette.primary.main}
              noPadding
              headerRight={
                <Button size="small" endIcon={<ArrowIcon />} onClick={() => navigate('/memorandum-receipts')}>
                  View All
                </Button>
              }
            >
              {pendingMRs.length === 0 ? (
                <EmptyState icon={<CheckIcon />} message="No pending requests" color={C.green} />
              ) : (
                <>
                  {selectedMRs.size > 0 && (
                    <Box sx={{
                      mx: CELL_PX, mt: CELL_PY, mb: 1,
                      px: 2, py: 1, borderRadius: 1.5,
                      bgcolor: alpha(C.blue, 0.07), border: `1px solid ${alpha(C.blue, 0.2)}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <Typography variant="body2" fontWeight={600} color={C.blue}>
                        {selectedMRs.size} selected
                      </Typography>
                      <Button
                        size="small" variant="contained"
                        sx={{ bgcolor: C.green, '&:hover': { bgcolor: '#16a34a' }, borderRadius: 1.5 }}
                        onClick={handleBatchApprove} disabled={approvingMRs} startIcon={<CheckIcon />}
                      >
                        {approvingMRs ? 'Approving…' : 'Batch Approve'}
                      </Button>
                    </Box>
                  )}
                  <TableContainer>
                    <Table>
                      <TableHead sx={TH(theme.palette.primary.main)}>
                        <TableRow>
                          <TableCell padding="checkbox" sx={{ pl: CELL_PX }}>
                            <input
                              type="checkbox"
                              style={{ accentColor: theme.palette.primary.main, cursor: 'pointer' }}
                              checked={selectedMRs.size === pendingMRs.length && pendingMRs.length > 0}
                              onChange={e => setSelectedMRs(e.target.checked ? new Set(pendingMRs.map(m => m.id)) : new Set())}
                            />
                          </TableCell>
                          <TableCell>MR Number</TableCell>
                          <TableCell>Office</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody sx={TD}>
                        {pendingMRs.slice(mrPage * mrRpp, (mrPage + 1) * mrRpp).map(mr => (
                          <TableRow
                            key={mr.id} hover
                            sx={{ cursor: 'pointer', bgcolor: selectedMRs.has(mr.id) ? alpha(theme.palette.primary.main, 0.04) : undefined }}
                            onClick={() => toggleMR(mr.id)}
                          >
                            <TableCell padding="checkbox" sx={{ pl: CELL_PX }}>
                              <input
                                type="checkbox" style={{ accentColor: theme.palette.primary.main }}
                                checked={selectedMRs.has(mr.id)} onChange={e => e.stopPropagation()}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{mr.mr_number || `MR-${mr.id}`}</TableCell>
                            <TableCell>{mr.office?.name || '—'}</TableCell>
                            <TableCell sx={{ color: 'text.secondary' }}>{new Date(mr.created_at).toLocaleDateString()}</TableCell>
                            <TableCell><StatusPill status={mr.status} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]} component="div"
                    count={pendingMRs.length} rowsPerPage={mrRpp} page={mrPage}
                    onPageChange={(_, p) => setMrPage(p)}
                    onRowsPerPageChange={e => { setMrRpp(+e.target.value); setMrPage(0); }}
                  />
                </>
              )}
            </PanelCard>
          </Grid>

          {/* MR Status Pie — 4/12 */}
          <Grid item xs={12} lg={4}>
            <PanelCard header="Request Status" headerColor={theme.palette.primary.main}>
              {memorandumReceipts.length === 0 ? (
                <EmptyState icon={<ReportsIcon />} message="No data to display" color={theme.palette.primary.main} />
              ) : (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 260 }}>
                  <Pie
                    data={{
                      labels: ['Pending / Draft', 'Active', 'Rejected'],
                      datasets: [{
                        data: [
                          memorandumReceipts.filter(m => m.status === 'Issued' || m.status === 'Draft').length,
                          memorandumReceipts.filter(m => m.status === 'Active').length,
                          memorandumReceipts.filter(m => m.status === 'Rejected').length,
                        ],
                        backgroundColor: [C.orange, C.green, C.red],
                        borderColor: '#fff', borderWidth: 3, hoverOffset: 8,
                      }],
                    }}
                    options={makeChartOpts()}
                  />
                </Box>
              )}
            </PanelCard>
          </Grid>
        </Grid>

        {/* Borrow Table + Bar chart */}
        <Grid container spacing={GAP} alignItems="stretch" sx={{ mb: GAP }}>

          {/* Borrow Table — 8/12 */}
          <Grid item xs={12} lg={8}>
            <PanelCard
              header="Pending Borrow Requests"
              headerColor={C.blue}
              noPadding
              headerRight={
                <Button size="small" sx={{ color: C.blue }} endIcon={<ArrowIcon />} onClick={() => navigate('/borrows')}>
                  Manage
                </Button>
              }
            >
              {pendingBorrow.length === 0 ? (
                <EmptyState icon={<CartIcon />} message="No pending borrow requests" color={C.blue} />
              ) : (
                <>
                  <TableContainer>
                    <Table>
                      <TableHead sx={TH(C.blue)}>
                        <TableRow>
                          <TableCell>Item Name</TableCell>
                          <TableCell>Borrowed By</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody sx={TD}>
                        {pendingBorrow.slice(borrowPage * borrowRpp, (borrowPage + 1) * borrowRpp).map(b => (
                          <TableRow key={b.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{b.item?.name || 'Unknown'}</TableCell>
                            <TableCell>{b.borrowedBy?.name || '—'}</TableCell>
                            <TableCell sx={{ color: 'text.secondary' }}>{new Date(b.created_at).toLocaleDateString()}</TableCell>
                            <TableCell><StatusPill status={b.status} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]} component="div"
                    count={pendingBorrow.length} rowsPerPage={borrowRpp} page={borrowPage}
                    onPageChange={(_, p) => setBorrowPage(p)}
                    onRowsPerPageChange={e => { setBorrowRpp(+e.target.value); setBorrowPage(0); }}
                  />
                </>
              )}
            </PanelCard>
          </Grid>

          {/* Borrow bar chart — 4/12 */}
          <Grid item xs={12} lg={4}>
            <PanelCard header="Borrow Overview" headerColor={C.blue}>
              {borrows.length === 0 ? (
                <EmptyState icon={<ReportsIcon />} message="No borrow data" color={C.blue} />
              ) : (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 260 }}>
                  <Bar
                    data={{
                      labels: ['Pending', 'Approved', 'Returned'],
                      datasets: [{
                        label: 'Requests',
                        data: [
                          borrows.filter(b => b.status === 'Pending').length,
                          borrows.filter(b => b.status === 'Approved').length,
                          borrows.filter(b => b.status === 'Returned').length,
                        ],
                        backgroundColor: [alpha(C.orange, 0.8), alpha(C.blue, 0.8), alpha(C.green, 0.8)],
                        borderColor: [C.orange, C.blue, C.green],
                        borderWidth: 2, borderRadius: 6, borderSkipped: false,
                      }],
                    }}
                    options={makeChartOpts({
                      indexAxis: 'y',
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: alpha('#000', 0.05) } },
                        y: { grid: { display: false } },
                      },
                    })}
                  />
                </Box>
              )}
            </PanelCard>
          </Grid>
        </Grid>

        {/* ═══════════════ SECTION 2 — Inventory Health ════════════════════ */}
        <Box sx={{ mb: 2, mt: 2 }}>
          <SectionTitle title="Inventory Health & Maintenance" color={C.green} icon={<InventoryIcon />} />
        </Box>

        {/* Stock Movements Table + Doughnut */}
        <Grid container spacing={GAP} alignItems="stretch" sx={{ mb: GAP }}>

          <Grid item xs={12} lg={8}>
            <PanelCard
              header="Recent Stock Movements"
              headerColor={C.blue}
              noPadding
              headerRight={
                <Button size="small" sx={{ color: C.blue }} endIcon={<ArrowIcon />} onClick={() => navigate('/stock-movements')}>
                  View All
                </Button>
              }
            >
              {movements.length === 0 ? (
                <EmptyState icon={<TransferIcon />} message="No recent stock movements" color={C.blue} />
              ) : (
                <>
                  <TableContainer>
                    <Table>
                      <TableHead sx={TH(C.blue)}>
                        <TableRow>
                          <TableCell>Item Name</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell align="right">Qty</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody sx={TD}>
                        {movements.slice(stockPage * stockRpp, (stockPage + 1) * stockRpp).map(m => (
                          <TableRow key={m.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{m.item?.name || 'Unknown'}</TableCell>
                            <TableCell>
                              <Typography component="span" sx={{
                                display: 'inline-block', px: 1.2, py: 0.25, borderRadius: 5,
                                fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.8,
                                color: m.type === 'IN' ? C.green : C.red,
                                bgcolor: m.type === 'IN' ? alpha(C.green, 0.1) : alpha(C.red, 0.1),
                              }}>
                                {m.type === 'IN' ? '▲ IN' : '▼ OUT'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: m.quantity > 0 ? C.green : C.red }}>
                              {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                            </TableCell>
                            <TableCell sx={{ color: 'text.secondary' }}>{new Date(m.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]} component="div"
                    count={movements.length} rowsPerPage={stockRpp} page={stockPage}
                    onPageChange={(_, p) => setStockPage(p)}
                    onRowsPerPageChange={e => { setStockRpp(+e.target.value); setStockPage(0); }}
                  />
                </>
              )}
            </PanelCard>
          </Grid>

          <Grid item xs={12} lg={4}>
            <PanelCard header="Movement Distribution" headerColor={C.green}>
              {movements.length === 0 ? (
                <EmptyState icon={<ReportsIcon />} message="No movement data" color={C.green} />
              ) : (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 260 }}>
                  <Doughnut
                    data={{
                      labels: ['Inbound', 'Outbound'],
                      datasets: [{
                        data: [
                          movements.filter(m => m.type === 'IN').length,
                          movements.filter(m => m.type === 'OUT').length,
                        ],
                        backgroundColor: [alpha(C.green, 0.85), alpha(C.red, 0.85)],
                        borderColor: '#fff', borderWidth: 3, hoverOffset: 6,
                      }],
                    }}
                    options={makeChartOpts({ cutout: '62%' })}
                  />
                </Box>
              )}
            </PanelCard>
          </Grid>
        </Grid>

        {/* Low Stock Table + Pie */}
        <Grid container spacing={GAP} alignItems="stretch" sx={{ mb: GAP }}>

          <Grid item xs={12} lg={8}>
            <PanelCard
              header="Low Stock Items"
              headerColor={C.red}
              noPadding
              headerRight={
                lowStock.length > 0 && (
                  <Chip label={`${lowStock.length} items`} size="small" color="error" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
                )
              }
            >
              {lowStock.length === 0 ? (
                <EmptyState icon={<CheckIcon />} message="All items are well stocked!" color={C.green} />
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead sx={TH(C.red)}>
                      <TableRow>
                        <TableCell>Item Name</TableCell>
                        <TableCell align="right">Stock</TableCell>
                        <TableCell align="right">Reorder</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell align="center">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody sx={TD}>
                      {lowStock.slice(0, 10).map(item => {
                        const pct = Math.min(100, Math.round(((item.quantity || 0) / (item.reorder_level || 10)) * 100));
                        return (
                          <TableRow key={item.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: C.red, lineHeight: 1 }}>
                                  {item.quantity || 0}
                                </Typography>
                                <LinearProgress
                                  variant="determinate" value={pct}
                                  sx={{
                                    width: 52, height: 4, borderRadius: 4,
                                    bgcolor: alpha(C.red, 0.12),
                                    '& .MuiLinearProgress-bar': { bgcolor: C.red },
                                  }}
                                />
                              </Box>
                            </TableCell>
                            <TableCell align="right" sx={{ color: 'text.secondary' }}>{item.reorder_level || 10}</TableCell>
                            <TableCell sx={{ color: 'text.secondary' }}>{item.category?.name || '—'}</TableCell>
                            <TableCell align="center">
                              <Button
                                size="small" variant="outlined" color="error"
                                sx={{ borderRadius: 1.5, fontSize: '0.72rem', fontWeight: 700, px: 1.5, py: 0.4 }}
                                onClick={() => navigate('/memorandum-receipts')}
                              >
                                Order
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </PanelCard>
          </Grid>

          <Grid item xs={12} lg={4}>
            <PanelCard header="Stock Status" headerColor={C.red}>
              {items.length === 0 ? (
                <EmptyState icon={<ReportsIcon />} message="No inventory data" color={C.red} />
              ) : (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 260 }}>
                  <Pie
                    data={{
                      labels: ['Well Stocked', 'Low Stock'],
                      datasets: [{
                        data: [
                          items.filter(i => (i.quantity || 0) >= (i.reorder_level || 10)).length,
                          items.filter(i => (i.quantity || 0) < (i.reorder_level || 10)).length,
                        ],
                        backgroundColor: [alpha(C.green, 0.85), alpha(C.red, 0.85)],
                        borderColor: '#fff', borderWidth: 3, hoverOffset: 6,
                      }],
                    }}
                    options={makeChartOpts()}
                  />
                </Box>
              )}
            </PanelCard>
          </Grid>
        </Grid>

        {/* Maintenance + Warranty (side by side) */}
        <Grid container spacing={GAP} alignItems="stretch" sx={{ mb: GAP }}>

          {/* Maintenance Due */}
          <Grid item xs={12} md={6}>
            <PanelCard
              header="Maintenance Due"
              headerColor={C.orange}
              noPadding
              headerRight={
                maintenanceDueItems.length > 0 && (
                  <Chip label={maintenanceDueItems.length} color="warning" size="small" sx={{ fontWeight: 700 }} />
                )
              }
            >
              {maintenanceDueItems.length === 0 ? (
                <EmptyState icon={<CheckIcon />} message="No maintenance overdue" color={C.green} />
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={TH(C.orange)}>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Last Check</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody sx={TD}>
                      {maintenanceDueItems.slice(0, 6).map(item => (
                        <TableRow key={item.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                          <TableCell sx={{ color: C.orange, fontWeight: 500 }}>
                            {item.last_condition_check ? new Date(item.last_condition_check).toLocaleDateString() : 'Never'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </PanelCard>
          </Grid>

          {/* Warranty Expiring */}
          <Grid item xs={12} md={6}>
            <PanelCard
              header="Warranty Expiring Soon"
              headerColor={C.red}
              noPadding
              headerRight={
                warrantyItems.length > 0 && (
                  <Chip label={warrantyItems.length} color="error" size="small" sx={{ fontWeight: 700 }} />
                )
              }
            >
              {warrantyItems.length === 0 ? (
                <EmptyState icon={<ShieldIcon />} message="All warranties are valid" color={C.blue} />
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={TH(C.red)}>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Expiry Date</TableCell>
                        <TableCell align="right">Days Left</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody sx={TD}>
                      {warrantyItems.slice(0, 6).map(item => {
                        const d = item.warranty_expiry ? new Date(item.warranty_expiry) : null;
                        const days = d ? Math.ceil((d - new Date()) / 86400000) : 0;
                        const exp = days < 0;
                        return (
                          <TableRow key={item.id} hover sx={{ bgcolor: exp ? alpha(C.red, 0.03) : undefined }}>
                            <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                            <TableCell sx={{ color: 'text.secondary' }}>{d?.toLocaleDateString()}</TableCell>
                            <TableCell align="right">
                              <Typography component="span" sx={{
                                display: 'inline-block', px: 1.2, py: 0.2, borderRadius: 5,
                                fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.8,
                                color: exp ? C.red : C.orange,
                                bgcolor: exp ? alpha(C.red, 0.1) : alpha(C.orange, 0.1),
                              }}>
                                {exp ? 'Expired' : `${days}d`}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </PanelCard>
          </Grid>
        </Grid>

        {/* ── Schedule Dialog ─────────────────────────────────────────────── */}
        <Dialog
          open={scheduleDialog.open}
          onClose={() => setScheduleDialog({ open: false, itemId: null, itemName: '' })}
          maxWidth="sm" fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 700 }}>Schedule Condition Check</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Schedule a condition check for <strong>{scheduleDialog.itemName}</strong>
            </Typography>
            <TextField
              type="date" label="Scheduled Date"
              defaultValue={new Date().toISOString().split('T')[0]}
              InputLabelProps={{ shrink: true }} fullWidth sx={{ mb: 2 }}
            />
            <TextField
              label="Notes" placeholder="Add any notes or instructions…"
              multiline rows={3} fullWidth
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setScheduleDialog({ open: false, itemId: null, itemName: '' })} sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSchedule} variant="contained" sx={{ borderRadius: 2 }}>
              Schedule
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Snackbar ────────────────────────────────────────────────────── */}
        <Snackbar
          open={snackbar.open} autoHideDuration={6000}
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar(s => ({ ...s, open: false }))}
            severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

      </Box>
    </DashboardLayout>
  );
}
