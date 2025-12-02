import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { fetchDashboardStats } from "../api/dashboard";
import { fetchItems } from "../api/item";
import { fetchBorrows } from "../api/borrow";
import { fetchStockMovements } from "../api/stockMovement";
import { fetchPurchaseRequests } from "../api/purchaseRequest";
import DashboardLayout from "../components/Layout/DashboardLayout";
import { DashboardCharts } from "../components/Dashboard/DashboardCharts";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Paper,
  Chip,
  useTheme,
  alpha,
  CircularProgress,
  LinearProgress,
  Button,
  List,
  ListItem,
  TextField,
  MenuItem,
} from "@mui/material";
import {
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  SwapHoriz as TransferIcon,
  LocalShipping as DeliveryIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  RequestQuote as PRIcon,
  Assessment as ReportsIcon,
  ArrowForward as ArrowIcon,
  Refresh,
} from "@mui/icons-material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [movements, setMovements] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);

  // Supply Officer filters
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterOffice, setFilterOffice] = useState('All');
  const [filterItem, setFilterItem] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let interval;
    if (autoRefresh && user.role === 'supply_officer') {
      interval = setInterval(loadDashboardData, refreshInterval * 1000);
    }
    return () => interval && clearInterval(interval);
  }, [autoRefresh, refreshInterval, user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [dashboardData, itemsData, borrowData, movementsData, prData] = await Promise.all([
        fetchDashboardStats().catch(() => ({ users: {}, offices: { data: [] }, items: [], purchaseRequests: { data: [] } })),
        fetchItems().catch(() => ({ data: [] })),
        fetchBorrows().catch(() => []),
        fetchStockMovements().catch(() => ({ data: [] })),
        fetchPurchaseRequests().catch(() => []),
      ]);

      setStats(dashboardData);
      setItems(Array.isArray(itemsData) ? itemsData : (itemsData?.data || []));
      setBorrows(Array.isArray(borrowData) ? borrowData : (borrowData?.data || []));
      setMovements(Array.isArray(movementsData) ? movementsData : (movementsData?.data || []));
      setPurchaseRequests(Array.isArray(prData) ? prData : (prData?.data || []));
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (userLoading || loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </DashboardLayout>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  // Render based on role
  if (user.role === 'admin') {
    return <AdminDashboardContent user={user} stats={stats} items={items} borrows={borrows} movements={movements} purchaseRequests={purchaseRequests} navigate={navigate} theme={theme} />;
  } else if (user.role === 'supply_officer') {
    return <SupplyOfficerDashboardContent 
      user={user} 
      stats={stats} 
      items={items} 
      borrows={borrows} 
      movements={movements} 
      purchaseRequests={purchaseRequests} 
      navigate={navigate} 
      theme={theme}
      filterStatus={filterStatus}
      setFilterStatus={setFilterStatus}
      filterOffice={filterOffice}
      setFilterOffice={setFilterOffice}
      filterItem={filterItem}
      setFilterItem={setFilterItem}
      autoRefresh={autoRefresh}
      setAutoRefresh={setAutoRefresh}
      refreshInterval={refreshInterval}
      setRefreshInterval={setRefreshInterval}
    />;
  } else {
    return <StaffDashboardContent user={user} items={items} borrows={borrows} navigate={navigate} theme={theme} />;
  }
}

// Admin Dashboard Component
function AdminDashboardContent({ user, stats, items, borrows, movements, purchaseRequests, navigate, theme }) {
  const quickStats = stats ? [
    {
      title: 'Total Users',
      value: (stats.users?.admin || 0) + (stats.users?.supply_officer || 0) + (stats.users?.staff || 0),
      icon: <PeopleIcon fontSize="inherit" />,
      subtitle: 'Active members',
      onClick: () => navigate('/users')
    },
    {
      title: 'Departments',
      value: stats.offices?.data?.length || 0,
      icon: <BusinessIcon fontSize="inherit" />,
      subtitle: 'Managed offices',
      onClick: () => navigate('/offices')
    },
    {
      title: 'Inventory Items',
      value: items.length,
      icon: <InventoryIcon fontSize="inherit" />,
      subtitle: `${items.filter(i => i.status === 'Available').length} available`,
      onClick: () => navigate('/items')
    },
    {
      title: 'Pending Requests',
      value: purchaseRequests.filter(pr => pr.status === 'Pending').length,
      icon: <PRIcon fontSize="inherit" />,
      subtitle: 'Awaiting approval',
      onClick: () => navigate('/purchase-requests')
    },
  ] : [];

  const quickActions = [
    { icon: <PeopleIcon />, label: 'User Management', description: 'Manage system users', path: '/users', color: '#006400' },
    { icon: <BusinessIcon />, label: 'Office Management', description: 'Manage departments', path: '/offices', color: '#004d00' },
    { icon: <InventoryIcon />, label: 'Inventory Control', description: 'Manage items & stock', path: '/items', color: '#006400' },
    { icon: <PRIcon />, label: 'Purchase Requests', description: 'Review & approve PRs', path: '/purchase-requests', color: '#004d00' },
    { icon: <TransferIcon />, label: 'Borrow Management', description: 'Track borrowed items', path: '/borrow-requests', color: '#006400' },
    { icon: <ReportsIcon />, label: 'Analytics & Reports', description: 'View system analytics', path: '/reports', color: '#004d00' },
  ];

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: '1400px', mx: 'auto', px: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom fontWeight="800" color="#006400">
            System Administrator Dashboard
          </Typography>
          <Typography variant="h6" sx={{ color: 'grey.600', fontWeight: '400' }}>
            Complete oversight and management of MinSU Inventory System
          </Typography>
        </Box>

        {/* Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {quickStats.map((stat, index) => (
            <Grid item xs={12} sm={6} lg={3} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 50%, #f5f5f5 100%)',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #006400 0%, #004d00 100%)',
                  },
                  '&:hover': { 
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0, 100, 0, 0.15)',
                    borderColor: '#006400',
                  }
                }}
                onClick={stat.onClick}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="overline" fontWeight="bold" sx={{ color: 'grey.600', fontSize: '0.65rem' }}>
                        {stat.title}
                      </Typography>
                      <Typography variant="h2" component="div" fontWeight="800" color="#006400" sx={{ mb: 1 }}>
                        {stat.value}
                      </Typography>
                      {stat.subtitle && (
                        <Typography variant="body2" sx={{ color: 'grey.600', fontWeight: '500' }}>
                          {stat.subtitle}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ color: '#006400', fontSize: 56 }}>
                      {stat.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Quick Actions */}
        <Card sx={{ mb: 4, borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
              <Typography variant="h5" fontWeight="700" color="#006400">
                Quick Actions
              </Typography>
              <Chip icon={<ScheduleIcon />} label="Most Used" size="small" sx={{ background: 'linear-gradient(135deg, #006400 0%, #004d00 100%)', color: 'white' }} />
            </Box>
            <Grid container spacing={2}>
              {quickActions.map((action, index) => (
                <Grid item xs={6} md={4} key={index}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => navigate(action.path)}
                    sx={{
                      minHeight: '140px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      p: 3,
                      border: '2px solid',
                      borderColor: 'grey.200',
                      borderRadius: 2,
                      color: '#006400',
                      '&:hover': {
                        borderColor: '#006400',
                        background: 'linear-gradient(135deg, #f8fff8 0%, #f0f8f0 100%)',
                        transform: 'translateY(-4px)',
                      }
                    }}
                  >
                    <Box sx={{ fontSize: '2rem', mb: 1.5, color: action.color }}>
                      {action.icon}
                    </Box>
                    <Typography variant="subtitle2" fontWeight="600">
                      {action.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'grey.600' }}>
                      {action.description}
                    </Typography>
                  </Button>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Charts */}
        <DashboardCharts purchaseRequests={purchaseRequests} borrows={borrows} items={items} />
      </Box>
    </DashboardLayout>
  );
}

// Supply Officer Dashboard Component
function SupplyOfficerDashboardContent({ user, stats, items, borrows, movements, purchaseRequests, navigate, theme, filterStatus, setFilterStatus, filterOffice, setFilterOffice, filterItem, setFilterItem, autoRefresh, setAutoRefresh, refreshInterval, setRefreshInterval }) {
  const priorityTasks = [
    {
      title: 'Pending Purchase Requests',
      count: purchaseRequests.filter(pr => pr.status === 'Pending').length,
      icon: <PRIcon />,
      color: 'warning',
      path: '/purchase-requests',
    },
    {
      title: 'Borrow Requests',
      count: borrows.filter(br => br.status === 'Pending').length,
      icon: <TransferIcon />,
      color: 'info',
      path: '/borrow-requests',
    },
    {
      title: 'Low Stock Items',
      count: items.filter(it => (it.stock || 0) <= (it.low_stock_threshold || 10)).length,
      icon: <WarningIcon />,
      color: 'error',
      path: '/items',
    },
    {
      title: 'Pending Deliveries',
      count: purchaseRequests.filter(pr => pr.status === 'Approved' && !pr.delivered_at).length,
      icon: <DeliveryIcon />,
      color: 'success',
      path: '/items',
    },
  ];

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
              <Typography variant="h6" color="text.secondary">
                Inventory management and request processing
              </Typography>
            </Box>
            <Chip icon={<TrendingUpIcon />} label="Live Monitoring" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
          </Box>

          {/* Filters */}
          <Paper elevation={0} sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.02), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField select label="Status Filter" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} size="small" sx={{ minWidth: 140 }}>
                <MenuItem value="All">All Status</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Approved">Approved</MenuItem>
                <MenuItem value="Rejected">Rejected</MenuItem>
              </TextField>
              <TextField label="Search Items" value={filterItem} onChange={e => setFilterItem(e.target.value)} size="small" sx={{ minWidth: 180 }} placeholder="Enter item name..." />
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 'auto' }}>
                <Button variant={autoRefresh ? "contained" : "outlined"} color="primary" size="small" startIcon={<Refresh />} onClick={() => setAutoRefresh(v => !v)}>
                  {autoRefresh ? "Auto Refresh" : "Manual"}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Priority Tasks */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {priorityTasks.map((task, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  background: `linear-gradient(135deg, ${alpha(theme.palette[task.color].main, 0.05)} 0%, ${alpha(theme.palette[task.color].main, 0.02)} 100%)`,
                  border: `1px solid ${alpha(theme.palette[task.color].main, 0.1)}`,
                  '&:hover': { transform: 'translateY(-8px)', boxShadow: 4 }
                }}
                onClick={() => navigate(task.path)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ color: `${task.color}.main`, fontSize: 48 }}>
                      {task.icon}
                    </Box>
                    <Chip label={task.count} color={task.color} size="medium" sx={{ fontWeight: 700 }} />
                  </Box>
                  <Typography variant="h6" fontWeight="600">
                    {task.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Charts */}
        <DashboardCharts purchaseRequests={purchaseRequests} borrows={borrows} items={items} />
      </Box>
    </DashboardLayout>
  );
}

