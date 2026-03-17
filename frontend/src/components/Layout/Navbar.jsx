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
  Inventory as InventoryIcon,
  Build as BuildIcon,
  Checklist as ChecklistIcon,
  PublishedWithChanges as PublishedWithChangesIcon,
} from '@mui/icons-material';
import { logout as logoutApi } from '../../api/Auth';
import { useUser } from '../../context/UserContext';
import { fetchNotificationAlerts } from '../../api/reports';

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
      // Removed auto-polling - only load on mount
    }
  }, [user?.id]);

  const getNotifIcon = (type) => {
    switch (type) {
      case 'borrow_pending': return <AssignmentIcon />;
      case 'borrow_overdue': return <WarningIcon />;
      case 'low_stock': return <InventoryIcon />;
      case 'needs_maintenance': return <BuildIcon />;
      case 'borrow_approved': return <CheckCircleIcon />;
      case 'borrow_rejected': return <CloseIcon />;
      case 'return_reminder': return <ScheduleIcon />;
      case 'mr_created': return <AssignmentIcon />;
      case 'mr_approved': return <CheckCircleIcon />;
      case 'mr_rejected': return <CloseIcon />;
      case 'mr_received': return <ChecklistIcon />;
      case 'mr_returned': return <PublishedWithChangesIcon />;
      case 'mr_pending_approval': return <WarningIcon />;
      default: return <InfoIcon />;
    }
  };

  const loadNotifications = async () => {
    try {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

      let allNotifications = [];

      if (user?.role === 'admin' || user?.role === 'supply_officer') {
        // Fetch both types of notifications for admins and supply officers
        const alertRes = await fetchNotificationAlerts();
        const alerts = (alertRes?.data || []).map(a => ({
          ...a,
          time: a.time ? new Date(a.time) : new Date(),
          icon: getNotifIcon(a.type),
        }));
        allNotifications = [...allNotifications, ...alerts];

        // Also fetch database notifications if they exist
        try {
          const { fetchUserNotifications } = await import('../../api/reports');
          const notifRes = await fetchUserNotifications();
          const dbNotifs = (notifRes?.data || []).map(n => ({
            id: `notification-${n.id}`,
            type: n.type,
            title: n.title,
            message: n.message,
            time: new Date(n.created_at),
            color: n.color || 'info',
            icon: getNotifIcon(n.type),
            link: n.action_link || '/memorandum-receipts',
          }));
          allNotifications = [...dbNotifs, ...allNotifications];
        } catch (err) {
          console.error('Failed to fetch database notifications:', err);
        }
      } else if (user?.role === 'staff') {
        // For staff: load their own borrow and MR notifications
        try {
          const { fetchUserNotifications } = await import('../../api/reports');
          const notifRes = await fetchUserNotifications();
          const dbNotifs = (notifRes?.data || []).map(n => ({
            id: `notification-${n.id}`,
            type: n.type,
            title: n.title,
            message: n.message,
            time: new Date(n.created_at),
            color: n.color || 'info',
            icon: getNotifIcon(n.type),
            link: n.action_link || '/memorandum-receipts',
          }));
          allNotifications = [...dbNotifs];
        } catch (err) {
          console.error('Failed to fetch notifications:', err);
        }

        // Also get borrow notifications
        const { fetchBorrowsReport } = await import('../../api/reports');
        const res = await fetchBorrowsReport({});
        const borrows = res?.data || [];
        const now = new Date();
        const notifs = [];

        borrows
          .filter(b => b.borrowed_by === user?.id || b.borrowedBy?.id === user?.id)
          .forEach(b => {
            if (b.status === 'Approved') {
              notifs.push({
                id: `borrow-approved-${b.id}`, type: 'borrow_approved',
                title: 'Borrow Request Approved',
                message: `Your request for ${b.item?.name} has been approved`,
                time: new Date(b.updated_at), icon: <CheckCircleIcon />, color: 'success', link: '/borrows',
              });
              // Return reminder (within 3 days)
              if (b.expected_return_date) {
                const returnDate = new Date(b.expected_return_date);
                const days = Math.floor((returnDate - now) / 86400000);
                if (days >= 0 && days <= 3) {
                  notifs.push({
                    id: `return-reminder-${b.id}`, type: 'return_reminder',
                    title: 'Return Reminder',
                    message: `${b.item?.name} is due in ${days} day${days !== 1 ? 's' : ''}`,
                    time: returnDate, icon: <ScheduleIcon />, color: days === 0 ? 'error' : 'warning', link: '/borrows',
                  });
                }
              }
            } else if (b.status === 'Rejected') {
              notifs.push({
                id: `borrow-rejected-${b.id}`, type: 'borrow_rejected',
                title: 'Borrow Request Rejected',
                message: `Your request for ${b.item?.name} was not approved`,
                time: new Date(b.updated_at), icon: <CloseIcon />, color: 'error', link: '/borrows',
              });
            }
          });

        allNotifications = [...allNotifications, ...notifs];
      }

      // Sort by most recent and limit to 15
      allNotifications.sort((a, b) => {
        const timeA = a.time instanceof Date ? a.time : new Date(a.time);
        const timeB = b.time instanceof Date ? b.time : new Date(b.time);
        return timeB - timeA;
      });
      setNotifications(allNotifications.slice(0, 15));
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
      '/memorandum-receipts': 'Memorandum Receipts',
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
            MinSU Real-Time Supply Operations Management System
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.75rem' }}>
            Bongabong Campus
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Mobile Scanner */}
          <IconButton
            color="inherit"
            onClick={() => navigate('/scanner/desktop-mobile')}
            sx={{
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
            }}
            title="Mobile Scanner - Desktop Controller"
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

          {notifications.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No new notifications
              </Typography>
            </Box>
          )}

          {notifications.length > 0 && [
            notifications.map((notif, index) => (
              <Box key={`notif-${notif.id}`}>
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
              </Box>
            )),
            <Divider key="divider-1" />,
            <Box key="mark-all" sx={{ p: 1, textAlign: 'center' }}>
              <MenuItem
                onClick={async () => {
                  try {
                    const { markAllNotificationsRead } = await import('../../api/reports');
                    await markAllNotificationsRead();
                    setNotifications([]);
                    handleNotificationClose();
                  } catch (error) {
                    console.error('Failed to mark all as read:', error);
                  }
                }}
                sx={{ justifyContent: 'center', color: 'primary.main' }}
              >
                <DoneIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2" fontWeight={600}>
                  Mark all as read
                </Typography>
              </MenuItem>
            </Box>
          ]}
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