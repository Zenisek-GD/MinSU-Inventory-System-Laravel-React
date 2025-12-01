import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { fetchItems } from '../api/item';
import { fetchStockMovements } from '../api/stockMovement';
import { Box, Typography, Grid, Card, CardContent, List, ListItem, ListItemText, CircularProgress } from '@mui/material';

export default function StockDashboardPage(){
  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try{
      const itemsRes = await fetchItems();
      const movementsRes = await fetchStockMovements();
      const itemsList = Array.isArray(itemsRes) ? itemsRes : itemsRes.data || [];
      setItems(itemsList);
      setMovements(movementsRes || []);
    }catch(e){ setItems([]); setMovements([]); }
    setLoading(false);
  };

  // compute current stock per item by summing movements (client-side)
  const computeStock = (itemId) => {
    const sum = movements.filter(m => m.item_id === itemId).reduce((acc,m)=> acc + Number(m.quantity || 0), 0);
    return sum;
  };

  const lowStock = items.filter(i => {
    const qty = computeStock(i.id);
    return (i.reorder_level || 0) > 0 && qty <= (i.reorder_level || 0);
  });

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>Stock Dashboard</Typography>
        {loading ? <CircularProgress /> : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Low Stock Items</Typography>
                  <List>
                    {lowStock.length === 0 && <ListItem><ListItemText primary="No low stock items"/></ListItem>}
                    {lowStock.map(i => (
                      <ListItem key={i.id}>
                        <ListItemText primary={i.name} secondary={`Current: ${computeStock(i.id)} • Reorder level: ${i.reorder_level || 0}`} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Recent Movements</Typography>
                  <List>
                    {movements.slice(0,10).map(m => {
                      const performedByDisplay = m.performedBy?.name || 
                                                 (typeof m.performed_by === 'string' ? m.performed_by : '') || 
                                                 'System';
                      return (
                        <ListItem key={m.id}>
                          <ListItemText 
                            primary={`${m.item?.name || m.item_id} ${m.quantity > 0 ? '+' : ''}${m.quantity}`} 
                            secondary={`${m.type} • By: ${performedByDisplay} • ${new Date(m.created_at).toLocaleString()}`} 
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </DashboardLayout>
  );
}
