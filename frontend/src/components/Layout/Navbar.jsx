// src/components/Layout/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Divider,
  ListItemText,
  ListItemIcon,
  Chip,
  Paper,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  QrCode as QrCodeIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Done as DoneIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { logout as logoutApi } from '../../api/Auth';
import { useUser } from '../../context/UserContext';
import { fetchBorrows } from '../../api/borrow';
import { fetchPurchaseRequests } from '../../api/purchaseRequest';

const Navbar = ({ onMenuToggle }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      // Refresh notifications every 60 seconds
      const interval = setInterval(loadNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const loadNotifications = async () => {
    try {
      // Avoid duplicate polling while on borrows pages
      if (location.pathname === '/borrows' || location.pathname === '/current-borrows') return;
      // Pause when tab is not visible
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      const notifs = [];
      const now = new Date();

      // Load borrow requests
      const borrowsData = await fetchBorrows({});
      const borrows = Array.isArray(borrowsData) ? borrowsData : borrowsData.data || [];

      // For admin/supply officer: pending borrow requests
      if (user?.role === 'admin' || user?.role === 'supply_officer') {
        const pendingBorrows = borrows.filter(b => b.status === 'Pending');
        pendingBorrows.forEach(b => {
          notifs.push({
            id: `borrow-${b.id}`,
            type: 'borrow_pending',
            title: 'New Borrow Request',
            message: `${b.borrowed_by?.name || b.borrowedBy?.name} requested to borrow ${b.item?.name}`,
            time: new Date(b.created_at),
            icon: <AssignmentIcon />,
            color: 'warning',
            link: '/borrows'
          });
        });

        // Overdue borrows
        const overdueBorrows = borrows.filter(b => 
          b.status === 'Approved' && 
          b.expected_return_date && 
          new Date(b.expected_return_date) < now
        );
        overdueBorrows.forEach(b => {
          notifs.push({
            id: `overdue-${b.id}`,
            type: 'borrow_overdue',
            title: 'Overdue Borrow',
            message: `${b.item?.name} is overdue by ${Math.floor((now - new Date(b.expected_return_date)) / (1000 * 60 * 60 * 24))} days`,
            time: new Date(b.expected_return_date),
            icon: <WarningIcon />,
            color: 'error',
            link: '/borrows'
          });
        });

        // Temporarily disable PR notifications
        /*
        // Load purchase requests - wrap in try/catch to prevent error from breaking notifications
        try {
          const prData = await fetchPurchaseRequests();
          const prs = Array.isArray(prData) ? prData : prData.data || [];
          const pendingPRs = prs.filter(pr => pr.status === 'Pending');
          pendingPRs.forEach(pr => {
            notifs.push({
              id: `pr-${pr.id}`,
              type: 'pr_pending',
              title: 'New Purchase Request',
              message: `${pr.requested_by?.name || pr.requestedBy?.name} requested ${pr.items?.length || 0} items`,
              time: new Date(pr.created_at),
              icon: <InfoIcon />,
              color: 'info',
              link: '/purchase-requests'
            });
          });
        } catch (prError) {
          // Silently ignore PR notification errors
        }
        */
      }

      // For staff: their approved/rejected borrow requests
      if (user?.role === 'staff') {
        const myBorrows = borrows.filter(b => 
          b.user_id === user?.id && 
          (b.status === 'Approved' || b.status === 'Rejected')
        );
        myBorrows.forEach(b => {
          if (b.status === 'Approved') {
            notifs.push({
              id: `borrow-approved-${b.id}`,
              type: 'borrow_approved',
              title: 'Borrow Request Approved',
              message: `Your request for ${b.item?.name} has been approved`,
              time: new Date(b.updated_at),
              icon: <CheckCircleIcon />,
              color: 'success',
              link: '/borrows'
            });
          } else if (b.status === 'Rejected') {
            notifs.push({
              id: `borrow-rejected-${b.id}`,
              type: 'borrow_rejected',
              title: 'Borrow Request Rejected',
              message: `Your request for ${b.item?.name} was not approved`,
              time: new Date(b.updated_at),
              icon: <CloseIcon />,
              color: 'error',
              link: '/borrows'
            });
          }
        });

        // Upcoming return dates
        const upcomingReturns = borrows.filter(b => 
          b.user_id === user?.id &&
          b.status === 'Approved' && 
          b.expected_return_date
        );
        upcomingReturns.forEach(b => {
          const returnDate = new Date(b.expected_return_date);
          const daysUntilReturn = Math.floor((returnDate - now) / (1000 * 60 * 60 * 24));
          if (daysUntilReturn >= 0 && daysUntilReturn <= 3) {
            notifs.push({
              id: `return-reminder-${b.id}`,
              type: 'return_reminder',
              title: 'Return Reminder',
              message: `${b.item?.name} is due in ${daysUntilReturn} day${daysUntilReturn !== 1 ? 's' : ''}`,
              time: returnDate,
              icon: <ScheduleIcon />,
              color: daysUntilReturn === 0 ? 'error' : 'warning',
              link: '/borrows'
            });
          }
        });
      }

      // Sort by time (most recent first)
      notifs.sort((a, b) => b.time - a.time);
      setNotifications(notifs.slice(0, 10)); // Keep only latest 10
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  // user is now provided by context

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleNotificationClick = (notification) => {
    navigate(notification.link);
    handleNotificationClose();
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
    handleMenuClose();
  };

  const getPageTitle = () => {
    const path = location.pathname;
    const titles = {
      '/offices': 'Manage Offices',
      '/users': 'Manage Users',
      '/items': 'Manage Items',
      '/categories': 'Manage Categories',
      '/purchase-requests': 'Purchase Requests',
      '/borrow-requests': 'Borrow Requests',
      '/inventory': 'Inventory Management',
      '/my-requests': 'My Requests',
      '/request-item': 'Request Item',
      '/borrow-item': 'Borrow Item',
      '/current-borrows': 'My Borrows',
      '/available-items': 'Available Items',
      '/reports': 'Reports',
      '/qr-scanner': 'QR Scanner',
    };
    return titles[path] || 'Dashboard';
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: 'linear-gradient(135deg, #006400 0%, #004d00 100%)',
        color: 'white',
        boxShadow: '0 4px 20px rgba(0, 100, 0, 0.15)',
        borderBottom: '1px solid #e0e0e0'
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuToggle}
          sx={{ 
            mr: 2, 
            display: { md: 'none' },
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <MenuIcon />
        </IconButton>
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" noWrap component="div" fontWeight="bold" fontSize="1.25rem">
            MinSU Inventory Management System
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.75rem' }}>
            Bongabong Campus
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Quick QR Scanner */}
          <IconButton 
            color="inherit"
            onClick={() => navigate('/qr-scanner')}
            sx={{
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            <QrCodeIcon />
          </IconButton>

          <IconButton 
            color="inherit"
            onClick={handleNotificationOpen}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <Badge badgeContent={notifications.length} color="error" sx={{
              '& .MuiBadge-badge': {
                backgroundColor: '#FFD700',
                color: '#006400',
                fontWeight: 'bold'
              }
            }}>
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          <IconButton
            onClick={handleProfileMenuOpen}
            color="inherit"
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <Avatar 
              sx={{ 
                width: 36, 
                height: 36, 
                bgcolor: '#FFD700',
                color: '#006400',
                fontWeight: 'bold',
                border: '2px solid white'
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : <PersonIcon fontSize="small" />}
            </Avatar>
          </IconButton>
        </Box>
        
        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
          PaperProps={{
            sx: {
              mt: 1.5,
              maxWidth: 400,
              width: '100%',
              maxHeight: 500,
              overflow: 'auto'
            }
          }}
        >
          <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" fontWeight={700}>
              Notifications
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {notifications.length} unread notification{notifications.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No new notifications
              </Typography>
            </Box>
          ) : (
            notifications.map((notif, index) => (
              <React.Fragment key={notif.id}>
                <MenuItem 
                  onClick={() => handleNotificationClick(notif)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    alignItems: 'flex-start',
                    '&:hover': {
                      bgcolor: alpha(theme.palette[notif.color].main, 0.05)
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        bgcolor: alpha(theme.palette[notif.color].main, 0.1),
                        color: `${notif.color}.main`
                      }}
                    >
                      {notif.icon}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {notif.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          {getTimeAgo(notif.time)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {notif.message}
                      </Typography>
                    }
                  />
                </MenuItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))
          )}
          
          {notifications.length > 0 && (
            <>
              <Divider />
              <Box sx={{ p: 1, textAlign: 'center' }}>
                <MenuItem 
                  onClick={() => {
                    setNotifications([]);
                    handleNotificationClose();
                  }}
                  sx={{ justifyContent: 'center', color: 'primary.main' }}
                >
                  <DoneIcon fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="body2" fontWeight={600}>
                    Mark all as read
                  </Typography>
                </MenuItem>
              </Box>
            </>
          )}
        </Menu>
        
        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              mt: 1.5,
              '& .MuiMenuItem-root': {
                fontSize: '0.875rem',
                '&:hover': {
                  backgroundColor: '#f5f5f5'
                }
              }
            }
          }}
        >
          <MenuItem onClick={handleMenuClose}>
            <PersonIcon fontSize="small" sx={{ mr: 1.5, color: '#006400' }} />
            Profile
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <LogoutIcon fontSize="small" sx={{ mr: 1.5, color: '#d32f2f' }} />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;