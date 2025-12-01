import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { fetchStockMovements } from '../api/stockMovement';
import { Box, Typography, Grid, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, Chip, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AddStockMovementDialog from '../components/AddStockMovementDialog';

export default function StockMovementsPage(){
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(()=>{ loadMovements(); }, []);

  const loadMovements = async () => {
    setLoading(true);
    try{
      const data = await fetchStockMovements();
      const list = Array.isArray(data) ? data : data.data || [];
      setMovements(list);
    }catch(e){ 
      setMovements([]);
    }
    setLoading(false);
  };

  const handleSuccess = () => {
    loadMovements(); // Refresh the list after adding
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" fontWeight={700}>Stock Movements</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Add Movement
          </Button>
        </Box>
        <Card>
          <CardContent>
            {loading ? <CircularProgress /> : movements.length === 0 ? (
              <Typography color="text.secondary">No stock movements found</Typography>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Item</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell>From Office</TableCell>
                    <TableCell>To Office</TableCell>
                    <TableCell>Performed By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movements.map(m => {
                    // Safely extract user name
                    const performedByName = m.performedBy?.name || 
                                           (typeof m.performed_by === 'string' ? m.performed_by : null) || 
                                           'System';
                    
                    return (
                      <TableRow key={m.id}>
                        <TableCell>{new Date(m.created_at).toLocaleString()}</TableCell>
                        <TableCell>{m.item?.name || m.item_id}</TableCell>
                        <TableCell>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</TableCell>
                        <TableCell>
                          <Chip 
                            label={m.type} 
                            size="small"
                            color={
                              m.type === 'purchase' ? 'success' :
                              m.type === 'damage' ? 'error' :
                              m.type === 'disposal' ? 'warning' :
                              m.type === 'transfer' ? 'info' :
                              'default'
                            }
                          />
                        </TableCell>
                        <TableCell>{m.notes || '-'}</TableCell>
                        <TableCell>{m.from_office?.name || m.fromOffice?.name || '-'}</TableCell>
                        <TableCell>{m.to_office?.name || m.toOffice?.name || '-'}</TableCell>
                        <TableCell>{performedByName}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Add Stock Movement Dialog */}
      <AddStockMovementDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleSuccess}
      />
    </DashboardLayout>
  );
}
