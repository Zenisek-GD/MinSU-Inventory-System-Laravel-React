import React, { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Typography,
  Alert,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Avatar,
  alpha,
  Autocomplete,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import { useUser } from '../context/UserContext';

/**
 * MemorandumReceiptForm — Reusable MR Form Component
 * 
 * Features:
 * - ICS/PAR form type toggle based on unit cost threshold (₱50,000)
 * - Professional header information section
 * - Item management with add/edit/delete functionality
 * - Automatic total cost calculation
 * - Comprehensive validation
 * - Consistent styling across staff and admin interfaces
 * 
 * Props:
 * - items: Array of available items for selection
 * - offices: Array of offices
 * - users: Array of users for officer selection
 * - onSubmit: Callback function with form data
 * - submitButtonText: Custom submit button label
 * - isLoading: Loading state for submit button
 * - variant: 'full' (CreateMemorandumReceipt) or 'compact' (RequestItem dialog)
 */
const MemorandumReceiptForm = React.forwardRef(({
  items = [],
  offices = [],
  users = [],
  initialValues = null,
  initialItems = null,
  onSubmit,
  onCancel,
  submitButtonText = 'Create MR',
  isLoading = false,
  variant = 'full'
}, ref) => {
  const PAR_THRESHOLD = 50000;
  const { user } = useUser();
  const isStaffCompact = variant === 'compact' && user?.role === 'staff';

  const itemNameOptions = useMemo(() => items.map((item) => item.name), [items]);

  // Form type tracking
  const [formType, setFormType] = useState('ics');
  const [formTypeAutoSwitched, setFormTypeAutoSwitched] = useState(false);
  const [userOverrodeFormType, setUserOverrodeFormType] = useState(false);

  // Predefined options
  const fundClusters = ['General Fund', 'Special Purpose Fund', 'Restricted Fund'];
  const positions = ['Supply Officer', 'Officer', 'Chief', 'Director', 'Manager', 'Staff'];
  const vendorOptions = [
    { label: '🏪 Local Supplier', value: 'Local Supplier' },
    { label: '🛒 Online Vendor', value: 'Online Vendor' },
    { label: '🏛️ Government Agency', value: 'Government Agency' },
    { label: '💳 Direct Purchase', value: 'Direct Purchase' },
    { label: '🎁 Donation', value: 'Donation' }
  ];
  const units = ['pcs', 'sets', 'units', 'boxes', 'kits', 'pairs', 'reams', 'liters', 'kg', 'meters'];
  const conditions = ['Good', 'Fair', 'Poor', 'Damaged', 'Non-functional'];
  const usefulLifeOptions = [
    '1 year', '2 years', '3 years', '4 years', '5 years',
    '7 years', '10 years', '15 years', '20 years',
  ];

  // Form data state
  const [formData, setFormData] = useState(() => {
    const defaults = {
      entity_name: 'Mindoro State University',
      fund_cluster: 'General Fund',
      office: '',
      accountable_officer: '',
      position: 'Staff',
      date_issued: new Date().toISOString().split('T')[0],
      received_from: 'Direct Purchase',
      purpose: '',
      notes: '',
    };
    return { ...defaults, ...(initialValues || {}) };
  });

  // Items list state
  const [itemsList, setItemsList] = useState(() => {
    if (!Array.isArray(initialItems) || initialItems.length === 0) return [];
    return initialItems.map((item, idx) => ({ ...item, id: idx + 1 }));
  });

  // Item dialog state
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemFormData, setItemFormData] = useState({
    item_id: null,
    item_name: '',
    item_type: 'equipment',
    qty: '',
    unit: 'pcs',
    property_number: '',
    acquisition_date: new Date().toISOString().split('T')[0],
    unit_cost: '',
    condition: 'Good',
    remarks: '',
    estimated_useful_life: '',
  });

  const [error, setError] = useState(null);

  useEffect(() => {
    if (variant !== 'compact') return;
    if (!user) return;

    const userOfficeName = user?.office?.name || user?.office?.office_name || '';
    setFormData((prev) => ({
      ...prev,
      office: prev.office || userOfficeName,
      accountable_officer: prev.accountable_officer || user?.name || '',
    }));
  }, [user, variant]);

  useEffect(() => {
    if (!initialValues) return;
    setFormData((prev) => ({ ...prev, ...initialValues }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialValues || {})]);

  useEffect(() => {
    if (!Array.isArray(initialItems)) return;
    setItemsList(initialItems.map((item, idx) => ({ ...item, id: idx + 1 })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialItems || [])]);

  // Handle main form input change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle item form input change
  const handleItemFormChange = (e) => {
    const { name, value } = e.target;

    // Auto-fill item details from inventory if selecting by name/id
    if (name === 'item_name') {
      const selectedItem = items.find(item => item.name === value || item.id === value);
      if (selectedItem) {
        setItemFormData((prev) => ({
          ...prev,
          item_id: selectedItem.id,
          item_name: selectedItem.name,
          item_type: selectedItem.item_type || prev.item_type || 'equipment',
          unit_cost: selectedItem.unit_cost || 0,
          property_number: selectedItem.qr_code || '',
          unit: selectedItem.unit || 'pcs',
        }));
        // Auto-switch to PAR if item cost is high
        if (!userOverrodeFormType && (selectedItem.unit_cost || 0) >= PAR_THRESHOLD) {
          setFormType('par');
          setFormTypeAutoSwitched(true);
        }
        return;
      }
    }

    const parsed = (name === 'qty' || name === 'unit_cost') ? parseFloat(value) || 0 : value;
    setItemFormData((prev) => ({ ...prev, [name]: parsed }));

    // Auto-detect PAR form if unit cost exceeds threshold
    if (name === 'unit_cost' && !userOverrodeFormType) {
      const cost = parseFloat(value) || 0;
      if (cost >= PAR_THRESHOLD) {
        setFormType('par');
        setFormTypeAutoSwitched(true);
      } else {
        // Re-check if any other items exceed threshold
        const anyAboveThreshold = itemsList.some((item) =>
          item.id !== editingItemId && parseFloat(item.unit_cost) >= PAR_THRESHOLD
        );
        if (!anyAboveThreshold) {
          setFormType('ics');
          setFormTypeAutoSwitched(false);
        }
      }
    }
  };

  // Open item dialog
  const openItemDialog = (item = null) => {
    if (item) {
      setEditingItemId(item.id);
      setItemFormData(item);
    } else {
      setEditingItemId(null);
      const today = new Date().toISOString().split('T')[0];
      setItemFormData({
        item_id: null,
        item_name: '',
        item_type: 'equipment',
        qty: isStaffCompact ? 1 : '',
        unit: 'pcs',
        property_number: '',
        acquisition_date: today,
        unit_cost: '',
        condition: 'Good',
        remarks: '',
        estimated_useful_life: '',
      });
    }
    setItemDialogOpen(true);
  };

  // Close item dialog
  const closeItemDialog = () => {
    setItemDialogOpen(false);
    setEditingItemId(null);
  };

  // Save item (add/update)
  const saveItem = () => {
    if (!itemFormData.item_name || !itemFormData.qty) {
      setError('Item name and quantity are required');
      return;
    }

    const updatedItem = { ...itemFormData };
    if (!updatedItem.property_number) {
      updatedItem.property_number = `TEMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
    let updatedList;

    if (editingItemId) {
      updatedList = itemsList.map((item) =>
        item.id === editingItemId ? { ...updatedItem, id: editingItemId } : item
      );
    } else {
      updatedList = [
        ...itemsList,
        { ...updatedItem, id: Math.max(...itemsList.map((i) => i.id), 0) + 1 },
      ];
    }

    setItemsList(updatedList);

    // Re-evaluate form type if user hasn't manually set it
    if (!userOverrodeFormType) {
      const anyAboveThreshold = updatedList.some(
        (item) => parseFloat(item.unit_cost) >= PAR_THRESHOLD
      );
      setFormType(anyAboveThreshold ? 'par' : 'ics');
      setFormTypeAutoSwitched(anyAboveThreshold);
    }

    closeItemDialog();
    setError(null);
  };

  // Delete item
  const deleteItem = (id) => {
    setItemsList((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculate item total
  const calculateItemTotal = (item) => {
    return (item.qty * item.unit_cost).toFixed(2);
  };

  // Calculate grand total
  const calculateGrandTotal = () => {
    return itemsList
      .reduce((sum, item) => sum + parseFloat(item.qty * item.unit_cost), 0)
      .toFixed(2);
  };

  // Handle submit
  const handleSubmit = () => {
    if (!formData.entity_name || !formData.office || !formData.accountable_officer) {
      setError('Please fill in all required fields');
      return;
    }

    if (itemsList.length === 0) {
      setError('Please add at least one item');
      return;
    }

    const submitData = {
      ...formData,
      form_type: formType,
      items: itemsList.map(({ id, ...rest }) => rest),
    };

    // Staff should not be able to impersonate other users/roles
    if (isStaffCompact) {
      submitData.accountable_officer = user?.name || submitData.accountable_officer;
      submitData.position = 'Staff';
    }

    if (onSubmit) {
      onSubmit(submitData);
    }
  };

  const grandTotal = calculateGrandTotal();

  return (
    <Box ref={ref} sx={{ py: variant === 'compact' ? 0 : 4 }}>
      {variant === 'full' && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: alpha('#006400', 0.1),
                color: '#006400',
                width: 60,
                height: 60
              }}
            >
              <DocumentScannerIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography
                variant="h4"
                component="h1"
                fontWeight={800}
                sx={{
                  fontSize: '2rem',
                  background: 'linear-gradient(135deg, #006400 0%, #004d00 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Create Memorandum Receipt
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Register equipment and materials issued to departments
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* Form Type Selector */}
      {(variant === 'full' || variant === 'compact') && (
        <Card sx={{
          mb: 3,
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: formType === 'par' ? '2px solid #b45309' : '2px solid #006400'
        }}>
          <CardContent sx={{ p: variant === 'compact' ? 2.5 : 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant={variant === 'compact' ? 'body1' : 'h6'} fontWeight={700} sx={{ mb: 0.5 }}>
                  📄 Form Type
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ICS for items below ₱50,000/unit · PAR for ₱50,000 and above
                </Typography>
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
                aria-label="Form type"
                size={variant === 'compact' ? 'medium' : 'large'}
              >
                <ToggleButton
                  value="ics"
                  sx={{
                    fontWeight: 700,
                    px: variant === 'compact' ? 2.5 : 4,
                    borderRadius: '8px 0 0 8px !important',
                    '&.Mui-selected': {
                      bgcolor: alpha('#006400', 0.15),
                      color: '#006400',
                      borderColor: '#006400'
                    }
                  }}
                >
                  📋 ICS
                </ToggleButton>
                <ToggleButton
                  value="par"
                  sx={{
                    fontWeight: 700,
                    px: 4,
                    borderRadius: '0 8px 8px 0 !important',
                    '&.Mui-selected': {
                      bgcolor: alpha('#b45309', 0.12),
                      color: '#b45309',
                      borderColor: '#b45309'
                    }
                  }}
                >
                  🏷️ PAR
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {formTypeAutoSwitched && !userOverrodeFormType && (
              <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                ⚠️ One or more items have a unit cost of ₱50,000 or above — <strong>PAR form</strong> has been automatically selected. You can switch back to ICS manually if needed.
              </Alert>
            )}

            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Chip
                label={formType === 'ics' ? '📋 Inventory Custodian Slip (ICS)' : '🏷️ Property Acknowledgment Receipt (PAR)'}
                sx={{
                  fontWeight: 700,
                  bgcolor: formType === 'par' ? alpha('#b45309', 0.1) : alpha('#006400', 0.1),
                  color: formType === 'par' ? '#b45309' : '#006400',
                  border: `1px solid ${formType === 'par' ? '#b45309' : '#006400'}`,
                }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Header Information Section */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ p: variant === 'compact' ? 2.5 : 4.5 }}>
          {variant === 'full' && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha('#006400', 0.1),
                    color: '#006400',
                  }}
                >
                  <DocumentScannerIcon />
                </Avatar>
                <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.1rem' }}>
                  MR Header Information
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
            </>
          )}

          <Grid container spacing={variant === 'compact' ? 2.5 : 3.5}>
            {/* Entity Name */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Entity Name</InputLabel>
                <Select
                  name="entity_name"
                  value={formData.entity_name}
                  onChange={handleFormChange}
                  label="Entity Name"
                >
                  <MenuItem value="Mindoro State University">Mindoro State University</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Fund Cluster */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Fund Cluster</InputLabel>
                <Select
                  name="fund_cluster"
                  value={formData.fund_cluster}
                  onChange={handleFormChange}
                  label="Fund Cluster"
                >
                  {fundClusters.map((cluster) => (
                    <MenuItem key={cluster} value={cluster}>
                      {cluster}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Office */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Office / Department</InputLabel>
                <Select
                  name="office"
                  value={formData.office}
                  onChange={handleFormChange}
                  label="Office / Department"
                  renderValue={(selected) => {
                    const selectedOffice = offices.find(o => (o.name || o.office_name) === selected);
                    if (!selectedOffice) return selected;
                    const location = [
                      selectedOffice.room_number && `Room ${selectedOffice.room_number}`,
                      selectedOffice.floor && `${selectedOffice.floor}F`,
                      selectedOffice.building
                    ].filter(Boolean).join(', ');
                    return (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {selectedOffice.room_id ? `${selectedOffice.room_id} — ` : ''}{selectedOffice.name || selectedOffice.office_name}
                        </Typography>
                        {location && (
                          <Typography variant="caption" color="text.secondary">
                            📍 {location}
                          </Typography>
                        )}
                      </Box>
                    );
                  }}
                >
                  {offices.map((office) => {
                    const location = [
                      office.room_number && `Room ${office.room_number}`,
                      office.floor && `${office.floor}F`,
                      office.building
                    ].filter(Boolean).join(', ');
                    return (
                      <MenuItem
                        key={office.id}
                        value={office.name || office.office_name}
                        sx={{ whiteSpace: 'normal' }}
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {office.room_id ? `${office.room_id} — ` : ''}{office.name || office.office_name}
                          </Typography>
                          {location && (
                            <Typography variant="caption" color="text.secondary">
                              📍 {location}
                            </Typography>
                          )}
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            {/* Accountable Officer */}
            <Grid item xs={12} sm={6}>
              {isStaffCompact ? (
                <TextField
                  fullWidth
                  required
                  label="Accountable Officer"
                  name="accountable_officer"
                  value={user?.name || formData.accountable_officer}
                  InputProps={{ readOnly: true }}
                  helperText="Automatically set from your account"
                />
              ) : (
                <FormControl fullWidth required>
                  <InputLabel>Accountable Officer</InputLabel>
                  <Select
                    name="accountable_officer"
                    value={formData.accountable_officer}
                    onChange={handleFormChange}
                    label="Accountable Officer"
                    renderValue={(selected) => {
                      const selectedUser = users.find(u => u.name === selected);
                      if (!selectedUser) return selected;
                      return (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {selectedUser.name}
                          </Typography>
                          {selectedUser.role && (
                            <Typography variant="caption" color="text.secondary">
                              👤 {selectedUser.role}
                            </Typography>
                          )}
                        </Box>
                      );
                    }}
                  >
                    {users.map((u) => (
                      <MenuItem
                        key={u.id}
                        value={u.name}
                        sx={{ whiteSpace: 'normal' }}
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {u.name}
                          </Typography>
                          {u.role && (
                            <Typography variant="caption" color="text.secondary">
                              👤 {u.role}
                            </Typography>
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Grid>

            {/* Position */}
            <Grid item xs={12} sm={6}>
              {isStaffCompact ? (
                <TextField
                  fullWidth
                  required
                  label="Position"
                  name="position"
                  value="Staff"
                  InputProps={{ readOnly: true }}
                  helperText="Automatically set from your role"
                />
              ) : (
                <FormControl fullWidth required>
                  <InputLabel>Position</InputLabel>
                  <Select
                    name="position"
                    value={formData.position}
                    onChange={handleFormChange}
                    label="Position"
                  >
                    {positions.map((pos) => (
                      <MenuItem key={pos} value={pos}>
                        {pos}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Grid>

            {/* Date Issued */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date Issued"
                name="date_issued"
                type="date"
                value={formData.date_issued}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            {/* Received From */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Received From</InputLabel>
                <Select
                  name="received_from"
                  value={formData.received_from}
                  onChange={handleFormChange}
                  label="Received From"
                >
                  {vendorOptions.map((vendor) => (
                    <MenuItem key={vendor.value} value={vendor.value}>
                      {vendor.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Purpose */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Purpose"
                name="purpose"
                value={formData.purpose}
                onChange={handleFormChange}
                required
                multiline
                rows={2}
                placeholder="Describe the purpose of this MR..."
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (Optional)"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                multiline
                rows={2}
                placeholder="Additional remarks or notes..."
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Items Section */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ p: variant === 'compact' ? 2.5 : 4.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, mb: variant === 'full' ? 4 : 3 }}>
            <Box>
              {variant === 'full' && (
                <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.1rem' }}>
                  📦 Item Details
                </Typography>
              )}
              {variant === 'compact' && (
                <Typography variant="subtitle2" fontWeight={700}>
                  📦 Items
                </Typography>
              )}
              {variant === 'full' && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Add equipment and materials to this memorandum receipt
                </Typography>
              )}
            </Box>
            <Button
              startIcon={<AddIcon />}
              onClick={() => openItemDialog()}
              sx={{
                bgcolor: '#006400',
                color: 'white',
                '&:hover': { bgcolor: '#004d00' },
                fontWeight: 700,
                fontSize: variant === 'compact' ? '0.75rem' : '0.875rem',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              variant="contained"
              size={variant === 'compact' ? 'small' : 'medium'}
            >
              Add Item
            </Button>
          </Box>
          {variant === 'full' && (
            <Divider sx={{ mb: 4 }} />
          )}

          <TableContainer sx={{ border: '1px solid #e0e0e0', borderRadius: 2, mb: 3 }}>
            <Table size={variant === 'compact' ? 'small' : 'medium'}>
              <TableHead sx={{ backgroundColor: alpha('#006400', 0.08) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#006400' }}>Item Name</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#006400' }}>Qty</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#006400' }}>Unit</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#006400' }}>Unit Cost</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#006400' }}>Total Cost</TableCell>
                  {variant === 'full' && (
                    <>
                      <TableCell sx={{ fontWeight: 700, color: '#006400' }}>Property #</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#006400' }}>Condition</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: '#006400' }}>Actions</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {itemsList.map((item) => (
                  <TableRow key={item.id} sx={{ '&:hover': { backgroundColor: alpha('#006400', 0.04) } }}>
                    <TableCell sx={{ fontWeight: 500 }}>{item.item_name}</TableCell>
                    <TableCell align="center">{item.qty}</TableCell>
                    <TableCell align="center">{item.unit}</TableCell>
                    <TableCell align="right">₱{parseFloat(item.unit_cost).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#006400' }}>
                      ₱{parseFloat(calculateItemTotal(item)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    {variant === 'full' && (
                      <>
                        <TableCell>{item.property_number}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.condition}
                            size="small"
                            variant="outlined"
                            color={item.condition === 'Good' ? 'success' : item.condition === 'Fair' ? 'warning' : 'error'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => openItemDialog(item)}
                            sx={{ color: '#006400' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => deleteItem(item.id)}
                            sx={{ color: '#d32f2f' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Grand Total */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, bgcolor: alpha('#006400', 0.05), borderRadius: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Grand Total:
              </Typography>
              <Typography variant="h6" fontWeight={700} color="#006400" sx={{ fontSize: '.85rem' }}>
                ₱{parseFloat(grandTotal).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Box>

          {itemsList.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No items added yet. Click "Add Item" to get started.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Item Dialog */}
      <Dialog open={itemDialogOpen} onClose={closeItemDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { mt: 2 } }}>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #006400 0%, #004d00 100%)', color: 'white', fontWeight: 700, fontSize: '1.4rem', py: 3, pb: 3 }}>
          {editingItemId ? '✏️ Edit Item' : '➕ Add New Item'}
        </DialogTitle>
        <DialogContent sx={{ pt: 4, pb: 4, px: 4 }}>
          <Grid container spacing={3.5} sx={{ mt: 1 }}>
            {/* Item Name - with Autocomplete for free text entry */}
            <Grid item xs={12}>
              <Autocomplete
                freeSolo={!isStaffCompact}
                options={itemNameOptions}
                value={itemFormData.item_name}
                onChange={(event, newValue) => {
                  handleItemFormChange({ target: { name: 'item_name', value: newValue || '' } });
                }}
                inputValue={itemFormData.item_name}
                onInputChange={(event, newInputValue) => {
                  handleItemFormChange({ target: { name: 'item_name', value: newInputValue } });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Item Name"
                    placeholder={isStaffCompact ? 'Select an available item' : 'Select or type item name'}
                    required
                    fullWidth
                    helperText={isStaffCompact ? 'Staff can only select from available items' : ''}
                  />
                )}
              />
            </Grid>

            {/* Item Type */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Item Type</InputLabel>
                <Select
                  name="item_type"
                  value={itemFormData.item_type}
                  onChange={handleItemFormChange}
                  label="Item Type"
                  disabled={isStaffCompact && !!itemFormData.item_id}
                >
                  <MenuItem value="equipment">Equipment</MenuItem>
                  <MenuItem value="consumable">Consumable</MenuItem>
                  <MenuItem value="supply">Supply</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Quantity */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity"
                name="qty"
                type="number"
                value={itemFormData.qty}
                onChange={handleItemFormChange}
                inputProps={{ min: 1, step: 1 }}
                required
              />
            </Grid>

            {/* Unit */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Unit</InputLabel>
                <Select
                  name="unit"
                  value={itemFormData.unit}
                  onChange={handleItemFormChange}
                  label="Unit"
                  disabled={isStaffCompact && !!itemFormData.item_id}
                >
                  {units.map((u) => (
                    <MenuItem key={u} value={u}>
                      {u}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Unit Cost */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unit Cost (₱)"
                name="unit_cost"
                type="number"
                value={itemFormData.unit_cost}
                onChange={handleItemFormChange}
                inputProps={{ min: 0, step: 0.01 }}
                required
                disabled={isStaffCompact && !!itemFormData.item_id}
                helperText={isStaffCompact && !!itemFormData.item_id ? 'Auto-filled from inventory item' : ''}
              />
            </Grid>

            {/* Property Number (for equipment) */}
            <Grid item xs={12} sm={6}>
              {isStaffCompact ? (
                <TextField
                  fullWidth
                  label="Property Number"
                  name="property_number"
                  value={itemFormData.property_number || 'Auto-generated on save'}
                  InputProps={{ readOnly: true }}
                  helperText={itemFormData.item_id ? 'From selected inventory item' : 'Automatically generated'}
                />
              ) : (
                <TextField
                  fullWidth
                  label="Property Number"
                  name="property_number"
                  value={itemFormData.property_number}
                  onChange={handleItemFormChange}
                  required={itemFormData.item_type === 'equipment'}
                  error={itemFormData.item_type === 'equipment' && !itemFormData.property_number}
                  helperText={itemFormData.item_type === 'equipment' && !itemFormData.property_number ? 'Required for equipment' : ''}
                />
              )}
            </Grid>

            {/* Acquisition Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Acquisition Date"
                name="acquisition_date"
                type="date"
                value={itemFormData.acquisition_date}
                onChange={handleItemFormChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Condition */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Condition</InputLabel>
                <Select
                  name="condition"
                  value={itemFormData.condition}
                  onChange={handleItemFormChange}
                  label="Condition"
                >
                  {conditions.map((cond) => (
                    <MenuItem key={cond} value={cond}>
                      {cond}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Estimated Useful Life */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Estimated Useful Life</InputLabel>
                <Select
                  name="estimated_useful_life"
                  value={itemFormData.estimated_useful_life}
                  onChange={handleItemFormChange}
                  label="Estimated Useful Life"
                >
                  <MenuItem value="">-- Not specified --</MenuItem>
                  {usefulLifeOptions.map((life) => (
                    <MenuItem key={life} value={life}>
                      {life}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Remarks */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                name="remarks"
                value={itemFormData.remarks}
                onChange={handleItemFormChange}
                multiline
                rows={2}
                placeholder="Additional remarks about this item..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 4, gap: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={closeItemDialog} variant="outlined" sx={{ flex: 1, p: 1.5, fontSize: '1rem', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={saveItem} variant="contained" sx={{ bgcolor: '#006400', '&:hover': { bgcolor: '#004d00' }, flex: 1, p: 1.5, fontSize: '1rem', fontWeight: 700 }}>
            {editingItemId ? 'Update Item' : 'Add Item'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit Button */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 5 }}>
        <Button
          variant="outlined"
          sx={{ borderColor: '#999', color: '#666', p: 1.5, fontSize: '1rem', fontWeight: 600 }}
          onClick={() => {
            if (typeof onCancel === 'function') {
              onCancel();
              return;
            }
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          sx={{
            bgcolor: '#006400',
            '&:hover': { bgcolor: '#004d00' },
            fontWeight: 700,
            px: 5,
            p: 1.5,
            fontSize: '1rem'
          }}
          onClick={handleSubmit}
          disabled={isLoading || itemsList.length === 0}
        >
          {isLoading ? 'Submitting...' : submitButtonText}
        </Button>
      </Box>
    </Box>
  );
});

MemorandumReceiptForm.displayName = 'MemorandumReceiptForm';

export default MemorandumReceiptForm;
