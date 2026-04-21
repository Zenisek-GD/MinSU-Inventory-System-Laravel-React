import React, { useEffect, useState } from "react";
import {
  fetchMemorandumReceipts,
  createMemorandumReceipt,
  deleteMemorandumReceipt,
  rejectMemorandumReceipt,
  approveMemorandumReceipt,
} from "../api/memorandumReceipt";
import { fetchItems } from "../api/item";
import { fetchOffices } from "../api/office";
import { fetchUsers } from "../api/user";
import DashboardLayout from "../components/Layout/DashboardLayout";
import { useUser } from "../context/UserContext";
import ReceiveItemsDialog from "../components/ReceiveItemsDialog";
import { useNavigate } from "react-router-dom";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  useTheme,
  Tooltip,
  Fade,
  Skeleton,
  Stack,
  Avatar,
  Badge,
  LinearProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Inventory as InventoryIcon,
  Business as OfficeIcon,
  Person as PersonIcon,
  LocalShipping as ReceiveIcon,
  CorporateFare as CorporateFareIcon,
  LocationOn as LocationOnIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  NoteAdd as NoteAddIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Warning as WarningIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Article as ArticleIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";

const defaultItem = {
  item_name: "",
  qty: 1,
  unit: "pcs",
  property_number: "",
  acquisition_date: new Date().toISOString().split("T")[0],
  unit_cost: 0,
  condition: "Good",
  remarks: "",
  estimated_useful_life: "",
};

const PAR_THRESHOLD = 50000;

const usefulLifeOptions = [
  "1 year", "2 years", "3 years", "4 years", "5 years",
  "7 years", "10 years", "15 years", "20 years",
];

