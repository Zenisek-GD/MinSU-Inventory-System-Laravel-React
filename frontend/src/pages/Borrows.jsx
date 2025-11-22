import React, { useEffect, useState } from "react";
import {
  fetchBorrows,
  createBorrow,
  deleteBorrow,
  updateBorrow,
} from "../api/borrow";
import { fetchItems } from "../api/item";
import DashboardLayout from "../components/Layout/DashboardLayout";
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
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Inventory as InventoryIcon,
  Person as PersonIcon,
  CalendarToday as DateIcon,
  Assignment as PurposeIcon,
  Build as ConditionIcon,
} from "@mui/icons-material";

const BorrowsPage = () => {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    item_id: "",
    borrow_date: "",
    expected_return_date: "",
    purpose: "",
  });
  const [items, setItems] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    loadBorrows();
    loadItems();
  }, []);

  const loadBorrows = async () => {
    setLoading(true);
    try {
      const data = await fetchBorrows();
      setBorrows(data);
    } catch {
      setError("Failed to load borrow records");
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const data = await fetchItems();
      setItems(data.data || []);
    } catch {
      setItems([]);
    }
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await createBorrow(form);
      setBorrows((prev) => [result.borrow_record, ...prev]);
      setForm({ item_id: "", borrow_date: "", expected_return_date: "", purpose: "" });
      setDialogOpen(false);
      showSnackbar("Borrow request submitted successfully", "success");
    } catch (err) {
      showSnackbar("Failed to create borrow record", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this borrow record?")) return;
    try {
      await deleteBorrow(id);
      setBorrows((prev) => prev.filter((r) => r.id !== id));
      showSnackbar("Borrow record deleted successfully", "success");
    } catch {
      showSnackbar("Failed to delete borrow record", "error");
    }
  };

  const handleStatusUpdate = async (id, status, notes = "") => {
    try {
      // Always send notes when rejecting
      if (status === "Rejected" && !notes) {
        notes = "Rejected by supply officer";
      }
      await updateBorrow(id, { status, ...(status === "Rejected" ? { notes } : {}) });
      setBorrows((prev) => prev.map(r => r.id === id ? { ...r, status } : r));
      showSnackbar(`Borrow request ${status.toLowerCase()} successfully`, "success");
    } catch (err) {
      const message = err?.response?.data?.message || `Failed to ${status.toLowerCase()} borrow request`;
      showSnackbar(message, "error");
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved": return "success";
      case "Rejected": return "error";
      case "Pending": return "warning";
      case "Returned": return "info";
      default: return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Approved": return <ApproveIcon />;
      case "Rejected": return <RejectIcon />;
      case "Pending": return <DateIcon />;
      case "Returned": return <CheckCircle />;
      default: return <InventoryIcon />;
    }
  };

  const isOverdue = (expectedReturnDate) => {
    return new Date(expectedReturnDate) < new Date();
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight="700">
            Borrow Management
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Track and manage item borrow requests
          </Typography>
        </Box>

        {/* Action Bar */}
        <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {user?.role === "staff" && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              New Borrow Request
            </Button>
          )}
        </Box>

        {/* Create Borrow Request Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={() => setDialogOpen(false)} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight="600">
              New Borrow Request
            </Typography>
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Select Item"
                    name="item_id"
                    value={form.item_id}
                    onChange={handleFormChange}
                    required
                  >
                    <MenuItem value="">Choose an item</MenuItem>
                    {items.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        <Box>
                          <Typography variant="body1">{item.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Stock: {item.stock} • {item.category}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Borrow Date"
                    name="borrow_date"
                    type="date"
                    value={form.borrow_date}
                    onChange={handleFormChange}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Expected Return Date"
                    name="expected_return_date"
                    type="date"
                    value={form.expected_return_date}
                    onChange={handleFormChange}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Purpose"
                    name="purpose"
                    value={form.purpose}
                    onChange={handleFormChange}
                    required
                    multiline
                    rows={3}
                    placeholder="Please describe the purpose of borrowing this item..."
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="contained">
                Submit Request
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Borrow Records List */}
        {loading ? (
          <Box sx={{ textAlign: "center", p: 4 }}>
            <Typography variant="h6">Loading borrow records...</Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {borrows.map((br) => (
              <Grid item xs={12} key={br.id}>
                <Card 
                  sx={{ 
                    borderRadius: 2,
                    borderLeft: 4,
                    borderColor: getStatusColor(br.status),
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar sx={{ bgcolor: "primary.main" }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight="600">
                            {br.borrowedBy?.name || br.borrowed_by?.name || br.borrowed_by}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Borrower
                          </Typography>
                        </Box>
                      </Box>
                      <Chip 
                        icon={getStatusIcon(br.status)}
                        label={br.status}
                        color={getStatusColor(br.status)}
                        variant="filled"
                      />
                    </Box>

                    <Grid container spacing={3} sx={{ mb: 2 }}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                          <InventoryIcon color="action" />
                          <Box>
                            <Typography variant="subtitle1" fontWeight="600">
                              {br.item?.name || br.item_id}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Item
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                          <PurposeIcon color="action" />
                          <Box>
                            <Typography variant="body2">
                              {br.purpose}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Purpose
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                          <DateIcon color="action" />
                          <Box>
                            <Typography variant="body2" fontWeight="500">
                              {br.borrow_date ? new Date(br.borrow_date).toLocaleDateString() : 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Borrow Date
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                          <DateIcon color="action" />
                          <Box>
                            <Typography 
                              variant="body2" 
                              fontWeight="500"
                              color={isOverdue(br.expected_return_date) ? "error" : "text.primary"}
                            >
                              {br.expected_return_date ? new Date(br.expected_return_date).toLocaleDateString() : 'N/A'}
                              {isOverdue(br.expected_return_date) && (
                                <Chip 
                                  label="Overdue" 
                                  color="error" 
                                  size="small" 
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Expected Return
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>

                    {br.condition_before || br.condition_after ? (
                      <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                          <ConditionIcon color="action" fontSize="small" />
                          <Typography variant="subtitle2" fontWeight="600">
                            Condition Report
                          </Typography>
                        </Box>
                        {br.condition_before && (
                          <Typography variant="body2">
                            Before: {br.condition_before}
                          </Typography>
                        )}
                        {br.condition_after && (
                          <Typography variant="body2">
                            After: {br.condition_after}
                          </Typography>
                        )}
                      </Box>
                    ) : null}

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {br.status === "Pending" && user?.role === "supply_officer" && (
                        <>
                          <Button
                            startIcon={<ApproveIcon />}
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => handleStatusUpdate(br.id, "Approved")}
                          >
                            Approve
                          </Button>
                          <Button
                            startIcon={<RejectIcon />}
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleStatusUpdate(br.id, "Rejected", "Rejected by supply officer")}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        startIcon={<DeleteIcon />}
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleDelete(br.id)}
                        sx={{ ml: "auto" }}
                      >
                        Delete Record
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

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
      </Box>
    </DashboardLayout>
  );
};

export default BorrowsPage;
