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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Paper,
  Divider,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import OfficeChip from '../components/UI/OfficeChip';
import PrimaryButton from '../components/UI/PrimaryButton';

const defaultItem = {
  item_name: "",
  description: "",
  quantity: 1,
  unit: "",
  estimated_unit_price: 0,
  urgency: "Medium",
  specifications: "",
};

export default function MyRequestsPage() {
  const { user } = useUser();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ office_id: "", purpose: "", items: [{ ...defaultItem }] });
  const [offices, setOffices] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadRequests();
    loadOffices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user?.role === 'staff' && user.office && user.office.id) {
      setForm((f) => ({ ...f, office_id: user.office.id }));
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
      // Request only this user's PRs from backend if supported
      const data = await fetchPurchaseRequests({ requested_by: user?.id });
      const list = Array.isArray(data) ? data : data.data || [];
      // Fallback: ensure only this user's requests are shown
      const my = list.filter((r) => ((r.requestedBy && r.requestedBy.id === user.id) || r.requested_by === user.id));
      setRequests(my);
    } catch (e) {
      setError("Failed to load your purchase requests");
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleItemChange = (idx, e) => {
    const items = [...form.items];
    items[idx][e.target.name] = e.target.value;
    setForm({ ...form, items });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { ...defaultItem }] });
  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await createPurchaseRequest(form);
      // Server returns created purchase_request
      const pr = result.purchase_request || result;
      // If the pr belongs to current user, prepend it
      if ((pr.requestedBy && pr.requestedBy.id === user.id) || pr.requested_by === user.id) {
        setRequests((prev) => [pr, ...prev]);
      }
      setForm({ office_id: "", purpose: "", items: [{ ...defaultItem }] });
      setDialogOpen(false);
      showSnackbar("Purchase request created", "success");
    } catch {
      showSnackbar("Failed to create purchase request", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this purchase request?")) return;
    try {
      await deletePurchaseRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      showSnackbar("Deleted successfully", "success");
    } catch {
      showSnackbar("Failed to delete", "error");
    }
  };

  const showSnackbar = (message, severity) => setSnackbar({ open: true, message, severity });
  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved": return "success";
      case "Rejected": return "error";
      case "Pending": return "warning";
      default: return "default";
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight="700">My Purchase Requests</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="h6" color="text.secondary">Requests you have submitted</Typography>
            {user?.office && <OfficeChip office={user.office} locked />}
          </Box>
        </Box>

        <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <PrimaryButton startIcon={<AddIcon />} onClick={() => setDialogOpen(true)} sx={{ borderRadius: 2 }}>
            New Purchase Request
          </PrimaryButton>
        </Box>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create New Purchase Request</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField select fullWidth label="Office" name="office_id" value={form.office_id} onChange={handleFormChange} required>
                    <MenuItem value="">Select Office</MenuItem>
                    {offices.map((office) => (
                      <MenuItem key={office.id} value={office.id}>{office.name}</MenuItem>
                    ))}
                  </TextField>
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
                          <TextField fullWidth label="Unit Price" name="estimated_unit_price" type="number" value={item.estimated_unit_price} onChange={(e) => handleItemChange(idx, e)} required inputProps={{ min: 0, step: 0.01 }} />
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
              <PrimaryButton variant="outlined" onClick={() => setDialogOpen(false)}>Cancel</PrimaryButton>
              <PrimaryButton type="submit">Submit Request</PrimaryButton>
            </DialogActions>
          </form>
        </Dialog>

        {loading ? (
          <Box sx={{ textAlign: "center", p: 4 }}><Typography variant="h6">Loading your purchase requests...</Typography></Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        ) : (
          <Grid container spacing={3}>
            {requests.map((req) => (
              <Grid item xs={12} key={req.id}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                      <Box>
                        <Typography variant="h6" fontWeight="600" gutterBottom>PR#{req.pr_number}</Typography>
                        <Chip label={req.status} color={getStatusColor(req.status)} size="small" />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">{req.office?.name || req.office_id}</Typography>
                        <Typography variant="body2" color="text.secondary">{new Date(req.created_at).toLocaleString()}</Typography>
                      </Box>
                    </Box>
                    <Typography variant="subtitle1" gutterBottom>{req.purpose}</Typography>
                    <Divider sx={{ my: 2 }} />
                    {req.items && req.items.map((it) => (
                      <Box key={it.id} sx={{ mb: 1 }}>
                        <Typography variant="body2"><strong>{it.item_name}</strong> — {it.quantity} {it.unit} • ₱{(it.estimated_total_price ?? (it.quantity * it.estimated_unit_price)).toFixed(2)}</Typography>
                      </Box>
                    ))}
                    <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                      {/* Allow delete only for Draft status */}
                      {req.status === 'Draft' && (
                        <Button color="error" onClick={() => handleDelete(req.id)}>Delete</Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </DashboardLayout>
  );
}
