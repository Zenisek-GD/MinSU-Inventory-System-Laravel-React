// src/components/Layout/Sidebar.jsx
import React from 'react';
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

  const getNavItems = () => {
    const baseItems = [
      { 
        path: '/dashboard', 
        icon: <DashboardIcon />, 
        label: 'Dashboard', 
        roles: ['admin', 'supply_officer', 'staff'] 
      },
    ];

    if (user?.role === 'admin') {
      return [
        ...baseItems,
        { path: '/offices', icon: <OfficeIcon />, label: 'Manage Offices', roles: ['admin'] },
        { path: '/users', icon: <UsersIcon />, label: 'Manage Users', roles: ['admin'] },
        { path: '/items', icon: <ItemsIcon />, label: 'Manage Items', roles: ['admin'] },
        { path: '/categories', icon: <CategoryIcon />, label: 'Categories', roles: ['admin'] },
        { path: '/purchase-requests', icon: <PurchaseIcon />, label: 'Purchase Requests', roles: ['admin'] },
        { path: '/borrows', icon: <BorrowIcon />, label: 'Borrow Requests', roles: ['admin'] },
        { path: '/inventory', icon: <InventoryIcon />, label: 'Inventory', roles: ['admin'] },
        { path: '/reports', icon: <ReportsIcon />, label: 'Reports', roles: ['admin'] },
        { path: '/qr-scanner', icon: <QRIcon />, label: 'QR Scanner', roles: ['admin'] },
      ];
    }

    if (user?.role === 'supply_officer') {
      return [
        ...baseItems,
        { path: '/purchase-requests', icon: <PurchaseIcon />, label: 'Purchase Requests', roles: ['supply_officer'] },
        { path: '/borrows', icon: <BorrowIcon />, label: 'Borrow Requests', roles: ['supply_officer'] },
        { path: '/inventory', icon: <InventoryIcon />, label: 'Inventory', roles: ['supply_officer'] },
        { path: '/items', icon: <ItemsIcon />, label: 'Item Catalog', roles: ['supply_officer'] },
        { path: '/monitoring', icon: <ReportsIcon />, label: 'Monitoring', roles: ['supply_officer'] },
        { path: '/transaction-logs', icon: <HistoryIcon />, label: 'Transaction Logs', roles: ['supply_officer'] },
        { path: '/return-processing', icon: <CheckIcon />, label: 'Return Processing', roles: ['supply_officer'] },
        { path: '/qr-scanner', icon: <QRIcon />, label: 'QR Scanner', roles: ['supply_officer'] },
      ];
    }

    if (user?.role === 'staff') {
      return [
        ...baseItems,
        { path: '/my-requests', icon: <HistoryIcon />, label: 'My Requests', roles: ['staff'] },
        { path: '/request-item', icon: <AddIcon />, label: 'Request Item', roles: ['staff'] },
        { path: '/borrow-item', icon: <BorrowIcon />, label: 'Borrow Item', roles: ['staff'] },
        { path: '/available-items', icon: <CartIcon />, label: 'Available Items', roles: ['staff'] },
        { path: '/qr-scanner', icon: <QRIcon />, label: 'QR Scanner', roles: ['staff'] },
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

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
          MinSU Inventory
        </Typography>
      </Toolbar>
      
      <Divider />
      
      {/* User Info */}
      {user && (
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="subtitle2" fontWeight="bold" color="#006400" fontSize="0.8rem">
            {user.role === 'admin' ? 'Administrator' : 
             user.role === 'supply_officer' ? 'Supply Officer' : 'Staff'}
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
            button
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