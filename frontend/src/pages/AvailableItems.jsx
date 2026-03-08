import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { fetchItems } from '../api/item';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import {
  Box, Typography, TextField, MenuItem, FormControl, InputLabel, Select,
  CircularProgress, Alert, Paper, Chip, InputAdornment, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TablePagination, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, alpha, useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  ShoppingCart as CartIcon,
  Info as InfoIcon,
  Inventory2 as InventoryIcon,
  CheckCircle as AvailableIcon,
} from '@mui/icons-material';
import OfficeChip from '../components/UI/OfficeChip';
import PrimaryButton from '../components/UI/PrimaryButton';

const CONDITION_COLORS = {
  Excellent: 'success', Good: 'success', Fair: 'warning',
  'Needs Repair': 'warning', Damaged: 'error', Disposed: 'error',
};

export default function AvailableItemsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useUser();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => { loadItems(); }, [user]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await fetchItems({});
      const list = Array.isArray(res) ? res : (res?.data || []);

      // Only show items that are truly available:
      // quantity > 0 AND status is not 'Borrowed'
      const available = list.filter(i =>
        (i.quantity ?? 1) > 0 &&
        i.status !== 'Borrowed' &&
        i.status !== 'borrowed'
      );
      setItems(available);
      setError(null);
    } catch (e) {
      console.error(e);
      setError('Failed to load available items. Please try again.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter + sort
  const filtered = items
    .filter(i =>
      i.name?.toLowerCase().includes(query.toLowerCase()) ||
      i.description?.toLowerCase().includes(query.toLowerCase()) ||
      i.category?.name?.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'category') return (a.category?.name || '').localeCompare(b.category?.name || '');
      if (sortBy === 'qty') return (b.quantity ?? 0) - (a.quantity ?? 0);
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      return 0;
    });

  const paged = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const handleRequest = (itemId) => navigate('/request-item', { state: { itemId } });
  const openDetails = (item) => { setSelected(item); setDetailsOpen(true); };

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            p: 1.5, borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
          }}>
            <InventoryIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800}>Browse Available Items</Typography>
            <Typography variant="body2" color="text.secondary">
              Items ready to request — excludes borrowed and out-of-stock items
            </Typography>
          </Box>
        </Box>

        {user?.office && <OfficeChip office={user.office} locked sx={{ mb: 2 }} />}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>
        )}

        {/* ── Filters ────────────────────────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{ p: 2, mb: 2.5, border: `1px solid ${alpha(theme.palette.divider, 0.5)}`, borderRadius: 2 }}
        >
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small" placeholder="Search by name, description, or category…"
              value={query} onChange={e => { setQuery(e.target.value); setPage(0); }}
              sx={{ flex: '1 1 260px' }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.disabled', fontSize: 18 }} /></InputAdornment> }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Sort By</InputLabel>
              <Select value={sortBy} label="Sort By" onChange={e => setSortBy(e.target.value)}>
                <MenuItem value="name">Name (A–Z)</MenuItem>
                <MenuItem value="category">Category</MenuItem>
                <MenuItem value="qty">Qty (High–Low)</MenuItem>
                <MenuItem value="newest">Newest First</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', whiteSpace: 'nowrap' }}>
              <strong>{filtered.length}</strong> of <strong>{items.length}</strong> items
            </Typography>
          </Box>
        </Paper>

        {/* ── Table ──────────────────────────────────────────────────────── */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filtered.length === 0 ? (
          <Paper
            elevation={0}
            sx={{ py: 8, textAlign: 'center', border: `1px solid ${alpha(theme.palette.divider, 0.5)}`, borderRadius: 2 }}
          >
            <CartIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary" fontWeight={500}>
              {query ? 'No items match your search.' : 'No available items at the moment.'}
            </Typography>
          </Paper>
        ) : (
          <Paper
            elevation={0}
            sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.5)}`, borderRadius: 2, overflow: 'hidden' }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                    {['Item Name', 'Category', 'Condition', 'Qty', 'Location', 'Unit Cost', ''].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.7, py: 1.5, color: 'primary.main' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paged.map(item => (
                    <TableRow key={item.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AvailableIcon sx={{ fontSize: 14, color: 'success.main', flexShrink: 0 }} />
                          <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                        </Box>
                        {item.serial_number && (
                          <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>
                            S/N: {item.serial_number}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {item.category?.name || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.condition || 'Good'}
                          size="small"
                          color={CONDITION_COLORS[item.condition] || 'default'}
                          variant="outlined"
                          sx={{ fontSize: '0.72rem', fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="success.main">
                          {item.quantity ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {item.office?.name || item.room?.name || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {item.unit_cost ? `₱${Number(item.unit_cost).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button
                            size="small" variant="outlined"
                            startIcon={<InfoIcon sx={{ fontSize: 14 }} />}
                            onClick={() => openDetails(item)}
                            sx={{ borderRadius: 1.5, fontSize: '0.72rem', fontWeight: 700, py: 0.4 }}
                          >
                            Details
                          </Button>
                          <Button
                            size="small" variant="contained"
                            startIcon={<CartIcon sx={{ fontSize: 14 }} />}
                            onClick={() => handleRequest(item.id)}
                            sx={{ borderRadius: 1.5, fontSize: '0.72rem', fontWeight: 700, py: 0.4 }}
                          >
                            Request
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filtered.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={e => { setRowsPerPage(+e.target.value); setPage(0); }}
            />
          </Paper>
        )}

        {/* ── Details Dialog ──────────────────────────────────────────────── */}
        <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          {selected && (
            <>
              <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                {selected.name}
                <Chip label="Available" color="success" size="small" sx={{ fontWeight: 700 }} />
              </DialogTitle>
              <DialogContent dividers>
                <Table size="small">
                  <TableBody>
                    {[
                      ['Category', selected.category?.name || '—'],
                      ['Condition', selected.condition || 'Good'],
                      ['Quantity', selected.quantity ?? '—'],
                      ['Unit', selected.unit || '—'],
                      ['Serial Number', selected.serial_number || '—'],
                      ['QR Code', selected.qr_code || '—'],
                      ['Fund Cluster', selected.fund_cluster || 'General Trust Fund'],
                      ['Location', selected.office?.name || selected.room?.name || '—'],
                      ['Est. Value', selected.unit_cost ? `₱${Number(selected.unit_cost).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—'],
                      ['Description', selected.description || '—'],
                    ].map(([label, val]) => (
                      <TableRow key={label}>
                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.78rem', width: '38%', border: 0 }}>
                          {label}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.84rem', border: 0 }}>{val}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DialogContent>
              <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button onClick={() => setDetailsOpen(false)} sx={{ borderRadius: 2 }}>Close</Button>
                <PrimaryButton
                  startIcon={<CartIcon />}
                  onClick={() => { handleRequest(selected.id); setDetailsOpen(false); }}
                >
                  Request This Item
                </PrimaryButton>
              </DialogActions>
            </>
          )}
        </Dialog>

      </Box>
    </DashboardLayout>
  );
}
