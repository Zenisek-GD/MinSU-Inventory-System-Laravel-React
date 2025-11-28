// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { fetchDashboardStats } from '../../api/dashboard';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Paper,
  List,
  ListItem,
  Chip,
  alpha,
} from '@mui/material';
import {
  People as UsersIcon,
  Business as OfficeIcon,
  Inventory as ItemsIcon,
  RequestQuote as PRIcon,
  SwapHoriz as BorrowIcon,
  Assessment as ReportsIcon,
  TrendingUp as TrendingIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  NotificationsActive as AlertIcon,
  ArrowForward as ArrowIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon, subtitle, trend, onClick }) => (
  <Card 
    sx={{ 
      height: '100%',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 50%, #f5f5f5 100%)',
      border: '1px solid',
      borderColor: 'grey.200',
      position: 'relative',
      overflow: 'hidden',
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
        transform: onClick ? 'translateY(-8px) scale(1.02)' : 'none',
        boxShadow: onClick ? '0 20px 40px rgba(0, 100, 0, 0.15)' : '0 4px 20px rgba(0, 0, 0, 0.08)',
        borderColor: onClick ? '#006400' : 'grey.300',
        '& .stat-icon': {
          transform: 'scale(1.1)',
          color: '#004d00'
        }
      }
    }}
    onClick={onClick}
  >
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box sx={{ flex: 1 }}>
          <Typography 
            gutterBottom 
            variant="overline" 
            fontWeight="bold"
            sx={{ 
              color: 'grey.600', 
              fontSize: '0.65rem',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}
          >
            {title}
          </Typography>
          <Typography variant="h2" component="div" fontWeight="800" color="#006400" sx={{ mb: 1 }}>
            {value}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {subtitle && (
              <Typography variant="body2" sx={{ color: 'grey.600', fontWeight: '500' }}>
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Chip 
                label={trend} 
                size="small" 
                color="success"
                sx={{ 
                  height: '20px', 
                  fontSize: '0.6rem',
                  fontWeight: 'bold'
                }}
              />
            )}
          </Box>
        </Box>
        <Box 
          className="stat-icon"
          sx={{ 
            color: '#006400', 
            fontSize: 56, 
            opacity: 0.9,
            transition: 'all 0.3s ease',
            filter: 'drop-shadow(0 4px 8px rgba(0, 100, 0, 0.1))'
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const data = await fetchDashboardStats();
        setStats(data);
      } catch (err) {
        setError('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const quickStats = stats ? [
    {
      title: 'Total Users',
      value: (stats.users.admin + stats.users.supply_officer + stats.users.staff),
      icon: <UsersIcon fontSize="inherit" />,
      subtitle: 'Active members',
      trend: '',
      onClick: () => navigate('/users')
    },
    {
      title: 'Departments',
      value: stats.offices.length,
      icon: <OfficeIcon fontSize="inherit" />,
      subtitle: 'Managed offices',
      trend: '',
      onClick: () => navigate('/offices')
    },
    {
      title: 'Inventory Items',
      value: stats.items.length,
      icon: <ItemsIcon fontSize="inherit" />,
      subtitle: '',
      trend: '',
      onClick: () => navigate('/items')
    },
    {
      title: 'Pending Requests',
      value: stats.purchaseRequests.filter(pr => pr.status === 'Pending').length,
      icon: <PRIcon fontSize="inherit" />,
      subtitle: 'Awaiting approval',
      trend: '',
      onClick: () => navigate('/purchase-requests')
    },
  ] : [];

  const quickActions = [
    { 
      icon: <UsersIcon />, 
      label: 'User Management', 
      description: 'Manage system users',
      path: '/users',
      color: '#006400'
    },
    { 
      icon: <OfficeIcon />, 
      label: 'Office Management', 
      description: 'Manage departments',
      path: '/offices',
      color: '#004d00'
    },
    { 
      icon: <ItemsIcon />, 
      label: 'Inventory Control', 
      description: 'Manage items & stock',
      path: '/items',
      color: '#006400'
    },
    { 
      icon: <PRIcon />, 
      label: 'Purchase Requests', 
      description: 'Review & approve PRs',
      path: '/purchase-requests',
      color: '#004d00'
    },
    { 
      icon: <BorrowIcon />, 
      label: 'Borrow Management', 
      description: 'Track borrowed items',
      path: '/borrow-requests',
      color: '#006400'
    },
    { 
      icon: <ReportsIcon />, 
      label: 'Analytics & Reports', 
      description: 'View system analytics',
      path: '/reports',
      color: '#004d00'
    },
  ];

  const recentActivities = [
    { 
      user: 'Dr. Maria Santos', 
      action: 'approved purchase request for lab equipment', 
      time: '2 hours ago', 
      type: 'purchase',
      priority: 'high'
    },
    { 
      user: 'Engr. Juan Dela Cruz', 
      action: 'borrowed multimedia projector for seminar', 
      time: '5 hours ago', 
      type: 'borrow',
      priority: 'medium'
    },
    { 
      user: 'Prof. Robert Lim', 
      action: 'added new Computer Laboratory department', 
      time: '1 day ago', 
      type: 'office',
      priority: 'medium'
    },
    { 
      user: 'Admin System', 
      action: 'automated backup completed successfully', 
      time: '1 day ago', 
      type: 'system',
      priority: 'low'
    },
  ];

  const systemMetrics = [
    { 
      metric: 'System Uptime', 
      value: '99.98%', 
      icon: <CheckIcon />, 
      status: 'excellent',
      trend: '+0.02%'
    },
    { 
      metric: 'Response Time', 
      value: '128ms', 
      icon: <TrendingIcon />, 
      status: 'good',
      trend: '-12ms'
    },
    { 
      metric: 'Active Sessions', 
      value: '47', 
      icon: <UsersIcon />, 
      status: 'normal',
      trend: '+8'
    },
    { 
      metric: 'Security Level', 
      value: 'High', 
      icon: <SecurityIcon />, 
      status: 'secure',
      trend: 'Optimal'
    },
  ];

  const getActivityIcon = (type) => {
    const icons = {
      purchase: <PRIcon sx={{ color: '#d32f2f' }} />,
      borrow: <BorrowIcon sx={{ color: '#ed6c02' }} />,
      office: <OfficeIcon sx={{ color: '#2e7d32' }} />,
      system: <SecurityIcon sx={{ color: '#1976d2' }} />,
      user: <UsersIcon sx={{ color: '#7b1fa2' }} />
    };
    return icons[type] || <TrendingIcon sx={{ color: 'grey.500' }} />;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: '#d32f2f',
      medium: '#ed6c02',
      low: '#2e7d32'
    };
    return colors[priority] || 'grey.500';
  };

  // Shared card styling so major dashboard cards align to the same width/look
  const unifiedCardSx = {
    background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
    border: '1px solid',
    borderColor: 'grey.200',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    borderRadius: 3,
    width: '100%'
  };

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
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>Loading dashboard stats...</Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', color: 'red', py: 6 }}>{error}</Box>
        ) : (
          <Grid container spacing={3} sx={{ mb: 6 }}>
            {quickStats.map((stat, index) => (
              <Grid item xs={12} sm={6} lg={3} key={index}>
                <StatCard {...stat} />
              </Grid>
            ))}
          </Grid>
        )}

