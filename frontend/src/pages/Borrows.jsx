import React, { useEffect, useState } from "react";
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
} from "@mui/icons-material";

const BorrowsPage = () => {
  const theme = useTheme();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form fields
    if (!form.item_id) {
      showSnackbar('Please select an item', 'error');
      return;
    }
    if (!form.borrow_date) {
      showSnackbar('Please select a borrow date', 'error');
      return;
    }
    if (!form.expected_return_date) {
      showSnackbar('Please select an expected return date', 'error');
      return;
    }
    if (!form.purpose || form.purpose.trim() === "") {
      showSnackbar('Please enter a purpose', 'error');
      return;
    }
    
    // Check stock
    const selectedItem = items.find(i => i.id === form.item_id);
    if (selectedItem && Number(selectedItem.stock) <= 0) {
      showSnackbar('Selected item has no available stock', 'error');
      return;
    }

    try {
      console.log('Submitting borrow with data:', form);
      const result = await createBorrow(form);
      console.log('Borrow created:', result);
      setBorrows((prev) => [result.borrow_record, ...prev]);
      setForm({ item_id: "", borrow_date: "", expected_return_date: "", purpose: "" });
      setDialogOpen(false);
      showSnackbar("Borrow request submitted successfully", "success");
      loadBorrows(); // Reload to get fresh data
    } catch (err) {
      console.error("Borrow submission error:", err);
      console.error("Error response:", err.response?.data);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Failed to create borrow record";
      const errors = err.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)[0];
        showSnackbar(firstError[0] || errorMsg, "error");
      } else {
        showSnackbar(errorMsg, "error");
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

        {/* Create Borrow Request Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={() => setDialogOpen(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
            <Typography variant="h5" fontWeight="700">
              New Borrow Request
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fill in the details to request an item
            </Typography>
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ pt: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Select Item"
                    name="item_id"
                    value={form.item_id}
                    onChange={handleFormChange}
                    required
                    variant="outlined"
                    size="small"
                  >
                    <MenuItem value="">Choose an item</MenuItem>
                    {items.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="body1" fontWeight="500">{item.name}</Typography>
                            <Chip 
                              label={item.office?.name || 'No Office'} 
                              size="small" 
                              sx={{ 
                                ml: 1,
                                fontSize: '0.7rem',
                                height: 20,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: 'primary.main'
                              }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              {item.category?.name || item.category}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              fontWeight="600"
                              color={Number(item.stock) <= 0 ? "error.main" : "success.main"}
                            >
                              Stock: {item.stock}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                
                {/* Selected item quick info */}
                {form.item_id && (
                  <Grid item xs={12}>
                    <Paper sx={{ 
                      p: 2.5, 
                      border: '1px dashed', 
                      borderColor: 'divider', 
                      borderRadius: 2,
                      bgcolor: 'grey.50'
                    }}>
                      <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                        Selected Item Details
                      </Typography>
                      {(() => {
                        const sel = items.find(i => i.id === form.item_id);
                        if (!sel) return <Typography variant="body2">Loading item...</Typography>;
                        return (
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={8}>
                              <Typography variant="body1" fontWeight="600" gutterBottom>
                                {sel.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {sel.category?.name || sel.category}
                              </Typography>
                              <Chip 
                                label={sel.office?.name || 'No Office'} 
                                size="small"
                                icon={<InfoIcon />}
                                sx={{ 
                                  mt: 0.5,
                                  bgcolor: alpha(theme.palette.info.main, 0.1),
                                  color: 'info.main',
                                  fontWeight: 600
                                }}
                              />
                            </Grid>
                            <Grid item xs={4} sx={{ textAlign: 'right' }}>
                              <Box sx={{ 
                                display: 'inline-block',
                                p: 1,
                                borderRadius: 1,
                                bgcolor: Number(sel.stock) <= 0 ? 'error.50' : 'success.50',
                                border: '1px solid',
                                borderColor: Number(sel.stock) <= 0 ? 'error.100' : 'success.100'
                              }}>
                                <Typography 
                                  variant="h6" 
                                  color={Number(sel.stock) <= 0 ? 'error.main' : 'success.main'}
                                >
                                  {sel.stock}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Available
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        );
                      })()}
                    </Paper>
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Borrow Date"
                    name="borrow_date"
                    type="date"
                    value={form.borrow_date}
                    onChange={handleFormChange}
                    required
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Expected Return Date"
                    name="expected_return_date"
                    type="date"
                    value={form.expected_return_date}
                    onChange={handleFormChange}
                    required
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Purpose"
                    name="purpose"
                    value={form.purpose}
                    onChange={handleFormChange}
                    required
                    multiline
                    rows={3}
                    placeholder="Please describe the purpose of borrowing this item..."
                    variant="outlined"
                    size="small"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
              <Button 
                onClick={() => setDialogOpen(false)}
                sx={{ borderRadius: 2, px: 3 }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained"
                sx={{ borderRadius: 2, px: 4 }}
              >
                Submit Request
              </Button>
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
