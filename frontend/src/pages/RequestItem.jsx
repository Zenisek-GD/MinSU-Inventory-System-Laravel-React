import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { fetchItems } from '../api/item';
import { fetchOffices } from '../api/office';
import { fetchUsers } from '../api/user';
import { createMemorandumReceipt, fetchMemorandumReceipts, signMemorandumReceipt, approveMemorandumReceipt, acceptMemorandumReceipt, exportMRPDF } from '../api/memorandumReceipt';
import { useUser } from '../context/UserContext';
import {
  Box, Card, CardContent, Typography, Grid, Dialog, DialogTitle,
  DialogContent, TextField, MenuItem, DialogActions, Snackbar, Alert, Paper, Divider, Chip,
  FormControl, InputLabel, Select, Avatar, alpha, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  CircularProgress
} from '@mui/material';
import OfficeChip from '../components/UI/OfficeChip';
import PrimaryButton from '../components/UI/PrimaryButton';
import { Add as AddIcon, Description as DescriptionIcon, GetApp as DownloadIcon, CheckCircle as ApproveIcon, Edit as SignIcon } from '@mui/icons-material';
import MemorandumReceiptForm from '../components/MemorandumReceiptForm';

export default function RequestItemPage() {
  const { user } = useUser();
  const [items, setItems] = useState([]);
  const [offices, setOffices] = useState([]);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [selectedForSignature, setSelectedForSignature] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [pageNumber, setPageNumber] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [signatureForm, setSignatureForm] = useState({
    role: '',
    signature_data: '',
  });
  const [form, setForm] = useState({
    office: '',
    accountable_officer: '',
    purpose: '',
    items: [],
    fund_cluster: 'General Fund',
    position: 'Staff',
    received_from: 'Direct Purchase',
    notes: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [itemSearch, setItemSearch] = useState('');
  const [itemPage, setItemPage] = useState(0);
  const [itemRpp, setItemRpp] = useState(10);

  // Enhanced vendor options with icons
  const vendorOptions = [
    { label: '🏪 Local Supplier', value: 'Local Supplier' },
    { label: '🛒 Online Vendor', value: 'Online Vendor' },
    { label: '🏛️ Government Agency', value: 'Government Agency' },
    { label: '💳 Direct Purchase', value: 'Direct Purchase' },
    { label: '🎁 Donation', value: 'Donation' }
  ];

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    // If user is staff, default the office to their assigned office
    if (user?.office) {
      setForm((f) => ({ ...f, office: user.office.name || user.office.office_name }));
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
      const [itemsResp, officesResp, usersResp, requestsResp] = await Promise.all([
        fetchItems(params),
        fetchOffices(),
        fetchUsers(),
        fetchMemorandumReceipts({ requested_by: user?.id })
      ]);
      const itemsList = Array.isArray(itemsResp) ? itemsResp : itemsResp.data || [];
      // Filter: only show items with quantity > 0 and not borrowed
      const availableItems = itemsList.filter(i =>
        (i.quantity ?? 1) > 0 &&
        i.status !== 'Borrowed' &&
        i.status !== 'borrowed'
      );
      // Backend returns array directly for purchase requests
      const requestsList = Array.isArray(requestsResp) ? requestsResp : [];
      setItems(availableItems);
      setOffices(officesResp.data || officesResp || []);
      setUsers(usersResp.data || usersResp || []);
      setRequests(requestsList);
    } catch (e) {
      setItems([]);
      setOffices([]);
      setUsers([]);
      setRequests([]);
    } finally { setLoading(false); }
  };

  const openRequestDialog = (item) => {
    setSelected(item);
    setForm({
      office: user?.office?.name || user?.office?.office_name || '',
      accountable_officer: user?.name || '',
      purpose: `Request for ${item.name}`,
      fund_cluster: 'General Fund',
      position: 'Staff',
      received_from: 'Direct Purchase',
      notes: '',
      items: [{
        item_name: item.name,
        item_type: item.item_type || 'equipment',
        description: item.description || '',
        qty: 1,
        unit: item.unit || 'piece',
        property_number: item.qr_code || '',
        acquisition_date: new Date().toISOString().split("T")[0],
        unit_cost: item.unit_cost || 0,
        total_cost: item.unit_cost || 0,
        condition: 'Good',
        remarks: ''
      }]
    });
    setDialogOpen(true);
  };

  // Create new MR without selecting an item first
  const openNewMRDialog = () => {
    setSelected(null);
    const currentDate = new Date().toISOString().split('T')[0];
    setForm({
      office: user?.office?.name || user?.office?.office_name || '',
      accountable_officer: user?.name || '',
      purpose: '',
      fund_cluster: 'General Fund',
      position: 'Staff',
      received_from: 'Direct Purchase',
      notes: `Prepared by: ${user?.name || 'N/A'} on ${currentDate}`,
      items: []
    });
    setDialogOpen(true);
  };

  const handleItemChange = (idx, e) => {
    const itemsArr = [...form.items];
    const fieldName = e.target.name;
    itemsArr[idx][fieldName] = e.target.value;

    // Auto-calculate total_cost when qty or unit_cost changes
    if (fieldName === 'qty' || fieldName === 'unit_cost') {
      const qty = parseFloat(itemsArr[idx].qty) || 0;
      const unitCost = parseFloat(itemsArr[idx].unit_cost) || 0;
      itemsArr[idx].total_cost = (qty * unitCost).toFixed(2);
    }

    setForm({ ...form, items: itemsArr });
  };

  // Use the form component's handler
  const handleMRSubmit = async (submitData) => {
    try {
      console.log('Submitting MR:', submitData);
      await createMemorandumReceipt(submitData);
      setSnackbar({ open: true, message: 'Memorandum Receipt submitted successfully', severity: 'success' });
      setDialogOpen(false);
      loadAll();
    } catch (err) {
      console.error('MR submission error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to submit request';
      const errors = err.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)[0];
        setSnackbar({ open: true, message: firstError[0] || errorMsg, severity: 'error' });
      } else {
        setSnackbar({ open: true, message: errorMsg, severity: 'error' });
      }
    }
  };

  const handleExportPDF = async (mrId) => {
    try {
      setExporting(true);
      await exportMRPDF(mrId);
      setSnackbar({ open: true, message: 'MR exported successfully', severity: 'success' });
    } catch (err) {
      console.error('Export error:', err);
      setSnackbar({ open: true, message: 'Failed to export MR', severity: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const handleOpenSignatureDialog = (mr) => {
    setSelectedForSignature(mr);
    setSignatureForm({ role: '', signature_data: '' });
    setSignatureDialogOpen(true);
  };

  const handleSignSubmit = async (e) => {
    e.preventDefault();

    if (!signatureForm.role) {
      setSnackbar({ open: true, message: 'Please select your role', severity: 'error' });
      return;
    }

    try {
      await signMemorandumReceipt(selectedForSignature.id, {
        role: signatureForm.role,
        signature_data: signatureForm.signature_data,
      });

      setSnackbar({ open: true, message: 'Approval signed successfully. Staff will be notified.', severity: 'success' });
      setSignatureDialogOpen(false);
      loadAll();
    } catch (err) {
      console.error('Signature error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to sign approval';
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
    }
  };

  const handleApproveMR = async (mrId) => {
    try {
      await approveMemorandumReceipt(mrId);
      setSnackbar({ open: true, message: 'MR approved successfully. Staff will be notified.', severity: 'success' });
      loadAll();
    } catch (err) {
      console.error('Approval error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to approve MR';
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
    }
  };

  const handleAcceptMR = async (mrId) => {
    try {
      await acceptMemorandumReceipt(mrId);
      setSnackbar({ open: true, message: 'MR accepted successfully. Items status updated to Borrowed.', severity: 'success' });
      loadAll();
    } catch (err) {
      console.error('Acceptance error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to accept MR';
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
    }
  };

  const handlePageChange = (event, newPage) => {
    setPageNumber(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPageNumber(0);
  };

  const getSignableRoles = () => {
    const userRole = user?.role?.toLowerCase() || '';
    if (userRole.includes('admin')) {
      return ['Receiver', 'Department Head', 'Principal', 'Finance Officer', 'Director', 'Supply Officer'];
    }
    if (userRole.includes('principal') || userRole.includes('director')) {
      return ['Principal', 'Director'];
    }
    if (userRole.includes('supply') || userRole.includes('officer')) {
      return ['Supply Officer', 'Finance Officer'];
    }
    if (userRole.includes('staff')) {
      return ['Receiver'];
    }
    return ['Receiver'];
  };

  const canSignMR = (mr) => {
    // User can sign if MR is pending signatures and they have appropriate role
    return mr.status === 'Pending Signature' || mr.status === 'Draft';
  };

  const canApproveMR = (mr) => {
    // Only admin and supply officers can approve
    const userRole = user?.role?.toLowerCase() || '';
    return (userRole.includes('admin') || userRole.includes('supply')) && mr.status === 'Approved';
  };

  const canAcceptMR = (mr) => {
    // Only the accountable officer can accept MRs in Approved or Released status
    const userRole = user?.role?.toLowerCase() || '';
    const userName = user?.name || '';
    // Check if user is the accountable officer and MR is in appropriate status
    return (mr.accountable_officer === userName || userRole.includes('admin')) &&
      (mr.status === 'Approved' || mr.status === 'Released');
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: alpha('#006400', 0.1), color: '#006400', width: 48, height: 48 }}>
                <DescriptionIcon />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="700">Request Item</Typography>
                <Typography variant="body2" color="text.secondary">Browse items and create a Memorandum Receipt</Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ 
                bgcolor: '#006400', 
                '&:hover': { bgcolor: '#004d00' },
                borderRadius: 2,
                fontWeight: 700,
                px: 3,
                py: 1.5
              }}
              onClick={openNewMRDialog}
            >
              Create New MR
            </Button>
          </Box>
        </Box>

        {/* ── Browse Available Items Table ─────────────────────────────── */}
        <Box sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6" fontWeight={700}>Available Items</Typography>
            <TextField
              size="small"
              placeholder="Search items…"
              value={itemSearch}
              onChange={e => { setItemSearch(e.target.value); setItemPage(0); }}
              sx={{ width: 240 }}
              InputProps={{ startAdornment: <Box component="span" sx={{ mr: 0.5, color: 'text.disabled', display: 'flex' }}>🔍</Box> }}
            />
          </Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <TableContainer sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: alpha('#006400', 0.06) }}>
                  <TableRow>
                    {['Item Name', 'Category', 'Condition', 'Qty', 'Location', ''].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.6, color: '#006400', py: 1.5 }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items
                    .filter(it =>
                      it.name?.toLowerCase().includes(itemSearch.toLowerCase()) ||
                      it.category?.name?.toLowerCase().includes(itemSearch.toLowerCase())
                    )
                    .slice(itemPage * itemRpp, (itemPage + 1) * itemRpp)
                    .map(it => (
                      <TableRow key={it.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{it.name}</Typography>
                          {it.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {it.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{it.category?.name || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={it.condition || 'Good'} size="small" variant="outlined"
                            color={it.condition === 'Damaged' || it.condition === 'Needs Repair' ? 'warning' : 'success'}
                            sx={{ fontSize: '0.7rem', fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} color="success.main">{it.quantity ?? '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{it.office?.name || '—'}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small" variant="contained"
                            sx={{ bgcolor: '#006400', '&:hover': { bgcolor: '#004d00' }, borderRadius: 1.5, fontSize: '0.73rem', fontWeight: 700, px: 2 }}
                            startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                            onClick={() => openRequestDialog(it)}
                          >
                            Request
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  }
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                        No available items found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]} component="div"
            count={items.filter(it =>
              it.name?.toLowerCase().includes(itemSearch.toLowerCase()) ||
              it.category?.name?.toLowerCase().includes(itemSearch.toLowerCase())
            ).length}
            rowsPerPage={itemRpp} page={itemPage}
            onPageChange={(_, p) => setItemPage(p)}
            onRowsPerPageChange={e => { setItemRpp(+e.target.value); setItemPage(0); }}
          />
        </Box>

        {requests.length > 0 && (
          <Box sx={{ mt: 6 }}>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h5" fontWeight="700" sx={{ mb: 3 }}>Your Memorandum Receipts</Typography>
            <TableContainer sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ backgroundColor: alpha('#006400', 0.08) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#006400' }}>MR Number</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#006400' }}>Purpose</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: '#006400' }}>Items</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#006400' }}>Total Cost</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: '#006400' }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: '#006400' }}>Created Date</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: '#006400' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.slice(pageNumber * rowsPerPage, pageNumber * rowsPerPage + rowsPerPage).map(req => {
                    // Calculate total cost from items
                    const totalCost = req.items?.reduce((sum, item) => sum + (parseFloat(item.total_cost) || 0), 0) || 0;
                    return (
                      <TableRow key={req.id} sx={{ '&:hover': { backgroundColor: alpha('#006400', 0.04) } }}>
                        <TableCell sx={{ fontWeight: 600 }}>MR#{req.mr_number || req.id}</TableCell>
                        <TableCell>{req.purpose}</TableCell>
                        <TableCell align="center">{req.items?.length || 0}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#006400' }}>
                          ₱{totalCost.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={req.status}
                            size="small"
                            color={req.status === 'Released' ? 'success' : req.status === 'Rejected' ? 'error' : 'warning'}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                          {new Date(req.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button
                              size="small"
                              startIcon={<DownloadIcon />}
                              onClick={() => handleExportPDF(req.id)}
                              disabled={exporting}
                              variant="outlined"
                              sx={{ color: '#006400', borderColor: '#006400' }}
                            >
                              Export
                            </Button>
                            {canSignMR(req) && (
                              <Button
                                size="small"
                                startIcon={<SignIcon />}
                                onClick={() => handleOpenSignatureDialog(req)}
                                variant="outlined"
                                sx={{ color: '#006400', borderColor: '#006400' }}
                              >
                                Sign
                              </Button>
                            )}
                            {canApproveMR(req) && (
                              <Button
                                size="small"
                                startIcon={<ApproveIcon />}
                                onClick={() => handleApproveMR(req.id)}
                                variant="contained"
                                sx={{ backgroundColor: '#006400' }}
                              >
                                Approve
                              </Button>
                            )}
                            {canAcceptMR(req) && (
                              <Button
                                size="small"
                                startIcon={<ApproveIcon />}
                                onClick={() => handleAcceptMR(req.id)}
                                variant="contained"
                                sx={{ backgroundColor: '#FFA500' }}
                              >
                                Accept
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={requests.length}
              rowsPerPage={rowsPerPage}
              page={pageNumber}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          </Box>
        )}

        {/* Enhanced MR Request Dialog - Now using reusable component */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ background: 'linear-gradient(135deg, #006400 0%, #004d00 100%)', color: 'white', fontWeight: 700 }}>
            Create Memorandum Receipt
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <MemorandumReceiptForm
              items={items}
              offices={offices}
              users={users}
              onSubmit={handleMRSubmit}
              submitButtonText="Create MR"
              isLoading={false}
              variant="compact"
            />
          </DialogContent>
        </Dialog>

        {/* Signature/Approval Dialog */}
        <Dialog open={signatureDialogOpen} onClose={() => setSignatureDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ background: 'linear-gradient(135deg, #006400 0%, #004d00 100%)', color: 'white', fontWeight: 700 }}>
            Approve Memorandum Receipt
          </DialogTitle>
          <form onSubmit={handleSignSubmit}>
            <DialogContent sx={{ pt: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                MR #{selectedForSignature?.mr_number || selectedForSignature?.id}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Your Role</InputLabel>
                    <Select
                      name="role"
                      value={signatureForm.role}
                      onChange={(e) => setSignatureForm({ ...signatureForm, role: e.target.value })}
                      label="Your Role"
                    >
                      {getSignableRoles().map(role => (
                        <MenuItem key={role} value={role}>{role}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Signature (type your name or draw)"
                    name="signature_data"
                    value={signatureForm.signature_data}
                    onChange={(e) => setSignatureForm({ ...signatureForm, signature_data: e.target.value })}
                    multiline
                    rows={2}
                    placeholder="Type your signature or initials"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="info">
                    Your approval signature will be recorded and staff will be notified automatically after approval.
                  </Alert>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              <PrimaryButton onClick={() => setSignatureDialogOpen(false)} variant="outlined">Cancel</PrimaryButton>
              <PrimaryButton type="submit" sx={{ background: 'linear-gradient(135deg, #006400 0%, #004d00 100%)' }}>
                Sign & Approve
              </PrimaryButton>
            </DialogActions>
          </form>
        </Dialog>

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </DashboardLayout>
  );
}
