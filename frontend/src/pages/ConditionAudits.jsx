import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  useTheme,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Rating,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  MoreVert as MoreIcon,
  Info as InfoIcon,
  Build as MaintenanceIcon,
  Assignment as AuditIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { useUser } from '../context/UserContext';
import { fetchItems } from '../api/item';
import { fetchAudits, createAudit, updateAudit, deleteAudit } from '../api/conditionAudit';

const CONDITION_OPTIONS = [
  'Excellent',
  'Good',
  'Fair',
  'Needs Repair',
  'Damaged',
  'Disposed'
];

const getConditionColor = (condition) => {
  const colors = {
    'Excellent': 'success',
    'Good': 'success',
    'Fair': 'warning',
    'Needs Repair': 'warning',
    'Damaged': 'error',
    'Disposed': 'error',
  };
  return colors[condition] || 'default';
};

const getConditionIcon = (condition) => {
  if (condition === 'Excellent' || condition === 'Good') {
    return <CheckIcon sx={{ fontSize: 16 }} />;
  }
  if (condition === 'Fair') {
    return <InfoIcon sx={{ fontSize: 16 }} />;
  }
  return <WarningIcon sx={{ fontSize: 16 }} />;
};

const ConditionAuditsPage = () => {
  const theme = useTheme();
  const { user } = useUser();
  const [audits, setAudits] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({
    audit_year: new Date().getFullYear(),
    condition: '',
    search: ''
  });
  const [form, setForm] = useState({
    item_id: '',
    audit_year: new Date().getFullYear(),
    condition: 'Good',
    remarks: '',
    recommendations: '',
    next_audit_date: '',
  });

  useEffect(() => {
    loadItems();
    loadAudits();
  }, []);

  const loadItems = async () => {
    try {
      const data = await fetchItems({});
      setItems(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Error loading items:', err);
      setItems([]);
    }
  };

  const loadAudits = async () => {
    setLoading(true);
    try {
      const year = filters.audit_year || new Date().getFullYear();
      const params = { audit_year: year };
      if (filters.condition) params.condition = filters.condition;
      const data = await fetchAudits(params);
      setAudits(Array.isArray(data) ? data : data?.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load audits');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (audit = null) => {
    if (audit) {
      setEditingId(audit.id);
      setForm({
        item_id: audit.item_id,
        audit_year: audit.audit_year,
        condition: audit.condition,
        remarks: audit.remarks || '',
        recommendations: audit.recommendations || '',
        next_audit_date: audit.next_audit_date || '',
      });
    } else {
      setEditingId(null);
      setForm({
        item_id: '',
        audit_year: new Date().getFullYear(),
        condition: 'Good',
        remarks: '',
        recommendations: '',
        next_audit_date: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.item_id) {
      setError('Please select an item');
      return;
    }

    try {
      if (editingId) {
        await updateAudit(editingId, form);
      } else {
        await createAudit(form);
      }
      await loadAudits();
      handleCloseDialog();
      setError(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save audit';
      setError(msg);
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this audit?')) {
      try {
        await deleteAudit(id);
        await loadAudits();
      } catch (err) {
        setError('Failed to delete audit');
      }
    }
  };

  const filteredAudits = audits.filter(audit => {
    if (filters.audit_year && audit.audit_year !== parseInt(filters.audit_year)) {
      return false;
    }
    if (filters.condition && audit.condition !== filters.condition) {
      return false;
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        audit.item?.name?.toLowerCase().includes(searchLower) ||
        audit.item?.serial_number?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const stats = {
    total: audits.length,
    excellent: audits.filter(a => a.condition === 'Excellent').length,
    good: audits.filter(a => a.condition === 'Good').length,
    needsRepair: audits.filter(a => a.condition === 'Needs Repair').length,
    damaged: audits.filter(a => a.condition === 'Damaged').length,
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'grey.50', minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h4" fontWeight={800} gutterBottom
                sx={{
                  color: 'text.primary',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Item Condition Audits
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Track annual equipment condition audits and maintenance records
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Tooltip title="Refresh audits">
                <IconButton
                  onClick={loadAudits}
                  sx={{
                    bgcolor: 'action.hover',
                    '&:hover': { bgcolor: 'primary.light' }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                New Audit
              </Button>
            </Stack>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={6} sm={2.4}>
              <Paper sx={{
                p: 2,
                borderRadius: 2,
                textAlign: 'center',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.3)
              }}>
                <Typography variant="h4" fontWeight={800} color="primary.main">
                  {stats.total}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Audits
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={2.4}>
              <Paper sx={{
                p: 2,
                borderRadius: 2,
                textAlign: 'center',
                bgcolor: alpha('#4caf50', 0.1),
                border: '1px solid',
                borderColor: alpha('#4caf50', 0.3)
              }}>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#4caf50' }}>
                  {stats.excellent}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Excellent
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
                <Typography variant="h4" fontWeight={800} color="success.main">
                  {stats.good}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Good Condition
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={2.4}>
              <Paper sx={{
                p: 2,
                borderRadius: 2,
                textAlign: 'center',
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                border: '1px solid',
                borderColor: alpha(theme.palette.warning.main, 0.3)
              }}>
                <Typography variant="h4" fontWeight={800} color="warning.main">
                  {stats.needsRepair}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Needs Repair
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
                <Typography variant="h4" fontWeight={800} color="error.main">
                  {stats.damaged}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Damaged
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Filters Card */}
        <Card elevation={0} sx={{
          mb: 4,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          bgcolor: alpha(theme.palette.primary.main, 0.02)
        }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AuditIcon /> Audit Filters
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Audit Year"
                  value={filters.audit_year}
                  onChange={(e) => setFilters(prev => ({ ...prev, audit_year: e.target.value }))}
                  size="small"
                >
                  {[2024, 2025, 2026, 2027].map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Condition"
                  value={filters.condition}
                  onChange={(e) => setFilters(prev => ({ ...prev, condition: e.target.value }))}
                  size="small"
                >
                  <MenuItem value="">All Conditions</MenuItem>
                  {CONDITION_OPTIONS.map(cond => (
                    <MenuItem key={cond} value={cond}>{cond}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search by item name or serial number..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  size="small"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Audits Table */}
        <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Serial Number</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Audit Year</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Condition</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Next Audit</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredAudits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">
                        No audits found. {audits.length === 0 ? 'Create your first audit.' : 'Try adjusting filters.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAudits.map(audit => (
                    <TableRow key={audit.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {audit.item?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                          {audit.item?.serial_number || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{audit.audit_year}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getConditionIcon(audit.condition)}
                          label={audit.condition}
                          color={getConditionColor(audit.condition)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {audit.next_audit_date ? (
                          new Date(audit.next_audit_date).toLocaleDateString()
                        ) : (
                          <Typography variant="caption" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(audit)}
                            sx={{ color: 'primary.main' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(audit.id)}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Audit Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, bgcolor: 'primary.light' }}>
            {editingId ? 'Edit Audit' : 'Create New Audit'}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Stack spacing={3}>
              <TextField
                select
                fullWidth
                label="Item *"
                name="item_id"
                value={form.item_id}
                onChange={handleFormChange}
              >
                {items.map(item => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name} ({item.serial_number || 'No S/N'})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                type="number"
                label="Audit Year *"
                name="audit_year"
                value={form.audit_year}
                onChange={handleFormChange}
                inputProps={{ min: 2020, max: 2030 }}
              />

              <TextField
                select
                fullWidth
                label="Item Condition *"
                name="condition"
                value={form.condition}
                onChange={handleFormChange}
              >
                {CONDITION_OPTIONS.map(cond => (
                  <MenuItem key={cond} value={cond}>{cond}</MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Remarks"
                name="remarks"
                value={form.remarks}
                onChange={handleFormChange}
                placeholder="Note any observations about the item's condition..."
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Recommendations"
                name="recommendations"
                value={form.recommendations}
                onChange={handleFormChange}
                placeholder="Suggest any maintenance, repairs, or replacement..."
              />

              <TextField
                fullWidth
                type="date"
                label="Next Audit Date"
                name="next_audit_date"
                value={form.next_audit_date}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              sx={{ borderRadius: 1 }}
            >
              {editingId ? 'Update Audit' : 'Create Audit'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default ConditionAuditsPage;
