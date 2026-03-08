import React, { useEffect, useState, useMemo } from "react";
import { fetchItems } from "../api/item";
import { fetchCategories } from "../api/category";
import { fetchOffices } from "../api/office";
import DashboardLayout from "../components/Layout/DashboardLayout";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Paper,
  InputAdornment,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Button,
  Stack,
} from "@mui/material";
import {
  Search,
  Inventory,
  Category as CategoryIcon,
  Business,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Refresh,
  FilterList,
  GetApp,
  QrCode as QrCodeIcon,
} from "@mui/icons-material";

const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter and pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedOffice, setSelectedOffice] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemData, catData, officeData] = await Promise.all([
        fetchItems(),
        fetchCategories(),
        fetchOffices(),
      ]);
      setItems(itemData?.data?.data || itemData?.data || itemData || []);
      setCategories(catData?.data?.data || catData?.data || catData || []);
      setOffices(officeData?.data?.data || officeData?.data || officeData || []);
    } catch (err) {
      setError("Failed to load inventory data");
      console.error("Inventory load error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.qr_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(item => item.category_id === parseInt(selectedCategory));
    }

    // Office filter
    if (selectedOffice !== "all") {
      filtered = filtered.filter(item => item.office_id === parseInt(selectedOffice));
    }

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === "category_id") {
        aVal = categories.find(c => c.id === a.category_id)?.name || "";
        bVal = categories.find(c => c.id === b.category_id)?.name || "";
      } else if (sortBy === "office_id") {
        aVal = offices.find(o => o.id === a.office_id)?.name || "";
        bVal = offices.find(o => o.id === b.office_id)?.name || "";
      }

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal?.toLowerCase() || "";
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [items, searchTerm, selectedCategory, selectedOffice, selectedStatus, sortBy, sortOrder, categories, offices]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [filteredItems, page, rowsPerPage]);

  // Statistics
  const totalItems = items.length;
  const totalCategories = categories.length;
  const totalOffices = offices.length;
  const availableItems = items.filter(i => i.status === "available").length;
  const borrowedItems = items.filter(i => i.status === "borrowed").length;
  const damagedItems = items.filter(i => i.status === "damaged").length;
  const lowStockItems = items.filter(i => i.quantity < 5).length;


  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "available":
        return "success";
      case "borrowed":
        return "warning";
      case "damaged":
        return "error";
      case "maintenance":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "available":
        return <CheckCircle fontSize="small" />;
      case "borrowed":
        return <Warning fontSize="small" />;
      case "damaged":
        return <ErrorIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedOffice("all");
    setSelectedStatus("all");
    setPage(0);
  };

  const exportToCSV = () => {
    const headers = ["Name", "QR Code", "Category", "Office", "Status", "Quantity", "Description"];
    const csvData = filteredItems.map(item => [
      item.name,
      item.qr_code || "",
      categories.find(c => c.id === item.category_id)?.name || "",
      offices.find(o => o.id === item.office_id)?.name || "",
      item.status,
      item.quantity || 0,
      item.description || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: "bold", color: "#006400" }}>
            Inventory Management
          </Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Refresh">
              <IconButton onClick={loadAll} color="primary">
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<GetApp />}
              onClick={exportToCSV}
              sx={{ bgcolor: "#006400", "&:hover": { bgcolor: "#004d00" } }}
            >
              Export CSV
            </Button>
          </Stack>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        ) : (
          <>
            {/* Statistics Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={4} md={3}>
                <Card sx={{ bgcolor: "#e8f5e9", borderLeft: "4px solid #4caf50" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#2e7d32" }}>
                          {totalItems}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Total Items</Typography>
                      </Box>
                      <Inventory sx={{ fontSize: 40, color: "#4caf50" }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={6} sm={4} md={3}>
                <Card sx={{ bgcolor: "#e3f2fd", borderLeft: "4px solid #2196f3" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#1565c0" }}>
                          {totalCategories}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Categories</Typography>
                      </Box>
                      <CategoryIcon sx={{ fontSize: 40, color: "#2196f3" }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={6} sm={4} md={3}>
                <Card sx={{ bgcolor: "#fff3e0", borderLeft: "4px solid #ff9800" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#e65100" }}>
                          {totalOffices}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Offices</Typography>
                      </Box>
                      <Business sx={{ fontSize: 40, color: "#ff9800" }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={6} sm={4} md={3}>
                <Card sx={{ bgcolor: "#f3e5f5", borderLeft: "4px solid #9c27b0" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#6a1b9a" }}>
                          {availableItems}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Available</Typography>
                      </Box>
                      <CheckCircle sx={{ fontSize: 40, color: "#9c27b0" }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={6} sm={4} md={3}>
                <Card sx={{ bgcolor: "#fff8e1", borderLeft: "4px solid #ffc107" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#f57f17" }}>
                          {borrowedItems}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Borrowed</Typography>
                      </Box>
                      <Warning sx={{ fontSize: 40, color: "#ffc107" }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={6} sm={4} md={3}>
                <Card sx={{ bgcolor: "#ffebee", borderLeft: "4px solid #f44336" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#c62828" }}>
                          {damagedItems}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Damaged</Typography>
                      </Box>
                      <ErrorIcon sx={{ fontSize: 40, color: "#f44336" }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={6} sm={4} md={3}>
                <Card sx={{ bgcolor: "#fce4ec", borderLeft: "4px solid #e91e63" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#ad1457" }}>
                          {lowStockItems}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Low Stock</Typography>
                      </Box>
                      <Warning sx={{ fontSize: 40, color: "#e91e63" }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Filters */}
            <Card sx={{ 
              mb: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              borderRadius: 2,
              border: '1px solid #f0f0f0'
            }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <FilterList sx={{ mr: 1.5, color: "#006400", fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: "700", color: "#006400" }}>
                    Filters & Search
                  </Typography>
                  <Button 
                    size="small" 
                    onClick={resetFilters} 
                    sx={{ ml: "auto", textTransform: "none" }}
                    variant="outlined"
                  >
                    Reset All
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search sx={{ color: "text.secondary" }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                          backgroundColor: '#fafafa',
                          '&:hover': { backgroundColor: '#f5f5f5' }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        label="Category"
                        sx={{
                          borderRadius: 1.5,
                          backgroundColor: '#fafafa',
                          '&:hover': { backgroundColor: '#f5f5f5' }
                        }}
                      >
                        <MenuItem value="all">All Categories</MenuItem>
                        {categories.map(cat => (
                          <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Office</InputLabel>
                      <Select
                        value={selectedOffice}
                        onChange={(e) => setSelectedOffice(e.target.value)}
                        label="Office"
                        sx={{
                          borderRadius: 1.5,
                          backgroundColor: '#fafafa',
                          '&:hover': { backgroundColor: '#f5f5f5' }
                        }}
                      >
                        <MenuItem value="all">All Offices</MenuItem>
                        {offices.map(office => (
                          <MenuItem key={office.id} value={office.id}>{office.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        label="Status"
                        sx={{
                          borderRadius: 1.5,
                          backgroundColor: '#fafafa',
                          '&:hover': { backgroundColor: '#f5f5f5' }
                        }}
                      >
                        <MenuItem value="all">All Status</MenuItem>
                        <MenuItem value="available">Available</MenuItem>
                        <MenuItem value="borrowed">Borrowed</MenuItem>
                        <MenuItem value="damaged">Damaged</MenuItem>
                        <MenuItem value="maintenance">Maintenance</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Items Table */}
            <Card sx={{ 
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              borderRadius: 2,
              border: '1px solid #f0f0f0',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 2, pb: 0 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: "700", color: "#006400", display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Inventory sx={{ color: '#006400' }} />
                    Inventory Items
                    <Chip 
                      label={filteredItems.length}
                      size="small"
                      sx={{ 
                        ml: 'auto',
                        bgcolor: 'rgba(0, 100, 0, 0.1)',
                        color: '#006400',
                        fontWeight: 700
                      }}
                    />
                  </Typography>
                </Box>
                <TableContainer sx={{ maxHeight: 'calc(100vh - 500px)' }}>
                  <Table stickyHeader size="small" sx={{ '& thead th': { fontWeight: 700 } }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell 
                          sx={{ 
                            fontWeight: "700", 
                            cursor: "pointer", 
                            bgcolor: '#f5f5f5',
                            color: '#006400',
                            fontSize: '0.9rem',
                            padding: '12px 14px !important',
                            userSelect: 'none',
                            width: '25%',
                            '&:hover': { bgcolor: '#e8f5e9' }
                          }} 
                          onClick={() => handleSort("name")}
                        >
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <span>Item Name</span>
                            {sortBy === "name" && (
                              <Box component="span" sx={{ fontSize: '0.75rem' }}>{sortOrder === "asc" ? "↑" : "↓"}</Box>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            fontWeight: "700", 
                            cursor: "pointer", 
                            bgcolor: '#f5f5f5',
                            color: '#006400',
                            fontSize: '0.9rem',
                            padding: '12px 14px !important',
                            userSelect: 'none',
                            width: '20%',
                            '&:hover': { bgcolor: '#e8f5e9' }
                          }} 
                          onClick={() => handleSort("category_id")}
                        >
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <span>Category</span>
                            {sortBy === "category_id" && (
                              <Box component="span" sx={{ fontSize: '0.75rem' }}>{sortOrder === "asc" ? "↑" : "↓"}</Box>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            fontWeight: "700", 
                            cursor: "pointer", 
                            bgcolor: '#f5f5f5',
                            color: '#006400',
                            fontSize: '0.9rem',
                            padding: '12px 14px !important',
                            userSelect: 'none',
                            width: '18%',
                            '&:hover': { bgcolor: '#e8f5e9' }
                          }} 
                          onClick={() => handleSort("office_id")}
                        >
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <span>Office</span>
                            {sortBy === "office_id" && (
                              <Box component="span" sx={{ fontSize: '0.75rem' }}>{sortOrder === "asc" ? "↑" : "↓"}</Box>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            fontWeight: "700", 
                            cursor: "pointer", 
                            bgcolor: '#f5f5f5',
                            color: '#006400',
                            fontSize: '0.9rem',
                            padding: '12px 14px !important',
                            userSelect: 'none',
                            width: '15%',
                            '&:hover': { bgcolor: '#e8f5e9' }
                          }} 
                          onClick={() => handleSort("status")}
                        >
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <span>Status</span>
                            {sortBy === "status" && (
                              <Box component="span" sx={{ fontSize: '0.75rem' }}>{sortOrder === "asc" ? "↑" : "↓"}</Box>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            fontWeight: "700", 
                            cursor: "pointer", 
                            bgcolor: '#f5f5f5',
                            color: '#006400',
                            fontSize: '0.9rem',
                            padding: '12px 14px !important',
                            userSelect: 'none',
                            width: '10%',
                            '&:hover': { bgcolor: '#e8f5e9' }
                          }} 
                          onClick={() => handleSort("quantity")}
                        >
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <span>Qty</span>
                            {sortBy === "quantity" && (
                              <Box component="span" sx={{ fontSize: '0.75rem' }}>{sortOrder === "asc" ? "↑" : "↓"}</Box>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            fontWeight: "700", 
                            bgcolor: '#f5f5f5',
                            color: '#006400',
                            fontSize: '0.9rem',
                            padding: '12px 14px !important',
                            width: '12%',
                            textAlign: 'center'
                          }}
                        >
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                              <Inventory sx={{ fontSize: 48, color: 'text.disabled' }} />
                              <Typography color="text.secondary" variant="body1">
                                No items found
                              </Typography>
                              <Typography color="text.disabled" variant="caption">
                                Try adjusting your filters
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedItems.map((item, idx) => (
                          <TableRow 
                            key={item.id} 
                            sx={{ 
                              backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9',
                              '&:hover': { 
                                backgroundColor: '#f0f8f0',
                                transition: 'background-color 0.15s'
                              },
                              borderBottom: '1px solid #e8e8e8'
                            }}
                          >
                            <TableCell sx={{ fontWeight: "600", color: '#006400', padding: '11px 14px !important', fontSize: '0.9rem' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Inventory sx={{ fontSize: 18, color: 'text.disabled' }} />
                                {item.name}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ padding: '11px 14px !important', fontSize: '0.9rem' }}>
                              <Chip 
                                label={categories.find(c => c.id === item.category_id)?.name || "-"}
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: '#006400',
                                  color: '#006400',
                                  fontWeight: 600,
                                  backgroundColor: 'rgba(0, 100, 0, 0.05)'
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ padding: '11px 14px !important', fontSize: '0.9rem' }}>
                              <Typography variant="body2">
                                {offices.find(o => o.id === item.office_id)?.name || "-"}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ padding: '11px 14px !important', fontSize: '0.9rem' }}>
                              <Chip
                                label={item.status}
                                color={
                                  item.status?.toLowerCase() === 'available' ? 'success' :
                                  item.status?.toLowerCase() === 'borrowed' ? 'warning' :
                                  item.status?.toLowerCase() === 'damaged' ? 'error' :
                                  'default'
                                }
                                size="small"
                                variant="filled"
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell sx={{ padding: '11px 14px !important', fontSize: '0.9rem', textAlign: 'center' }}>
                              <Chip
                                label={item.quantity || 0}
                                size="small"
                                sx={{
                                  backgroundColor: (item.quantity || 0) < 5 ? '#ffebee' : '#e8f5e9',
                                  color: (item.quantity || 0) < 5 ? '#c62828' : '#2e7d32',
                                  fontWeight: 700
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ padding: '11px 14px !important', textAlign: 'center' }}>
                              <Tooltip title="View QR Code">
                                <IconButton 
                                  size="small" 
                                  sx={{ color: '#006400', '&:hover': { bgcolor: 'rgba(0, 100, 0, 0.1)' } }}
                                >
                                  <QrCodeIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={filteredItems.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50, 100]}
                  sx={{
                    borderTop: '1px solid #f0f0f0',
                    '& .MuiTablePagination-root': { p: 2 }
                  }}
                />
              </CardContent>
            </Card>
          </>
        )}
      </Box>
    </DashboardLayout>
  );
};

export default InventoryPage;
