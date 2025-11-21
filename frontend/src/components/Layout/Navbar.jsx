// src/components/Layout/Navbar.jsx
import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { logout as logoutApi } from '../../api/Auth';
import { useUser } from '../../context/UserContext';

const Navbar = ({ onMenuToggle }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // user is now provided by context

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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
          <IconButton 
            color="inherit"
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <Badge badgeContent={4} color="error" sx={{
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