<Grid container spacing={4}>
  {/* Quick Actions */}
  <Grid item xs={12} lg={6}>
    <Card sx={unifiedCardSx}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Typography variant="h5" fontWeight="700" color="#006400">
            Quick Actions
          </Typography>
          <Chip 
            icon={<ScheduleIcon />} 
            label="Most Used" 
            size="small"
            sx={{ background: 'linear-gradient(135deg, #006400 0%, #004d00 100%)', color: 'white' }}
          />
        </Box>
        <Grid container spacing={2}>
          {quickActions.map((action, index) => (
              <Grid item xs={6} key={index}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate(action.path)}
                sx={{
                  minHeight: { xs: '140px', sm: '150px' },
                  height: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  p: 3,
                  border: '2px solid',
                  borderColor: 'grey.200',
                  borderRadius: 2,
                  color: '#006400',
                  background: 'white',
                  textAlign: 'left',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'normal',
                  overflowWrap: 'anywhere',
                  '& .MuiTypography-root': {
                    whiteSpace: 'normal'
                  },
                  '&:hover': {
                    borderColor: '#006400',
                    background: 'linear-gradient(135deg, #f8fff8 0%, #f0f8f0 100%)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(0, 100, 0, 0.15)'
                  }
                }}
              >
                <Box sx={{ fontSize: '2rem', mb: 1.5, color: action.color }}>
                  {action.icon}
                </Box>
                <Box sx={{ flex: 1, width: '100%', pr: 3 }}>
                  <Typography variant="subtitle2" fontWeight="600" sx={{ lineHeight: 1.2, mb: 0.5 }}>
                    {action.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'grey.600', lineHeight: 1.2, display: 'block' }}>
                    {action.description}
                  </Typography>
                </Box>
                <ArrowIcon 
                  sx={{ 
                    position: 'absolute', 
                    bottom: 12, 
                    right: 12, 
                    fontSize: '1rem',
                    color: '#006400',
                    opacity: 0.7
                  }} 
                />
              </Button>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  </Grid>

          {/* Recent Activities & System Metrics */}
          <Grid item xs={12} lg={6}>
            {/* Recent Activities */}
            <Card sx={{ ...unifiedCardSx, mb: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h5" fontWeight="700" color="#006400">
                    Recent Activities
                  </Typography>
                  <Chip 
                    icon={<TrendingIcon />} 
                    label="Live Feed" 
                    color="success" 
                    size="small"
                    variant="outlined"
                  />
                </Box>
                <List sx={{ p: 0 }}>
                  {recentActivities.map((activity, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 1.5 }}>
                      <Paper 
                        sx={{ 
                          p: 2.5, 
                          width: '100%', 
                          borderLeft: '4px solid',
                          borderLeftColor: getPriorityColor(activity.priority),
                          background: 'white',
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateX(8px)',
                            boxShadow: '0 8px 24px rgba(0, 100, 0, 0.12)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Box sx={{ mt: 0.5 }}>
                            {getActivityIcon(activity.type)}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="subtitle1" fontWeight="600" color="#006400">
                                {activity.user}
                              </Typography>
                              <Chip 
                                label={activity.priority} 
                                size="small"
                                sx={{ 
                                  height: '20px',
                                  fontSize: '0.6rem',
                                  fontWeight: 'bold',
                                  background: getPriorityColor(activity.priority),
                                  color: 'white'
                                }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ color: 'grey.700', mb: 1 }}>
                              {activity.action}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'grey.500', fontWeight: '500' }}>
                              {activity.time}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* System Metrics */}
            <Card sx={unifiedCardSx}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom fontWeight="700" sx={{ color: '#006400', mb: 3 }}>
                  System Performance
                </Typography>
                <Grid container spacing={2}>
                  {systemMetrics.map((metric, index) => (
                    <Grid item xs={6} key={index}>
                      <Paper 
                        sx={{ 
                          p: 3, 
                          textAlign: 'center',
                          background: 'white',
                          border: '1px solid',
                          borderColor: 'grey.200',
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 24px rgba(0, 100, 0, 0.1)'
                          }
                        }}
                      >
                        <Box sx={{ 
                          color: '#006400', 
                          fontSize: '2.5rem', 
                          mb: 2,
                          filter: 'drop-shadow(0 4px 8px rgba(0, 100, 0, 0.1))'
                        }}>
                          {metric.icon}
                        </Box>
                        <Typography variant="h4" fontWeight="800" color="#006400" sx={{ mb: 1 }}>
                          {metric.value}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'grey.600', mb: 1, fontWeight: '500' }}>
                          {metric.metric}
                        </Typography>
                        <Chip 
                          label={metric.trend} 
                          size="small"
                          color="success"
                          sx={{ 
                            fontSize: '0.6rem',
                            fontWeight: 'bold',
                            height: '20px'
                          }}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
};

export default AdminDashboard;