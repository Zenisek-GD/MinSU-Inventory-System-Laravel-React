import React, { useEffect, useState } from "react";
import { createBorrowRequest, getMyBorrowRequests } from "../api/borrowRequests";
import { listItems } from "../api/items";
import { listOffices } from "../api/offices";
import DashboardLayout from "../components/Layout/DashboardLayout";
import {
  Add,
  Edit,
  Delete,
  Check,
  Close,
  History,
  Search,
} from "@mui/icons-material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Card,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  alpha,
  useTheme,
  Tooltip,
  IconButton,
  TablePagination,
} from "@mui/material";

const BorrowRequestPage = () => {
  const theme = useTheme();

  // Data states
  const [items, setItems] = useState([]);
  const [offices, setOffices] = useState([]);
  const [borrowRequests, setBorrowRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedOffice, setSelectedOffice] = useState("");
  const [reason, setReason] = useState("");

  // UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [itemsData, officesData, requestsData] = await Promise.all([
        listItems(),
        listOffices(),
        getMyBorrowRequests(),
      ]);
      setItems(itemsData);
      setOffices(officesData);
      setBorrowRequests(requestsData);
      setError(null);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!selectedItem || !selectedOffice) {
      setError("Item and location are required");
      return;
    }

    try {
      const newRequest = await createBorrowRequest({
        item_id: selectedItem,
        office_id: selectedOffice,
        reason: reason || null,
      });

      setBorrowRequests([newRequest, ...borrowRequests]);
      setShowModal(false);
      setSelectedItem("");
      setSelectedOffice("");
      setReason("");
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create request");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "approved":
        return "info";
      case "borrowed":
        return "success";
      case "returned":
        return "default";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filteredRequests = borrowRequests.filter((req) => {
    const matchesSearch =
      req.item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.office?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && req.status === statusFilter;
  });

  return (
    <DashboardLayout>
      <Box sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 6 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 3,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                fontWeight={800}
                gutterBottom
                sx={{
                  color: "text.primary",
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Borrow Items
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Request to borrow equipment and resources for your department
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowModal(true)}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
              }}
            >
              Request Item
            </Button>
          </Box>

          {/* Search and Filter */}
          <Card
            elevation={0}
            sx={{
              p: 2,
              mb: 4,
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Stack spacing={2}>
              <TextField
                fullWidth
                placeholder="Search items, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 },
                }}
              />
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="borrowed">Borrowed</MenuItem>
                  <MenuItem value="returned">Returned</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Card>
        </Box>

        {/* Main Content */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : filteredRequests.length === 0 ? (
          <Card
            elevation={0}
            sx={{
              p: 8,
              textAlign: "center",
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <History
              sx={{
                fontSize: 64,
                color: alpha(theme.palette.text.secondary, 0.3),
                mb: 2,
              }}
            />
            <Typography variant="h6" color="text.secondary" fontWeight={600}>
              No Requests Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              {searchTerm
                ? "No requests match your search"
                : "Create your first borrow request"}
            </Typography>
            {!searchTerm && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setShowModal(true)}
              >
                Request Item
              </Button>
            )}
          </Card>
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  <TableCell sx={{ fontWeight: 700, width: "20%" }}>Item</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: "20%" }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: "15%" }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: "15%" }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: "15%" }}>Requested</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: "15%" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((req) => (
                    <TableRow
                      key={req.id}
                      sx={{
                        "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {req.item?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {req.item?.qr_code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{req.office?.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {req.reason || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(req.status)}
                          color={getStatusColor(req.status)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(req.requested_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small" sx={{ color: "text.secondary" }}>
                            <History fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredRequests.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.02),
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            />
          </TableContainer>
        )}

        {/* Request Modal */}
        <Dialog
          open={showModal}
          onClose={() => setShowModal(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              color: "white",
              fontWeight: 700,
              fontSize: "1.25rem",
            }}
          >
            Request to Borrow Item
          </DialogTitle>

          <DialogContent sx={{ pt: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Item</InputLabel>
                <Select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  label="Item"
                >
                  <MenuItem value="">-- Select Item --</MenuItem>
                  {items
                    .filter((item) => item.status === "Available")
                    .map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.name} ({item.qr_code})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Borrow Location</InputLabel>
                <Select
                  value={selectedOffice}
                  onChange={(e) => setSelectedOffice(e.target.value)}
                  label="Borrow Location"
                >
                  <MenuItem value="">-- Select Location --</MenuItem>
                  {offices.map((office) => (
                    <MenuItem key={office.id} value={office.id}>
                      {office.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Reason (Optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why do you need this item?"
                multiline
                rows={3}
                variant="outlined"
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <Button onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              onClick={handleSubmitRequest}
              variant="contained"
              sx={{
                bgcolor: theme.palette.primary.main,
              }}
            >
              Submit Request
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default BorrowRequestPage;
