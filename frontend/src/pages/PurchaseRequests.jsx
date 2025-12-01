import React, { useEffect, useState } from "react";
import {
  fetchPurchaseRequests,
  createPurchaseRequest,
  deletePurchaseRequest,
  updatePurchaseRequest,
} from "../api/purchaseRequest";
import DashboardLayout from "../components/Layout/DashboardLayout";
import { fetchOffices } from "../api/office";
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
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Inventory as InventoryIcon,
  Business as OfficeIcon,
  Person as PersonIcon,
  PriorityHigh as UrgencyIcon,
} from "@mui/icons-material";

const defaultItem = {
  item_name: "",
  description: "",
  quantity: 1,
  unit: "",
  estimated_unit_price: 0,
  urgency: "Medium",
  specifications: "",
};

const PurchaseRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    office_id: "",
    purpose: "",
    items: [{ ...defaultItem }],
  });
  const [offices, setOffices] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [rejectingRequestId, setRejectingRequestId] = useState(null);
  const { user } = useUser();

  useEffect(() => {
    loadRequests();
    loadOffices();
  }, []);

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
      const data = await fetchPurchaseRequests();
      setRequests(data);
    } catch {
      setError("Failed to load purchase requests");
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
  };

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { ...defaultItem }] });
  };

  const removeItem = (idx) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await createPurchaseRequest(form);
      setRequests((prev) => [result.purchase_request, ...prev]);
      setForm({ office_id: "", purpose: "", items: [{ ...defaultItem }] });
      setDialogOpen(false);
      showSnackbar("Purchase request created successfully", "success");
    } catch {
      showSnackbar("Failed to create purchase request", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this purchase request?")) return;
    try {
      await deletePurchaseRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      showSnackbar("Purchase request deleted successfully", "success");
    } catch {
      showSnackbar("Failed to delete purchase request", "error");
    }
  };

  const handleStatusUpdate = async (id, status) => {
    if (status === "Rejected") {
      // Show dialog to get rejection notes
      setRejectingRequestId(id);
      setRejectNotes("");
      setRejectDialogOpen(true);
      return;
    }
    
    try {
      await updatePurchaseRequest(id, { status });
      setRequests((prev) => prev.map(r => r.id === id ? { ...r, status } : r));
      showSnackbar(`Request ${status.toLowerCase()} successfully`, "success");
    } catch {
      showSnackbar(`Failed to ${status.toLowerCase()} request`, "error");
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectNotes.trim()) {
      showSnackbar("Please provide rejection notes", "error");
      return;
    }
    
    try {
      await updatePurchaseRequest(rejectingRequestId, { status: "Rejected", notes: rejectNotes });
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
    switch (status) {
      case "Approved": return "success";
      case "Rejected": return "error";
      case "Pending": return "warning";
      default: return "default";
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "Critical": return "error";
      case "High": return "warning";
      case "Medium": return "info";
      case "Low": return "success";
      default: return "default";
    }
  };

  const calculateItemTotal = (item) => {
    return (item.quantity * item.estimated_unit_price).toFixed(2);
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight="700">
            Purchase Requests
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage and track purchase requisitions
          </Typography>
        </Box>

        {/* Action Bar */}
        <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            New Purchase Request
          </Button>
        </Box>

        {/* Create Request Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={() => setDialogOpen(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight="600">
              Create New Purchase Request
            </Typography>
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Office"
                    name="office_id"
                    value={form.office_id}
                    onChange={handleFormChange}
                    required
                  >
                    <MenuItem value="">Select Office</MenuItem>
                    {offices.map((office) => (
                      <MenuItem key={office.id} value={office.id}>
                        {office.name}
                      </MenuItem>
                    ))}
                  </TextField>
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
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Items
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                {form.items.map((item, idx) => (
                  <Grid item xs={12} key={idx}>
                    <Paper sx={{ p: 2, border: "1px solid #e0e0e0" }}>
                      <Grid container spacing={2}>
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
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Description"
                            name="description"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, e)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            label="Quantity"
                            name="quantity"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, e)}
                            required
                            inputProps={{ min: 1 }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            label="Unit"
                            name="unit"
                            value={item.unit}
                            onChange={(e) => handleItemChange(idx, e)}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            label="Unit Price"
                            name="estimated_unit_price"
                            type="number"
                            value={item.estimated_unit_price}
                            onChange={(e) => handleItemChange(idx, e)}
                            required
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            select
                            fullWidth
                            label="Urgency"
                            name="urgency"
                            value={item.urgency}
                            onChange={(e) => handleItemChange(idx, e)}
                          >
                            <MenuItem value="Low">Low</MenuItem>
                            <MenuItem value="Medium">Medium</MenuItem>
                            <MenuItem value="High">High</MenuItem>
                            <MenuItem value="Critical">Critical</MenuItem>
                          </TextField>
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Specifications"
                            name="specifications"
                            value={item.specifications}
                            onChange={(e) => handleItemChange(idx, e)}
                            multiline
                            rows={2}
                          />
                        </Grid>
                        {form.items.length > 1 && (
                          <Grid item xs={12}>
                            <Button
                              startIcon={<DeleteIcon />}
                              onClick={() => removeItem(idx)}
                              color="error"
                              size="small"
                            >
                              Remove Item
                            </Button>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={addItem}
                    variant="outlined"
                  >
                    Add Another Item
                  </Button>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="contained">
                Submit Request
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Requests List */}
        {loading ? (
          <Box sx={{ textAlign: "center", p: 4 }}>
            <Typography variant="h6">Loading purchase requests...</Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {requests.map((req) => (
              <Grid item xs={12} key={req.id}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                      <Box>
                        <Typography variant="h6" fontWeight="600" gutterBottom>
                          PR#{req.pr_number}
                        </Typography>
                        <Chip 
                          label={req.status} 
                          color={getStatusColor(req.status)}
                          size="small"
                        />
                      </Box>
                      <Typography variant="h6" color="primary.main" fontWeight="600">
                        ₱{req.total_estimated_cost}
                      </Typography>
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                          <OfficeIcon color="action" fontSize="small" />
                          <Typography variant="body2">
                            {req.office?.name || offices.find(o => o.id === req.office_id)?.name || req.office_id}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                          <PersonIcon color="action" fontSize="small" />
                          <Typography variant="body2">
                            {typeof req.requested_by === 'object' ? req.requested_by.name : req.requested_by}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Purpose:
                        </Typography>
                        <Typography variant="body2">
                          {req.purpose}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                      Requested Items
                    </Typography>
                    <List dense>
                      {req.items?.map((item) => (
                        <ListItem key={item.id} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <InventoryIcon color="action" />
                          </ListItemIcon>
                          <Box sx={{ width: "100%", py: 1 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                              <Typography variant="body2" fontWeight="500">
                                {item.item_name}
                              </Typography>
                              <Chip
                                label={item.urgency}
                                color={getUrgencyColor(item.urgency)}
                                size="small"
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {item.description} • {item.quantity} {item.unit}
                            </Typography>
                            <Typography variant="body2" color="primary.main" fontWeight="500">
                              ₱{calculateItemTotal(item)} 
                              <Typography component="span" variant="body2" color="text.secondary">
                                {" "}(₱{item.estimated_unit_price} per unit)
                              </Typography>
                            </Typography>
                            {item.specifications && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                                Specs: {item.specifications}
                              </Typography>
                            )}
                          </Box>
                        </ListItem>
                      ))}
                    </List>

                    <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
                      {req.status === "Pending" && user?.role === "supply_officer" && (
                        <>
                          <Button
                            startIcon={<ApproveIcon />}
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => handleStatusUpdate(req.id, "Approved")}
                          >
                            Approve
                          </Button>
                          <Button
                            startIcon={<RejectIcon />}
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleStatusUpdate(req.id, "Rejected")}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        startIcon={<DeleteIcon />}
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleDelete(req.id)}
                        sx={{ ml: "auto" }}
                      >
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 600 }}>
            Reject Purchase Request
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Are you sure you want to reject this purchase request?
            </Alert>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Rejection Notes"
              placeholder="Explain why this request is being rejected..."
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleConfirmReject}
              variant="contained" 
              color="error"
            >
              Reject Request
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default PurchaseRequestsPage;
