import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { fetchBorrows } from '../../api/borrow';
import { fetchItems } from '../../api/item';
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
  Chip,
  CircularProgress,
  alpha,
  useTheme,
  Button,
  Divider,
  Avatar,
  AvatarGroup,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  History as HistoryIcon,
  CheckCircle as CheckIcon,
  Schedule as ClockIcon,
  Cancel as CancelIcon,
  ArrowForward as ArrowIcon,
  RequestQuote as RequestIcon,
} from '@mui/icons-material';

export default function StaffDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useUser();
  const [borrows, setBorrows] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [borrowsData, itemsData] = await Promise.all([
        fetchBorrows().catch(() => ({})),
        fetchItems().catch(() => ({})),
      ]);

      setBorrows(Array.isArray(borrowsData) ? borrowsData : (borrowsData?.data || []));
      setItems(Array.isArray(itemsData) ? itemsData : (itemsData?.data || []));
    } catch (error) {
      console.error('Failed to load data:', error);
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

  const myBorrows = borrows.filter(b => b.borrowed_by?.id === user?.id || b.borrowed_by === user?.id);
  const pendingBorrows = myBorrows.filter(b => b.status === 'Pending');
  const activeBorrows = myBorrows.filter(b => b.status === 'Borrowed');
  const completedBorrows = myBorrows.filter(b => b.status === 'Returned');

  const isOverdue = (expectedReturnDate) => {
    return new Date(expectedReturnDate) < new Date();
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <DashboardHeader
          title="My Inventory"
          subtitle={`Welcome back, ${user?.name}!`}
          onRefresh={loadData}
          loading={loading}
          actions={[
            {
              label: 'Request Item',
              icon: <CartIcon />,
              onClick: () => navigate('/request-item'),
              variant: 'contained',
              sx: {
                background: 'linear-gradient(135deg, #006400 0%, #004d00 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #004d00 0%, #003300 100%)',
                },
              },
            },
          ]}
        />

        {/* Borrow Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardCard
              title="Total Requests"
              value={myBorrows.length}
              icon={<RequestIcon />}
              color="#2196f3"
              variant="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardCard
              title="Pending"
              value={pendingBorrows.length}
              icon={<ClockIcon />}
              color="#ff9800"
              variant="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardCard
              title="Borrowed"
              value={activeBorrows.length}
              icon={<CartIcon />}
              color="#4caf50"
              variant="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardCard
              title="Completed"
              value={completedBorrows.length}
              icon={<CheckIcon />}
              color="#8bc34a"
            />
          </Grid>
        </Grid>

        {/* Active Borrows & Pending Requests */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Currently Borrowed"
                titleTypographyProps={{ variant: 'h6', fontWeight: '600' }}
                action={
                  activeBorrows.length > 0 && (
                    <Chip
                      label={activeBorrows.length}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )
                }
                sx={{
                  pb: 2,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                }}
              />
              <CardContent>
                {activeBorrows.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No items currently borrowed
                  </Typography>
                ) : (
                  <List dense>
                    {activeBorrows.map((borrow) => (
                      <ListItem
                        key={borrow.id}
                        sx={{
                          mb: 1.5,
                          p: 1.5,
                          backgroundColor: alpha(theme.palette.primary.main, 0.05),
                          borderRadius: 1,
                          borderLeft: `3px solid ${
                            isOverdue(borrow.expected_return_date) ? '#f44336' : '#4caf50'
                          }`,
                        }}
                      >
                        <ListItemText
                          primary={borrow.item?.name || 'Unknown Item'}
                          secondary={
                            <Box sx={{ mt: 0.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant="caption" color="text.secondary">
                                📅 Due: {new Date(borrow.expected_return_date).toLocaleDateString()}
                              </Typography>
                              {isOverdue(borrow.expected_return_date) && (
                                <Chip
                                  label="Overdue"
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          }
                          primaryTypographyProps={{ variant: 'body2', fontWeight: '600' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Recent Requests"
                titleTypographyProps={{ variant: 'h6', fontWeight: '600' }}
                action={
                  pendingBorrows.length > 0 && (
                    <Chip
                      label={pendingBorrows.length}
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  )
                }
                sx={{
                  pb: 2,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                }}
              />
              <CardContent>
                {pendingBorrows.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No pending requests
                  </Typography>
                ) : (
                  <List dense>
                    {pendingBorrows.map((borrow) => (
                      <ListItem
                        key={borrow.id}
                        sx={{
                          mb: 1.5,
                          p: 1.5,
                          backgroundColor: alpha('#ff9800', 0.05),
                          borderRadius: 1,
                        }}
                      >
                        <ListItemText
                          primary={borrow.item?.name || 'Unknown Item'}
                          secondary={`Requested ${new Date(borrow.created_at).toLocaleDateString()}`}
                          primaryTypographyProps={{ variant: 'body2', fontWeight: '600' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                        <Chip label="Pending" size="small" variant="outlined" />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Available Items */}
        <Card>
          <CardHeader
            title="Available Items to Request"
            titleTypographyProps={{ variant: 'h6', fontWeight: '600' }}
            sx={{
              pb: 2,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            }}
          />
          <CardContent>
            {items.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No items available
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {items.slice(0, 6).map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: 3,
                          borderColor: '#006400',
                        },
                      }}
                      onClick={() => navigate(`/request-item/${item.id}`)}
                    >
                      <CardContent>
                        <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          {item.category?.name}
                        </Typography>
                        <Chip
                          label={item.display_status || item.status}
                          size="small"
                          color={item.display_status === 'Available' ? 'success' : 'default'}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
            {items.length > 6 && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="text"
                  endIcon={<ArrowIcon />}
                  onClick={() => navigate('/available-items')}
                >
                  View All Items
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}
