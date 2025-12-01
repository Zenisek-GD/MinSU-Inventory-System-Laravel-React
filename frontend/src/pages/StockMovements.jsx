import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { fetchStockMovements } from '../api/stockMovement';
import { Box, Typography, Grid, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress } from '@mui/material';

export default function StockMovementsPage(){
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>Stock Movements</Typography>
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
                    <TableCell>Change</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>From</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell>By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movements.map(m => (
                    <TableRow key={m.id}>
                      <TableCell>{new Date(m.created_at).toLocaleString()}</TableCell>
                      <TableCell>{m.item?.name || m.item_id}</TableCell>
                      <TableCell>{m.change_qty}</TableCell>
                      <TableCell>{m.movement_type}</TableCell>
                      <TableCell>{m.reason}</TableCell>
                      <TableCell>{m.from_office_id || (m.from_office?.name)}</TableCell>
                      <TableCell>{m.to_office_id || (m.to_office?.name)}</TableCell>
                      <TableCell>{m.performer?.name || m.performed_by}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}
