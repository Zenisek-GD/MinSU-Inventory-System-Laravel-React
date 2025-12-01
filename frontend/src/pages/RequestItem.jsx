import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { fetchItems } from '../api/item';
import { fetchOffices } from '../api/office';
import { createPurchaseRequest, fetchPurchaseRequests } from '../api/purchaseRequest';
import { useUser } from '../context/UserContext';
import {
  Box, Card, CardContent, Typography, Grid, Dialog, DialogTitle,
  DialogContent, TextField, MenuItem, DialogActions, Snackbar, Alert, Paper, Divider, Chip
} from '@mui/material';
import OfficeChip from '../components/UI/OfficeChip';
import PrimaryButton from '../components/UI/PrimaryButton';
import { Add as AddIcon } from '@mui/icons-material';

export default function RequestItemPage(){
  const { user } = useUser();
  const [items, setItems] = useState([]);
  const [offices, setOffices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ office_id: '', purpose: '', items: [] });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    // If user is staff, default the office_id to their assigned office and lock it
    if (user?.role === 'staff' && user.office && user.office.id) {
      setForm((f) => ({ ...f, office_id: user.office.id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const location = useLocation();

  // If navigated here with an itemId in state, auto-open the dialog for that item
  useEffect(() => {
    if (!location?.state?.itemId) return;
    const itemId = location.state.itemId;
    const found = items.find(i => i.id === itemId);
    if (found) {
      openRequestDialog(found);
    } else {
      // If items not loaded yet, wait until loadAll completes
      const unwatch = setTimeout(() => {
        const f = items.find(i => i.id === itemId);
        if (f) openRequestDialog(f);
      }, 300);
      return () => clearTimeout(unwatch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, items]);

  const loadAll = async () => {
    setLoading(true);
    try {
      // Limit items to the user's office (if available) so staff see relevant items
      const params = {};
      if (user && user.office && user.office.id) params.office_id = user.office.id;
      const [itemsResp, officesResp, requestsResp] = await Promise.all([fetchItems(params), fetchOffices(), fetchPurchaseRequests({ requested_by: user?.id })]);
      const itemsList = Array.isArray(itemsResp) ? itemsResp : itemsResp.data || [];
      // Backend returns array directly for purchase requests
      const requestsList = Array.isArray(requestsResp) ? requestsResp : [];
      setItems(itemsList);
      setOffices(officesResp.data || []);
      setRequests(requestsList);
    } catch (e) {
      setItems([]);
      setOffices([]);
      setRequests([]);
    } finally { setLoading(false); }
  };

  const openRequestDialog = (item) => {
    setSelected(item);
    setForm({ office_id: item.office_id || '', purpose: `Request for ${item.name}`, items: [{
      item_name: item.name,
      description: item.description || '',
      quantity: 1,
      unit: item.unit || '',
      estimated_unit_price: item.purchase_price || 0,
      urgency: 'Medium',
      specifications: ''
    }] });
    setDialogOpen(true);
  };

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleItemChange = (idx, e) => {
    const itemsArr = [...form.items];
    itemsArr[idx][e.target.name] = e.target.value;
    setForm({ ...form, items: itemsArr });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createPurchaseRequest(form);
      setSnackbar({ open: true, message: 'Request submitted', severity: 'success' });
      setDialogOpen(false);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to submit request', severity: 'error' });
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="700">Request Item</Typography>
          <Typography variant="body2" color="text.secondary">Browse items and submit a purchase request for any item.</Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            {user?.office && <OfficeChip office={user.office} locked sx={{ mb: 2 }} />}
          </Grid>
          {items.map(it => (
            <Grid item xs={12} md={4} key={it.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="600">{it.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{it.description}</Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <PrimaryButton variant="outlined" size="small" onClick={() => openRequestDialog(it)} startIcon={<AddIcon />}>Request</PrimaryButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Display user's purchase requests */}
        {requests.length > 0 && (
          <Box sx={{ mt: 6 }}>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h5" fontWeight="700" sx={{ mb: 2 }}>Your Purchase Requests</Typography>
            <Grid container spacing={2}>
              {requests.map(req => (
                <Grid item xs={12} md={6} key={req.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" fontWeight="600">PR#{req.pr_number}</Typography>
                        <Chip label={req.status} size="small" color={req.status === 'Approved' ? 'success' : req.status === 'Rejected' ? 'error' : 'warning'} />
                      </Box>
                      <Typography variant="body2" color="text.secondary">{req.purpose}</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>Items: {req.items?.length || 0}</Typography>
                      <Typography variant="caption" color="text.secondary">Created: {new Date(req.created_at).toLocaleDateString()}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Request Item</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <TextField select fullWidth label="Office" name="office_id" value={form.office_id} onChange={handleFormChange} required sx={{ mb: 2 }}>
                <MenuItem value="">Select Office</MenuItem>
                {offices.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
              </TextField>
              <TextField fullWidth label="Purpose" name="purpose" value={form.purpose} onChange={handleFormChange} required sx={{ mb: 2 }} />

              {form.items.map((it, idx) => (
                <Paper key={idx} sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle1"><strong>{it.item_name}</strong></Typography>
                  <TextField fullWidth label="Quantity" name="quantity" type="number" value={it.quantity} onChange={(e) => handleItemChange(idx, e)} inputProps={{ min:1 }} sx={{ mt:1 }} />
                  <TextField fullWidth label="Urgency" name="urgency" value={it.urgency} onChange={(e) => handleItemChange(idx, e)} sx={{ mt:1 }} />
                </Paper>
              ))}
            </DialogContent>
            <DialogActions>
              <PrimaryButton onClick={() => setDialogOpen(false)} variant="outlined">Cancel</PrimaryButton>
              <PrimaryButton type="submit">Submit Request</PrimaryButton>
            </DialogActions>
          </form>
        </Dialog>

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({...snackbar, open:false})}>
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </DashboardLayout>
  );
}
