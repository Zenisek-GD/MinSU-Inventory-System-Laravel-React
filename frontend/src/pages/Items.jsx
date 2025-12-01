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
} from "@mui/icons-material";

const statusOptions = [
  { value: "Available", label: "Available", color: "success", icon: <AvailableIcon /> },
  { value: "Borrowed", label: "Borrowed", color: "warning", icon: <WarningIcon /> },
  { value: "Under Maintenance", label: "Under Maintenance", color: "warning", icon: <WarningIcon /> },
  { value: "Lost", label: "Lost", color: "error", icon: <ErrorIcon /> },
  { value: "Disposed", label: "Disposed", color: "default", icon: <ErrorIcon /> },
];

const conditionOptions = ['Excellent', 'Good', 'Fair', 'Needs Repair', 'Damaged', 'Disposed'];
const returnConditionOptions = ['Excellent', 'Good', 'Fair', 'Needs Repair', 'Damaged']; // Disposed not allowed for returns

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
    notes: ""
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
    
    // If editing, call update instead
    if (editing) {
      await handleUpdate(editing);
      return;
    }

    try {
      const result = await createItem(newItem);
      setItems(prev => [result.item, ...prev]);
      setNewItem({
        name: "", description: "", category_id: "", office_id: "", status: "Available",
        serial_number: "", condition: "Good", purchase_date: "", purchase_price: "", warranty_expiry: "", notes: ""
      });
      setDialogOpen(false);
      // Automatically open QR code print modal with the new item
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
      notes: item.notes
    });
    setDialogOpen(true);
  };

  const handleUpdate = async (id) => {
    try {
      const result = await updateItem(id, newItem);
      setItems(prev => prev.map(item => item.id === id ? result.item : item));
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
        notes: ""
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

      // Reload items to reflect the change
      await loadAll();
      
      // Update selected item
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
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        {/* Left Panel - Items List */}
        <Box sx={{ width: '40%', borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h5" gutterBottom fontWeight="700">
              Inventory Items
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {items.length} items total
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
              sx={{ borderRadius: 2 }}
              fullWidth
            >
              Add New Item
            </Button>
          </Box>

          {/* Items List */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {loading ? (
              <Box sx={{ textAlign: "center", p: 4 }}>
                <Typography variant="h6">Loading items...</Typography>
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
            ) : (
              <List sx={{ p: 1 }}>
                {items.map(item => (
                  <ListItem
                    key={item.id}
                    sx={{
                      border: '1px solid',
                      borderColor: selectedItem?.id === item.id ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      mb: 1,
                      bgcolor: selectedItem?.id === item.id ? alpha(theme.palette.primary.main, 0.04) : 'background.paper',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        borderColor: 'primary.light'
                      }
                    }}
                    onClick={() => setSelectedItem(item)}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: getStatusConfig(item.display_status || item.status).color }}>
                        <InventoryIcon />
                      </Avatar>
                    </ListItemIcon>
                    <Box sx={{ width: '100%', py: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="600" noWrap sx={{ maxWidth: '200px' }}>
                          {item.name}
                        </Typography>
                        <Chip
                          label={getStatusConfig(item.display_status || item.status).label}
                          color={getStatusConfig(item.display_status || item.status).color}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: '250px', mb: 1 }}>
                        {item.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={item.condition}
                          color={getConditionColor(item.condition)}
                          size="small"
                          variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                          {item.category?.name || categories.find(c => c.id === item.category_id)?.name}
                        </Typography>
                        {item.currentBorrow && (
                          <Chip
                            icon={<PersonIcon />}
                            label={`Borrowed by ${item.currentBorrow.borrowedBy?.name || 'Unknown'}`}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                          setQrPrintOpen(true);
                        }}
                        color="success"
                        title="Print QR Code"
                      >
                        <QrCodeIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(item);
                        }}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Box>

        {/* Right Panel - Item Preview */}
        <Box sx={{ width: '60%', display: 'flex', flexDirection: 'column' }}>
          {selectedItem ? (
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  {/* Header Section */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box>
                      <Typography variant="h4" fontWeight="700" gutterBottom>
                        {selectedItem.name}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {selectedItem.description}
                      </Typography>
                    </Box>
                    <Chip
                      icon={getStatusConfig(selectedItem.display_status || selectedItem.status).icon}
                      label={getStatusConfig(selectedItem.display_status || selectedItem.status).label}
                      color={getStatusConfig(selectedItem.display_status || selectedItem.status).color}
                      size="medium"
                    />
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* Basic Information Grid */}
                  <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 2 }}>
                    Basic Information
                  </Typography>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <CategoryIcon color="primary" />
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Category
                          </Typography>
                          <Typography variant="body1" fontWeight="500">
                            {selectedItem.category?.name || categories.find(c => c.id === selectedItem.category_id)?.name || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <OfficeIcon color="primary" />
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Office
                          </Typography>
                          <Typography variant="body1" fontWeight="500">
                            {selectedItem.office?.name || offices.find(o => o.id === selectedItem.office_id)?.name || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <InventoryIcon color="primary" />
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Serial Number
                          </Typography>
                          <Typography variant="body1" fontWeight="500">
                            {selectedItem.serial_number || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <ConditionIcon color="primary" />
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Condition
                          </Typography>
                          <Chip
                            label={selectedItem.condition}
                            color={getConditionColor(selectedItem.condition)}
                            size="medium"
                          />
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Purchase Details Grid */}
                  <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 2 }}>
                    Purchase Details
                  </Typography>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <DateIcon color="primary" />
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Purchase Date
                          </Typography>
                          <Typography variant="body1" fontWeight="500">
                            {formatDate(selectedItem.purchase_date)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <PriceIcon color="primary" />
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Purchase Price
                          </Typography>
                          <Typography variant="body1" fontWeight="500">
                            {formatCurrency(selectedItem.purchase_price)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <DateIcon color="primary" />
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Warranty Expiry
                          </Typography>
                          <Typography variant="body1" fontWeight="500">
                            {formatDate(selectedItem.warranty_expiry)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Notes Section */}
                  {selectedItem.notes && (
                    <>
                      <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 2 }}>
                        Additional Notes
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body1">
                          {selectedItem.notes}
                        </Typography>
                      </Paper>
                    </>
                  )}

                  {/* Borrow Information Section */}
                  {selectedItem.currentBorrow && (
                    <>
                      <Divider sx={{ my: 3 }} />
                      <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 2 }}>
                        Current Borrow Record
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <PersonIcon color="warning" />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Borrowed by
                            </Typography>
                            <Typography variant="body1" fontWeight="500">
                              {selectedItem.currentBorrow.borrowedBy?.name || 'Unknown'}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <DateIcon color="warning" />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Expected Return Date
                            </Typography>
                            <Typography variant="body1" fontWeight="500">
                              {formatDate(selectedItem.currentBorrow.expected_return_date)}
                            </Typography>
                          </Box>
                        </Box>
                        {(user?.role === 'supply_officer' || user?.role === 'admin') && (
                          <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            startIcon={<ReturnIcon />}
                            onClick={() => setReturnDialogOpen(true)}
                            sx={{ mt: 2 }}
                          >
                            Mark as Returned
                          </Button>
                        )}
                      </Paper>
                    </>
                  )}

                  {/* QR Code Section */}
                  <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="600" gutterBottom>
                      Item QR Code
                    </Typography>
                    <Paper sx={{ p: 3, display: 'inline-block', borderRadius: 2 }}>
                      <ItemQrCode value={selectedItem.qr_code} />
                    </Paper>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      Scan to view item details
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ) : (
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: 'grey.50'
            }}>
              <InfoIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                No Item Selected
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 400 }}>
                Select an item from the list to view detailed information, purchase details, and QR code.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Create Item Dialog */}
      <Dialog open={dialogOpen} onClose={() => {
        setDialogOpen(false);
        setEditing(null);
        setNewItem({
          name: "", description: "", category_id: "", office_id: "", status: "Available",
          serial_number: "", condition: "Good", purchase_date: "", purchase_price: "", warranty_expiry: "", notes: ""
        });
      }} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight="600">
            {editing ? 'Edit Item' : 'Add New Item'}
          </Typography>
        </DialogTitle>
        <form onSubmit={handleCreate}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Item Name"
                  value={newItem.name}
                  onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Serial Number"
                  value={newItem.serial_number}
                  onChange={e => setNewItem({ ...newItem, serial_number: e.target.value })}
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
                >
                  {statusOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
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
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Purchase Price"
                  type="number"
                  value={newItem.purchase_price}
                  onChange={e => setNewItem({ ...newItem, purchase_price: e.target.value })}
                  InputProps={{ startAdornment: '₱' }}
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
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => {
              setDialogOpen(false);
              setEditing(null);
              setNewItem({
                name: "", description: "", category_id: "", office_id: "", status: "Available",
                serial_number: "", condition: "Good", purchase_date: "", purchase_price: "", warranty_expiry: "", notes: ""
              });
            }}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editing ? 'Update Item' : 'Create Item'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Return Item Dialog */}
      <Dialog open={returnDialogOpen} onClose={handleCloseReturnDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          Mark Item as Returned
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            This will mark the item as returned and set its status back to Available.
          </Alert>
          <TextField
            fullWidth
            select
            label="Item Condition"
            value={returnData.condition}
            onChange={e => setReturnData({ ...returnData, condition: e.target.value })}
            sx={{ mb: 2 }}
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
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseReturnDialog}>Cancel</Button>
          <Button 
            onClick={handleMarkAsReturned} 
            variant="contained" 
            color="success"
            disabled={returnLoading}
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