// Staff Dashboard Component
function StaffDashboardContent({ user, items, borrows, navigate, theme }) {
  const myBorrows = borrows.filter(b => b.borrowed_by === user.id || b.borrowedBy?.id === user.id);

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight="700">
            Welcome, {user.name}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's your personal dashboard
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <InventoryIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6" fontWeight="600">
                    Available Items
                  </Typography>
                </Box>
                <Typography variant="h3" fontWeight="700" color="primary.main">
                  {items.filter(i => i.status === 'Available').length}
                </Typography>
                <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/items')}>
                  Browse Items
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AssignmentIcon sx={{ color: 'warning.main', mr: 1 }} />
                  <Typography variant="h6" fontWeight="600">
                    My Borrows
                  </Typography>
                </Box>
                <Typography variant="h3" fontWeight="700" color="warning.main">
                  {myBorrows.filter(b => b.status === 'Approved').length}
                </Typography>
                <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/borrow-requests')}>
                  View My Requests
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ShoppingCartIcon sx={{ color: 'info.main', mr: 1 }} />
                  <Typography variant="h6" fontWeight="600">
                    Request Item
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Need equipment? Submit a request or borrow an item.
                </Typography>
                <Button variant="contained" sx={{ mt: 1 }} onClick={() => navigate('/borrow-requests')}>
                  Create Request
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
}
