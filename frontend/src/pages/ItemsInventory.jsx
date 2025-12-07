import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/Layout/DashboardLayout";
import { fetchItems } from "../api/item";
import { fetchCategories } from "../api/category";
import { fetchStockMovements } from "../api/stockMovement";
import { fetchOffices } from "../api/office";
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
  ZoomIn,
} from "@mui/icons-material";
import QRCode from "react-qr-code";

export default function ItemsInventoryPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [movements, setMovements] = useState([]);
  const [offices, setOffices] = useState([]);
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

  // form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    category_id: "",
    status: "Available",
    serial_number: "",
    office_id: "",
  });
  const [transferOfficeId, setTransferOfficeId] = useState("");

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState("all");
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
        // offices
        try {
          const officeData = await fetchOffices();
          setOffices(officeData?.data?.data || officeData?.data || officeData || []);
        } catch (e) {
          // silently ignore office load errors
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

  const handleQrClick = (item, e) => {
    e.stopPropagation();
    if (item.qr_code) {
      setSelectedQrData({
        code: item.qr_code,
        name: item.name,
        serial: item.serial_number,
        category: categories.find(c => c.id === item.category_id)?.name
      });
      setQrModalOpen(true);
    }
  };

  // Helpers: API calls for mutations
  const apiBase = "/api/v1";
  const createItem = async (payload) => {
    return fetch(`${apiBase}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(r => r.json());
  };
  const updateItem = async (id, payload) => {
    return fetch(`${apiBase}/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(r => r.json());
  };
  const archiveItem = async (id) => {
    return fetch(`${apiBase}/items/${id}/archive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Archived via Items & Inventory" }),
    }).then(r => r.json());
  };
  const transferItemApi = async (id, office_id) => {
    return fetch(`${apiBase}/items/${id}/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ office_id }),
    }).then(r => r.json());
  };

  // Open dialogs
  const openAdd = () => {
    setForm({ name: "", description: "", category_id: "", status: "Available", serial_number: "", office_id: "" });
    setAddOpen(true);
  };
  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name || "",
      description: item.description || "",
      category_id: item.category_id || "",
      status: item.status || "Available",
      serial_number: item.serial_number || "",
      office_id: item.office_id || item.office?.id || "",
    });
    setEditOpen(true);
  };
  const openTransfer = (item) => {
    setTransferItem(item);
    setTransferOfficeId("");
    setTransferOpen(true);
  };

  // Actions
  const submitAdd = async () => {
    setMutating(true);
    try {
      await createItem({ ...form });
      setAddOpen(false);
      setRefresh(r => !r);
    } catch (e) {
      setError("Failed to add item.");
    } finally {
      setMutating(false);
    }
  };
  const submitEdit = async () => {
    if (!editingItem) return;
    setMutating(true);
    try {
      await updateItem(editingItem.id, { ...form });
      setEditOpen(false);
      setEditingItem(null);
      setRefresh(r => !r);
    } catch (e) {
      setError("Failed to update item.");
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
    if (!transferItem || !transferOfficeId) return;
    setMutating(true);
    try {
      await transferItemApi(transferItem.id, parseInt(transferOfficeId));
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
              <Table>
                <TableHead sx={{ bgcolor: 'primary.lighter' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Item Details</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>QR Code</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paged.map(item => (
                    <TableRow 
                      key={item.id} 
                      hover 
                      sx={{ 
                        cursor: "pointer",
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onClick={() => handleRowClick(item)}
                    >
                      <TableCell>
                        <Box>
                          <Typography fontWeight={600} sx={{ mb: 0.5 }}>
                            {item.name}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {item.serial_number && (
                              <Chip 
                                size="small" 
                                label={`SN: ${item.serial_number}`} 
                                variant="outlined" 
                                sx={{ fontSize: '0.75rem' }}
                              />
                            )}
                          </Stack>
                          {item.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                              {item.description.length > 60 ? `${item.description.substring(0, 60)}...` : item.description}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          icon={<CategoryIcon sx={{ fontSize: 16 }} />} 
                          label={categories.find(c => c.id === item.category_id)?.name || "-"}
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          label={item.status || "-"}
                          color={getStatusColor(item.status)}
                          sx={{ 
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            minWidth: 100
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {item.office?.name || item.office_name || "Unassigned"}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {item.qr_code ? (
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Tooltip title="View/Print QR Code">
                              <Chip 
                                size="small"
                                icon={<QrCodeIcon sx={{ fontSize: 16 }} />}
                                label={item.qr_code}
                                variant="outlined"
                                sx={{ fontFamily: 'monospace', fontSize: '0.75rem', cursor: 'pointer' }}
                                onClick={(e) => handleQrClick(item, e)}
                              />
                            </Tooltip>
                            <Tooltip title="Zoom QR">
                              <IconButton 
                                size="small" 
                                onClick={(e) => handleQrClick(item, e)}
                                sx={{ color: 'primary.main' }}
                              >
                                <ZoomIn fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.secondary">No QR</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRowClick(item); }}>
                              <Visibility sx={{ fontSize: 20, color: 'primary.main' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); openEdit(item); }}>
                              Edit
                            </Button>
                          </Tooltip>
                          <Tooltip title="Transfer">
                            <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); openTransfer(item); }}>
                              Transfer
                            </Button>
                          </Tooltip>
                          <Tooltip title="Archive">
                            <Button size="small" color="error" variant="outlined" onClick={(e) => { e.stopPropagation(); setArchiveConfirm(item); }}>
                              Archive
                            </Button>
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
                            category: categories.find(c => c.id === selectedItem.category_id)?.name
                          });
                          setQrModalOpen(true);
                        }}
                      >
                        <QRCode 
                          value={selectedItem.qr_code} 
                          size={120}
                          level="H"
                          includeMargin={true}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {selectedItem.qr_code}
                      </Typography>
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button 
                          size="small" 
                          startIcon={<ZoomIn />}
                          onClick={() => {
                            setSelectedQrData({
                              code: selectedItem.qr_code,
                              name: selectedItem.name,
                              serial: selectedItem.serial_number,
                              category: categories.find(c => c.id === selectedItem.category_id)?.name
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
                    {itemTimeline(selectedItem.id).map((ev, index) => (
                      <Box 
                        key={ev.id} 
                        sx={{ 
                          pl: 2, 
                          borderLeft: 2, 
                          borderColor: index === 0 ? 'primary.main' : 'divider',
                          position: 'relative',
                          '&:before': {
                            content: '""',
                            position: 'absolute',
                            left: -5,
                            top: 8,
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: index === 0 ? 'primary.main' : 'grey.500',
                          }
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {new Date(ev.created_at).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {ev.type || ev.action}
                        </Typography>
                        {ev.notes && (
                          <Typography variant="body2" color="text.secondary">
                            {ev.notes}
                          </Typography>
                        )}
                      </Box>
                    ))}
                    {itemTimeline(selectedItem.id).length === 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        No activity history available
                      </Typography>
                    )}
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
                    includeMargin={true}
                    renderAs="svg"
                  />
                </Box>
                
                {/* Visible QR */}
                <QRCode 
                  value={selectedQrData.code} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
                
                <Box sx={{ textAlign: 'center' }}>
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
            <TextField label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth />
            <TextField label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} fullWidth multiline minRows={2} />
            <TextField select label="Category" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} fullWidth>
              {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            <TextField label="Serial Number" value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} fullWidth />
            <TextField select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} fullWidth>
              {['Available','Borrowed','Under Maintenance','Lost','Disposed'].map(s => (<MenuItem key={s} value={s}>{s}</MenuItem>))}
            </TextField>
            <TextField select label="Office" value={form.office_id} onChange={e => setForm(f => ({ ...f, office_id: e.target.value }))} fullWidth>
              <MenuItem value="">Unassigned</MenuItem>
              {offices.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
            </TextField>
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
            <TextField label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth />
            <TextField label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} fullWidth multiline minRows={2} />
            <TextField select label="Category" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} fullWidth>
              {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            <TextField label="Serial Number" value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} fullWidth />
            <TextField select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} fullWidth>
              {['Available','Borrowed','Under Maintenance','Lost','Disposed'].map(s => (<MenuItem key={s} value={s}>{s}</MenuItem>))}
            </TextField>
            <TextField select label="Office" value={form.office_id} onChange={e => setForm(f => ({ ...f, office_id: e.target.value }))} fullWidth>
              <MenuItem value="">Unassigned</MenuItem>
              {offices.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setEditOpen(false); setEditingItem(null); }}>Cancel</Button>
          <Button onClick={submitEdit} disabled={mutating} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onClose={() => setTransferOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transfer Item</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2">Select new office for: {transferItem?.name}</Typography>
            <TextField select label="Office" value={transferOfficeId} onChange={e => setTransferOfficeId(e.target.value)} fullWidth>
              {offices.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferOpen(false)}>Cancel</Button>
          <Button onClick={submitTransfer} disabled={mutating || !transferOfficeId} variant="contained">Transfer</Button>
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