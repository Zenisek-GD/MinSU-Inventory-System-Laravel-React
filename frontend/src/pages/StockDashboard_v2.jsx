import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchItems } from '../../api/item';
import { fetchStockMovements } from '../../api/stockMovement';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import DashboardCard from '../../components/Dashboard/DashboardCard';
import DashboardHeader from '../../components/Dashboard/DashboardHeader';
import {
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  alpha,
  useTheme,
  Button,
  TextField,
  MenuItem,
  LinearProgress,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  ArrowForward as ArrowIcon,
  ArrowUpward as UpIcon,
  ArrowDownward as DownIcon,
  SwapHoriz as TransferIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

export default function StockDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsData, movementsData] = await Promise.all([
        fetchItems().catch(() => ({})),
        fetchStockMovements().catch(() => ({})),
      ]);

      setItems(Array.isArray(itemsData) ? itemsData : (itemsData?.data || []));
      setMovements(Array.isArray(movementsData) ? movementsData : (movementsData?.data || []));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStock = (itemId) => {
    return movements
      .filter(m => m.item_id === itemId)
      .reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);
  };

  const getLowStockItems = () => items.filter(i => {
    const stock = calculateStock(i.id);
    return stock <= (i.reorder_level || 10);
  });

  const getOutOfStockItems = () => items.filter(i => calculateStock(i.id) <= 0);

  const getTotalValue = () => {
    return items.reduce((sum, item) => {
      const stock = calculateStock(item.id);
      const price = Number(item.purchase_price) || 0;
      return sum + (stock * price);
    }, 0);
  };

  const getCategories = () => [...new Set(items.map(i => i.category?.name || 'Uncategorized'))];

  const filteredItems = items.filter(item => {
    const status = item.status || 'Active';
    const category = item.category?.name || 'Uncategorized';
    
    if (filterStatus !== 'All' && status !== filterStatus) return false;
    if (filterCategory !== 'All' && category !== filterCategory) return false;
    return true;
  });

  const lowStockItems = getLowStockItems();
  const outOfStockItems = getOutOfStockItems();

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <DashboardHeader
          title="Stock Dashboard"
          subtitle="Inventory Overview & Analytics"
          onRefresh={loadData}
          loading={loading}
          actions={[
            {
              label: 'Add Movement',
              icon: <ArrowIcon />,
              onClick: () => navigate('/stock-movements'),
            },
          ]}
        />

        {/* Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardCard
              title="Total Items"
              value={items.length}
              icon={<InventoryIcon />}
              color="#2196f3"
              variant="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardCard
              title="Low Stock"
              value={lowStockItems.length}
              icon={<WarningIcon />}
              color="#ff9800"
              variant="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardCard
              title="Out of Stock"
              value={outOfStockItems.length}
              icon={<WarningIcon />}
              color="#f44336"
              variant="danger"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardCard
              title="Inventory Value"
              value={`₱${getTotalValue().toLocaleString('en-PH', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}`}
              icon={<TrendingUpIcon />}
              color="#4caf50"
              variant="success"
            />
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="All">All</MenuItem>
                  <MenuItem value="Available">Available</MenuItem>
                  <MenuItem value="Borrowed">Borrowed</MenuItem>
                  <MenuItem value="Under Maintenance">Maintenance</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Category"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <MenuItem value="All">All Categories</MenuItem>
                  {getCategories().map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Alerts & Inventory Status */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Critical Alerts"
                titleTypographyProps={{ variant: 'h6', fontWeight: '600' }}
                sx={{
                  pb: 2,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                }}
              />
              <CardContent>
                {outOfStockItems.length === 0 && lowStockItems.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <CheckIcon sx={{ fontSize: 48, color: '#4caf50', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      All items are well stocked!
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {outOfStockItems.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" fontWeight="600" color="#f44336" sx={{ mb: 1 }}>
                          Out of Stock ({outOfStockItems.length})
                        </Typography>
                        <List dense>
                          {outOfStockItems.slice(0, 3).map(item => (
                            <ListItem
                              key={item.id}
                              sx={{
                                p: 1,
                                backgroundColor: alpha('#f44336', 0.05),
                                borderRadius: 1,
                                mb: 0.5,
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <DownIcon sx={{ color: '#f44336', fontSize: 20 }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={item.name}
                                secondary={item.category?.name}
                                primaryTypographyProps={{ variant: 'body2', fontWeight: '500' }}
                                secondaryTypographyProps={{ variant: 'caption' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                    {lowStockItems.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" fontWeight="600" color="#ff9800" sx={{ mb: 1 }}>
                          Low Stock ({lowStockItems.length})
                        </Typography>
                        <List dense>
                          {lowStockItems.slice(0, 3).map(item => {
                            const current = calculateStock(item.id);
                            const reorder = item.reorder_level || 10;
                            return (
                              <ListItem
                                key={item.id}
                                sx={{
                                  p: 1,
                                  backgroundColor: alpha('#ff9800', 0.05),
                                  borderRadius: 1,
                                  mb: 0.5,
                                }}
                              >
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  <WarningIcon sx={{ color: '#ff9800', fontSize: 20 }} />
                                </ListItemIcon>
                                <ListItemText
                                  primary={item.name}
                                  secondary={`Current: ${current} / Reorder: ${reorder}`}
                                  primaryTypographyProps={{ variant: 'body2', fontWeight: '500' }}
                                  secondaryTypographyProps={{ variant: 'caption' }}
                                />
                              </ListItem>
                            );
                          })}
                        </List>
                      </Box>
                    )}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Recent Movements"
                titleTypographyProps={{ variant: 'h6', fontWeight: '600' }}
                sx={{
                  pb: 2,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                }}
              />
              <CardContent>
                <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {movements.slice(0, 10).map(movement => (
                    <ListItem
                      key={movement.id}
                      sx={{
                        mb: 1,
                        p: 1.5,
                        backgroundColor: alpha(movement.quantity > 0 ? '#4caf50' : '#f44336', 0.05),
                        borderRadius: 1,
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            backgroundColor: movement.quantity > 0 ? '#4caf50' : '#f44336',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: 14,
                            fontWeight: 'bold',
                          }}
                        >
                          {movement.quantity > 0 ? '+' : ''}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={`${movement.item?.name || 'Item'}`}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {movement.type}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              •
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(movement.created_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                        primaryTypographyProps={{ variant: 'body2', fontWeight: '500' }}
                      />
                      <Typography
                        variant="body2"
                        fontWeight="600"
                        sx={{ color: movement.quantity > 0 ? '#4caf50' : '#f44336' }}
                      >
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Inventory Table */}
        <Card>
          <CardHeader
            title="Stock Inventory"
            titleTypographyProps={{ variant: 'h6', fontWeight: '600' }}
            sx={{
              pb: 2,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            }}
          />
          <CardContent>
            <Box sx={{ overflowX: 'auto' }}>
              <Box sx={{ minWidth: 600 }}>
                {filteredItems.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                    No items found
                  </Typography>
                ) : (
                  <List>
                    {filteredItems.map(item => {
                      const current = calculateStock(item.id);
                      const reorder = item.reorder_level || 10;
                      const percentage = Math.min((current / Math.max(reorder, 1)) * 100, 100);

                      return (
                        <Box key={item.id} sx={{ mb: 2, pb: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}` }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight="600">
                                {item.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.category?.name} • {item.serial_number && `#${item.serial_number}`}
                              </Typography>
                            </Box>
                            <Chip
                              label={`${current} units`}
                              size="small"
                              color={current > reorder ? 'success' : 'warning'}
                              variant="outlined"
                            />
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={percentage}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: alpha(theme.palette.divider, 0.3),
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: current > reorder ? '#4caf50' : '#ff9800',
                              },
                            }}
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Reorder: {reorder}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {percentage.toFixed(0)}%
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </List>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}
