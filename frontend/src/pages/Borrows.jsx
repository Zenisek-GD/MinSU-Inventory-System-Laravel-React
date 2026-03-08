import React, { useEffect, useState, useRef } from "react";
import ReactDOM from 'react-dom/client';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  fetchBorrows,
  createBorrow,
  deleteBorrow,
  updateBorrow,
  returnBorrow,
} from "../api/borrow";
import { fetchItems } from "../api/item";
import DashboardLayout from "../components/Layout/DashboardLayout";
import { useUser } from "../context/UserContext";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  Grid,
  Chip,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  useTheme,
  alpha,
  Tooltip,
  Badge,
  Fade,
  Skeleton,
  Stack,
  CardHeader,
  CardActionArea,
  LinearProgress,
  Tabs,
  Tab,
} from "@mui/material";
import OfficeChip from '../components/UI/OfficeChip';
import PrimaryButton from '../components/UI/PrimaryButton';
import BorrowerSlip from '../components/BorrowerSlip';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Inventory as InventoryIcon,
  Person as PersonIcon,
  CalendarToday as DateIcon,
  Assignment as PurposeIcon,
  Build as ConditionIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  DoneAll as ReturnedIcon,
  Schedule as PendingIcon,
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  AssignmentReturn as ReturnIcon,
  Print as PrintIcon,
} from "@mui/icons-material";