const MemorandumReceiptsPage = () => {
  const theme = useTheme();
  const [requests, setRequests] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [offices, setOffices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    entity_name: "MinSU",
    fund_cluster: "General Fund",
    office: "",
    accountable_officer: "",
    position: "",
    date_issued: new Date().toISOString().split("T")[0],
    received_from: "",
    purpose: "",
    notes: "",
    items: [{ ...defaultItem }],
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [rejectingRequestId, setRejectingRequestId] = useState(null);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [selectedMRForReceive, setSelectedPRForReceive] = useState(null);
  const [formType, setFormType] = useState('ics');
  const [formTypeAutoSwitched, setFormTypeAutoSwitched] = useState(false);
  const [userOverrodeFormType, setUserOverrodeFormType] = useState(false);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
    totalValue: 0
  });
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    loadRequests();
    loadItems();
    loadOffices();
    loadUsers();
  }, []);

  useEffect(() => {
    if (requests.length > 0) {
      const stats = {
        pending: requests.filter(r => r.status === 'Pending Review').length,
        approved: requests.filter(r => r.status === 'Approved' || r.status === 'Completed').length,
        rejected: requests.filter(r => r.status === 'Rejected').length,
        total: requests.length,
        totalValue: requests.reduce((sum, r) =>
          sum + (r.items?.reduce((itemSum, item) => itemSum + (item.qty * item.unit_cost), 0) || 0), 0
        )
      };
      setStats(stats);
    }
  }, [requests]);

  const loadOffices = async () => {
    try {
      const data = await fetchOffices();
      setOffices(data?.data || []);
    } catch (err) {
      console.error("Failed to load offices:", err);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data?.data?.data || data?.data || data || []);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  const loadItems = async () => {
    try {
      const data = await fetchItems();
      setAvailableItems(data?.data?.data || data?.data || data || []);
    } catch (err) {
      console.error("Failed to load items:", err);
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await fetchMemorandumReceipts();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load memorandum receipts");
      setRequests([]);
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

    if (e.target.name === "unit_cost" && !userOverrodeFormType) {
      const cost = parseFloat(e.target.value) || 0;
      const updatedItems = [...items];
      updatedItems[idx].unit_cost = cost;
      const anyAbove = updatedItems.some((item) => parseFloat(item.unit_cost) >= PAR_THRESHOLD);
      setFormType(anyAbove ? 'par' : 'ics');
      setFormTypeAutoSwitched(anyAbove);
    }
  };

  const handleAddItem = () => {
    setForm({ ...form, items: [...form.items, { ...defaultItem }] });
  };

  const handleRemoveItem = (idx) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const handleSelectInventoryItem = (idx, itemId) => {
    const selectedItem = availableItems.find(item => item.id === parseInt(itemId));
    if (!selectedItem) return;

    const items = [...form.items];
    items[idx] = {
      ...items[idx],
      item_id: selectedItem.id,
      item_name: selectedItem.name,
      unit_cost: selectedItem.purchase_price || 0,
      condition: selectedItem.condition || "Good",
      property_number: selectedItem.serial_number || selectedItem.qr_code || "",
      acquisition_date: selectedItem.purchase_date || new Date().toISOString().split("T")[0],
      remarks: `From inventory - ${selectedItem.category?.name || ""}`,
    };
    setForm({ ...form, items });

    if (!userOverrodeFormType) {
      const cost = selectedItem.purchase_price || 0;
      const allItems = [...items];
      const anyAbove = allItems.some((item) => parseFloat(item.unit_cost) >= PAR_THRESHOLD);
      setFormType(anyAbove ? 'par' : 'ics');
      setFormTypeAutoSwitched(anyAbove);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.entity_name?.trim()) {
      showSnackbar("Please enter entity name", "error");
      return;
    }
    if (!form.fund_cluster?.trim()) {
      showSnackbar("Please enter fund cluster", "error");
      return;
    }
    if (!form.office?.trim()) {
      showSnackbar("Please enter office", "error");
      return;
    }
    if (!form.accountable_officer?.trim()) {
      showSnackbar("Please enter accountable officer name", "error");
      return;
    }
    if (!form.position?.trim()) {
      showSnackbar("Please enter position", "error");
      return;
    }
    if (!form.received_from?.trim()) {
      showSnackbar("Please enter received from (source)", "error");
      return;
    }
    if (!form.items || form.items.length === 0) {
      showSnackbar("Please add at least one item", "error");
      return;
    }

    for (let i = 0; i < form.items.length; i++) {
      const item = form.items[i];
      if (!item.item_name?.trim()) {
        showSnackbar(`Item ${i + 1}: Please enter item name`, "error");
        return;
      }
      if (!item.qty || item.qty < 1) {
        showSnackbar(`Item ${i + 1}: Quantity must be at least 1`, "error");
        return;
      }
      if (!item.unit?.trim()) {
        showSnackbar(`Item ${i + 1}: Please enter unit`, "error");
        return;
      }
      if (!item.property_number?.trim()) {
        showSnackbar(`Item ${i + 1}: Please enter property number`, "error");
        return;
      }
      if (!item.acquisition_date) {
        showSnackbar(`Item ${i + 1}: Please enter acquisition date`, "error");
        return;
      }
      if (item.unit_cost === null || item.unit_cost === undefined || item.unit_cost < 0) {
        showSnackbar(`Item ${i + 1}: Please enter valid unit cost`, "error");
        return;
      }
      if (!item.condition) {
        showSnackbar(`Item ${i + 1}: Please select condition`, "error");
        return;
      }
    }

    try {
      const submitData = { ...form, form_type: formType };
      const result = await createMemorandumReceipt(submitData);
      setRequests((prev) => [result.data, ...prev]);
      setForm({
        entity_name: "",
        fund_cluster: "",
        office: "",
        accountable_officer: "",
        position: "",
        date_issued: new Date().toISOString().split("T")[0],
        received_from: "",
        purpose: "",
        notes: "",
        items: [{ ...defaultItem }],
      });
      setFormType('ics');
      setFormTypeAutoSwitched(false);
      setUserOverrodeFormType(false);
      setDialogOpen(false);
      showSnackbar("Memorandum Receipt created successfully", "success");
    } catch (err) {
      console.error('MR submission error:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Failed to create memorandum receipt";
      showSnackbar(errorMsg, "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this memorandum receipt?")) return;
    try {
      await deleteMemorandumReceipt(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      showSnackbar("Memorandum Receipt deleted successfully", "success");
    } catch {
      showSnackbar("Failed to delete memorandum receipt", "error");
    }
  };

  const handleStatusUpdate = async (id, status) => {
    if (status === "Rejected") {
      setRejectingRequestId(id);
      setRejectNotes("");
      setRejectDialogOpen(true);
      return;
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveMemorandumReceipt(id);
      loadRequests();
      showSnackbar("Memorandum Receipt approved successfully", "success");
    } catch (err) {
      showSnackbar(err.response?.data?.message || "Failed to approve request", "error");
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectNotes.trim()) {
      showSnackbar("Please provide rejection notes", "error");
      return;
    }

    try {
      await rejectMemorandumReceipt(rejectingRequestId, { notes: rejectNotes });
      setRequests((prev) => prev.map(r => r.id === rejectingRequestId ? { ...r, status: "Rejected" } : r));
      showSnackbar("Request rejected successfully", "success");
      setRejectDialogOpen(false);
      setRejectNotes("");
      setRejectingRequestId(null);
    } catch {
      showSnackbar("Failed to reject request", "error");
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
      case "completed":
        return "success";
      case "rejected":
      case "cancelled":
      case "returned":
        return "error";
      case "turned in":
        return "success";
      case "pending review":
        return "warning";
      case "processing":
        return "info";
      case "received":
        return "primary";
      default: return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
      case "completed":
        return <CheckCircleOutlineIcon fontSize="small" />;
      case "rejected":
      case "cancelled":
        return <WarningIcon fontSize="small" />;
      case "pending review":
        return <ScheduleIcon fontSize="small" />;
      case "processing":
        return <AssignmentTurnedInIcon fontSize="small" />;
      case "turned in":
        return <CheckCircleOutlineIcon fontSize="small" />;
      default: return <ArticleIcon fontSize="small" />;
    }
  };

  const handleReceiveItems = (request) => {
    setSelectedPRForReceive(request);
    setReceiveDialogOpen(true);
  };

  const handleReceiveSuccess = () => {
    loadRequests();
    showSnackbar("Items received successfully and stock movements created", "success");
  };

  const calculateItemTotal = (item) => {
    return (item.qty * item.unit_cost).toFixed(2);
  };

  const filteredRequests = requests.filter(req => {
    if (filterStatus !== 'all' && req.status?.toLowerCase() !== filterStatus.toLowerCase()) return false;

    if (query) {
      const searchLower = query.toLowerCase();
      return (
        req.mr_number?.toLowerCase().includes(searchLower) ||
        req.office?.toLowerCase().includes(searchLower) ||
        req.accountable_officer?.toLowerCase().includes(searchLower) ||
        req.purpose?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const statusOptions = [
    { value: 'all', label: 'All', count: stats.total },
    { value: 'pending review', label: 'Pending', count: stats.pending },
    { value: 'approved', label: 'Approved', count: stats.approved },
    { value: 'rejected', label: 'Rejected', count: stats.rejected },
  ];

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'grey.50', minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h3" fontWeight="800" color="primary.main" gutterBottom>
                Memorandum Receipts
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Manage and track property accountability documents
              </Typography>
            </Box>
            <Tooltip title="Refresh">
              <IconButton
                onClick={loadRequests}
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

          {/* Stats Cards */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.3)
              }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                    <ReceiptIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="800" color="primary.main">
                      {stats.total}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total MRs
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                border: '1px solid',
                borderColor: alpha(theme.palette.warning.main, 0.3)
              }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar sx={{ bgcolor: 'warning.main', width: 40, height: 40 }}>
                    <ScheduleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="800" color="warning.main">
                      {stats.pending}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pending Review
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.success.main, 0.1),
                border: '1px solid',
                borderColor: alpha(theme.palette.success.main, 0.3)
              }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                    <CheckCircleOutlineIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="800" color="success.main">
                      {stats.approved}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Approved
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.info.main, 0.1),
                border: '1px solid',
                borderColor: alpha(theme.palette.info.main, 0.3)
              }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar sx={{ bgcolor: 'info.main', width: 40, height: 40 }}>
                    <MoneyIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="800" color="info.main" noWrap>
                      {formatCurrency(stats.totalValue)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Value
                    </Typography>
                  </Box>
                </Stack>
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
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setDialogOpen(true)}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.2,
                  fontSize: '1rem',
                  bgcolor: '#006400',
                  '&:hover': { bgcolor: '#004d00' }
                }}
                fullWidth
              >
                New Memorandum Receipt
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="medium"
                placeholder="Search MR number, office, officer..."
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
                  width: '100%',
                  borderColor: '#006400',
                  color: '#006400',
                  '&:hover': { borderColor: '#004d00', bgcolor: alpha('#006400', 0.04) }
                }}
              >
                Filters
              </Button>
            </Grid>
          </Grid>

          {/* Status Tabs */}
          <Box sx={{ mt: 3 }}>
            <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
              {statusOptions.map((option) => (
                <Chip
                  key={option.value}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {option.label}
                      <Badge badgeContent={option.count} color="primary" max={999} sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem', height: 18, minWidth: 18 } }} />
                    </Box>
                  }
                  onClick={() => setFilterStatus(option.value)}
                  color={filterStatus === option.value ? 'primary' : 'default'}
                  variant={filterStatus === option.value ? 'filled' : 'outlined'}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 600,
                    '&.MuiChip-filledPrimary': { bgcolor: '#006400' }
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Paper>

        {/* Create Request Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{
            bgcolor: '#006400',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <NoteAddIcon />
            <Typography variant="h6" fontWeight="600">
              Create New Memorandum Receipt
            </Typography>
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ pt: 3 }}>
              {/* Form Type Selector */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  mb: 3,
                  borderRadius: 2,
                  borderColor: formType === 'par' ? theme.palette.warning.main : theme.palette.success.main,
                  borderWidth: 2,
                  bgcolor: formType === 'par' ? alpha(theme.palette.warning.main, 0.04) : alpha(theme.palette.success.main, 0.04)
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentIcon color={formType === 'par' ? 'warning' : 'success'} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        Document Type
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ICS for items below ₱50,000 · PAR for ₱50,000 and above
                      </Typography>
                    </Box>
                  </Box>
                  <ToggleButtonGroup
                    value={formType}
                    exclusive
                    onChange={(e, val) => {
                      if (val) {
                        setFormType(val);
                        setUserOverrodeFormType(true);
                        setFormTypeAutoSwitched(false);
                      }
                    }}
                    size="small"
                  >
                    <ToggleButton
                      value="ics"
                      sx={{
                        fontWeight: 700,
                        px: 3,
                        '&.Mui-selected': {
                          bgcolor: alpha(theme.palette.success.main, 0.15),
                          color: theme.palette.success.main,
                          borderColor: theme.palette.success.main,
                        },
                      }}
                    >
                      <DescriptionIcon sx={{ mr: 1, fontSize: 18 }} />
                      ICS
                    </ToggleButton>
                    <ToggleButton
                      value="par"
                      sx={{
                        fontWeight: 700,
                        px: 3,
                        '&.Mui-selected': {
                          bgcolor: alpha(theme.palette.warning.main, 0.12),
                          color: theme.palette.warning.main,
                          borderColor: theme.palette.warning.main,
                        },
                      }}
                    >
                      <AssignmentIcon sx={{ mr: 1, fontSize: 18 }} />
                      PAR
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    icon={formType === 'ics' ? <DescriptionIcon /> : <AssignmentIcon />}
                    label={formType === 'ics' ? 'Inventory Custodian Slip (ICS)' : 'Property Acknowledgment Receipt (PAR)'}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      bgcolor: formType === 'par' ? alpha(theme.palette.warning.main, 0.1) : alpha(theme.palette.success.main, 0.1),
                      color: formType === 'par' ? theme.palette.warning.main : theme.palette.success.main,
                      border: `1px solid ${formType === 'par' ? theme.palette.warning.main : theme.palette.success.main}`,
                    }}
                  />
                </Box>

                {formTypeAutoSwitched && !userOverrodeFormType && (
                  <Alert severity="warning" icon={<WarningIcon />} sx={{ mt: 2 }}>
                    An item with a unit cost of ₱50,000 or above was detected — <strong>PAR form</strong> has been automatically selected.
                  </Alert>
                )}
              </Paper>

              {/* Organization Details */}
              <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                  <CorporateFareIcon color="primary" />
                  <Typography variant="h6" fontWeight="600">
                    Organization Details
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Entity Name"
                      name="entity_name"
                      value={form.entity_name}
                      onChange={handleFormChange}
                      required
                    >
                      <MenuItem value="MinSU">Mindoro State University (MinSU)</MenuItem>
                      <MenuItem value="DOST">Department of Science and Technology (DOST)</MenuItem>
                      <MenuItem value="CHED">Commission on Higher Education (CHED)</MenuItem>
                      <MenuItem value="DA">Department of Agriculture (DA)</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Fund Cluster"
                      name="fund_cluster"
                      value={form.fund_cluster}
                      onChange={handleFormChange}
                      required
                    >
                      <MenuItem value="General Fund">General Fund</MenuItem>
                      <MenuItem value="Special Trust Fund">Special Trust Fund</MenuItem>
                      <MenuItem value="Revolving Fund">Revolving Fund</MenuItem>
                      <MenuItem value="Trust Fund">Trust Fund</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Paper>

              {/* Location & Personnel */}
              <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                  <LocationOnIcon color="secondary" />
                  <Typography variant="h6" fontWeight="600">
                    Location & Personnel
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      label="Location (Room/Office)"
                      name="office"
                      value={form.office}
                      onChange={handleFormChange}
                      required
                      helperText="Select the specific room or office from Location Management."
                    >
                      {offices.map((off) => (
                        <MenuItem key={off.id} value={off.name}>
                          <Box>
                            <Typography variant="body2">{off.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {off.room_number ? `Room ${off.room_number} · ` : ''}{off.department?.name || 'Unassigned'}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Accountable Officer"
                      name="accountable_officer"
                      value={form.accountable_officer}
                      onChange={(e) => {
                        const selectedUser = users.find((u) => u.name === e.target.value);
                        setForm({
                          ...form,
                          accountable_officer: e.target.value,
                          position: selectedUser ? (selectedUser.role === 'staff' ? 'Staff' : 'Admin') : form.position
                        });
                      }}
                      required
                    >
                      {users.map((u) => (
                        <MenuItem key={u.id} value={u.name}>
                          <Box>
                            <Typography variant="body2">{u.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {u.role} · {u.email}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Position"
                      name="position"
                      value={form.position}
                      onChange={handleFormChange}
                      required
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Tracking Details */}
              <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                  <AssignmentIcon color="info" />
                  <Typography variant="h6" fontWeight="600">
                    Tracking Details
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Date Issued"
                      name="date_issued"
                      type="date"
                      value={form.date_issued}
                      onChange={handleFormChange}
                      InputLabelProps={{ shrink: true }}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Received From"
                      name="received_from"
                      value={form.received_from}
                      onChange={handleFormChange}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Purpose"
                      name="purpose"
                      value={form.purpose}
                      onChange={handleFormChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notes"
                      name="notes"
                      value={form.notes}
                      onChange={handleFormChange}
                      multiline
                      rows={2}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Items Section */}
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.01)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InventoryIcon color="action" />
                    <Typography variant="h6" fontWeight="600">
                      Requested Items
                    </Typography>
                  </Box>
                  <Chip
                    icon={<InventoryIcon />}
                    label={`${form.items.length} Item(s)`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                <Divider sx={{ mb: 3 }} />

                {form.items.map((item, idx) => (
                  <Paper
                    key={idx}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      mb: 3,
                      border: "1px solid #e0e0e0",
                      borderRadius: 2,
                      bgcolor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                      position: 'relative'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle2" color="primary" fontWeight="700">
                        Item #{idx + 1}
                      </Typography>
                      {form.items.length > 1 && (
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleRemoveItem(idx)}
                          sx={{ borderRadius: 1.5 }}
                        >
                          Remove
                        </Button>
                      )}
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          select
                          label="Select from Inventory (Optional - auto-fills fields)"
                          onChange={(e) => handleSelectInventoryItem(idx, e.target.value)}
                          value=""
                          helperText="Choose an item from inventory to auto-populate the form"
                          size="small"
                        >
                          <MenuItem value="">-- Select an item to auto-fill --</MenuItem>
                          {availableItems.map((invItem) => (
                            <MenuItem key={invItem.id} value={invItem.id}>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>{invItem.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {invItem.serial_number ? `S/N: ${invItem.serial_number} · ` : ''}
                                  ₱{parseFloat(invItem.purchase_price || 0).toFixed(2)}
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Item Name"
                          name="item_name"
                          value={item.item_name}
                          onChange={(e) => handleItemChange(idx, e)}
                          required
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          fullWidth
                          label="Qty"
                          name="qty"
                          type="number"
                          value={item.qty}
                          onChange={(e) => handleItemChange(idx, e)}
                          required
                          inputProps={{ min: 1 }}
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          fullWidth
                          label="Unit"
                          name="unit"
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, e)}
                          required
                          placeholder="e.g., pcs"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Property Number"
                          name="property_number"
                          value={item.property_number}
                          onChange={(e) => handleItemChange(idx, e)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Acquisition Date"
                          name="acquisition_date"
                          type="date"
                          value={item.acquisition_date}
                          onChange={(e) => handleItemChange(idx, e)}
                          InputLabelProps={{ shrink: true }}
                          required
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <CalendarIcon fontSize="small" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Unit Cost (₱)"
                          name="unit_cost"
                          type="number"
                          value={item.unit_cost}
                          onChange={(e) => handleItemChange(idx, e)}
                          required
                          inputProps={{ min: 0, step: 0.01 }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <MoneyIcon fontSize="small" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Total (₱)"
                          value={calculateItemTotal(item)}
                          disabled
                          variant="filled"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <MoneyIcon fontSize="small" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          select
                          fullWidth
                          label="Condition"
                          name="condition"
                          value={item.condition}
                          onChange={(e) => handleItemChange(idx, e)}
                          required
                        >
                          <MenuItem value="Good">Good</MenuItem>
                          <MenuItem value="Fair">Fair</MenuItem>
                          <MenuItem value="Poor">Poor</MenuItem>
                          <MenuItem value="Damaged">Damaged</MenuItem>
                          <MenuItem value="Non-functional">Non-functional</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Remarks"
                          name="remarks"
                          value={item.remarks}
                          onChange={(e) => handleItemChange(idx, e)}
                          multiline
                          rows={2}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          select
                          fullWidth
                          label="Estimated Useful Life"
                          name="estimated_useful_life"
                          value={item.estimated_useful_life || ""}
                          onChange={(e) => handleItemChange(idx, e)}
                        >
                          <MenuItem value=""><em>Not specified</em></MenuItem>
                          {usefulLifeOptions.map((opt) => (
                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}

                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                  sx={{
                    mt: 1,
                    borderRadius: 1.5,
                    borderStyle: 'dashed',
                    borderColor: '#006400',
                    color: '#006400',
                    '&:hover': {
                      borderColor: '#004d00',
                      bgcolor: alpha('#006400', 0.04)
                    }
                  }}
                  fullWidth
                >
                  Add Another Item
                </Button>
              </Paper>
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
                startIcon={<NoteAddIcon />}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  bgcolor: '#006400',
                  '&:hover': { bgcolor: '#004d00' }
                }}
              >
                Create Memorandum Receipt
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Requests List */}
        {loading ? (
          <Grid container spacing={3}>
            {[...Array(3)].map((_, index) => (
              <Grid item xs={12} key={index}>
                <Skeleton
                  variant="rectangular"
                  height={120}
                  sx={{ borderRadius: 3 }}
                />
              </Grid>
            ))}
          </Grid>
        ) : error ? (
          <Alert
            severity="error"
            sx={{ borderRadius: 2, mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={loadRequests}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        ) : filteredRequests.length === 0 ? (
          <Paper sx={{
            p: 8,
            textAlign: 'center',
            borderRadius: 3,
            bgcolor: 'background.paper'
          }}>
            <ReceiptIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No memorandum receipts found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {query ? 'Try a different search term' : 'Create your first memorandum receipt'}
            </Typography>
            {!query && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setDialogOpen(true)}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  bgcolor: '#006400',
                  '&:hover': { bgcolor: '#004d00' }
                }}
              >
                Create First MR
              </Button>
            )}
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Table>
              <TableHead sx={{ backgroundColor: alpha('#006400', 0.08) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#006400' }}>MR Number</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#006400' }}>Office</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#006400' }}>Officer</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#006400' }}>Items</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#006400' }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#006400' }}>Total Amount</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#006400' }}>Form</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#006400' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((req) => (
                  <TableRow
                    key={req.id}
                    sx={{
                      '&:hover': { backgroundColor: alpha('#006400', 0.04) },
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReceiptIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                        {req.mr_number}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <OfficeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        {req.office}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        {req.accountable_officer}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={<InventoryIcon />}
                        label={req.items?.length || 0}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={getStatusIcon(req.status)}
                        label={req.status}
                        color={getStatusColor(req.status)}
                        size="small"
                        sx={{ fontWeight: 600, minWidth: 100 }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#006400' }}>
                      {formatCurrency(req.items?.reduce((sum, item) => sum + (item.qty * item.unit_cost), 0) || 0)}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={req.form_type === 'par' ? 'Property Acknowledgment Receipt' : 'Inventory Custodian Slip'}>
                        <Chip
                          icon={req.form_type === 'par' ? <AssignmentIcon /> : <DescriptionIcon />}
                          label={req.form_type?.toUpperCase()}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            bgcolor: req.form_type === 'par' ? alpha(theme.palette.warning.main, 0.08) : alpha(theme.palette.success.main, 0.08),
                            color: req.form_type === 'par' ? theme.palette.warning.main : theme.palette.success.main,
                            border: `1px solid ${req.form_type === 'par' ? theme.palette.warning.main : theme.palette.success.main}`,
                          }}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        {req.status === "Pending Review" && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleApprove(req.id)}
                                sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}
                              >
                                <ApproveIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleStatusUpdate(req.id, "Rejected")}
                                sx={{ bgcolor: alpha(theme.palette.error.main, 0.1) }}
                              >
                                <RejectIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => navigate(`/memorandum-receipts/${req.id}`)}
                            sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Print">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => navigate(`/memorandum-receipts/${req.id}/print`)}
                            sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1) }}
                          >
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Reject Dialog */}
        <Dialog
          open={rejectDialogOpen}
          onClose={() => setRejectDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{
            bgcolor: 'error.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <WarningIcon />
            Reject Memorandum Receipt
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              Are you sure you want to reject this memorandum receipt?
            </Alert>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Rejection Notes"
              placeholder="Explain why this request is being rejected..."
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              required
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setRejectDialogOpen(false)}
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReject}
              variant="contained"
              color="error"
              startIcon={<RejectIcon />}
              sx={{ borderRadius: 2 }}
            >
              Reject Request
            </Button>
          </DialogActions>
        </Dialog>

        {/* Receive Items Dialog */}
        <ReceiveItemsDialog
          open={receiveDialogOpen}
          onClose={() => {
            setReceiveDialogOpen(false);
            setSelectedPRForReceive(null);
          }}
          memorandumReceipt={selectedMRForReceive}
          onSuccess={handleReceiveSuccess}
        />

        {/* Snackbar */}
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

export default MemorandumReceiptsPage;