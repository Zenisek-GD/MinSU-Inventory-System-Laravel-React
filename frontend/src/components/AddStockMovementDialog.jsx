import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  FormHelperText
} from '@mui/material';
import { createStockMovement } from '../api/stockMovement';
import { fetchItems } from '../api/item';
import { fetchOffices } from '../api/office';

const MOVEMENT_TYPES = [
  { value: 'purchase', label: 'Purchase', requiresOffices: false, quantitySign: '+' },
  { value: 'transfer', label: 'Transfer', requiresOffices: true, quantitySign: '' },
  { value: 'adjustment', label: 'Adjustment', requiresOffices: false, quantitySign: '±' },
  { value: 'damage', label: 'Damage', requiresOffices: false, quantitySign: '-' },
  { value: 'disposal', label: 'Disposal', requiresOffices: false, quantitySign: '-' }
];

export default function AddStockMovementDialog({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [offices, setOffices] = useState([]);
  
  const [formData, setFormData] = useState({
    item_id: '',
    type: '',
    quantity: '',
    from_office_id: '',
    to_office_id: '',
    reference_number: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      const [itemsRes, officesRes] = await Promise.all([
        fetchItems(),
        fetchOffices()
      ]);
      // Ensure we have arrays
      const itemsList = Array.isArray(itemsRes) ? itemsRes : (itemsRes?.data || []);
      const officesList = Array.isArray(officesRes) ? officesRes : (officesRes?.data || []);
      
      setItems(itemsList);
      setOffices(officesList);
    } catch (err) {
      setError('Failed to load items and offices');
      setItems([]);
      setOffices([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.item_id) newErrors.item_id = 'Item is required';
    if (!formData.type) newErrors.type = 'Movement type is required';
    if (!formData.quantity || formData.quantity === '0') {
      newErrors.quantity = 'Quantity is required and cannot be zero';
    }

    const selectedType = MOVEMENT_TYPES.find(t => t.value === formData.type);
    
    // Validate offices for transfer
    if (selectedType?.requiresOffices) {
      if (!formData.from_office_id) newErrors.from_office_id = 'From office is required for transfers';
      if (!formData.to_office_id) newErrors.to_office_id = 'To office is required for transfers';
      if (formData.from_office_id === formData.to_office_id) {
        newErrors.to_office_id = 'From and To offices must be different';
      }
    }

    // Notes required for adjustment
    if (formData.type === 'adjustment' && !formData.notes) {
      newErrors.notes = 'Notes are required for adjustments';
    }

    // Validate quantity sign based on type
    const qty = parseFloat(formData.quantity);
    if (formData.type === 'purchase' && qty <= 0) {
      newErrors.quantity = 'Purchase quantity must be positive';
    }
    if ((formData.type === 'damage' || formData.type === 'disposal') && qty >= 0) {
      newErrors.quantity = 'Damage/Disposal quantity must be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // Prepare data - only include office fields for transfers
      const submitData = {
        item_id: parseInt(formData.item_id),
        type: formData.type,
        quantity: parseFloat(formData.quantity),
        reference_number: formData.reference_number || undefined,
        notes: formData.notes || undefined
      };

      if (formData.type === 'transfer') {
        submitData.from_office_id = parseInt(formData.from_office_id);
        submitData.to_office_id = parseInt(formData.to_office_id);
      }

      await createStockMovement(submitData);
      
      // Reset form
      setFormData({
        item_id: '',
        type: '',
        quantity: '',
        from_office_id: '',
        to_office_id: '',
        reference_number: '',
        notes: ''
      });
      
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create stock movement');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = MOVEMENT_TYPES.find(t => t.value === formData.type);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Stock Movement</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Grid container spacing={2}>
            {/* Item Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.item_id}>
                <InputLabel>Item *</InputLabel>
                <Select
                  name="item_id"
                  value={formData.item_id}
                  onChange={handleChange}
                  label="Item *"
                >
                  {items.map(item => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name} ({item.qr_code}) - Stock: {item.current_stock || 0}
                    </MenuItem>
                  ))}
                </Select>
                {errors.item_id && <FormHelperText>{errors.item_id}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Movement Type */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.type}>
                <InputLabel>Movement Type *</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  label="Movement Type *"
                >
                  {MOVEMENT_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label} ({type.quantitySign})
                    </MenuItem>
                  ))}
                </Select>
                {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Quantity */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity *"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                error={!!errors.quantity}
                helperText={
                  errors.quantity || 
                  (formData.type === 'purchase' ? 'Enter positive number' :
                   formData.type === 'damage' || formData.type === 'disposal' ? 'Enter negative number (e.g., -5)' :
                   formData.type === 'adjustment' ? 'Enter positive or negative number' : '')
                }
                inputProps={{ step: '0.01' }}
              />
            </Grid>

            {/* From Office (only for transfers) */}
            {selectedType?.requiresOffices && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.from_office_id}>
                  <InputLabel>From Office *</InputLabel>
                  <Select
                    name="from_office_id"
                    value={formData.from_office_id}
                    onChange={handleChange}
                    label="From Office *"
                  >
                    {offices.map(office => (
                      <MenuItem key={office.id} value={office.id}>
                        {office.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.from_office_id && <FormHelperText>{errors.from_office_id}</FormHelperText>}
                </FormControl>
              </Grid>
            )}

            {/* To Office (only for transfers) */}
            {selectedType?.requiresOffices && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.to_office_id}>
                  <InputLabel>To Office *</InputLabel>
                  <Select
                    name="to_office_id"
                    value={formData.to_office_id}
                    onChange={handleChange}
                    label="To Office *"
                  >
                    {offices.map(office => (
                      <MenuItem key={office.id} value={office.id}>
                        {office.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.to_office_id && <FormHelperText>{errors.to_office_id}</FormHelperText>}
                </FormControl>
              </Grid>
            )}

            {/* Reference Number */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reference Number"
                name="reference_number"
                value={formData.reference_number}
                onChange={handleChange}
                placeholder="e.g., PO-2025-001, TR-2025-001"
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={`Notes ${formData.type === 'adjustment' ? '*' : ''}`}
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={3}
                error={!!errors.notes}
                helperText={errors.notes || (formData.type === 'adjustment' ? 'Required for adjustments' : 'Optional')}
                placeholder="Enter reason or additional details..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Adding...' : 'Add Movement'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
