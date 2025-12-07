import React, { useEffect, useState } from "react";
import { fetchItems, createItem, updateItem, deleteItem } from "../api/item";
import { fetchCategories } from "../api/category";
import { fetchOffices } from "../api/office";
import { returnBorrow } from "../api/borrow";
import DashboardLayout from "../components/Layout/DashboardLayout";
import ItemQrCode from "../components/ItemQrCode";
import QRCodePrintModal from "../components/QRCodePrintModal";
import { useUser } from "../context/UserContext";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  useTheme,
  alpha,
  Container,
  Tooltip,
  Skeleton,
  Badge,
  Fade,
  CardActionArea,
  CardHeader,
  Stack,
  InputAdornment,
  Fab,
  LinearProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  QrCode as QrCodeIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Business as OfficeIcon,
  CalendarToday as DateIcon,
  AttachMoney as PriceIcon,
  Build as ConditionIcon,
  CheckCircle as AvailableIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  Logout as ReturnIcon,
  Schedule as ScheduleIcon,
  NotificationsActive as AlertIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";

const statusOptions = [
  { value: "Available", label: "Available", color: "success", icon: <AvailableIcon /> },
  { value: "Borrowed", label: "Borrowed", color: "warning", icon: <WarningIcon /> },
  { value: "Under Maintenance", label: "Under Maintenance", color: "info", icon: <WarningIcon /> },
  { value: "Lost", label: "Lost", color: "error", icon: <ErrorIcon /> },
  { value: "Disposed", label: "Disposed", color: "default", icon: <ErrorIcon /> },
];

const conditionOptions = ['Excellent', 'Good', 'Fair', 'Needs Repair', 'Damaged', 'Disposed'];
const returnConditionOptions = ['Excellent', 'Good', 'Fair', 'Needs Repair', 'Damaged'];

