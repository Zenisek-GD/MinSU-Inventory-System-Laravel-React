// src/components/Layout/Sidebar.jsx
import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Business as OfficeIcon,
  People as UsersIcon,
  Inventory as ItemsIcon,
  Category as CategoryIcon,
  RequestQuote as PurchaseIcon,
  SwapHoriz as BorrowIcon,
  Assessment as ReportsIcon,
  Warehouse as InventoryIcon,
  Add as AddIcon,
  ShoppingCart as CartIcon,
  QrCode as QRIcon,
  History as HistoryIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useUser } from '../../context/UserContext';

const Sidebar = ({ mobileOpen, onMenuToggle, isMobile }) => {
  const { user } = useUser();
  const location = useLocation();
  const drawerWidth = 280;

  const navItems = useMemo(() => {
    const baseItems = [
      {
        path: '/dashboard',
        icon: <DashboardIcon />,
        label: 'Dashboard',
        roles: ['admin', 'supply_officer', 'property_custodia', 'staff']
      },
    ];

    if (user?.role === 'admin') {
      return [
        ...baseItems,
        { path: '/locations', icon: <OfficeIcon />, label: 'Locations', roles: ['admin'] },
        { path: '/users', icon: <UsersIcon />, label: 'Manage Users', roles: ['admin'] },
        { path: '/items', icon: <ItemsIcon />, label: 'Items & Inventory', roles: ['admin'] },
        { path: '/categories', icon: <CategoryIcon />, label: 'Categories', roles: ['admin'] },
        { path: '/memorandum-receipts', icon: <PurchaseIcon />, label: 'Memorandum Receipts', roles: ['admin'] },
        { path: '/borrows', icon: <BorrowIcon />, label: 'Borrow Requests', roles: ['admin'] },
        { path: '/stock-movements', icon: <HistoryIcon />, label: 'Stock Movements', roles: ['admin'] },
        { path: '/received-supplies-log', icon: <CheckIcon />, label: 'Received Supplies Log', roles: ['admin'] },
        { path: '/reports', icon: <ReportsIcon />, label: 'Reports', roles: ['admin'] },
      ];
    }

    if (user?.role === 'supply_officer') {
      return [
        ...baseItems,
        { path: '/locations', icon: <OfficeIcon />, label: 'Locations', roles: ['supply_officer'] },
        { path: '/users', icon: <UsersIcon />, label: 'Manage Users', roles: ['supply_officer'] },
        { path: '/items', icon: <ItemsIcon />, label: 'Items & Inventory', roles: ['supply_officer'] },
        { path: '/categories', icon: <CategoryIcon />, label: 'Categories', roles: ['supply_officer'] },
        { path: '/memorandum-receipts', icon: <PurchaseIcon />, label: 'Memorandum Receipts', roles: ['supply_officer'] },
        { path: '/borrows', icon: <BorrowIcon />, label: 'Borrow Requests', roles: ['supply_officer'] },
        { path: '/stock-movements', icon: <HistoryIcon />, label: 'Stock Movements', roles: ['supply_officer'] },
        { path: '/received-supplies-log', icon: <CheckIcon />, label: 'Received Supplies Log', roles: ['supply_officer'] },
        { path: '/reports', icon: <ReportsIcon />, label: 'Reports', roles: ['supply_officer'] },
      ];
    }

    if (user?.role === 'property_custodia') {
      return [
        ...baseItems,
        { path: '/available-items', icon: <CartIcon />, label: 'Browse Items', roles: ['property_custodia'] },
        { path: '/memorandum-receipts', icon: <PurchaseIcon />, label: 'Memorandum Receipts', roles: ['property_custodia'] },
        { path: '/borrows', icon: <BorrowIcon />, label: 'Borrow Items', roles: ['property_custodia'] },
      ];
    }

    if (['staff', 'faculty'].includes((user?.role || '').toLowerCase())) {
      return [
        {
          path: '/staff-dashboard',
          icon: <DashboardIcon />,
          label: 'My Dashboard',
          roles: ['staff', 'faculty']
        },
        { path: '/available-items', icon: <CartIcon />, label: 'Browse Items', roles: ['staff', 'faculty'] },
        { path: '/request-item', icon: <AddIcon />, label: 'Request Item', roles: ['staff', 'faculty'] },
        { path: '/borrows', icon: <BorrowIcon />, label: 'Borrow Items', roles: ['staff', 'faculty'] },
      ];
    }

    return baseItems;
  }, [user?.role]);

  const drawer = (
    <Box sx={{ height: '100%', background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)' }}>
      {/* Header */}
      <Toolbar
        sx={{
          background: 'linear-gradient(135deg, #006400 0%, #004d00 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(0, 100, 0, 0.2)'
        }}
      >
        <Typography variant="h6" noWrap component="div" fontWeight="bold" fontSize="1.1rem">
          MinSU Supply Ops
        </Typography>
      </Toolbar>

      <Divider />

      {/* User Info */}
      {user && (
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="subtitle2" fontWeight="bold" color="#006400" fontSize="0.8rem">
            {user.role === 'admin' ? 'Administrator' :
              user.role === 'supply_officer' ? 'Supply Officer' :
              user.role === 'property_custodia' ? 'Property Custodian' : 'Staff'}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
            {user.name}
          </Typography>
        </Box>
      )}

      {/* Navigation Items */}
      <List sx={{ px: 1.5, pt: 2 }}>
        {navItems.map((item) => (
          <ListItem
            key={item.path}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            onClick={isMobile ? onMenuToggle : undefined}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              transition: 'all 0.2s ease-in-out',
              '&.Mui-selected': {
                background: 'linear-gradient(135deg, #006400 0%, #004d00 100%)',
                color: 'white',
                boxShadow: '0 2px 8px rgba(0, 100, 0, 0.3)',
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
                '&:hover': {
                  background: 'linear-gradient(135deg, #004d00 0%, #003800 100%)',
                },
              },
              '&:hover': {
                backgroundColor: '#e8f5e8',
                color: '#006400',
                transform: 'translateX(4px)',
                '& .MuiListItemIcon-root': {
                  color: '#006400',
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: 'inherit',
                minWidth: 40,
                transition: 'color 0.2s ease-in-out'
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: location.pathname === item.path ? '600' : '400'
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMenuToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            border: 'none',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            border: 'none',
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;