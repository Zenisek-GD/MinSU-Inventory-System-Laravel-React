// src/pages/SupplyOfficerDashboard.jsx
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Paper,
  Chip,
  List,
  ListItem,
  TextField,
  MenuItem,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  RequestQuote as PRIcon,
  SwapHoriz as BorrowIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as PendingIcon,
  LocalShipping as DeliveryIcon,
  TrendingUp,
  Refresh,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardStats } from '../../api/dashboard';
import { fetchPurchaseRequests } from '../../api/purchaseRequest';
import { fetchBorrows } from '../../api/borrow';
import { fetchItems } from '../../api/item';
import { DashboardCharts } from '../../components/Dashboard/DashboardCharts';

const SupplyOfficerDashboard = () => {
  const theme = useTheme();
  
  // Monitoring filters
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterOffice, setFilterOffice] = useState('All');
  const [filterItem, setFilterItem] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ users: [], offices: [], items: [], purchaseRequests: [] });
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const dashboardStats = await fetchDashboardStats();
        setStats(dashboardStats);
        const pr = await fetchPurchaseRequests();
        setPurchaseRequests(pr);
        const br = await fetchBorrows();
        setBorrows(br);
        const it = await fetchItems();
        setItems(Array.isArray(it) ? it : (it?.data || []));
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchData, refreshInterval * 1000);
    }
    return () => interval && clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Advanced filters for requests
  const filteredPurchaseRequests = purchaseRequests.filter(pr =>
    (filterStatus === 'All' || pr.status === filterStatus) &&
    (filterOffice === 'All' || pr.office?.name === filterOffice) &&
    (filterItem === '' || pr.items?.some(i => i.item_name?.toLowerCase().includes(filterItem.toLowerCase())))
  );
  const filteredBorrows = borrows.filter(br =>
    (filterStatus === 'All' || br.status === filterStatus) &&
    (filterItem === '' || (br.item?.name?.toLowerCase().includes(filterItem.toLowerCase())))
  );

  // Priority Tasks
  const priorityTasks = [
    {
      title: 'Pending Purchase Requests',
      count: purchaseRequests.filter(pr => pr.status === 'Pending').length,
      icon: <PRIcon />,
      color: 'warning',
      path: '/purchase-requests',
      items: purchaseRequests.filter(pr => pr.status === 'Pending').slice(0, 3).map(pr => `${pr.items?.[0]?.item_name || 'Item'} (${pr.items?.[0]?.quantity || 1})`)
    },
    {
      title: 'Borrow Requests',
      count: borrows.filter(br => br.status === 'Pending').length,
      icon: <BorrowIcon />,
      color: 'info',
      path: '/borrow-requests',
      items: borrows.filter(br => br.status === 'Pending').slice(0, 3).map(br => `${br.item?.name || 'Item'} (${br.quantity || 1})`)
    },
    {
      title: 'Low Stock Items',
      count: items.filter(it => it.stock <= (it.low_stock_threshold || 10)).length,
      icon: <WarningIcon />,
      color: 'error',
      path: '/inventory',
      items: items.filter(it => it.stock <= (it.low_stock_threshold || 10)).slice(0, 3).map(it => it.name)
    },
    {
      title: 'Pending Deliveries',
      count: purchaseRequests.filter(pr => pr.status === 'Approved' && !pr.delivered_at).length,
      icon: <DeliveryIcon />,
      color: 'success',
      path: '/inventory',
      items: purchaseRequests.filter(pr => pr.status === 'Approved' && !pr.delivered_at).slice(0, 3).map(pr => pr.items?.[0]?.item_name || 'Item')
    },
  ];

  // Recent Requests (mix of PR and Borrow)
  const recentRequests = [
    ...purchaseRequests.slice(0, 2).map(pr => ({
      id: pr.id,
      item: pr.items?.[0]?.item_name || 'Item',
      requester: pr.requestedBy?.name || 'Unknown',
      date: pr.created_at,
      status: pr.status.toLowerCase()
    })),
    ...borrows.slice(0, 2).map(br => ({
      id: br.id,
      item: br.item?.name || 'Item',
      requester: br.borrowedBy?.name || br.borrowed_by?.name || br.borrowed_by || 'Unknown',
      date: br.created_at,
      status: br.status.toLowerCase()
    }))
  ];

  const getStatusChip = (status) => {
    const config = {
      pending: { color: 'warning', label: 'Pending' },
      approved: { color: 'success', label: 'Approved' },
      rejected: { color: 'error', label: 'Rejected' },
    };
    return <Chip label={config[status].label} color={config[status].color} size="small" />;
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h4" gutterBottom fontWeight="700" color="primary.main">
                Supply Officer Dashboard
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ opacity: 0.8 }}>
                Inventory management and request processing
              </Typography>
            </Box>
            <Chip 
              icon={<TrendingUp />} 
              label="Live Monitoring" 
              color="primary" 
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Box>
          
          {/* Filters Section */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              borderRadius: 3
            }}
          >
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                select
                label="Status Filter"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                size="small"
                sx={{ minWidth: 140 }}
              >
                <MenuItem value="All">All Status</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Approved">Approved</MenuItem>
                <MenuItem value="Rejected">Rejected</MenuItem>
              </TextField>
              <TextField
                select
                label="Office Filter"
                value={filterOffice}
                onChange={e => setFilterOffice(e.target.value)}
                size="small"
                sx={{ minWidth: 140 }}
              >
                <MenuItem value="All">All Offices</MenuItem>
                {[...new Set(purchaseRequests.map(pr => pr.office?.name).filter(Boolean))].map(name => (
                  <MenuItem key={name} value={name}>{name}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Search Items"
                value={filterItem}
                onChange={e => setFilterItem(e.target.value)}
                size="small"
                sx={{ minWidth: 180 }}
                placeholder="Enter item name..."
              />
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 'auto' }}>
                <Button
                  variant={autoRefresh ? "contained" : "outlined"}
                  color="primary"
                  size="small"
                  startIcon={<Refresh />}
                  onClick={() => setAutoRefresh(v => !v)}
                  sx={{ borderRadius: 2 }}
                >
                  {autoRefresh ? "Auto Refresh" : "Manual"}
                </Button>
                {autoRefresh && (
                  <TextField
                    type="number"
                    label="Interval"
                    value={refreshInterval}
                    onChange={e => setRefreshInterval(Number(e.target.value))}
                    size="small"
                    sx={{ width: 100 }}
                    inputProps={{ min: 5, max: 300 }}
                  />
                )}
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Monitoring Charts */}
        <Box sx={{ mb: 4 }}>
          <DashboardCharts purchaseRequests={purchaseRequests} borrows={borrows} items={items} />
        </Box>

        {loading ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">Loading dashboard data...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <Typography variant="h6" color="error">{error}</Typography>
          </Box>
        ) : (
          <>
            {/* Priority Tasks */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {priorityTasks.map((task, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease-in-out',
                      background: `linear-gradient(135deg, ${alpha(theme.palette[task.color].main, 0.05)} 0%, ${alpha(theme.palette[task.color].main, 0.02)} 100%)`,
                      border: `1px solid ${alpha(theme.palette[task.color].main, 0.1)}`,
                      borderRadius: 3,
                      '&:hover': { 
                        transform: 'translateY(-8px)',
                        boxShadow: 4,
                        borderColor: alpha(theme.palette[task.color].main, 0.3),
                      }
                    }}
                    onClick={() => navigate(task.path)}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                        <Box 
                          sx={{ 
                            color: `${task.color}.main`,
                            fontSize: 48,
                            opacity: 0.8
                          }}
                        >
                          {task.icon}
                        </Box>
                        <Chip 
                          label={task.count} 
                          color={task.color} 
                          size="medium" 
                          sx={{ fontWeight: 700, fontSize: '0.9rem' }}
                        />
                      </Box>
                      <Typography variant="h6" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
                        {task.title}
                      </Typography>
                      <Box sx={{ mt: 2, mb: 2 }}>
                        {task.items.map((item, idx) => (
                          <Typography 
                            key={idx} 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: 1,
                              display: 'flex',
                              alignItems: 'center',
                              '&:before': {
                                content: '"•"',
                                color: `${task.color}.main`,
                                fontWeight: 'bold',
                                mr: 1
                              }
                            }}
                          >
                            {item}
                          </Typography>
                        ))}
                      </Box>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        sx={{ 
                          mt: 1,
                          borderRadius: 2,
                          borderWidth: 2,
                          '&:hover': { borderWidth: 2 }
                        }}
                        color={task.color}
                      >
                        Manage Requests
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={3}>
              {/* Recent Requests */}
              <Grid item xs={12} md={8}>
                <Card 
                  sx={{ 
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography 
                      variant="h6" 
                      gutterBottom 
                      fontWeight="600" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        mb: 3
                      }}
                    >
                      <PendingIcon color="primary" />
                      Recent Activity & Requests
                    </Typography>
                    <List sx={{ p: 0 }}>
                      {recentRequests.map((request, index) => (
                        <ListItem key={`${request.id}-${index}`} sx={{ px: 0, py: 1.5 }}>
                          <Paper 
                            sx={{ 
                              p: 2.5, 
                              width: '100%', 
                              borderLeft: 4, 
                              borderColor: 'primary.main',
                              borderRadius: 2,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                boxShadow: 2,
                                transform: 'translateX(4px)'
                              }
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                                  <Typography variant="subtitle1" fontWeight="600">
                                    {request.item}
                                  </Typography>
                                  <Chip 
                                    label={String(request.id).startsWith('PR') ? 'Purchase' : 'Borrow'} 
                                    size="small"
                                    color={String(request.id).startsWith('PR') ? 'primary' : 'secondary'}
                                    variant="outlined"
                                  />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                  👤 Requested by: {request.requester}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  📅 {request.date}
                                </Typography>
                              </Box>
                              <Box sx={{ textAlign: 'right', minWidth: 100 }}>
                                {getStatusChip(request.status)}
                              </Box>
                            </Box>
                          </Paper>
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Quick Actions & Summary */}
              <Grid item xs={12} md={4}>
                <Card 
                  sx={{ 
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography 
                      variant="h6" 
                      gutterBottom 
                      fontWeight="600" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        mb: 3
                      }}
                    >
                      <CheckIcon color="primary" />
                      Quick Actions
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Button 
                        variant="contained" 
                        startIcon={<InventoryIcon />}
                        onClick={() => navigate('/inventory')}
                        size="large"
                        sx={{ 
                          borderRadius: 2,
                          py: 1.5,
                          fontWeight: 600
                        }}
                      >
                        Inventory Management
                      </Button>
                      <Button 
                        variant="outlined" 
                        startIcon={<PRIcon />}
                        onClick={() => navigate('/purchase-requests')}
                        size="large"
                        sx={{ 
                          borderRadius: 2,
                          py: 1.5,
                          fontWeight: 600
                        }}
                      >
                        Purchase Requests
                      </Button>
                      <Button 
                        variant="outlined" 
                        startIcon={<BorrowIcon />}
                        onClick={() => navigate('/borrow-requests')}
                        size="large"
                        sx={{ 
                          borderRadius: 2,
                          py: 1.5,
                          fontWeight: 600
                        }}
                      >
                        Borrow Requests
                      </Button>
                    </Box>

                    {/* Inventory Summary */}
                    <Paper 
                      elevation={0}
                      sx={{ 
                        mt: 4, 
                        p: 3, 
                        bgcolor: alpha(theme.palette.primary.main, 0.03),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        borderRadius: 2 
                      }}
                    >
                      <Typography variant="subtitle1" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
                        📊 Inventory Overview
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">Total Items:</Typography>
                          <Chip label={items.length} size="small" color="primary" variant="outlined" />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">Low Stock:</Typography>
                          <Chip 
                            label={items.filter(it => it.stock <= (it.low_stock_threshold || 10)).length} 
                            size="small" 
                            color="warning" 
                          />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">Out of Stock:</Typography>
                          <Chip 
                            label={items.filter(it => it.stock === 0).length} 
                            size="small" 
                            color="error" 
                          />
                        </Box>
                      </Box>
                    </Paper>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </DashboardLayout>
  );
};

export default SupplyOfficerDashboard;