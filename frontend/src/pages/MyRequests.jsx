import React, { useEffect, useState } from "react";
import ReactDOM from 'react-dom/client';
import {
  fetchMemorandumReceipts,
  createMemorandumReceipt,
  deleteMemorandumReceipt,
} from "../api/memorandumReceipt";
import DashboardLayout from "../components/Layout/DashboardLayout";
import { fetchOffices } from "../api/office";
import { useUser } from "../context/UserContext";
import { getMyBorrowRequests } from "../api/borrowRequests";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Paper,
  Divider,
  Tabs,
  Tab,
  ToggleButtonGroup,
  ToggleButton,
  alpha,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Print as PrintIcon,
} from "@mui/icons-material";
import OfficeChip from '../components/UI/OfficeChip';
import PrimaryButton from '../components/UI/PrimaryButton';
import BorrowerSlip from '../components/BorrowerSlip';

// Shared Borrower's Slip print helper
const printBorrowerSlip = (borrowRecord, borrowerName = '') => {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) { alert("Please allow popups to print the Borrower's Slip."); return; }
  win.document.write(`<!DOCTYPE html><html><head><title>Borrower's Slip</title><style>body{margin:0;padding:0;}@media print{@page{size:A4;margin:12mm;}}</style></head><body><div id="slip-root"></div></body></html>`);
  win.document.close();
  const root = ReactDOM.createRoot(win.document.getElementById('slip-root'));
  root.render(<BorrowerSlip borrows={borrowRecord ? [borrowRecord] : []} borrowerName={borrowerName} borrowerDesignation="Staff" availableYes={true} />);
  setTimeout(() => { win.focus(); win.print(); }, 600);
};

const defaultItem = {
  item_name: "",
  description: "",
  quantity: 1,
  unit: "",
  unit_cost: 0,
  urgency: "Medium",
  specifications: "",
  estimated_useful_life: "",
};

