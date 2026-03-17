import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/Layout/DashboardLayout";
import { fetchItems } from "../api/item";
import { fetchCategories } from "../api/category";
import { fetchStockMovements } from "../api/stockMovement";
import { fetchOffices } from "../api/office";
import { fetchUsers } from "../api/user";
import api from "../api/axios";
import {
  Box,
  Grid,
  Paper,
  TextField,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Chip,
  Divider,
  Typography,
  Skeleton,
  Drawer,
  Card,
  CardContent,
  Stack,
  IconButton,
  InputAdornment,
  Alert,
  Tooltip,
  Modal,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import {
  Search,
  Category as CategoryIcon,
  FilterList,
  QrCode as QrCodeIcon,
  LocationOn,
  CalendarToday,
  Inventory,
  Visibility,
  Close,
  Refresh,
  Download,
  Print,
  ContentCopy,
  Edit as EditIcon,
  Send as TransferIcon,
  DeleteOutline as DeleteIcon,
} from "@mui/icons-material";
import QRCode from "react-qr-code";

export default function ItemsInventoryPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [movements, setMovements] = useState([]);
  const [offices, setOffices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(false);

  // UI state for mutations
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(null); // item to archive
  const [editingItem, setEditingItem] = useState(null);
  const [transferItem, setTransferItem] = useState(null);
  const [mutating, setMutating] = useState(false);
  const [transferUserId, setTransferUserId] = useState("");

  // form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    category_id: "",
    fund_cluster: "General Trust Fund",
    condition: "Good",
    serial_number: "",
    office_id: "",
    item_type: "equipment",
    stock: "",
    purchase_date: "",
    purchase_price: "",
    warranty_expiry: "",
    notes: "",
  });
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState("all");
  // Remove old transferOfficeId state - handled by transferUserId now
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedItem, setSelectedItem] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedQrData, setSelectedQrData] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [itemData, catData, movData] = await Promise.all([
          fetchItems(),
          fetchCategories(),
          fetchStockMovements(),
        ]);
        setItems(itemData?.data?.data || itemData?.data || itemData || []);
        setCategories(catData?.data?.data || catData?.data || catData || []);
        setMovements(movData?.data?.data || movData?.data || movData || []);
        // offices and users
        try {
          const [officeData, userData] = await Promise.all([
            fetchOffices(),
            fetchUsers(),
          ]);
          setOffices(officeData?.data?.data || officeData?.data || officeData || []);
          setUsers(userData?.data?.data || userData?.data || userData || []);
        } catch (e) {
          // silently ignore office/user load errors
        }
      } catch (e) {
        setError("Failed to load items. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refresh]);

  const filtered = useMemo(() => {
    let list = items;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        (i.name || "").toLowerCase().includes(q) ||
        (i.description || "").toLowerCase().includes(q) ||
        (i.qr_code || "").toLowerCase().includes(q) ||
        (i.serial_number || "").toLowerCase().includes(q)
      );
    }
    if (categoryId !== "all") {
      list = list.filter(i => i.category_id === parseInt(categoryId));
    }
    if (status !== "all") {
      list = list.filter(i => (i.status || "").toLowerCase() === status.toLowerCase());
    }
    return list;
  }, [items, search, categoryId, status]);

  const paged = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      available: items.filter(i => i.status === "Available").length,
      borrowed: items.filter(i => i.status === "Borrowed").length,
      maintenance: items.filter(i => i.status === "Under Maintenance").length,
    };
  }, [items]);

  const handleRowClick = (item) => setSelectedItem(item);

  const itemTimeline = (itemId) => {
    return movements
      .filter(m => m.item_id === itemId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const getStatusColor = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "available") return "success";
    if (s === "borrowed") return "warning";
    if (s === "under maintenance") return "info";
    if (s === "lost") return "error";
    if (s === "disposed") return "default";
    return "default";
  };

  const getFundClusterColor = (fund) => {
    const f = (fund || "General Trust Fund").toLowerCase();
    if (f.includes("general")) return "#2196F3"; // Blue
    if (f.includes("special")) return "#4CAF50"; // Green
    if (f.includes("tef")) return "#FF9800"; // Orange
    if (f.includes("mds") || f.includes("raf")) return "#9C27B0"; // Purple
    return "#757575"; // Grey
  };

  const handleQrClick = (item, e) => {
    e.stopPropagation();
    if (item.qr_code) {
      setSelectedQrData({
        code: item.qr_code,
        name: item.name,
        serial: item.serial_number,
        category: categories.find(c => c.id === item.category_id)?.name,
        currentBorrow: item.current_borrow || item.currentBorrow,
        assigned_user: item.assigned_user
      });
      setQrModalOpen(true);
    }
  };

  // Helpers: API calls for mutations
  const createItem = async (payload) => {
    const response = await api.post("/items", payload);
    return response.data;
  };
  const updateItem = async (id, payload) => {
    const response = await api.put(`/items/${id}`, payload);
    return response.data;
  };
  const archiveItem = async (id) => {
    const response = await api.post(`/items/${id}/archive`, { reason: "Archived via Items & Inventory" });
    return response.data;
  };
  const transferItemApi = async (id, assigned_to) => {
    const response = await api.post(`/items/${id}/transfer`, { assigned_to });
    return response.data;
  };

  // Open dialogs
  const openAdd = () => {
    setForm({ name: "", description: "", category_id: "", condition: "Good", serial_number: "", office_id: "", item_type: "equipment", stock: "", purchase_date: "", purchase_price: "", warranty_expiry: "", notes: "" });
    setAddOpen(true);
  };
  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name || "",
      description: item.description || "",
      category_id: item.category_id || "",
      condition: item.condition || "Good",
      serial_number: item.serial_number || "",
      office_id: item.office_id || item.office?.id || "",
      item_type: item.item_type || "equipment",
      stock: item.stock || "",
      purchase_date: item.purchase_date || "",
      purchase_price: item.purchase_price || "",
      warranty_expiry: item.warranty_expiry || "",
      notes: item.notes || "",
    });
    setEditOpen(true);
  };
  const openTransfer = (item) => {
    setTransferItem(item);
    setTransferUserId("");
    setTransferOpen(true);
  };

  // Actions
  const submitAdd = async () => {
    setMutating(true);
    try {
      const payload = { ...form };
      // Remove empty string values but keep 0 and false
      Object.keys(payload).forEach(key => {
        if (payload[key] === "") payload[key] = null;
      });
      await createItem(payload);
      setAddOpen(false);
      setRefresh(r => !r);
    } catch (e) {
      setError("Failed to add item.");
      console.error("Add item error:", e);
    } finally {
      setMutating(false);
    }
  };
  const submitEdit = async () => {
    if (!editingItem) return;
    setMutating(true);
    try {
      const payload = { ...form };
      // Remove empty string values but keep 0 and false
      Object.keys(payload).forEach(key => {
        if (payload[key] === "") payload[key] = null;
      });
      await updateItem(editingItem.id, payload);
      setEditOpen(false);
      setEditingItem(null);
      setRefresh(r => !r);
    } catch (e) {
      setError("Failed to update item.");
      console.error("Update item error:", e);
    } finally {
      setMutating(false);
    }
  };
  const confirmArchive = async () => {
    if (!archiveConfirm) return;
    setMutating(true);
    try {
      await archiveItem(archiveConfirm.id);
      setArchiveConfirm(null);
      setRefresh(r => !r);
    } catch (e) {
      setError("Failed to archive item.");
    } finally {
      setMutating(false);
    }
  };
  const submitTransfer = async () => {
    if (!transferItem || !transferUserId) return;
    setMutating(true);
    try {
      await transferItemApi(transferItem.id, parseInt(transferUserId));
      setTransferOpen(false);
      setTransferItem(null);
      setRefresh(r => !r);
    } catch (e) {
      setError("Failed to transfer item.");
    } finally {
      setMutating(false);
    }
  };

  const handleDownloadQR = () => {
    if (!selectedQrData) return;
    
    const canvas = document.getElementById("qr-code-canvas");
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `QR_${selectedQrData.code}_${selectedQrData.name}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const handlePrintQR = () => {
    if (!selectedQrData) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${selectedQrData.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .qr-container { margin: 20px auto; }
            .qr-info { margin-top: 20px; }
            .qr-info h3 { margin: 10px 0; }
            .qr-info p { margin: 5px 0; color: #666; }
            @media print {
              @page { margin: 0.5in; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
              ${document.getElementById("qr-code-canvas")?.innerHTML || ''}
            </svg>
          </div>
          <div class="qr-info">
            <h3>${selectedQrData.name}</h3>
            <p><strong>QR Code:</strong> ${selectedQrData.code}</p>
            ${selectedQrData.serial ? `<p><strong>Serial:</strong> ${selectedQrData.serial}</p>` : ''}
            ${selectedQrData.category ? `<p><strong>Category:</strong> ${selectedQrData.category}</p>` : ''}
            <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleCopyQRCode = () => {
    if (selectedQrData?.code) {
      navigator.clipboard.writeText(selectedQrData.code)
        .then(() => {
          // You could add a snackbar/toast notification here
          alert("QR Code copied to clipboard!");
        })
        .catch(err => console.error("Failed to copy: ", err));
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box>
              <Typography variant="h4" fontWeight={800} sx={{ color: "primary.main", mb: 0.5 }}>
                Items & Inventory
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage and track all inventory items in your organization
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button variant="contained" onClick={openAdd}>Add Item</Button>
              <IconButton onClick={() => setRefresh(!refresh)} sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}>
                <Refresh />
              </IconButton>
            </Stack>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Card sx={{ bgcolor: 'primary.lighter', borderRadius: 2, boxShadow: 'none' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} color="primary.main">
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Total Items</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ bgcolor: 'success.lighter', borderRadius: 2, boxShadow: 'none' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    {stats.available}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Available</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ bgcolor: 'warning.lighter', borderRadius: 2, boxShadow: 'none' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} color="warning.main">
                    {stats.borrowed}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Borrowed</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ bgcolor: 'info.lighter', borderRadius: 2, boxShadow: 'none' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} color="info.main">
                    {stats.maintenance}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Maintenance</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filters Card */}
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FilterList sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="subtitle1" fontWeight={600}>Filters</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by name, serial, or QR code..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ bgcolor: 'background.paper' }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    select
                    size="small"
                    label="Category"
                    value={categoryId}
                    onChange={e => { setCategoryId(e.target.value); setPage(0); }}
                    sx={{ bgcolor: 'background.paper' }}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {categories.map(c => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    select
                    size="small"
                    label="Status"
                    value={status}
                    onChange={e => { setStatus(e.target.value); setPage(0); }}
                    sx={{ bgcolor: 'background.paper' }}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="Available">Available</MenuItem>
                    <MenuItem value="Borrowed">Borrowed</MenuItem>
                    <MenuItem value="Under Maintenance">Maintenance</MenuItem>
                    <MenuItem value="Lost">Lost</MenuItem>
                    <MenuItem value="Disposed">Disposed</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Table Section */}
        <Card sx={{ borderRadius: 2, boxShadow: 3, overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ p: 3 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} height={56} sx={{ mb: 1 }} />
              ))}
            </Box>
          ) : (
            <>
              <Table size="small" sx={{ tableLayout: 'fixed' }}>
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#006400', width: '20%', padding: '12px 10px' }}>Item</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#006400', width: '12%', padding: '12px 10px' }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#006400', width: '12%', padding: '12px 10px' }}>Fund</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#006400', width: '10%', padding: '12px 10px' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#006400', width: '12%', padding: '12px 10px' }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#006400', width: '12%', padding: '12px 10px' }}>Assigned</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#006400', width: '10%', padding: '12px 10px' }}>Borrowed</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#006400', width: '12%', padding: '12px 10px', textAlign: 'center' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paged.map((item, idx) => (
                    <TableRow 
                      key={item.id} 
                      hover 
                      sx={{ 
                        cursor: "pointer",
                        backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9',
                        '&:hover': { bgcolor: '#f0f8f0', transition: 'background-color 0.15s' }
                      }}
                      onClick={() => handleRowClick(item)}
                    >
                      <TableCell sx={{ padding: '10px' }}>
                        <Box>
                          <Typography fontWeight={600} sx={{ mb: 0.25, fontSize: '0.9rem' }}>
                            {item.name}
                          </Typography>
                          {item.serial_number && (
                            <Chip 
                              size="small" 
                              label={`SN: ${item.serial_number}`} 
                              variant="outlined" 
                              sx={{ fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ padding: '10px' }}>
                        <Chip 
                          size="small" 
                          icon={<CategoryIcon sx={{ fontSize: 14 }} />} 
                          label={categories.find(c => c.id === item.category_id)?.name || "-"}
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ padding: '10px' }}>
                        <Chip 
                          size="small"
                          label={item.fund_cluster?.substring(0, 10) || "GTF"}
                          variant="filled"
                          sx={{ 
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            bgcolor: getFundClusterColor(item.fund_cluster),
                            color: '#fff'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ padding: '10px' }}>
                        <Chip 
                          size="small" 
                          label={item.status || "-"}
                          color={getStatusColor(item.status)}
                          sx={{ 
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ padding: '10px' }}>
                        <Stack direction="row" alignItems="center" spacing={0.25}>
                          <LocationOn sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" sx={{ fontSize: '0.8rem' }}>
                            {(item.office?.name || item.office_name || "Unassigned").substring(0, 15)}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ padding: '10px' }}>
                        {item.currentMR ? (
                          <Chip 
                            size="small" 
                            label={item.currentMR.mr_number.substring(0, 12)}
                            variant="filled"
                            sx={{ 
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              bgcolor: 'success.light',
                              color: 'success.dark'
                            }}
                          />
                        ) : item.assigned_user ? (
                          <Chip 
                            size="small" 
                            label={item.assigned_user.name.substring(0, 12)}
                            variant="filled"
                            sx={{ 
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              bgcolor: 'info.light',
                              color: 'info.dark'
                            }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>-</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ padding: '10px' }}>
                        {item.currentBorrow ? (
                          <Chip 
                            size="small" 
                            label={item.currentBorrow.borrowedBy?.name?.substring(0, 12) || "Borrowed"}
                            variant="filled"
                            sx={{ 
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              bgcolor: 'warning.light',
                              color: 'warning.dark'
                            }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>-</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ padding: '8px', textAlign: 'center' }}>
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRowClick(item); }} sx={{ color: '#006400' }}>
                              <Visibility sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(item); }} sx={{ color: '#1976d2' }}>
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="QR Code">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleQrClick(item, e); }} sx={{ color: '#f57c00' }}>
                              <QrCodeIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paged.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                          <Inventory sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                          <Typography color="text.secondary">No items found</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Try adjusting your filters or search terms
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={filtered.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={e => { 
                  setRowsPerPage(parseInt(e.target.value, 10)); 
                  setPage(0); 
                }}
                rowsPerPageOptions={[10, 25, 50]}
                sx={{ borderTop: 1, borderColor: 'divider' }}
              />
            </>
          )}
        </Card>
      </Box>

      {/* Side Drawer for Details */}
      <Drawer 
        anchor="right" 
        open={Boolean(selectedItem)} 
        onClose={() => setSelectedItem(null)}
        PaperProps={{
          sx: { 
            width: { xs: '100%', sm: 400 },
            borderLeft: 2,
            borderColor: 'primary.lighter'
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Item Details
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Complete information and history
              </Typography>
            </Box>
            <IconButton onClick={() => setSelectedItem(null)} size="small">
              <Close />
            </IconButton>
          </Box>

          {selectedItem && (
            <>
              {/* Item Summary Card */}
              <Card sx={{ mb: 3, borderRadius: 2, bgcolor: 'primary.lighter' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {selectedItem.name}
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Inventory sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {categories.find(c => c.id === selectedItem.category_id)?.name || "Uncategorized"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography sx={{ mr: 1, fontSize: 20, color: 'text.secondary', fontWeight: 600 }}>💰</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Fund:
                        </Typography>
                        <Chip
                          size="small"
                          label={selectedItem.fund_cluster || "General Trust Fund"}
                          sx={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            bgcolor: getFundClusterColor(selectedItem.fund_cluster),
                            color: '#fff'
                          }}
                        />
                      </Stack>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <QrCodeIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {selectedItem.qr_code || "No QR code"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationOn sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {selectedItem.office?.name || selectedItem.office_name || "Unassigned"}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Status and Details */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Card sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Status
                      </Typography>
                      <Chip 
                        label={selectedItem.status || "-"} 
                        color={getStatusColor(selectedItem.status)}
                        size="small"
                        sx={{ fontWeight: 600, mt: 0.5 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Serial Number
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedItem.serial_number || "N/A"}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Current MR Assignment */}
              {selectedItem.currentMR ? (
                <Card sx={{ mb: 3, borderRadius: 2, bgcolor: 'success.lighter', borderLeft: 4, borderColor: 'success.main' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ color: 'success.dark' }}>
                      Assigned To Memorandum Receipt
                    </Typography>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          MR Number:
                        </Typography>
                        <Chip
                          label={selectedItem.currentMR.mr_number}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Accountable Officer:
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {selectedItem.currentMR.accountable_officer}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Entity:
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {selectedItem.currentMR.entity_name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Status:
                        </Typography>
                        <Chip
                          label={selectedItem.currentMR.status}
                          size="small"
                          color="success"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ) : selectedItem.assigned_user ? (
                <Card sx={{ mb: 3, borderRadius: 2, bgcolor: 'info.lighter', borderLeft: 4, borderColor: 'info.main' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ color: 'info.dark' }}>
                      Assigned To User
                    </Typography>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          User:
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {selectedItem.assigned_user.name}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ) : null}

              {/* Current Borrow Information */}
              {selectedItem.currentBorrow && (
                <Card sx={{ mb: 3, borderRadius: 2, bgcolor: 'warning.lighter', borderLeft: 4, borderColor: 'warning.main' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ color: 'warning.dark' }}>
                      Currently Borrowed
                    </Typography>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Borrowed by:
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {selectedItem.currentBorrow.borrowedBy?.name || "Unknown"}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Borrowed on:
                        </Typography>
                        <Typography variant="body2">
                          {new Date(selectedItem.currentBorrow.borrowed_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                      {selectedItem.currentBorrow.expected_return_date && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Expected return:
                          </Typography>
                          <Typography variant="body2">
                            {new Date(selectedItem.currentBorrow.expected_return_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* QR Code Preview Card */}
              {selectedItem.qr_code && (
                <Card sx={{ mb: 3, borderRadius: 2 }}>
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      QR Code
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Box 
                        sx={{ 
                          p: 2, 
                          bgcolor: 'white', 
                          borderRadius: 1, 
                          border: 1, 
                          borderColor: 'divider',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'grey.50' }
                        }}
                        onClick={() => {
                          setSelectedQrData({
                            code: selectedItem.qr_code,
                            name: selectedItem.name,
                            serial: selectedItem.serial_number,
                            category: categories.find(c => c.id === selectedItem.category_id)?.name,
                            currentBorrow: selectedItem.current_borrow || selectedItem.currentBorrow,
                            assigned_user: selectedItem.assigned_user
                          });
                          setQrModalOpen(true);
                        }}
                      >
                        <QRCode 
                          value={selectedItem.qr_code} 
                          size={120}
                          level="H"
                        />
                      </Box>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {selectedItem.qr_code}
                      </Typography>
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button 
                          size="small" 
                          onClick={() => {
                            setSelectedQrData({
                              code: selectedItem.qr_code,
                              name: selectedItem.name,
                              serial: selectedItem.serial_number,
                              category: categories.find(c => c.id === selectedItem.category_id)?.name,
                              currentBorrow: selectedItem.current_borrow || selectedItem.currentBorrow,
                              assigned_user: selectedItem.assigned_user
                            });
                            setQrModalOpen(true);
                          }}
                        >
                          View
                        </Button>
                        <Button 
                          size="small" 
                          startIcon={<ContentCopy />}
                          onClick={handleCopyQRCode}
                        >
                          Copy Code
                        </Button>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Description */}
              {selectedItem.description && (
                <Card sx={{ mb: 3, borderRadius: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedItem.description}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Timeline */}
              <Card sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CalendarToday sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Activity Timeline
                    </Typography>
                  </Box>
                  <Stack spacing={1.5}>
                    {/* Combined timeline: stock movements + borrow records */}
                    {(() => {
                      const stockEvents = itemTimeline(selectedItem.id).map(ev => ({
                        ...ev,
                        eventType: 'stock',
                        date: new Date(ev.created_at)
                      }));
                      
                      const borrowEvents = (selectedItem.borrowRecords || []).map(br => ({
                        ...br,
                        eventType: 'borrow',
                        date: new Date(br.created_at)
                      }));
                      
                      const allEvents = [...stockEvents, ...borrowEvents]
                        .sort((a, b) => b.date - a.date);
                      
                      return allEvents.length > 0 ? (
                        allEvents.map((ev, index) => (
                          <Box 
                            key={`${ev.eventType}-${ev.id}`} 
                            sx={{ 
                              pl: 2, 
                              borderLeft: 3,
                              borderColor: ev.eventType === 'borrow' 
                                ? (index === 0 ? 'info.main' : 'info.light')
                                : (index === 0 ? 'primary.main' : 'divider'),
                              position: 'relative',
                              pb: 1,
                              '&:before': {
                                content: '""',
                                position: 'absolute',
                                left: -7,
                                top: 6,
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: ev.eventType === 'borrow' 
                                  ? (index === 0 ? 'info.main' : 'info.light')
                                  : (index === 0 ? 'primary.main' : 'grey.500'),
                                border: '2px solid white',
                              }
                            }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              {ev.date.toLocaleString()}
                            </Typography>
                            
                            {ev.eventType === 'borrow' ? (
                              <>
                                <Chip 
                                  size="small" 
                                  label={ev.status}
                                  color={ev.status === 'Approved' ? 'info' : ev.status === 'Pending' ? 'warning' : 'default'}
                                  sx={{ ml: 0, mb: 0.5, fontWeight: 600 }}
                                />
                                <Typography variant="body2" fontWeight={500}>
                                  Borrow Request - {ev.status}
                                </Typography>
                                {ev.borrowedBy && (
                                  <Typography variant="caption" display="block">
                                    <strong>By:</strong> {ev.borrowedBy.name || 'Unknown'}
                                  </Typography>
                                )}
                                {ev.purpose && (
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    <strong>Purpose:</strong> {ev.purpose}
                                  </Typography>
                                )}
                                {ev.expected_return_date && (
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    <strong>Expected return:</strong> {new Date(ev.expected_return_date).toLocaleDateString()}
                                  </Typography>
                                )}
                              </>
                            ) : (
                              <>
                                <Typography variant="body2" fontWeight={500}>
                                  {ev.type || ev.action}
                                </Typography>
                                {ev.notes && (
                                  <Typography variant="body2" color="text.secondary">
                                    {ev.notes}
                                  </Typography>
                                )}
                              </>
                            )}
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          No activity history available
                        </Typography>
                      );
                    })()}
                  </Stack>
                </CardContent>
              </Card>
            </>
          )}
        </Box>
      </Drawer>

      {/* QR Code Modal */}
      <Dialog 
        open={qrModalOpen} 
        onClose={() => setQrModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedQrData && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">QR Code - {selectedQrData.name}</Typography>
                <IconButton onClick={() => setQrModalOpen(false)} size="small">
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
                {/* Hidden QR for download */}
                <Box sx={{ display: 'none' }}>
                  <QRCode 
                    id="qr-code-canvas"
                    value={selectedQrData.code} 
                    size={256}
                    level="H"
                    renderAs="svg"
                  />
                </Box>
                
                {/* Visible QR */}
                <QRCode 
                  value={selectedQrData.code} 
                  size={200}
                  level="H"
                />
                
                <Box sx={{ textAlign: 'center', width: '100%' }}>
                  <Typography variant="h6" fontWeight={600}>
                    {selectedQrData.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    QR Code: {selectedQrData.code}
                  </Typography>
                  {selectedQrData.serial && (
                    <Typography variant="body2" color="text.secondary">
                      Serial: {selectedQrData.serial}
                    </Typography>
                  )}
                  {selectedQrData.category && (
                    <Typography variant="body2" color="text.secondary">
                      Category: {selectedQrData.category}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Generated on: {new Date().toLocaleDateString()}
                  </Typography>

                  {/* Assigned To Status */}
                  {selectedQrData.assigned_user && (
                    <Card sx={{ mt: 2, bgcolor: 'info.lighter', borderLeft: 4, borderColor: 'info.main' }}>
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'info.dark', mb: 1 }}>
                          Assigned To
                        </Typography>
                        <Stack spacing={0.5} sx={{ fontSize: '0.875rem' }}>
                          <Box>
                            <Typography variant="caption" fontWeight={600}>
                              User: {selectedQrData.assigned_user.name}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  )}

                  {/* Borrow Status */}
                  {selectedQrData.currentBorrow && (
                    <Card sx={{ mt: 2, bgcolor: 'warning.lighter', borderLeft: 4, borderColor: 'warning.main' }}>
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'warning.dark', mb: 1 }}>
                          Currently Borrowed
                        </Typography>
                        <Stack spacing={0.5} sx={{ fontSize: '0.875rem' }}>
                          <Box>
                            <Typography variant="caption" fontWeight={600}>
                              Borrowed by: {selectedQrData.currentBorrow.borrowedBy?.name || "Unknown"}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption">
                              Borrowed on: {new Date(selectedQrData.currentBorrow.borrowed_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                          {selectedQrData.currentBorrow.expected_return_date && (
                            <Box>
                              <Typography variant="caption">
                                Expected return: {new Date(selectedQrData.currentBorrow.expected_return_date).toLocaleDateString()}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  )}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 0 }}>
              <Button 
                startIcon={<ContentCopy />}
                onClick={handleCopyQRCode}
                variant="outlined"
              >
                Copy Code
              </Button>
              <Button 
                startIcon={<Download />}
                onClick={handleDownloadQR}
                variant="outlined"
              >
                Download
              </Button>
              <Button 
                startIcon={<Print />}
                onClick={handlePrintQR}
                variant="contained"
              >
                Print
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Item</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth required />
            <TextField label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} fullWidth multiline minRows={2} />
            <TextField select label="Category" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} fullWidth required>
              {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            <TextField select label="Fund Cluster" value={form.fund_cluster} onChange={e => setForm(f => ({ ...f, fund_cluster: e.target.value }))} fullWidth required>
              <MenuItem value="General Trust Fund">General Trust Fund</MenuItem>
              <MenuItem value="Special Trust Fund">Special Trust Fund</MenuItem>
              <MenuItem value="TEF Trust Fund">TEF Trust Fund</MenuItem>
              <MenuItem value="MDS/RAF">MDS/RAF</MenuItem>
            </TextField>
            <TextField label="Serial Number" value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} fullWidth />
            <TextField select label="Condition" value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} fullWidth required>
              {['Excellent','Good','Fair','Needs Repair','Damaged','Disposed'].map(s => (<MenuItem key={s} value={s}>{s}</MenuItem>))}
            </TextField>
            <TextField select label="Office" value={form.office_id} onChange={e => setForm(f => ({ ...f, office_id: e.target.value }))} fullWidth required>
              {offices.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
            </TextField>
            <TextField select label="Item Type" value={form.item_type} onChange={e => setForm(f => ({ ...f, item_type: e.target.value }))} fullWidth required>
              <MenuItem value="equipment">Equipment</MenuItem>
              <MenuItem value="consumable">Consumable</MenuItem>
            </TextField>
            <TextField label="Stock Quantity" type="number" inputProps={{ min: 0, step: 1 }} value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} fullWidth required={form.item_type === 'consumable'} helperText={form.item_type === 'consumable' ? "Required for consumable items" : "Optional stock tracking"} />
            <TextField label="Purchase Date" type="date" value={form.purchase_date} onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Purchase Price" type="number" inputProps={{ step: "0.01" }} value={form.purchase_price} onChange={e => setForm(f => ({ ...f, purchase_price: e.target.value }))} fullWidth />
            <TextField label="Warranty Expiry" type="date" value={form.warranty_expiry} onChange={e => setForm(f => ({ ...f, warranty_expiry: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} fullWidth multiline minRows={2} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button onClick={submitAdd} disabled={mutating} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Item</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth required />
            <TextField label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} fullWidth multiline minRows={2} />
            <TextField select label="Category" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} fullWidth required>
              {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            <TextField select label="Fund Cluster" value={form.fund_cluster} onChange={e => setForm(f => ({ ...f, fund_cluster: e.target.value }))} fullWidth required>
              <MenuItem value="General Trust Fund">General Trust Fund</MenuItem>
              <MenuItem value="Special Trust Fund">Special Trust Fund</MenuItem>
              <MenuItem value="TEF Trust Fund">TEF Trust Fund</MenuItem>
              <MenuItem value="MDS/RAF">MDS/RAF</MenuItem>
            </TextField>
            <TextField label="Serial Number" value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} fullWidth />
            <TextField select label="Condition" value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} fullWidth required>
              {['Excellent','Good','Fair','Needs Repair','Damaged','Disposed'].map(s => (<MenuItem key={s} value={s}>{s}</MenuItem>))}
            </TextField>
            <TextField select label="Office" value={form.office_id} onChange={e => setForm(f => ({ ...f, office_id: e.target.value }))} fullWidth required>
              {offices.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
            </TextField>
            <TextField select label="Item Type" value={form.item_type} onChange={e => setForm(f => ({ ...f, item_type: e.target.value }))} fullWidth required>
              <MenuItem value="equipment">Equipment</MenuItem>
              <MenuItem value="consumable">Consumable</MenuItem>
            </TextField>
            <TextField label="Stock Quantity" type="number" inputProps={{ min: 0, step: 1 }} value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} fullWidth required={form.item_type === 'consumable'} helperText={form.item_type === 'consumable' ? "Required for consumable items" : "Optional stock tracking"} />
            <TextField label="Purchase Date" type="date" value={form.purchase_date} onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Purchase Price" type="number" inputProps={{ step: "0.01" }} value={form.purchase_price} onChange={e => setForm(f => ({ ...f, purchase_price: e.target.value }))} fullWidth />
            <TextField label="Warranty Expiry" type="date" value={form.warranty_expiry} onChange={e => setForm(f => ({ ...f, warranty_expiry: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} fullWidth multiline minRows={2} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={submitEdit} disabled={mutating} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onClose={() => setTransferOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Item to User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2">Assign item "{transferItem?.name}" to:</Typography>
            {transferItem?.assigned_user && (
              <Typography variant="caption" color="textSecondary">
                Currently assigned to: {transferItem.assigned_user.name}
              </Typography>
            )}
            {!transferItem?.assigned_user && (
              <Typography variant="caption" color="textSecondary">
                Currently unassigned
              </Typography>
            )}
            <TextField 
              select 
              label="Assign to User" 
              value={transferUserId} 
              onChange={e => setTransferUserId(e.target.value)} 
              fullWidth
            >
              {users.map(u => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferOpen(false)}>Cancel</Button>
          <Button onClick={submitTransfer} disabled={mutating || !transferUserId} variant="contained">Assign</Button>
        </DialogActions>
      </Dialog>

      {/* Archive Confirm */}
      <Dialog open={Boolean(archiveConfirm)} onClose={() => setArchiveConfirm(null)}>
        <DialogTitle>Archive Item</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to archive "{archiveConfirm?.name}"?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveConfirm(null)}>Cancel</Button>
          <Button color="error" onClick={confirmArchive} disabled={mutating} variant="contained">Archive</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}