const ItemsPage = () => {
  const theme = useTheme();
  const { user } = useUser();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    category_id: "",
    office_id: "",
    status: "Available",
    serial_number: "",
    condition: "Good",
    purchase_date: "",
    purchase_price: "",
    warranty_expiry: "",
    notes: "",
    last_condition_check: ""
  });
  const [editing, setEditing] = useState(null);
  const [editItem, setEditItem] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrPrintOpen, setQrPrintOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnData, setReturnData] = useState({
    condition: 'Good',
    notes: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [itemData, catData, officeData] = await Promise.all([
        fetchItems(),
        fetchCategories(),
        fetchOffices(),
      ]);
      setItems(itemData.data || []);
      setCategories(catData.data || []);
      setOffices(officeData.data || []);
    } catch (err) {
      setError("Failed to load data");
      showSnackbar("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (editing) {
      await handleUpdate(editing);
      return;
    }

    try {
      const result = await createItem(newItem);
      setItems(prev => [result.item, ...prev]);
      setNewItem({
        name: "", description: "", category_id: "", office_id: "", status: "Available",
        serial_number: "", condition: "Good", purchase_date: "", purchase_price: "", warranty_expiry: "", notes: "",
        last_condition_check: ""
      });
      setDialogOpen(false);
      setSelectedItem(result.item);
      setQrPrintOpen(true);
      showSnackbar("Item created successfully! Print QR code for the new item.", "success");
    } catch {
      showSnackbar("Failed to create item", "error");
    }
  };

  const handleEdit = (item) => {
    setEditing(item.id);
    setNewItem({
      name: item.name,
      description: item.description,
      category_id: item.category_id,
      office_id: item.office_id,
      status: item.status,
      serial_number: item.serial_number,
      condition: item.condition,
      purchase_date: item.purchase_date,
      purchase_price: item.purchase_price,
      warranty_expiry: item.warranty_expiry,
      notes: item.notes,
      last_condition_check: item.last_condition_check || ""
    });
    setDialogOpen(true);
  };

  const handleUpdate = async (id) => {
    try {
      const result = await updateItem(id, newItem);
      const updatedItem = result.item;
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
      
      // Update selectedItem if it's the one being edited
      if (selectedItem?.id === id) {
        setSelectedItem(updatedItem);
      }
      
      setEditing(null);
      setNewItem({
        name: "",
        description: "",
        category_id: "",
        office_id: "",
        status: "Available",
        serial_number: "",
        condition: "Good",
        purchase_date: "",
        purchase_price: "",
        warranty_expiry: "",
        notes: "",
        last_condition_check: ""
      });
      setDialogOpen(false);
      showSnackbar("Item updated successfully", "success");
    } catch (err) {
      showSnackbar(err.response?.data?.message || "Failed to update item", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteItem(id);
      setItems(prev => prev.filter(item => item.id !== id));
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
      showSnackbar("Item deleted successfully", "success");
    } catch {
      showSnackbar("Failed to delete item", "error");
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleMarkAsReturned = async () => {
    if (!selectedItem?.currentBorrow) return;

    setReturnLoading(true);
    try {
      const result = await returnBorrow(selectedItem.currentBorrow.id, {
        condition_after: returnData.condition,
        notes: returnData.notes
      });

      await loadAll();
      
      const updatedItems = await fetchItems();
      const updated = updatedItems.data.find(item => item.id === selectedItem.id);
      setSelectedItem(updated);

      setReturnDialogOpen(false);
      setReturnData({ condition: 'Good', notes: '' });
      showSnackbar("Item marked as returned successfully", "success");
    } catch (err) {
      console.error('Error marking item as returned:', err);
      showSnackbar("Failed to mark item as returned", "error");
    } finally {
      setReturnLoading(false);
    }
  };

  const handleCloseReturnDialog = () => {
    setReturnDialogOpen(false);
    setReturnData({ condition: 'Good', notes: '' });
  };

  const getStatusConfig = (status) => {
    return statusOptions.find(opt => opt.value === status) || statusOptions[0];
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'Excellent': return 'success';
      case 'Good': return 'success';
      case 'Fair': return 'warning';
      case 'Needs Repair': return 'warning';
      case 'Damaged': return 'error';
      case 'Disposed': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const needsConditionCheck = (item) => {
    if (!item.last_condition_check) {
      if (item.purchase_date) {
        const purchaseDate = new Date(item.purchase_date);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return purchaseDate < oneYearAgo;
      }
      return true;
    }
    
    const lastCheck = new Date(item.last_condition_check);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return lastCheck < oneYearAgo;
  };

  const getDaysSinceLastCheck = (item) => {
    if (!item.last_condition_check) {
      if (item.purchase_date) {
        const purchaseDate = new Date(item.purchase_date);
        const today = new Date();
        const diffTime = Math.abs(today - purchaseDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
      }
      return 'Never';
    }
    
    const lastCheck = new Date(item.last_condition_check);
    const today = new Date();
    const diffTime = Math.abs(today - lastCheck);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.serial_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status) => {
    const config = getStatusConfig(status);
    return React.cloneElement(config.icon, { sx: { fontSize: 16 } });
  };

  return (
    <DashboardLayout>
      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        {/* Left Panel - Items List */}
        <Box sx={{ 
          width: { xs: '100%', lg: '40%' }, 
          borderRight: { lg: 1 }, 
          borderColor: 'divider', 
          display: 'flex', 
          flexDirection: 'column',
          bgcolor: 'grey.50'
        }}>
          {/* Header */}
          <Box sx={{ 
            p: 3, 
            borderBottom: 1, 
            borderColor: 'divider',
            bgcolor: 'background.paper',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h5" fontWeight="800" color="primary.main">
                  Inventory Items
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {items.length} items • {items.filter(i => i.status === 'Available').length} available
                </Typography>
              </Box>
              <Tooltip title="Refresh">
                <IconButton onClick={loadAll} sx={{ color: 'primary.main' }}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Search items..."
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2, bgcolor: 'background.paper' }
                }}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setDialogOpen(true)}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                Add
              </Button>
            </Stack>

            {/* Stats Overview */}
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <Chip 
                label={`${items.filter(i => i.status === 'Available').length} Available`} 
                color="success" 
                size="small" 
                variant="outlined"
              />
              <Chip 
                label={`${items.filter(i => i.status === 'Borrowed').length} Borrowed`} 
                color="warning" 
                size="small" 
                variant="outlined"
              />
              <Chip 
                label={`${items.filter(i => needsConditionCheck(i)).length} Needs Check`} 
                color="error" 
                size="small" 
                variant="outlined"
              />
            </Stack>
          </Box>

          {/* Items List */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {loading ? (
              <Box sx={{ p: 2 }}>
                {[...Array(5)].map((_, index) => (
                  <Skeleton 
                    key={index}
                    variant="rectangular" 
                    height={100} 
                    sx={{ 
                      borderRadius: 2, 
                      mb: 2,
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }} 
                  />
                ))}
              </Box>
            ) : error ? (
              <Alert 
                severity="error" 
                sx={{ m: 2 }}
                action={
                  <Button color="inherit" size="small" onClick={loadAll}>
                    Retry
                  </Button>
                }
              >
                {error}
              </Alert>
            ) : filteredItems.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                p: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <InventoryIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No items found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchQuery ? 'Try a different search term' : 'Add your first item to get started'}
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 1 }}>
                {filteredItems.map(item => (
                  <Fade in key={item.id}>
                    <Card
                      elevation={selectedItem?.id === item.id ? 3 : 1}
                      sx={{
                        mb: 2,
                        borderRadius: 3,
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        border: selectedItem?.id === item.id ? `2px solid ${theme.palette.primary.main}` : 'none',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                          borderColor: 'primary.light'
                        }
                      }}
                      onClick={() => setSelectedItem(item)}
                    >
                      <CardActionArea>
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <Badge
                              badgeContent={needsConditionCheck(item) ? "!" : null}
                              color="error"
                              invisible={!needsConditionCheck(item)}
                            >
                              <Avatar
                                sx={{
                                  bgcolor: alpha(theme.palette[getStatusConfig(item.display_status || item.status).color].main, 0.1),
                                  color: theme.palette[getStatusConfig(item.display_status || item.status).color].main,
                                  width: 48,
                                  height: 48,
                                  borderRadius: 2
                                }}
                              >
                                <InventoryIcon />
                              </Avatar>
                            </Badge>
                            
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Typography 
                                  variant="subtitle1" 
                                  fontWeight="600" 
                                  noWrap 
                                  sx={{ 
                                    maxWidth: '200px',
                                    color: 'text.primary'
                                  }}
                                >
                                  {item.name}
                                </Typography>
                                <Chip
                                  icon={getStatusIcon(item.display_status || item.status)}
                                  label={getStatusConfig(item.display_status || item.status).label}
                                  color={getStatusConfig(item.display_status || item.status).color}
                                  size="small"
                                  sx={{ 
                                    height: 24,
                                    fontWeight: 500,
                                    fontSize: '0.75rem'
                                  }}
                                />
                              </Box>
                              
                              <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ 
                                  mb: 1.5,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}
                              >
                                {item.description || 'No description'}
                              </Typography>
                              
                              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                                <Chip
                                  label={item.condition}
                                  color={getConditionColor(item.condition)}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                                <Typography 
                                  variant="caption" 
                                  color="text.secondary"
                                  sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    gap: 0.5
                                  }}
                                >
                                  <CategoryIcon sx={{ fontSize: 12 }} />
                                  {item.category?.name || categories.find(c => c.id === item.category_id)?.name || 'Uncategorized'}
                                </Typography>
                                {item.currentBorrow && (
                                  <Chip
                                    icon={<PersonIcon sx={{ fontSize: 12 }} />}
                                    label={`Borrowed`}
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                  />
                                )}
                              </Stack>
                            </Box>
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Fade>
                ))}
              </List>
            )}
          </Box>
        </Box>

        {/* Right Panel - Item Preview */}
        <Box sx={{ 
          width: { xs: '0%', lg: '60%' }, 
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          bgcolor: 'grey.50'
        }}>
          {selectedItem ? (
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              <Fade in>
                <Card sx={{ 
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  overflow: 'visible'
                }}>
                  <CardContent sx={{ p: 4 }}>
                    {/* Header Section */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start', 
                      mb: 3,
                      gap: 2
                    }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <Typography variant="h4" fontWeight="800" color="primary.main">
                            {selectedItem.name}
                          </Typography>
                          <Chip
                            icon={getStatusIcon(selectedItem.display_status || selectedItem.status)}
                            label={getStatusConfig(selectedItem.display_status || selectedItem.status).label}
                            color={getStatusConfig(selectedItem.display_status || selectedItem.status).color}
                            size="medium"
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                          {selectedItem.description || 'No description provided'}
                        </Typography>
                        
                        <Stack direction="row" spacing={2}>
                          <Tooltip title="Edit Item">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(selectedItem)}
                              sx={{ 
                                bgcolor: 'primary.main',
                                color: 'white',
                                '&:hover': { bgcolor: 'primary.dark' }
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Print QR Code">
                            <IconButton
                              size="small"
                              onClick={() => setQrPrintOpen(true)}
                              sx={{ 
                                bgcolor: 'success.main',
                                color: 'white',
                                '&:hover': { bgcolor: 'success.dark' }
                              }}
                            >
                              <PrintIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Item">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(selectedItem.id)}
                              sx={{ 
                                bgcolor: 'error.main',
                                color: 'white',
                                '&:hover': { bgcolor: 'error.dark' }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 4, borderColor: 'divider', borderWidth: 1 }} />

                    {/* Condition Check Alert */}
                    {needsConditionCheck(selectedItem) && (
                      <Alert 
                        severity="warning" 
                        icon={<AlertIcon />}
                        sx={{ 
                          mb: 4,
                          borderRadius: 2,
                          bgcolor: 'warning.50',
                          border: '1px solid',
                          borderColor: 'warning.light'
                        }}
                        action={
                          <Button 
                            color="inherit" 
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setNewItem({
                                ...newItem,
                                last_condition_check: new Date().toISOString().split('T')[0]
                              });
                              handleEdit(selectedItem);
                            }}
                          >
                            Update Now
                          </Button>
                        }
                      >
                        <Typography variant="subtitle2" fontWeight="600">
                          ⚠️ Annual Condition Check Required
                        </Typography>
                        <Typography variant="body2">
                          Last checked: {typeof getDaysSinceLastCheck(selectedItem) === 'number' 
                            ? `${getDaysSinceLastCheck(selectedItem)} days ago` 
                            : getDaysSinceLastCheck(selectedItem)}
                        </Typography>
                      </Alert>
                    )}

                    {/* Information Cards */}
                    <Grid container spacing={3}>
                      {/* Basic Information Card */}
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                          <CardContent>
                            <Typography variant="h6" fontWeight="600" gutterBottom sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1,
                              mb: 3 
                            }}>
                              <InfoIcon color="primary" /> Basic Information
                            </Typography>
                            
                            <Stack spacing={2}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <CategoryIcon sx={{ color: 'primary.main' }} />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Category
                                  </Typography>
                                  <Typography variant="body1" fontWeight="500">
                                    {selectedItem.category?.name || categories.find(c => c.id === selectedItem.category_id)?.name || 'N/A'}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <OfficeIcon sx={{ color: 'primary.main' }} />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Office
                                  </Typography>
                                  <Typography variant="body1" fontWeight="500">
                                    {selectedItem.office?.name || offices.find(o => o.id === selectedItem.office_id)?.name || 'N/A'}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <InventoryIcon sx={{ color: 'primary.main' }} />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Serial Number
                                  </Typography>
                                  <Typography variant="body1" fontWeight="500">
                                    {selectedItem.serial_number || 'N/A'}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <ConditionIcon sx={{ color: 'primary.main' }} />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Condition
                                  </Typography>
                                  <Chip
                                    label={selectedItem.condition}
                                    color={getConditionColor(selectedItem.condition)}
                                    size="medium"
                                    sx={{ fontWeight: 500 }}
                                  />
                                </Box>
                              </Box>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Purchase Details Card */}
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                          <CardContent>
                            <Typography variant="h6" fontWeight="600" gutterBottom sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1,
                              mb: 3 
                            }}>
                              <PriceIcon color="primary" /> Purchase Details
                            </Typography>
                            
                            <Stack spacing={2}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <DateIcon sx={{ color: 'primary.main' }} />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Purchase Date
                                  </Typography>
                                  <Typography variant="body1" fontWeight="500">
                                    {formatDate(selectedItem.purchase_date)}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <PriceIcon sx={{ color: 'primary.main' }} />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Purchase Price
                                  </Typography>
                                  <Typography variant="body1" fontWeight="500">
                                    {formatCurrency(selectedItem.purchase_price)}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <DateIcon sx={{ color: 'primary.main' }} />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Warranty Expiry
                                  </Typography>
                                  <Typography variant="body1" fontWeight="500">
                                    {formatDate(selectedItem.warranty_expiry)}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <ScheduleIcon sx={{ color: 'primary.main' }} />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Last Condition Check
                                  </Typography>
                                  <Typography variant="body1" fontWeight="500">
                                    {selectedItem.last_condition_check 
                                      ? formatDate(selectedItem.last_condition_check)
                                      : 'Never checked'}
                                  </Typography>
                                </Box>
                              </Box>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Notes Card */}
                      {selectedItem.notes && (
                        <Grid item xs={12}>
                          <Card variant="outlined" sx={{ borderRadius: 2 }}>
                            <CardContent>
                              <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 2 }}>
                                Additional Notes
                              </Typography>
                              <Paper sx={{ 
                                p: 2.5, 
                                bgcolor: 'grey.50', 
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider'
                              }}>
                                <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                                  {selectedItem.notes}
                                </Typography>
                              </Paper>
                            </CardContent>
                          </Card>
                        </Grid>
                      )}

                      {/* Borrow Information Card */}
                      {selectedItem.currentBorrow && (
                        <Grid item xs={12}>
                          <Card variant="outlined" sx={{ 
                            borderRadius: 2,
                            borderColor: 'warning.main',
                            bgcolor: 'warning.50'
                          }}>
                            <CardContent>
                              <Typography variant="h6" fontWeight="600" gutterBottom sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1,
                                mb: 3,
                                color: 'warning.dark'
                              }}>
                                <PersonIcon /> Current Borrow Record
                              </Typography>
                              
                              <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <PersonIcon sx={{ color: 'warning.main' }} />
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        Borrowed by
                                      </Typography>
                                      <Typography variant="body1" fontWeight="500">
                                        {selectedItem.currentBorrow.borrowedBy?.name || 'Unknown'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                                
                                <Grid item xs={12} md={6}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <DateIcon sx={{ color: 'warning.main' }} />
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        Expected Return Date
                                      </Typography>
                                      <Typography variant="body1" fontWeight="500">
                                        {formatDate(selectedItem.currentBorrow.expected_return_date)}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                              </Grid>
                              
                              {(user?.role === 'supply_officer' || user?.role === 'admin') && (
                                <Button
                                  fullWidth
                                  variant="contained"
                                  color="success"
                                  startIcon={<ReturnIcon />}
                                  onClick={() => setReturnDialogOpen(true)}
                                  sx={{ 
                                    mt: 3,
                                    borderRadius: 2,
                                    py: 1.5,
                                    fontSize: '1rem'
                                  }}
                                >
                                  Mark as Returned
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      )}

                      {/* QR Code Card */}
                      <Grid item xs={12}>
                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 3 }}>
                              <QrCodeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                              Item QR Code
                            </Typography>
                            <Paper sx={{ 
                              p: 4, 
                              display: 'inline-block', 
                              borderRadius: 3,
                              bgcolor: 'white',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                            }}>
                              <ItemQrCode value={selectedItem.qr_code} />
                            </Paper>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                              Scan this QR code to view item details
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Fade>
            </Box>
          ) : (
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: 'background.paper',
              borderRadius: 3,
              m: 3
            }}>
              <Box sx={{ 
                width: 120, 
                height: 120, 
                borderRadius: '50%', 
                bgcolor: 'primary.50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3
              }}>
                <InventoryIcon sx={{ fontSize: 64, color: 'primary.main', opacity: 0.7 }} />
              </Box>
              <Typography variant="h4" color="text.secondary" gutterBottom fontWeight="600">
                No Item Selected
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ 
                textAlign: 'center', 
                maxWidth: 400,
                mb: 4
              }}>
                Select an item from the list to view detailed information, purchase details, and QR code.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setDialogOpen(true)}
                sx={{ borderRadius: 2, px: 4, py: 1.5 }}
              >
                Create New Item
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Create/Edit Item Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
          setNewItem({
            name: "", description: "", category_id: "", office_id: "", status: "Available",
            serial_number: "", condition: "Good", purchase_date: "", purchase_price: "", warranty_expiry: "", notes: "",
            last_condition_check: ""
          });
        }} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
          <Typography variant="h5" fontWeight="700">
            {editing ? 'Edit Item' : 'Add New Item'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {editing ? 'Update the item details below' : 'Fill in the details to add a new item'}
          </Typography>
        </DialogTitle>
        <form onSubmit={handleCreate}>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Item Name"
                  value={newItem.name}
                  onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                  required
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Serial Number"
                  value={newItem.serial_number}
                  onChange={e => setNewItem({ ...newItem, serial_number: e.target.value })}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  value={newItem.description}
                  onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Category"
                  value={newItem.category_id}
                  onChange={e => setNewItem({ ...newItem, category_id: e.target.value })}
                  required
                  variant="outlined"
                  size="small"
                >
                  <MenuItem value="">Select Category</MenuItem>
                  {categories.map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Office"
                  value={newItem.office_id}
                  onChange={e => setNewItem({ ...newItem, office_id: e.target.value })}
                  required
                  variant="outlined"
                  size="small"
                >
                  <MenuItem value="">Select Office</MenuItem>
                  {offices.map(office => (
                    <MenuItem key={office.id} value={office.id}>{office.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={newItem.status}
                  onChange={e => setNewItem({ ...newItem, status: e.target.value })}
                  required
                  variant="outlined"
                  size="small"
                >
                  {statusOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {opt.icon}
                        {opt.label}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Condition"
                  value={newItem.condition}
                  onChange={e => setNewItem({ ...newItem, condition: e.target.value })}
                  required
                  variant="outlined"
                  size="small"
                >
                  {conditionOptions.map(opt => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Purchase Date"
                  type="date"
                  value={newItem.purchase_date}
                  onChange={e => setNewItem({ ...newItem, purchase_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Purchase Price"
                  type="number"
                  value={newItem.purchase_price}
                  onChange={e => setNewItem({ ...newItem, purchase_price: e.target.value })}
                  InputProps={{ 
                    startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                    inputProps: { min: 0, step: 0.01 }
                  }}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Warranty Expiry"
                  type="date"
                  value={newItem.warranty_expiry}
                  onChange={e => setNewItem({ ...newItem, warranty_expiry: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Condition Check"
                  type="date"
                  value={newItem.last_condition_check}
                  onChange={e => setNewItem({ ...newItem, last_condition_check: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  size="small"
                  helperText="Track annual condition inspections"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={newItem.notes}
                  onChange={e => setNewItem({ ...newItem, notes: e.target.value })}
                  variant="outlined"
                  size="small"
                  placeholder="Additional notes about the item..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
            <Button 
              onClick={() => {
                setDialogOpen(false);
                setEditing(null);
                setNewItem({
                  name: "", description: "", category_id: "", office_id: "", status: "Available",
                  serial_number: "", condition: "Good", purchase_date: "", purchase_price: "", warranty_expiry: "", notes: "",
                  last_condition_check: ""
                });
              }}
              sx={{ borderRadius: 2, px: 3 }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              sx={{ borderRadius: 2, px: 4 }}
            >
              {editing ? 'Update Item' : 'Create Item'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ 
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Return Item Dialog */}
      <Dialog 
        open={returnDialogOpen} 
        onClose={handleCloseReturnDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
          <Typography variant="h5" fontWeight="700">
            Mark Item as Returned
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            This will mark the item as returned and set its status back to Available.
          </Alert>
          <TextField
            fullWidth
            select
            label="Item Condition"
            value={returnData.condition}
            onChange={e => setReturnData({ ...returnData, condition: e.target.value })}
            sx={{ mb: 3 }}
            variant="outlined"
            size="small"
          >
            {returnConditionOptions.map(option => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Return Notes"
            multiline
            rows={3}
            value={returnData.notes}
            onChange={e => setReturnData({ ...returnData, notes: e.target.value })}
            placeholder="Any notes about the returned item..."
            variant="outlined"
            size="small"
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Button 
            onClick={handleCloseReturnDialog}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleMarkAsReturned} 
            variant="contained" 
            color="success"
            disabled={returnLoading}
            sx={{ borderRadius: 2, px: 4 }}
          >
            {returnLoading ? 'Processing...' : 'Mark as Returned'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Print Modal */}
      <QRCodePrintModal
        open={qrPrintOpen}
        onClose={() => setQrPrintOpen(false)}
        item={selectedItem}
      />
    </DashboardLayout>
  );
};

export default ItemsPage;