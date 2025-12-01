import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { fetchItems } from '../api/item';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import {
  Box, Grid, Card, CardContent, Typography, Chip, TextField
} from '@mui/material';
import OfficeChip from '../components/UI/OfficeChip';
import PrimaryButton from '../components/UI/PrimaryButton';
import { ShoppingCart as CartIcon } from '@mui/icons-material';

export default function AvailableItemsPage(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const { user } = useUser();

  useEffect(() => { loadItems(); }, [user]);

  const loadItems = async () => {
    setLoading(true);
    try {
      // scope to available only and to the user's office if available
      const params = { status: 'Available' };
      if (user && user.office && user.office.id) params.office_id = user.office.id;
      const res = await fetchItems(params);
      // API may return { data: [...] } or an array directly
      const list = Array.isArray(res) ? res : res.data || [];
      setItems(list);
    } catch (e) {
      setItems([]);
    } finally { setLoading(false); }
  };

  const filtered = items.filter(it => it.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="700">Available Items</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Browse items currently available in inventory.</Typography>
              {user?.office && <OfficeChip office={user.office} locked />}
            </Box>
          </Box>
          <TextField placeholder="Search items..." size="small" value={query} onChange={(e)=>setQuery(e.target.value)} />
        </Box>

        <Grid container spacing={2}>
          {filtered.map(it => (
            <Grid item xs={12} md={4} key={it.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h6" fontWeight="600">{it.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{it.description}</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}><strong>Office:</strong> {it.office?.name || it.office_id}</Typography>
                    </Box>
                    <Chip label="Available" color="success" icon={<CartIcon />} />
                  </Box>

                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <PrimaryButton size="small" onClick={() => navigate('/request-item', { state: { itemId: it.id } })}>Request</PrimaryButton>
                    {user?.role === 'staff' && (
                      <PrimaryButton size="small" variant="outlined" onClick={() => navigate('/borrow-item', { state: { itemId: it.id } })}>
                        Borrow
                      </PrimaryButton>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </DashboardLayout>
  );
}
