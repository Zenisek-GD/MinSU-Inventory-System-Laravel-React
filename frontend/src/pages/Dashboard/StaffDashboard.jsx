// src/pages/StaffDashboard.jsx
import React from 'react';
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
  ShoppingCart as CartIcon,
  Add as AddIcon,
  SwapHoriz as BorrowIcon,
  Pending as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  History as HistoryIcon,
  QrCode as QRIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const StaffDashboard = () => {
  const navigate = useNavigate();

  const requestStats = [
    {
      title: 'Pending',
      value: 3,
      icon: <PendingIcon fontSize="inherit" />,
      color: 'warning',
      description: 'Awaiting approval'
    },
    {
      title: 'Approved',
      value: 8,
      icon: <ApprovedIcon fontSize="inherit" />,
      color: 'success',
      description: 'Ready for processing'
    },
    {
      title: 'Rejected',
      value: 2,
      icon: <RejectedIcon fontSize="inherit" />,
      color: 'error',
      description: 'Needs revision'
    },
    {
      title: 'Active Borrows',
      value: 5,
      icon: <BorrowIcon fontSize="inherit" />,
      color: 'info',
      description: 'Currently borrowed'
    },
  ];

  const quickActions = [
    {
      icon: <AddIcon />,
      label: 'Request New Item',
      description: 'Submit purchase request',
      path: '/request-item',
      color: 'primary'
    },
    {
      icon: <BorrowIcon />,
      label: 'Borrow Item',
      description: 'Borrow from inventory',
      path: '/borrow-item',
      color: 'secondary'
    },
    {
      icon: <CartIcon />,
      label: 'Browse Items',
      description: 'View available items',
      path: '/available-items',
      color: 'success'
    },
    {
      icon: <QRIcon />,
      label: 'QR Scanner',
      description: 'Scan item QR codes',
      path: '/qr-scanner',
      color: 'info'
    },
  ];

  const myRecentRequests = [
    { id: 'PR-2024-001', item: 'Laptop Stand', type: 'Purchase', status: 'pending', date: '2 hours ago' },
    { id: 'BR-2024-045', item: 'Projector', type: 'Borrow', status: 'approved', date: '1 day ago' },
    { id: 'PR-2024-002', item: 'Office Chair', type: 'Purchase', status: 'rejected', date: '2 days ago' },
    { id: 'BR-2024-046', item: 'Camera', type: 'Borrow', status: 'pending', date: '3 days ago' },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <PendingIcon color="warning" />;
      case 'approved': return <ApprovedIcon color="success" />;
      case 'rejected': return <RejectedIcon color="error" />;
      default: return <PendingIcon />;
    }
  };

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
            Staff Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Item requests and inventory access
          </Typography>
        </Box>

        {/* Request Statistics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {requestStats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ color: `${stat.color}.main`, fontSize: 48, mb: 1 }}>
                    {stat.icon}
                  </Box>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {stat.value}
                  </Typography>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    {stat.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Quick Actions */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AddIcon color="primary" />
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {quickActions.map((action, index) => (
                    <Card 
                      key={index}
                      sx={{ 
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                          transform: 'translateY(-2px)',
                          boxShadow: 3
                        }
                      }}
                      onClick={() => navigate(action.path)}
                    >
                      <CardContent sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ color: `${action.color}.main` }}>
                            {action.icon}
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {action.label}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {action.description}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Requests */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon color="primary" />
                    My Recent Requests
                  </Typography>
                  <Button 
                    variant="outlined" 
                    onClick={() => navigate('/my-requests')}
                    startIcon={<HistoryIcon />}
                  >
                    View All
                  </Button>
                </Box>
                <List>
                  {myRecentRequests.map((request) => (
                    <ListItem key={request.id} sx={{ px: 0, py: 1 }}>
                      <Paper sx={{ p: 2, width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          {getStatusIcon(request.status)}
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {request.item}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {request.id} • {request.date}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            {getStatusChip(request.status)}
                            <Chip 
                              label={request.type} 
                              size="small"
                              color={request.type === 'Purchase' ? 'primary' : 'secondary'}
                              sx={{ mt: 1 }}
                            />
                          </Box>
                        </Box>
                      </Paper>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* Available Items Preview */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CartIcon color="primary" />
                  Available Items
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.dark' }}>
                      <Typography variant="h6" fontWeight="bold">45</Typography>
                      <Typography variant="body2">Electronics</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'info.dark' }}>
                      <Typography variant="h6" fontWeight="bold">23</Typography>
                      <Typography variant="body2">Office Supplies</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'warning.dark' }}>
                      <Typography variant="h6" fontWeight="bold">12</Typography>
                      <Typography variant="body2">Furniture</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'secondary.dark' }}>
                      <Typography variant="h6" fontWeight="bold">8</Typography>
                      <Typography variant="body2">Equipment</Typography>
                    </Paper>
                  </Grid>
                </Grid>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/available-items')}
                >
                  Browse All Items
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
};

export default StaffDashboard;