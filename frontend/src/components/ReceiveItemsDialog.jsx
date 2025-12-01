import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Typography,
  Box,
  Chip
} from '@mui/material';
import { fetchItems } from '../api/item';
import api from '../api/axios';

export default function ReceiveItemsDialog({ open, onClose, purchaseRequest, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inventoryItems, setInventoryItems] = useState([]);
  const [receivedItems, setReceivedItems] = useState([]);

  useEffect(() => {
    if (open && purchaseRequest) {
      loadData();
    }
  }, [open, purchaseRequest]);

  const loadData = async () => {
    try {
      const itemsRes = await fetchItems();
      const itemsList = Array.isArray(itemsRes) ? itemsRes : (itemsRes?.data || []);
      setInventoryItems(itemsList);

      // Initialize received items from purchase request items
      const initialReceived = purchaseRequest.items.map(prItem => ({
        pr_item_id: prItem.id,
        item_name: prItem.item_name,
        quantity_requested: prItem.quantity,
        item_id: prItem.item_id || '',
        quantity_received: prItem.quantity_received || '',
        unit: prItem.unit || 'pcs'
      }));
      setReceivedItems(initialReceived);
    } catch (err) {
      setError('Failed to load inventory items');
      setInventoryItems([]);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...receivedItems];
    updated[index][field] = value;
    setReceivedItems(updated);
  };

  const handleSubmit = async () => {
    // Validate
    const errors = [];
    receivedItems.forEach((item, idx) => {
      if (!item.item_id) {
        errors.push(`Row ${idx + 1}: Please select an inventory item`);
      }
      if (!item.quantity_received || item.quantity_received <= 0) {
        errors.push(`Row ${idx + 1}: Please enter quantity received`);
      }
    });

    if (errors.length > 0) {
      setError(errors.join('. '));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post(`/purchase-requests/${purchaseRequest.id}/receive`, {
        items: receivedItems
      });

      setReceivedItems([]);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to receive items');
    } finally {
      setLoading(false);
    }
  };

  if (!purchaseRequest) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Receive Items - PR #{purchaseRequest.pr_number}
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Office:</strong> {purchaseRequest.office?.name || 'N/A'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Purpose:</strong> {purchaseRequest.purpose || 'N/A'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Map each requested item to an inventory item and record quantity received
          </Typography>
        </Box>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Requested Item</TableCell>
              <TableCell>Qty Requested</TableCell>
              <TableCell>Inventory Item *</TableCell>
              <TableCell>Qty Received *</TableCell>
              <TableCell>Unit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {receivedItems.map((item, index) => (
              <TableRow key={item.pr_item_id}>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {item.item_name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={item.quantity_requested} size="small" color="primary" />
                </TableCell>
                <TableCell>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={item.item_id}
                    onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
                    required
                  >
                    <MenuItem value="">
                      <em>Select inventory item...</em>
                    </MenuItem>
                    {inventoryItems.map(invItem => (
                      <MenuItem key={invItem.id} value={invItem.id}>
                        {invItem.name} ({invItem.qr_code}) - Stock: {invItem.current_stock || 0}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    size="small"
                    value={item.quantity_received}
                    onChange={(e) => handleItemChange(index, 'quantity_received', e.target.value)}
                    inputProps={{ min: 0, step: 0.01 }}
                    required
                    sx={{ width: 100 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{item.unit}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Box sx={{ mt: 2 }}>
          <Alert severity="info">
            <strong>Note:</strong> Stock movements will be automatically created for each received item.
            The purchase request status will be updated to "Received".
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Receiving...' : 'Receive Items'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
