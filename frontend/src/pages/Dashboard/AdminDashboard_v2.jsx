import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardStats } from '../../api/dashboard';
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
  Divider,
  Button,
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as OfficeIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  SwapHoriz as TransferIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  TrendingUp as TrendingIcon,
  Info as InfoIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await fetchDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  const totalUsers = (stats?.users?.admin || 0) + (stats?.users?.supply_officer || 0) + (stats?.users?.staff || 0);

  const quickActions = [
    {
      label: 'Manage Users',
      icon: <PeopleIcon />,
      onClick: () => navigate('/users'),
      color: '#2196f3',
    },
    {
      label: 'Manage Items',
      icon: <InventoryIcon />,
      onClick: () => navigate('/items'),
      color: '#4caf50',
    },
    {
      label: 'View Reports',
      icon: <TrendingIcon />,
      onClick: () => navigate('/reports'),
      color: '#ff9800',
    },
  ];

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <DashboardHeader
          title="Admin Dashboard"
          subtitle="System Overview & Management"
          onRefresh={loadStats}
          loading={loading}
        />

        {/* Quick Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardCard
              title="Total Users"
              value={totalUsers}
              icon={<PeopleIcon />}
              subtitle="Active members"
              color="#2196f3"
              variant="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardCard
              title="Offices"
              value={stats?.officesCount || 0}
              icon={<OfficeIcon />}
              subtitle="Departments/locations"
              color="#ff9800"
              variant="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardCard
              title="Total Items"
              value={stats?.itemsCount || 0}
              icon={<InventoryIcon />}
              subtitle="In inventory"
              color="#4caf50"
              variant="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardCard
              title="Pending Requests"
              value={stats?.pendingMemorandumReceiptsCount || 0}
              icon={<ShoppingCartIcon />}
              subtitle="Awaiting approval"
              color="#f44336"
              variant="danger"
            />
          </Grid>
        </Grid>

        {/* User Breakdown & Quick Actions */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardHeader
                title="User Breakdown"
                titleTypographyProps={{ variant: 'h6', fontWeight: '600' }}
                sx={{
                  pb: 2,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                }}
              />
              <CardContent>
                <Stack spacing={2}>
                  {[
                    { role: 'Admin', count: stats?.users?.admin || 0, color: '#2196f3' },
                    { role: 'Supply Officer', count: stats?.users?.supply_officer || 0, color: '#ff9800' },
                    { role: 'Staff', count: stats?.users?.staff || 0, color: '#4caf50' },
                  ].map((item) => (
                    <Box key={item.role} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: item.color,
                          }}
                        />
                        <Typography variant="body2" fontWeight="500">
                          {item.role}
                        </Typography>
                      </Box>
                      <Chip
                        label={item.count}
                        size="small"
                        sx={{
                          backgroundColor: alpha(item.color, 0.1),
                          color: item.color,
                          fontWeight: '600',
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%' }}>
              <CardHeader
                title="Quick Actions"
                titleTypographyProps={{ variant: 'h6', fontWeight: '600' }}
                sx={{
                  pb: 2,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                }}
              />
              <CardContent>
                <Grid container spacing={2}>
                  {quickActions.map((action, idx) => (
                    <Grid item xs={12} sm={6} md={4} key={idx}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={action.onClick}
                        startIcon={action.icon}
                        sx={{
                          py: 2,
                          borderColor: action.color,
                          color: action.color,
                          '&:hover': {
                            backgroundColor: alpha(action.color, 0.04),
                            borderColor: action.color,
                          },
                        }}
                      >
                        {action.label}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* System Status & Recent Activity */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="System Status"
                titleTypographyProps={{ variant: 'h6', fontWeight: '600' }}
                sx={{
                  pb: 2,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                }}
              />
              <CardContent>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Database Connection</Typography>
                    <Chip label="Healthy" color="success" size="small" />
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">API Status</Typography>
                    <Chip label="Online" color="success" size="small" />
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">System Load</Typography>
                    <Typography variant="body2" fontWeight="600">42%</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Recent Memorandum Receipts"
                titleTypographyProps={{ variant: 'h6', fontWeight: '600' }}
                action={
                  <Button size="small" endIcon={<ArrowIcon />} onClick={() => navigate('/memorandum-receipts')}>
                    View all
                  </Button>
                }
                sx={{
                  pb: 2,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                }}
              />
              <CardContent>
                <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {(stats?.recentMemorandumReceipts || []).length === 0 ? (
                    <ListItem sx={{ py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 40, color: '#006400' }}>
                        <InfoIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="No memorandum receipts yet"
                        secondary="Go to Memorandum Receipts to create one"
                        primaryTypographyProps={{ variant: 'body2', fontWeight: '500' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ) : (
                    (stats?.recentMemorandumReceipts || []).map((mr) => (
                      <ListItem
                        key={mr.id}
                        sx={{ py: 1, cursor: 'pointer' }}
                        onClick={() => navigate(`/memorandum-receipts/${mr.id}`)}
                      >
                        <ListItemIcon sx={{ minWidth: 40, color: '#006400' }}>
                          <ShoppingCartIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${mr.mr_number || `MR-${mr.id}`} · ${(mr.form_type || 'ics').toUpperCase()}`}
                          secondary={`${mr.office || 'N/A'} • ${mr.status || 'N/A'}${mr.created_at ? ` • ${new Date(mr.created_at).toLocaleString()}` : ''}`}
                          primaryTypographyProps={{ variant: 'body2', fontWeight: '600' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
}