// Request Card Component for Memorandum Receipts
const RequestCard = ({ req, type, onDelete, getStatusColor, getStatusIcon, issueMemorandumReceipt, setRequests, showSnackbar }) => {
  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6" fontWeight="600">MR#{req.mr_number || req.id}</Typography>
              <Chip
                icon={getStatusIcon(req.status)}
                label={req.status}
                color={getStatusColor(req.status)}
                size="small"
              />
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">{req.office?.name || req.office_id}</Typography>
            <Typography variant="body2" color="text.secondary">{new Date(req.created_at).toLocaleDateString()}</Typography>
          </Box>
        </Box>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>{req.purpose}</Typography>
        <Divider sx={{ my: 2 }} />

        {/* Items List */}
        <Box sx={{ mb: 2, bgcolor: '#f9f9f9', p: 1.5, borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
            Items ({req.items?.length || 0})
          </Typography>
          {req.items && req.items.map((it) => (
            <Box key={it.id} sx={{ mb: 0.5, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">
                <strong>{it.item_name}</strong> — {it.quantity || it.qty} {it.unit}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ₱{parseFloat(it.total_cost || (it.quantity || it.qty) * (it.unit_cost || 0)).toFixed(2)}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Actions */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {/* Removed Draft submit-for-approval flow. MR goes directly to Pending Review now */}

          {(req.status === 'Pending Review' || req.status === 'Returned') && (
            <Button
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={() => onDelete(req.id)}
            >
              Delete
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Borrow Request Card Component
const BorrowRequestCard = ({ req, getStatusColor, getStatusIcon, borrowerName }) => {
  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6" fontWeight="600">BR#{req.id}</Typography>
              <Chip
                icon={getStatusIcon(req.status)}
                label={typeof req.status === 'string' ? req.status.charAt(0).toUpperCase() + req.status.slice(1) : 'Pending'}
                color={getStatusColor(req.status)}
                size="small"
              />
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">{req.office?.name || 'N/A'}</Typography>
            <Typography variant="body2" color="text.secondary">{new Date(req.requested_at).toLocaleDateString()}</Typography>
          </Box>
        </Box>

        {/* Item & Reason */}
        <Box sx={{ mb: 2, bgcolor: '#f9f9f9', p: 1.5, borderRadius: 1 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Item:</strong> {req.item?.name || 'N/A'}
          </Typography>
          {req.reason && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Reason:</strong> {req.reason}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            <strong>QR:</strong> {req.item?.qr_code || 'N/A'}
          </Typography>
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            ID: BR-{String(req.id).padStart(4, '0')}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PrintIcon sx={{ fontSize: 14 }} />}
            onClick={() => printBorrowerSlip(req, borrowerName)}
            sx={{ borderRadius: 1.5, fontSize: '0.72rem', fontWeight: 700 }}
          >
            Print Slip
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default function MyRequestsPage() {
  const { user } = useUser();
  const [requests, setRequests] = useState([]);
  const [borrowRequests, setBorrowRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    office_id: "",
    entity_name: "Mindoro State University (MinSU)",
    fund_cluster: "General Fund",
    accountable_officer: "",
    position: "",
    received_from: "Supply Office",
    purpose: "",
    form_type: "ics",
    items: [{ ...defaultItem }]
  });
  const [formTypeAutoSwitched, setFormTypeAutoSwitched] = useState(false);
  const [userOverrodeFormType, setUserOverrodeFormType] = useState(false);
  const PAR_THRESHOLD = 50000;
  const [offices, setOffices] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0); // 0: All, 1: Memorandum, 2: Borrow

  useEffect(() => {
    loadRequests();
    loadOffices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        office_id: user.office?.id || "",
        accountable_officer: user.name || "",
        position: user.role === 'staff' ? 'Staff' : (user.role || ""),
      }));
    }
  }, [user]);

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
      let memoList = [];
      let borrowList = [];

      // Load memorandum receipts
      try {
        const memoResp = await fetchMemorandumReceipts({ requested_by: user?.id });
        memoList = Array.isArray(memoResp) ? memoResp : [];
      } catch (e) {
        console.warn('Failed to load memorandum receipts:', e);
        memoList = [];
      }

      // Load borrow requests
      try {
        const borrowResp = await getMyBorrowRequests();
        borrowList = Array.isArray(borrowResp) ? borrowResp : [];
      } catch (e) {
        console.warn('Failed to load borrow requests:', e);
        borrowList = [];
      }

      const myMemo = memoList.filter((r) => ((r.requestedBy && r.requestedBy.id === user.id) || r.requested_by === user.id));
      setRequests(myMemo);
      setBorrowRequests(borrowList);
      setError(null);
    } catch (e) {
      console.error('Error loading requests:', e);
      setError("Some data could not be loaded");
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === 'form_type') {
      setUserOverrodeFormType(true);
    }
  };

  const handleItemChange = (idx, e) => {
    const items = [...form.items];
    const fieldName = e.target.name;
    items[idx][fieldName] = e.target.value;

    if (fieldName === 'unit_cost' && !userOverrodeFormType) {
      const anyAbove = items.some((item) => parseFloat(item.unit_cost) >= PAR_THRESHOLD);
      setForm(prev => ({ ...prev, items, form_type: anyAbove ? 'par' : 'ics' }));
      setFormTypeAutoSwitched(anyAbove);
      return;
    }

    setForm({ ...form, items });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { ...defaultItem }] });
  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate office_id
    if (!form.office_id) {
      showSnackbar("Please select an office", "error");
      return;
    }

    // Validate purpose
    if (!form.purpose || form.purpose.trim() === "") {
      showSnackbar("Please enter a purpose", "error");
      return;
    }

    // Validate items
    if (!form.items || form.items.length === 0) {
      showSnackbar("Please add at least one item", "error");
      return;
    }

    // Validate each item
    for (let i = 0; i < form.items.length; i++) {
      const item = form.items[i];
      if (!item.item_name || item.item_name.trim() === "") {
        showSnackbar(`Item ${i + 1}: Please enter item name`, "error");
        return;
      }
      if (!item.quantity || item.quantity < 1) {
        showSnackbar(`Item ${i + 1}: Quantity must be at least 1`, "error");
        return;
      }
      if (!item.unit || item.unit.trim() === "") {
        showSnackbar(`Item ${i + 1}: Please enter unit`, "error");
        return;
      }
      if (item.unit_cost === null || item.unit_cost === undefined || item.unit_cost < 0) {
        showSnackbar(`Item ${i + 1}: Please enter valid price`, "error");
        return;
      }
      if (!item.urgency) {
        showSnackbar(`Item ${i + 1}: Please select urgency`, "error");
        return;
      }
    }

    try {
      // Map frontend fields (e.g. quantity vs qty) to backend expectations
      const submitData = {
        entity_name: form.entity_name,
        fund_cluster: form.fund_cluster,
        office: form.office_id, // backend will resolve it, though it typically expects office name string, so we assume backend maps integer id to office if necessary (MyRequests is legacy)
        accountable_officer: form.accountable_officer,
        position: form.position,
        date_issued: new Date().toISOString().split("T")[0],
        received_from: form.received_from,
        purpose: form.purpose,
        form_type: form.form_type,
        items: form.items.map(it => ({
          item_name: it.item_name,
          description: it.description,
          qty: it.quantity,
          unit: it.unit,
          unit_cost: it.unit_cost,
          estimated_useful_life: it.estimated_useful_life,
          property_number: `TEMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // MR required field
          acquisition_date: new Date().toISOString().split("T")[0], // MR required field
          condition: 'Good',
          remarks: it.specifications
        }))
      };

      console.log('Submitting PR with data:', submitData);
      const result = await createMemorandumReceipt(submitData);
      // Server returns created purchase_request
      const pr = result.purchase_request || result;
      // If the pr belongs to current user, prepend it
      if ((pr.requestedBy && pr.requestedBy.id === user.id) || pr.requested_by === user.id) {
        setRequests((prev) => [pr, ...prev]);
      }
      setForm({
        office_id: user?.office?.id || "",
        entity_name: "Mindoro State University (MinSU)",
        fund_cluster: "General Fund",
        accountable_officer: user?.name || "",
        position: user?.role === 'staff' ? 'Staff' : (user?.role || ""),
        received_from: "Supply Office",
        purpose: "",
        form_type: "ics",
        items: [{ ...defaultItem }]
      });
      setFormTypeAutoSwitched(false);
      setUserOverrodeFormType(false);
      setDialogOpen(false);
      showSnackbar("Memorandum Receipt created successfully", "success");
    } catch (err) {
      console.error('PR submission error:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Failed to create memorandum receipt";
      showSnackbar(errorMsg, "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this memorandum receipt?")) return;
    try {
      await deleteMemorandumReceipt(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      showSnackbar("Deleted successfully", "success");
    } catch {
      showSnackbar("Failed to delete", "error");
    }
  };

  const showSnackbar = (message, severity) => setSnackbar({ open: true, message, severity });
  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "approved":
      case "borrowed":
        return "success";
      case "pending review":
      case "pending":
        return "warning";
      case "returned":
      case "issue reported":
      case "rejected":
      case "cancelled":
        return "error";
      case "out for delivery":
      case "processing":
      case "ready for release":
        return "primary";
      case "for receiving":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "approved":
      case "borrowed":
        return <CheckIcon sx={{ fontSize: 16 }} />;
      case "pending review":
      case "pending":
      case "processing":
      case "out for delivery":
      case "ready for release":
      case "for receiving":
        return <PendingIcon sx={{ fontSize: 16 }} />;
      case "returned":
      case "issue reported":
      case "rejected":
      case "cancelled":
        return <CancelIcon sx={{ fontSize: 16 }} />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight="700">
            📋 My Requests
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Track all your memorandum receipts and borrow requests
            </Typography>
            {user?.office && <OfficeChip office={user.office} locked />}
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Requests
                </Typography>
                <Typography variant="h5" fontWeight="700">
                  {requests.length + borrowRequests.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Pending Approval
                </Typography>
                <Typography variant="h5" fontWeight="700" sx={{ color: 'warning.main' }}>
                  {requests.filter(r => ['Pending Review', 'Processing', 'Ready for Release', 'Out for Delivery', 'For Receiving'].includes(r.status)).length + borrowRequests.filter(r => r.status === 'pending').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Completed
                </Typography>
                <Typography variant="h5" fontWeight="700" sx={{ color: 'success.main' }}>
                  {requests.filter(r => r.status === 'Completed').length + borrowRequests.filter(r => r.status === 'borrowed').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Action */}
        <Box sx={{ mb: 3 }}>
          <PrimaryButton
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            New Memorandum Receipt
          </PrimaryButton>
        </Box>

        {/* Tabs */}
        <Card sx={{ borderRadius: 2, mb: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
              <Tab label={`All Requests (${requests.length + borrowRequests.length})`} />
              <Tab label={`Memorandum Receipts (${requests.length})`} />
              <Tab label={`Borrow Requests (${borrowRequests.length})`} />
            </Tabs>
          </Box>
        </Card>

        <Dialog open={dialogOpen} onClose={() => {
          setDialogOpen(false);
          setForm({
            office_id: user?.office?.id || "",
            entity_name: "Mindoro State University (MinSU)",
            fund_cluster: "General Fund",
            accountable_officer: user?.name || "",
            position: user?.role === 'staff' ? 'Staff' : (user?.role || ""),
            received_from: "Supply Office",
            purpose: "",
            form_type: "ics",
            items: [{ ...defaultItem }]
          });
          setUserOverrodeFormType(false);
          setFormTypeAutoSwitched(false);
        }} maxWidth="md" fullWidth>
          <DialogTitle>Create New Memorandum Receipt</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Form Type</Typography>
                    <ToggleButtonGroup
                      color="primary"
                      value={form.form_type}
                      exclusive
                      onChange={(e, newVal) => {
                        if (newVal) {
                          handleFormChange({ target: { name: 'form_type', value: newVal } });
                        }
                      }}
                      sx={{
                        bgcolor: '#f5f5f5',
                        '& .MuiToggleButton-root': {
                          px: 3, py: 1, textTransform: 'none', fontWeight: 600, border: '1px solid transparent'
                        },
                        '& .Mui-selected': { bgcolor: '#006400 !important', color: '#fff !important' }
                      }}
                    >
                      <ToggleButton value="ics">Inventory Custodian Slip (ICS)</ToggleButton>
                      <ToggleButton value="par">Property Acknowledgment Receipt (PAR)</ToggleButton>
                    </ToggleButtonGroup>
                    {formTypeAutoSwitched && !userOverrodeFormType && form.form_type === 'par' && (
                      <Alert severity="info" sx={{ mt: 1, py: 0 }}>
                        Auto-switched to PAR because an item unit cost is ₱50,000 or above.
                      </Alert>
                    )}
                  </Box>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>Organization & Personnel Details</Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#006400', 0.02) }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Entity Name" name="entity_name" value={form.entity_name} onChange={handleFormChange} required size="small" />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          select
                          fullWidth
                          label="Fund Cluster (Optional)"
                          name="fund_cluster"
                          value={form.fund_cluster}
                          onChange={handleFormChange}
                          size="small"
                        >
                          <MenuItem value="General Fund">General Fund</MenuItem>
                          <MenuItem value="Special Trust Fund">Special Trust Fund</MenuItem>
                          <MenuItem value="Revolving Fund">Revolving Fund</MenuItem>
                          <MenuItem value="Trust Fund">Trust Fund</MenuItem>
                          <MenuItem value="MDS">MDS</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField select fullWidth label="Location (Office)" name="office_id" value={form.office_id} onChange={handleFormChange} required size="small" disabled={user?.role === 'staff'}>
                          <MenuItem value="">Select Office</MenuItem>
                          {offices.map((office) => (
                            <MenuItem key={office.id} value={office.id}>{office.name}</MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Received From" name="received_from" value={form.received_from} onChange={handleFormChange} required size="small" helperText="E.g. Supply Office or Officer Name" />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Accountable Officer (You)" name="accountable_officer" value={form.accountable_officer} onChange={handleFormChange} required size="small" disabled={user?.role === 'staff'} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Position" name="position" value={form.position} onChange={handleFormChange} required size="small" disabled={user?.role === 'staff'} />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Purpose" name="purpose" value={form.purpose} onChange={handleFormChange} required multiline rows={2} />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6">Items</Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                {form.items.map((item, idx) => (
                  <Grid item xs={12} key={idx}>
                    <Paper sx={{ p: 2, border: "1px solid #e0e0e0" }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Item Name" name="item_name" value={item.item_name} onChange={(e) => handleItemChange(idx, e)} required />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Description" name="description" value={item.description} onChange={(e) => handleItemChange(idx, e)} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField fullWidth label="Quantity" name="quantity" type="number" value={item.quantity} onChange={(e) => handleItemChange(idx, e)} required inputProps={{ min: 1 }} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField fullWidth label="Unit" name="unit" value={item.unit} onChange={(e) => handleItemChange(idx, e)} required />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField fullWidth label="Unit Price" name="unit_cost" type="number" value={item.unit_cost} onChange={(e) => handleItemChange(idx, e)} required inputProps={{ min: 0, step: 0.01 }} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField fullWidth label="Useful Life" name="estimated_useful_life" value={item.estimated_useful_life} onChange={(e) => handleItemChange(idx, e)} placeholder="e.g. 5 years" />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField select fullWidth label="Urgency" name="urgency" value={item.urgency} onChange={(e) => handleItemChange(idx, e)}>
                            <MenuItem value="Low">Low</MenuItem>
                            <MenuItem value="Medium">Medium</MenuItem>
                            <MenuItem value="High">High</MenuItem>
                            <MenuItem value="Critical">Critical</MenuItem>
                          </TextField>
                        </Grid>
                        <Grid item xs={12}>
                          <TextField fullWidth label="Specifications" name="specifications" value={item.specifications} onChange={(e) => handleItemChange(idx, e)} multiline rows={2} />
                        </Grid>
                        {form.items.length > 1 && (
                          <Grid item xs={12}>
                            <Button startIcon={<DeleteIcon />} onClick={() => removeItem(idx)} color="error" size="small">Remove Item</Button>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <Button startIcon={<AddIcon />} onClick={addItem} variant="outlined">Add Another Item</Button>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <PrimaryButton variant="outlined" onClick={() => {
                setDialogOpen(false);
                setForm({
                  office_id: user?.office?.id || "",
                  entity_name: "Mindoro State University (MinSU)",
                  fund_cluster: "General Fund",
                  accountable_officer: user?.name || "",
                  position: user?.role === 'staff' ? 'Staff' : (user?.role || ""),
                  received_from: "Supply Office",
                  purpose: "",
                  form_type: "ics",
                  items: [{ ...defaultItem }]
                });
                setUserOverrodeFormType(false);
                setFormTypeAutoSwitched(false);
              }}>Cancel</PrimaryButton>
              <PrimaryButton type="submit">Submit Request</PrimaryButton>
            </DialogActions>
          </form>
        </Dialog>

        {loading ? (
          <Box sx={{ textAlign: "center", p: 4 }}>
            <Typography variant="h6">Loading your requests...</Typography>
          </Box>
        ) : (
          <>
            {/* All Requests Tab */}
            {tabValue === 0 && (
              <Grid container spacing={3}>
                {requests.length === 0 && borrowRequests.length === 0 ? (
                  <Grid item xs={12}>
                    <Card sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="h6" color="text.secondary">No requests yet</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Create your first request to get started
                      </Typography>
                    </Card>
                  </Grid>
                ) : (
                  <>
                    {requests.map((req) => (
                      <Grid item xs={12} key={`memo-${req.id}`}>
                        <RequestCard
                          req={req}
                          type="memorandum"
                          onDelete={handleDelete}
                          getStatusColor={getStatusColor}
                          getStatusIcon={getStatusIcon}
                          issueMemorandumReceipt={issueMemorandumReceipt}
                          setRequests={setRequests}
                          showSnackbar={showSnackbar}
                        />
                      </Grid>
                    ))}
                    {borrowRequests.map((req) => (
                      <Grid item xs={12} key={`borrow-${req.id}`}>
                        <BorrowRequestCard
                          req={req}
                          getStatusColor={getStatusColor}
                          getStatusIcon={getStatusIcon}
                          borrowerName={user?.name}
                        />
                      </Grid>
                    ))}
                  </>
                )}
              </Grid>
            )}

            {/* Memorandum Receipts Tab */}
            {tabValue === 1 && (
              <Grid container spacing={3}>
                {requests.length === 0 ? (
                  <Grid item xs={12}>
                    <Card sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="h6" color="text.secondary">No memorandum receipts yet</Typography>
                    </Card>
                  </Grid>
                ) : (
                  requests.map((req) => (
                    <Grid item xs={12} key={`memo-${req.id}`}>
                      <RequestCard
                        req={req}
                        type="memorandum"
                        onDelete={handleDelete}
                        getStatusColor={getStatusColor}
                        getStatusIcon={getStatusIcon}
                        issueMemorandumReceipt={issueMemorandumReceipt}
                        setRequests={setRequests}
                        showSnackbar={showSnackbar}
                      />
                    </Grid>
                  ))
                )}
              </Grid>
            )}

            {/* Borrow Requests Tab */}
            {tabValue === 2 && (
              <Grid container spacing={3}>
                {borrowRequests.length === 0 ? (
                  <Grid item xs={12}>
                    <Card sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="h6" color="text.secondary">No borrow requests yet</Typography>
                    </Card>
                  </Grid>
                ) : (
                  borrowRequests.map((req) => (
                    <Grid item xs={12} key={`borrow-${req.id}`}>
                      <BorrowRequestCard
                        req={req}
                        getStatusColor={getStatusColor}
                        getStatusIcon={getStatusIcon}
                        borrowerName={user?.name}
                      />
                    </Grid>
                  ))
                )}
              </Grid>
            )}
          </>
        )}

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </DashboardLayout>
  );
}
