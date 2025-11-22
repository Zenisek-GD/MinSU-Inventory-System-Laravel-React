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
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  RequestQuote as PRIcon,
  SwapHoriz as BorrowIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as PendingIcon,
  LocalShipping as DeliveryIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardStats } from '../../api/dashboard';
import { fetchPurchaseRequests } from '../../api/purchaseRequest';
import { fetchBorrows } from '../../api/borrow';
import { fetchItems } from '../../api/item';

const SupplyOfficerDashboard = () => {
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
  }, []);

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
      requester: br.borrowedBy?.name || 'Unknown',
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
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight="bold" color="primary.main">
            Supply Officer Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Inventory management and request processing
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6">Loading dashboard...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
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
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                    onClick={() => navigate(task.path)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ color: `${task.color}.main`, fontSize: 40 }}>
                          {task.icon}
                        </Box>
                        <Chip label={task.count} color={task.color} size="small" />
                      </Box>
                      <Typography variant="h6" gutterBottom fontWeight="bold">
                        {task.title}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        {task.items.map((item, idx) => (
                          <Typography key={idx} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            • {item}
                          </Typography>
                        ))}
                      </Box>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        sx={{ mt: 2 }}
                        color={task.color}
                      >
                        Manage
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={3}>
              {/* Recent Requests */}
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PendingIcon color="primary" />
                      Recent Requests
                    </Typography>
                    <List>
                      {recentRequests.map((request) => (
                        <ListItem key={request.id} sx={{ px: 0, py: 1 }}>
                          <Paper sx={{ p: 2, width: '100%', borderLeft: 4, borderColor: 'primary.main' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {request.item}
                                  </Typography>
                                  <Chip 
                                    label={String(request.id).startsWith('PR') ? 'Purchase' : 'Borrow'} 
                                    size="small"
                                    color={String(request.id).startsWith('PR') ? 'primary' : 'secondary'}
                                  />
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                  Requested by: {request.requester}
                                </Typography>
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                {getStatusChip(request.status)}
                                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                                  {request.date}
                                </Typography>
                              </Box>
                            </Box>
                          </Paper>
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Quick Actions */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckIcon color="primary" />
                      Quick Actions
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Button 
                        variant="contained" 
                        startIcon={<InventoryIcon />}
                        onClick={() => navigate('/inventory')}
                        size="large"
                      >
                        Inventory Management
                      </Button>
                      <Button 
                        variant="outlined" 
                        startIcon={<PRIcon />}
                        onClick={() => navigate('/purchase-requests')}
                        size="large"
                      >
                        Purchase Requests
                      </Button>
                      <Button 
                        variant="outlined" 
                        startIcon={<BorrowIcon />}
                        onClick={() => navigate('/borrow-requests')}
                        size="large"
                      >
                        Borrow Requests
                      </Button>
                    </Box>

                    {/* Inventory Summary */}
                    <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                        Inventory Summary
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2">Total Items:</Typography>
                        <Typography variant="body2" fontWeight="bold">{items.length}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Low Stock:</Typography>
                        <Typography variant="body2" fontWeight="bold" color="warning.main">{items.filter(it => it.stock <= (it.low_stock_threshold || 10)).length}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Out of Stock:</Typography>
                        <Typography variant="body2" fontWeight="bold" color="error.main">{items.filter(it => it.stock === 0).length}</Typography>
                      </Box>
                    </Box>
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