const BorrowsPage = () => {
  const theme = useTheme();
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const EMPTY_ITEM_ROW = { item_id: '', quantity: 1, borrow_date: '', expected_return_date: '', remarks: '' };
  const [form, setForm] = useState({
    borrowItems: [{ ...EMPTY_ITEM_ROW }],
    purpose: '',
    availability: 'yes',
    designation: '',
    borrower_name: '',
    borrower_date: new Date().toISOString().slice(0, 10),
  });
  const [items, setItems] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'my'
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnForm, setReturnForm] = useState({
    condition_after: '',
    notes: ''
  });

  // --- Borrower's Slip print helper ---
  const printBorrowerSlip = (borrowRecord) => {
    const slipBorrows = borrowRecord ? [borrowRecord] : [];
    const borrowerName = borrowRecord?.borrowerName ||
      borrowRecord?.borrowedBy?.name ||
      borrowRecord?.borrowed_by?.name ||
      (typeof borrowRecord?.borrowed_by === 'string' ? borrowRecord.borrowed_by : '') ||
      user?.name || '';
    const designation = borrowRecord?.designation || 'Staff';
    const availableYes = borrowRecord?.availability !== 'no';
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { alert('Please allow popups to print the Borrower\'s Slip.'); return; }
    win.document.write(`<!DOCTYPE html><html><head><title>Borrower's Slip</title><style>body{margin:0;padding:0;}@media print{@page{size:A4;margin:12mm;}}</style></head><body><div id="slip-root"></div></body></html>`);
    win.document.close();
    const container = win.document.getElementById('slip-root');
    const root = ReactDOM.createRoot(container);
    root.render(
      <BorrowerSlip
        borrows={slipBorrows}
        borrowerName={borrowerName}
        borrowerDesignation={designation}
        availableYes={availableYes}
      />
    );
    setTimeout(() => { win.focus(); win.print(); }, 600);
  };

  // Multi-item slip print: accepts array of borrow records
  const printBorrowerSlipMulti = (borrowRecords, formData) => {
    const borrowerName = formData?.borrower_name || user?.name || '';
    const designation = formData?.designation || 'Staff';
    const availableYes = formData?.availability !== 'no';
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { alert("Please allow popups to print the Borrower's Slip."); return; }
    win.document.write(`<!DOCTYPE html><html><head><title>Borrower's Slip</title><style>body{margin:0;padding:0;}@media print{@page{size:A4;margin:12mm;}}</style></head><body><div id="slip-root"></div></body></html>`);
    win.document.close();
    const root = ReactDOM.createRoot(win.document.getElementById('slip-root'));
    root.render(
      <BorrowerSlip
        borrows={borrowRecords || []}
        borrowerName={borrowerName}
        borrowerDesignation={designation}
        availableYes={availableYes}
      />
    );
    setTimeout(() => { win.focus(); win.print(); }, 600);
  };

  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    returned: 0,
    overdue: 0,
    rejected: 0,
    myActive: 0
  });

  useEffect(() => {
    if (user?.id) {
      loadBorrows();
      loadItems();
    }
  }, [user?.id]);

  // Handle location state (itemId) separately
  useEffect(() => {
    if (location?.state?.itemId && items.length > 0) {
      const itemId = location.state.itemId;
      const found = items.find(i => i.id === itemId);
      if (found) {
        setForm((f) => ({ ...f, item_id: itemId }));
        setDialogOpen(true);
      }
    }
  }, [location?.state?.itemId, items]);

  useEffect(() => {
    if (borrows.length > 0) {
      const now = new Date();
      const myActiveBorrows = user?.role === 'staff'
        ? borrows.filter(b => b.user_id === user?.id && ['Approved', 'Borrowed'].includes(b.status)).length
        : 0;

      const stats = {
        pending: borrows.filter(b => b.status === 'Pending').length,
        approved: borrows.filter(b => b.status === 'Approved').length,
        returned: borrows.filter(b => b.status === 'Returned').length,
        rejected: borrows.filter(b => b.status === 'Rejected').length,
        overdue: borrows.filter(b =>
          b.status === 'Approved' &&
          b.expected_return_date &&
          new Date(b.expected_return_date) < now
        ).length,
        myActive: myActiveBorrows
      };
      setStats(stats);
    }
  }, [borrows, user]);

  const loadBorrows = async () => {
    setLoading(true);
    try {
      const params = {};
      // Don't filter by user_id here - let the UI handle filtering based on viewMode
      const data = await fetchBorrows(params);
      const list = Array.isArray(data) ? data : data.data || [];
      console.log('LOADED BORROWS:', list);
      console.log('CURRENT USER:', user);
      setBorrows(list);
    } catch (err) {
      setError("Failed to load borrow records");
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const params = {};
      // Only filter by office for staff users, supply officers and admins can see all items
      if (user?.role === 'staff' && user?.office && user.office.id) {
        params.office_id = user.office.id;
      }

      console.log('Fetching items with params:', params);
      const data = await fetchItems(params);
      console.log('RAW API RESPONSE:', data);

      const list = Array.isArray(data) ? data : data.data || [];
      console.log('PARSED LIST:', list);
      console.log('LIST LENGTH:', list.length);

      // NO FILTERING - Show everything
      setItems(list);
    } catch (err) {
      console.error('Error loading items:', err);
      console.error('Error response:', err.response);
      setItems([]);
    }
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Multi-item row helpers
  const handleItemRowChange = (idx, field, value) => {
    const newRows = form.borrowItems.map((row, i) => i === idx ? { ...row, [field]: value } : row);
    setForm(f => ({ ...f, borrowItems: newRows }));
  };
  const addItemRow = () => setForm(f => ({ ...f, borrowItems: [...f.borrowItems, { ...EMPTY_ITEM_ROW }] }));
  const removeItemRow = (idx) => setForm(f => ({ ...f, borrowItems: f.borrowItems.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate: at least one item row must have item_id and dates
    const validRows = form.borrowItems.filter(r => r.item_id && r.borrow_date && r.expected_return_date);
    if (validRows.length === 0) {
      showSnackbar('Please fill in at least one item with dates', 'error');
      return;
    }
    if (!form.purpose.trim()) {
      showSnackbar('Please enter a purpose', 'error');
      return;
    }

    // Check stock for each selected item
    for (const row of validRows) {
      const sel = items.find(i => i.id === row.item_id);
      if (sel && Number(sel.stock ?? sel.quantity ?? 1) <= 0) {
        showSnackbar(`"${sel.name}" has no available stock`, 'error');
        return;
      }
    }

    try {
      // Submit one borrow record per item row
      const results = await Promise.all(
        validRows.map(row =>
          createBorrow({
            item_id: row.item_id,
            quantity: row.quantity || 1,
            borrow_date: row.borrow_date,
            expected_return_date: row.expected_return_date,
            remarks: row.remarks || '',
            purpose: form.purpose,
          })
        )
      );

      const newRecords = results.map(r => r.borrow_record || r);
      setBorrows(prev => [...newRecords, ...prev]);

      // Build slip records with shared form fields
      const slipRecords = newRecords.map(rec => ({
        ...rec,
        designation: form.designation || '',
        availability: form.availability || 'yes',
        borrowerName: form.borrower_name || user?.name || '',
      }));

      // Reset form
      setForm({
        borrowItems: [{ ...EMPTY_ITEM_ROW }],
        purpose: '',
        availability: 'yes',
        designation: '',
        borrower_name: '',
        borrower_date: new Date().toISOString().slice(0, 10),
      });
      setDialogOpen(false);
      showSnackbar(`${newRecords.length} borrow request${newRecords.length > 1 ? 's' : ''} submitted. Printing Borrower's Slip…`, 'success');
      loadBorrows();

      // Print slip with ALL item records
      printBorrowerSlipMulti(slipRecords, form);
    } catch (err) {
      console.error('Borrow submission error:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to create borrow record';
      const errors = err.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)[0];
        showSnackbar(firstError[0] || errorMsg, 'error');
      } else {
        showSnackbar(errorMsg, 'error');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this borrow record?")) return;
    try {
      await deleteBorrow(id);
      setBorrows((prev) => prev.filter((r) => r.id !== id));
      showSnackbar("Borrow record deleted successfully", "success");
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to delete borrow record";
      showSnackbar(message, "error");
    }
  };

  const handleStatusUpdate = async (id, status, notes = "") => {
    try {
      if (status === "Rejected" && !notes) {
        notes = "Rejected by supply officer";
      }
      await updateBorrow(id, { status, ...(status === "Rejected" ? { notes } : {}) });
      setBorrows((prev) => prev.map(r => r.id === id ? { ...r, status } : r));
      showSnackbar(`Borrow request ${status.toLowerCase()} successfully`, "success");
    } catch (err) {
      const message = err?.response?.data?.message || `Failed to ${status.toLowerCase()} borrow request`;
      showSnackbar(message, "error");
    }
  };

  const handleOpenReturnDialog = (borrow) => {
    setSelectedBorrow(borrow);
    setReturnForm({
      condition_after: borrow.item?.condition || 'Good',
      notes: ''
    });
    setReturnDialogOpen(true);
  };

  const handleCloseReturnDialog = () => {
    setReturnDialogOpen(false);
    setSelectedBorrow(null);
    setReturnForm({ condition_after: '', notes: '' });
  };

  const handleReturnSubmit = async () => {
    if (!returnForm.condition_after) {
      showSnackbar("Please select the condition of the item", "error");
      return;
    }

    try {
      await returnBorrow(selectedBorrow.id, returnForm);
      loadBorrows(); // Reload to get updated data
      handleCloseReturnDialog();
      showSnackbar("Item returned successfully", "success");
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to return item";
      showSnackbar(message, "error");
    }
  };


  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved": return "success";
      case "Rejected": return "error";
      case "Pending": return "warning";
      case "Returned": return "info";
      default: return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Approved": return <ApproveIcon sx={{ fontSize: 16 }} />;
      case "Rejected": return <RejectIcon sx={{ fontSize: 16 }} />;
      case "Pending": return <PendingIcon sx={{ fontSize: 16 }} />;
      case "Returned": return <ReturnedIcon sx={{ fontSize: 16 }} />;
      default: return <InventoryIcon sx={{ fontSize: 16 }} />;
    }
  };

  const getStatusBgColor = (status) => {
    const color = getStatusColor(status);
    return alpha(theme.palette[color].main, 0.1);
  };

  const isOverdue = (expectedReturnDate) => {
    return new Date(expectedReturnDate) < new Date();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredBorrows = borrows.filter(borrow => {
    // Filter by view mode (all or my)
    if (viewMode === 'my' && user?.role === 'staff') {
      // Check if this borrow belongs to the current user
      const borrowUserId = borrow.borrowed_by || borrow.borrowedBy?.id;
      console.log('Filtering borrow:', {
        borrowId: borrow.id,
        borrowUserId,
        currentUserId: user?.id,
        status: borrow.status,
        match: borrowUserId === user?.id
      });
      if (borrowUserId !== user?.id) return false;
      // Show Pending, Approved, Borrowed, and Returned in "my" view
      if (!['Pending', 'Approved', 'Borrowed', 'Returned'].includes(borrow.status)) return false;
    }

    if (filterStatus !== 'all' && borrow.status !== filterStatus) return false;

    if (query) {
      const searchLower = query.toLowerCase();
      const borrowerName = borrow.borrowedBy?.name || borrow.borrowed_by?.name || '';
      const itemName = borrow.item?.name || '';
      return (
        borrowerName.toLowerCase().includes(searchLower) ||
        itemName.toLowerCase().includes(searchLower) ||
        borrow.purpose?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const statusTabs = [
    { value: 'all', label: 'All', count: borrows.length },
    { value: 'Pending', label: 'Pending', count: stats.pending },
    { value: 'Approved', label: 'Approved', count: stats.approved },
    { value: 'Returned', label: 'Returned', count: stats.returned },
    { value: 'Rejected', label: 'Rejected', count: stats.rejected },
  ];

  const viewTabs = user?.role === 'staff' ? [
    { value: 'all', label: 'All Borrows', icon: <InventoryIcon /> },
    { value: 'my', label: 'My Borrows', icon: <PersonIcon />, count: stats.myActive },
  ] : null;

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'grey.50', minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h3" fontWeight="800" color="primary.main" gutterBottom>
                Borrow Management
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Track and manage item borrow requests
              </Typography>
            </Box>
            <Tooltip title="Refresh">
              <IconButton
                onClick={loadBorrows}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {user?.office && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <OfficeChip office={user.office} locked />
              <Typography variant="body2" color="text.secondary">
                • {borrows.length} total records
              </Typography>
            </Box>
          )}

          {/* Stats Cards */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={6} sm={2.4}>
              <Paper sx={{
                p: 2,
                borderRadius: 2,
                textAlign: 'center',
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                border: '1px solid',
                borderColor: alpha(theme.palette.warning.main, 0.3)
              }}>
                <Typography variant="h4" fontWeight="800" color="warning.main">
                  {stats.pending}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pending
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={2.4}>
              <Paper sx={{
                p: 2,
                borderRadius: 2,
                textAlign: 'center',
                bgcolor: alpha(theme.palette.success.main, 0.1),
                border: '1px solid',
                borderColor: alpha(theme.palette.success.main, 0.3)
              }}>
                <Typography variant="h4" fontWeight="800" color="success.main">
                  {stats.approved}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Approved
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={2.4}>
              <Paper sx={{
                p: 2,
                borderRadius: 2,
                textAlign: 'center',
                bgcolor: alpha(theme.palette.info.main, 0.1),
                border: '1px solid',
                borderColor: alpha(theme.palette.info.main, 0.3)
              }}>
                <Typography variant="h4" fontWeight="800" color="info.main">
                  {stats.returned}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Returned
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={2.4}>
              <Paper sx={{
                p: 2,
                borderRadius: 2,
                textAlign: 'center',
                bgcolor: alpha(theme.palette.error.main, 0.1),
                border: '1px solid',
                borderColor: alpha(theme.palette.error.main, 0.3)
              }}>
                <Typography variant="h4" fontWeight="800" color="error.main">
                  {stats.overdue}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Overdue
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={2.4}>
              <Paper sx={{
                p: 2,
                borderRadius: 2,
                textAlign: 'center',
                bgcolor: alpha(theme.palette.error.main, 0.1),
                border: '1px solid',
                borderColor: alpha(theme.palette.error.main, 0.3)
              }}>
                <Typography variant="h4" fontWeight="800" color="error.main">
                  {stats.rejected}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Rejected
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Action Bar */}
        <Paper sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          bgcolor: 'background.paper',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              {user?.role === "staff" && (
                <PrimaryButton
                  startIcon={<AddIcon />}
                  onClick={() => setDialogOpen(true)}
                  sx={{
                    borderRadius: 2,
                    px: 4,
                    py: 1.2,
                    fontSize: '1rem'
                  }}
                  fullWidth
                >
                  New Borrow Request
                </PrimaryButton>
              )}
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="medium"
                placeholder="Search borrower or item..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'grey.500' }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  width: '100%'
                }}
              >
                Filters
              </Button>
            </Grid>
          </Grid>

          {/* View Mode Tabs (for staff) */}
          {viewTabs && (
            <Box sx={{ mt: 3, mb: 2 }}>
              <Tabs
                value={viewMode}
                onChange={(e, newValue) => {
                  setViewMode(newValue);
                  setFilterStatus('all'); // Reset status filter when changing view
                }}
                sx={{
                  bgcolor: 'white',
                  borderRadius: 2,
                  boxShadow: 1,
                  '& .MuiTab-root': {
                    minHeight: 60,
                  }
                }}
              >
                {viewTabs.map((tab) => (
                  <Tab
                    key={tab.value}
                    value={tab.value}
                    icon={tab.icon}
                    iconPosition="start"
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {tab.label}
                        {tab.count !== undefined && (
                          <Chip
                            label={tab.count}
                            size="small"
                            color={viewMode === tab.value ? 'primary' : 'default'}
                            sx={{ minWidth: 28 }}
                          />
                        )}
                      </Box>
                    }
                    sx={{
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: viewMode === tab.value ? 600 : 400
                    }}
                  />
                ))}
              </Tabs>
            </Box>
          )}

          {/* Status Tabs */}
          <Box sx={{ mt: 3 }}>
            <Tabs
              value={filterStatus}
              onChange={(e, newValue) => setFilterStatus(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              {statusTabs.map((tab) => (
                <Tab
                  key={tab.value}
                  value={tab.value}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {tab.label}
                      <Chip
                        label={tab.count}
                        size="small"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>
                  }
                  sx={{
                    borderRadius: 2,
                    minHeight: 40,
                    fontWeight: filterStatus === tab.value ? 600 : 400
                  }}
                />
              ))}
            </Tabs>
          </Box>
        </Paper>

        {/* ── New Borrow Request — Borrower's Slip Form ──────────────── */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          {/* Slip Header */}
          <DialogTitle sx={{ p: 0 }}>
            <Box sx={{ background: 'linear-gradient(135deg,#006400 0%,#004d00 100%)', color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" fontWeight={800} letterSpacing={0.5}>🖨 BORROWER'S SLIP FORM</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>Mindoro State University — MinSU Bongabong Campus &nbsp;|&nbsp; MRC-B01G</Typography>
              </Box>
              <Chip label="DRAFT" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />
            </Box>
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ pt: 3 }}>
              {/* ── Custodian Section ── */}
              <Paper elevation={0} sx={{ border: '1px solid #ddd', borderRadius: 2, p: 2, mb: 2 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>For Custodian</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Typography variant="body2" fontWeight={600}>Availability of Equipment:</Typography>
                  <TextField
                    select size="small" value={form.availability ?? 'yes'}
                    onChange={e => setForm(f => ({ ...f, availability: e.target.value }))}
                    sx={{ minWidth: 110 }}
                  >
                    <MenuItem value="yes">✅ YES</MenuItem>
                    <MenuItem value="no">❌ NO</MenuItem>
                  </TextField>
                </Box>
              </Paper>

              {/* ── For Borrower note ── */}
              <Paper elevation={0} sx={{ border: '1px solid #ddd', borderRadius: 2, p: 2, mb: 2, bgcolor: '#fafafa' }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>For Borrower</Typography>
                <Typography variant="body2" sx={{ fontStyle: 'italic', fontSize: '0.82rem' }}>
                  I acknowledge to have received from the <strong>SCHOOL'S PROPERTY</strong> of the MinSU Bongabong Campus the following:
                </Typography>
              </Paper>

              {/* ── Item Rows (repeating) ── */}
              <Paper elevation={0} sx={{ border: '1px solid #ddd', borderRadius: 2, overflow: 'hidden', mb: 2 }}>
                <Box sx={{ bgcolor: alpha('#006400', 0.07), px: 2, py: 1, borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Items to Borrow</Typography>
                  <Chip label={`${form.borrowItems.length} item${form.borrowItems.length > 1 ? 's' : ''}`} size="small" color="primary" sx={{ fontWeight: 700 }} />
                </Box>
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {form.borrowItems.map((row, idx) => {
                    const sel = items.find(i => i.id === row.item_id);
                    return (
                      <Paper key={idx} elevation={0} sx={{ border: '1px solid #e8e8e8', borderRadius: 1.5, p: 1.5, position: 'relative', bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                        {/* Row label + Remove */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="caption" fontWeight={700} color="text.secondary">ITEM #{idx + 1}</Typography>
                          {form.borrowItems.length > 1 && (
                            <Button
                              size="small" color="error" variant="text"
                              startIcon={<DeleteIcon sx={{ fontSize: 14 }} />}
                              onClick={() => removeItemRow(idx)}
                              sx={{ py: 0, minWidth: 0, fontSize: '0.72rem', fontWeight: 700 }}
                            >
                              Remove
                            </Button>
                          )}
                        </Box>

                        <Grid container spacing={1.5}>
                          {/* Item dropdown */}
                          <Grid item xs={12} sm={5}>
                            <TextField
                              select fullWidth size="small" label="Item / Equipment *"
                              value={row.item_id}
                              onChange={e => handleItemRowChange(idx, 'item_id', e.target.value)}
                              required={idx === 0}
                            >
                              <MenuItem value=""><em>— Select item —</em></MenuItem>
                              {items.map(item => (
                                <MenuItem key={item.id} value={item.id}>
                                  <Box>
                                    <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {item.category?.name} &nbsp;·&nbsp; Stock: {item.stock ?? item.quantity ?? 0}
                                    </Typography>
                                  </Box>
                                </MenuItem>
                              ))}
                            </TextField>
                          </Grid>

                          {/* QTY */}
                          <Grid item xs={6} sm={1}>
                            <TextField
                              fullWidth size="small" label="QTY" type="number"
                              value={row.quantity}
                              onChange={e => handleItemRowChange(idx, 'quantity', e.target.value)}
                              inputProps={{ min: 1 }}
                            />
                          </Grid>

                          {/* Date Released */}
                          <Grid item xs={6} sm={3}>
                            <TextField
                              fullWidth size="small" label="Date Released *" type="date"
                              value={row.borrow_date}
                              onChange={e => handleItemRowChange(idx, 'borrow_date', e.target.value)}
                              required={idx === 0}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>

                          {/* Expected Return */}
                          <Grid item xs={6} sm={3}>
                            <TextField
                              fullWidth size="small" label="Expected Return *" type="date"
                              value={row.expected_return_date}
                              onChange={e => handleItemRowChange(idx, 'expected_return_date', e.target.value)}
                              required={idx === 0}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>

                          {/* Remarks */}
                          <Grid item xs={12}>
                            <TextField
                              fullWidth size="small" label="Remarks"
                              value={row.remarks}
                              onChange={e => handleItemRowChange(idx, 'remarks', e.target.value)}
                              placeholder="Notes about condition, accessories…"
                            />
                          </Grid>

                          {/* Item info chips */}
                          {sel && (
                            <Grid item xs={12}>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip label={sel.condition || 'Good'} size="small" color="success" variant="outlined" sx={{ fontWeight: 700 }} />
                                {sel.serial_number && <Chip label={`S/N: ${sel.serial_number}`} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />}
                                {sel.office?.name && <Chip icon={<InfoIcon sx={{ fontSize: 14 }} />} label={sel.office.name} size="small" variant="outlined" color="info" />}
                                <Chip
                                  label={`Qty available: ${sel.stock ?? sel.quantity ?? '—'}`}
                                  size="small"
                                  color={Number(sel.stock ?? sel.quantity) > 0 ? 'success' : 'error'}
                                />
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </Paper>
                    );
                  })}

                  {/* Add Item Row button */}
                  <Button
                    variant="outlined" size="small"
                    startIcon={<AddIcon />}
                    onClick={addItemRow}
                    sx={{ alignSelf: 'flex-start', borderRadius: 1.5, fontWeight: 700, borderStyle: 'dashed', color: '#006400', borderColor: '#006400', '&:hover': { bgcolor: alpha('#006400', 0.05) } }}
                  >
                    Add Another Item
                  </Button>
                </Box>
              </Paper>

              {/* ── Purpose ── */}
              <Paper elevation={0} sx={{ border: '1px solid #ddd', borderRadius: 2, p: 2, mb: 2 }}>
                <TextField fullWidth size="small" label="Purpose *" name="purpose" value={form.purpose} onChange={handleFormChange} required multiline rows={2} placeholder="Describe the purpose of borrowing this item…" />
              </Paper>

              {/* ── Borrower Info ── */}
              <Paper elevation={0} sx={{ border: '1px solid #ddd', borderRadius: 2, p: 2, bgcolor: '#fafafa' }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Borrower Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={5}>
                    <TextField fullWidth size="small" label="Full Name" name="borrower_name" value={form.borrower_name ?? user?.name ?? ''} onChange={handleFormChange} InputProps={{ readOnly: !!user?.name }} helperText={user?.name ? 'Auto-filled from your account' : ''} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth size="small" label="Designation / Position" name="designation" value={form.designation ?? ''} onChange={handleFormChange} placeholder="e.g. Faculty, Admin Staff" />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField fullWidth size="small" label="Date" name="borrower_date" type="date" value={form.borrower_date ?? new Date().toISOString().slice(0, 10)} onChange={handleFormChange} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  {user?.office?.name && (
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" label="Office / Department" value={user.office.name} InputProps={{ readOnly: true }} helperText="Auto-filled from your account" />
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider', flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                <PrintIcon sx={{ fontSize: 13 }} />
                The Borrower's Slip will automatically open for printing after submission.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  onClick={() => setDialogOpen(false)}
                  sx={{ borderRadius: 2, px: 3 }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<PrintIcon />}
                  sx={{ borderRadius: 2, px: 4, bgcolor: '#006400', '&:hover': { bgcolor: '#004d00' } }}
                >
                  Submit &amp; Print Slip
                </Button>
              </Box>
            </DialogActions>
          </form>
        </Dialog>

        {/* Borrow Records List */}
        {loading ? (
          <Grid container spacing={3}>
            {[...Array(3)].map((_, index) => (
              <Grid item xs={12} key={index}>
                <Skeleton
                  variant="rectangular"
                  height={180}
                  sx={{
                    borderRadius: 3,
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}
                />
              </Grid>
            ))}
          </Grid>
        ) : error ? (
          <Alert
            severity="error"
            sx={{
              borderRadius: 2,
              mb: 2
            }}
            action={
              <Button color="inherit" size="small" onClick={loadBorrows}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        ) : filteredBorrows.length === 0 ? (
          <Paper sx={{
            p: 8,
            textAlign: 'center',
            borderRadius: 3,
            bgcolor: 'background.paper'
          }}>
            <InventoryIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No borrow records found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {query ? 'Try a different search term' : user?.role === 'staff' ? 'Create your first borrow request' : 'No records available for your office'}
            </Typography>
            {user?.role === 'staff' && !query && (
              <PrimaryButton
                startIcon={<AddIcon />}
                onClick={() => setDialogOpen(true)}
                sx={{ borderRadius: 2, px: 4 }}
              >
                Create First Request
              </PrimaryButton>
            )}
          </Paper>
        ) : (
          <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ width: '100%', overflowX: 'auto' }}>
              <table className="mui-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: theme.palette.primary.lighter }}>
                  <tr>
                    <th style={{ padding: 12, textAlign: 'left' }}>Borrower</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Item</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Purpose</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Borrow Date</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Expected Return</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBorrows.map((br) => (
                    <tr key={br.id} style={{ borderTop: `1px solid ${theme.palette.divider}` }}>
                      <td style={{ padding: 12 }}>
                        <Typography fontWeight={600}>{br.borrowedBy?.name || br.borrowed_by?.name || br.borrowed_by}</Typography>
                        <Typography variant="caption" color="text.secondary">{formatDate(br.created_at || br.borrow_date)}</Typography>
                      </td>
                      <td style={{ padding: 12 }}>
                        <Typography>{br.item?.name || br.item_id}</Typography>
                      </td>
                      <td style={{ padding: 12 }}>
                        <Typography variant="body2">{br.purpose}</Typography>
                      </td>
                      <td style={{ padding: 12 }}>
                        <Typography variant="body2">{formatDate(br.borrow_date)}</Typography>
                      </td>
                      <td style={{ padding: 12 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="body2" color={isOverdue(br.expected_return_date) && br.status === 'Approved' ? 'error' : 'text.primary'}>
                            {formatDate(br.expected_return_date)}
                          </Typography>
                          {isOverdue(br.expected_return_date) && br.status === 'Approved' && (
                            <Chip label="Overdue" color="error" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                          )}
                        </Stack>
                      </td>
                      <td style={{ padding: 12 }}>
                        <Chip
                          icon={getStatusIcon(br.status)}
                          label={br.status}
                          color={getStatusColor(br.status)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </td>
                      <td style={{ padding: 12 }}>
                        <Stack direction="row" spacing={1}>
                          {br.status === "Pending" && user?.role === "supply_officer" && (
                            <>
                              <Button startIcon={<ApproveIcon />} variant="contained" color="success" size="small" onClick={() => handleStatusUpdate(br.id, "Approved")}>Approve</Button>
                              <Button startIcon={<RejectIcon />} variant="outlined" color="error" size="small" onClick={() => handleStatusUpdate(br.id, "Rejected", "Rejected by supply officer")}>Reject</Button>
                            </>
                          )}
                          {(() => {
                            const showButton = br.status === "Approved" && user?.role === "staff" && (user?.id === br.borrowedBy?.id || user?.id === br.borrowed_by);
                            return showButton ? (
                              <Button startIcon={<ReturnIcon />} variant="contained" color="primary" size="small" onClick={() => handleOpenReturnDialog(br)}>Return</Button>
                            ) : null;
                          })()}
                          {(br.status === 'Pending' && (user?.role === 'supply_officer' || user?.id === br.borrowedBy?.id || user?.id === br.borrowed_by)) && (
                            <Button startIcon={<DeleteIcon />} variant="outlined" color="error" size="small" onClick={() => handleDelete(br.id)}>Delete</Button>
                          )}
                          <Button startIcon={<ViewIcon />} variant="text" size="small" onClick={() => { setSelectedBorrow(br); setDetailsOpen(true); }}>Details</Button>
                          <Button startIcon={<PrintIcon />} variant="text" size="small" color="secondary" onClick={() => printBorrowerSlip(br)}>Slip</Button>
                        </Stack>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Paper>
        )}

        {/* Details Dialog */}
        <Dialog
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight={700}>
              Borrow Request Details
            </Typography>
          </DialogTitle>
          <DialogContent>
            {selectedBorrow && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Item
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedBorrow.item?.name || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedBorrow.item?.description}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Borrowed By
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedBorrow.borrowed_by?.name || selectedBorrow.borrowedBy?.name || 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.05), borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Status
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={selectedBorrow.status}
                        color={
                          selectedBorrow.status === 'Approved' ? 'success' :
                            selectedBorrow.status === 'Pending' ? 'warning' :
                              selectedBorrow.status === 'Returned' ? 'info' :
                                'error'
                        }
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.grey[500], 0.05), borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Borrow Date
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {new Date(selectedBorrow.borrow_date).toLocaleDateString()}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.grey[500], 0.05), borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Expected Return
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {new Date(selectedBorrow.expected_return_date).toLocaleDateString()}
                    </Typography>
                  </Paper>
                </Grid>

                {selectedBorrow.actual_return_date && (
                  <Grid item xs={12} sm={6}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Actual Return Date
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {new Date(selectedBorrow.actual_return_date).toLocaleDateString()}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.grey[500], 0.05), borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Purpose
                    </Typography>
                    <Typography variant="body1">
                      {selectedBorrow.purpose || 'No purpose specified'}
                    </Typography>
                  </Paper>
                </Grid>

                {selectedBorrow.condition_on_return && (
                  <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Condition on Return
                      </Typography>
                      <Typography variant="body1">
                        {selectedBorrow.condition_on_return}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {selectedBorrow.remarks && (
                  <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.05), borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Remarks
                      </Typography>
                      <Typography variant="body1">
                        {selectedBorrow.remarks}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => selectedBorrow && printBorrowerSlip(selectedBorrow)}
              variant="outlined"
              startIcon={<PrintIcon />}
              sx={{ borderRadius: 2, borderColor: '#006400', color: '#006400', '&:hover': { borderColor: '#004d00', bgcolor: 'rgba(0,100,0,0.04)' } }}
            >
              Print Slip
            </Button>
            <Button
              onClick={() => setDetailsOpen(false)}
              variant="contained"
              sx={{
                bgcolor: '#006400',
                '&:hover': { bgcolor: '#004d00' }
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Return Item Dialog */}
        <Dialog
          open={returnDialogOpen}
          onClose={handleCloseReturnDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          <DialogTitle sx={{
            bgcolor: '#006400',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <ReturnIcon />
            Return Item
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            {selectedBorrow && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  You are returning: <strong>{selectedBorrow.item?.name}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                  Original Condition: <Chip
                    label={selectedBorrow.condition_before}
                    size="small"
                    color="info"
                  />
                </Typography>

                <TextField
                  select
                  fullWidth
                  label="Condition After Use"
                  value={returnForm.condition_after}
                  onChange={(e) => setReturnForm(prev => ({ ...prev, condition_after: e.target.value }))}
                  required
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="Excellent">Excellent</MenuItem>
                  <MenuItem value="Good">Good</MenuItem>
                  <MenuItem value="Fair">Fair</MenuItem>
                  <MenuItem value="Needs Repair">Needs Repair</MenuItem>
                  <MenuItem value="Damaged">Damaged</MenuItem>
                </TextField>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes (Optional)"
                  placeholder="Any issues, damages, or notes about the item..."
                  value={returnForm.notes}
                  onChange={(e) => setReturnForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={handleCloseReturnDialog}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReturnSubmit}
              variant="contained"
              startIcon={<ReturnIcon />}
              sx={{
                bgcolor: '#006400',
                '&:hover': { bgcolor: '#004d00' }
              }}
            >
              Confirm Return
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            variant="filled"
            sx={{
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </DashboardLayout>
  );
};

export default BorrowsPage;
