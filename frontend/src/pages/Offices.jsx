import React, { useEffect, useState } from "react";
import { fetchOffices, createOffice, updateOffice, deleteOffice } from "../api/office";
import DashboardLayout from "../components/Layout/DashboardLayout";
import QRCode from "react-qr-code";
import { 
  Edit, 
  Delete, 
  Add, 
  Close, 
  LocationOn, 
  Info,
  Business,
  MeetingRoom,
  Science,
  Download,
  Search,
  FilterList,
  MoreVert,
  ArrowForward,
  CheckCircle,
  Cancel
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
  IconButton,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  Paper,
  Stack,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  alpha,
  useTheme,
  Fade,
  CircularProgress,
  Tooltip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Badge
} from "@mui/material";

const OfficesPage = () => {
  const theme = useTheme();
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOffice, setNewOffice] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newRooms, setNewRooms] = useState(0);
  const [newLaboratories, setNewLaboratories] = useState(0);
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editRooms, setEditRooms] = useState(0);
  const [editLaboratories, setEditLaboratories] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedOfficeId, setSelectedOfficeId] = useState(null);

  useEffect(() => {
    loadOffices();
  }, []);

  const loadOffices = async () => {
    setLoading(true);
    try {
      const data = await fetchOffices();
      setOffices(data.data || []);
      setError(null);
    } catch (err) {
      setError("Failed to load offices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newOffice.trim()) {
      setError("Office name is required");
      return;
    }
    try {
      const created = await createOffice({ 
        name: newOffice, 
        description: newDescription, 
        location: newLocation,
        rooms: Number(newRooms) || 0,
        laboratories: Number(newLaboratories) || 0,
      });
      const newOfficeData = created.data?.data || created.data || created;
      setOffices(prev => [...prev, newOfficeData]);
      setNewOffice("");
      setNewDescription("");
      setNewLocation("");
      setShowAddModal(false);
      setNewRooms(0);
      setNewLaboratories(0);
      setError(null);
    } catch {
      setError("Failed to create office");
    }
  };

  const handleEdit = (office) => {
    setEditing(office.id);
    setEditName(office.name);
    setEditDescription(office.description || "");
    setEditLocation(office.location || "");
    setEditRooms(office.rooms || 0);
    setEditLaboratories(office.laboratories || 0);
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) {
      setError("Office name is required");
      return;
    }
    try {
      const updated = await updateOffice(id, { 
        name: editName, 
        description: editDescription, 
        location: editLocation,
        rooms: Number(editRooms) || 0,
        laboratories: Number(editLaboratories) || 0,
      });
      const updatedOfficeData = updated.data?.data || updated.data || updated;
      setOffices(prev => prev.map(o => o.id === id ? updatedOfficeData : o));
      setEditing(null);
      setEditName("");
      setEditDescription("");
      setEditLocation("");
      setEditRooms(0);
      setEditLaboratories(0);
      setSelectedOffice(null);
      setError(null);
    } catch {
      setError("Failed to update office");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this office?")) return;
    try {
      await deleteOffice(id);
      setOffices(prev => prev.filter(o => o.id !== id));
      setSelectedOffice(null);
    } catch {
      setError("Failed to delete office");
    }
  };

  const resetAddForm = () => {
    setNewOffice("");
    setNewDescription("");
    setNewLocation("");
    setNewRooms(0);
    setNewLaboratories(0);
    setError(null);
  };

  const filteredOffices = offices.filter(office =>
    office.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    office.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    office.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleActionMenuOpen = (event, officeId) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
    setSelectedOfficeId(officeId);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedOfficeId(null);
  };

  const handleDownloadQR = (office) => {
    // Implement QR download logic
    console.log("Download QR for:", office.name);
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography 
                variant="h4" 
                fontWeight={800} 
                gutterBottom
                sx={{ 
                  color: 'text.primary',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Office Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage office locations, generate QR codes, and track facilities
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                resetAddForm();
                setShowAddModal(true);
              }}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
                bgcolor: theme.palette.primary.main,
                '&:hover': {
                  bgcolor: theme.palette.primary.dark
                }
              }}
            >
              Add Office
            </Button>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main
                    }}
                  >
                    <Business />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={800}>
                      {offices.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Offices
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      color: theme.palette.info.main
                    }}
                  >
                    <MeetingRoom />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={800}>
                      {offices.reduce((sum, office) => sum + (office.rooms || 0), 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Rooms
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)} 0%, ${alpha(theme.palette.warning.main, 0.02)} 100%)`
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      color: theme.palette.warning.main
                    }}
                  >
                    <Science />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={800}>
                      {offices.reduce((sum, office) => sum + (office.laboratories || 0), 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Laboratories
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      color: theme.palette.success.main
                    }}
                  >
                    <CheckCircle />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={800}>
                      {offices.filter(o => o.qr_code).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      QR Codes Generated
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>

          {/* Search and Filters */}
          <Card 
            elevation={0}
            sx={{
              p: 2,
              mb: 4,
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                fullWidth
                placeholder="Search offices by name, location, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 }
                }}
              />
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                sx={{ borderRadius: 2 }}
              >
                Filter
              </Button>
            </Box>
          </Card>
        </Box>

        {/* Main Content */}
        <Grid container spacing={4}>
          {/* Offices Table */}
          <Grid item xs={12} lg={8}>
            <Card 
              elevation={0}
              sx={{
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                overflow: 'hidden'
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                  <CircularProgress />
                </Box>
              ) : error && !showAddModal ? (
                <Alert severity="error" sx={{ m: 3 }}>
                  {error}
                </Alert>
              ) : filteredOffices.length === 0 ? (
                <Box sx={{ textAlign: 'center', p: 8 }}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      p: 3,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.divider, 0.1),
                      mb: 3
                    }}
                  >
                    <Business sx={{ fontSize: 64, color: alpha(theme.palette.text.secondary, 0.3) }} />
                  </Box>
                  <Typography variant="h6" color="text.secondary" gutterBottom fontWeight={600}>
                    No Offices Found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
                    {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first office'}
                  </Typography>
                  {!searchTerm && (
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => setShowAddModal(true)}
                      sx={{
                        px: 4,
                        borderRadius: 3
                      }}
                    >
                      Add First Office
                    </Button>
                  )}
                </Box>
              ) : (
                <>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                          <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Office</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Location</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Facilities</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>QR Code</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'text.secondary', textAlign: 'right' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredOffices
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((office) => (
                            <TableRow 
                              key={office.id} 
                              hover 
                              sx={{ 
                                cursor: 'pointer',
                                bgcolor: selectedOffice?.id === office.id ? alpha(theme.palette.primary.main, 0.04) : 'inherit',
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.02)
                                }
                              }}
                              onClick={() => setSelectedOffice(office)}
                            >
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar
                                    sx={{
                                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                                      color: theme.palette.primary.main
                                    }}
                                  >
                                    {office.name.charAt(0)}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="subtitle1" fontWeight={600}>
                                      {office.name}
                                    </Typography>
                                    {office.description && (
                                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }}>
                                        {office.description.length > 50 
                                          ? `${office.description.substring(0, 50)}...` 
                                          : office.description}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                {office.location ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <LocationOn fontSize="small" sx={{ color: 'text.secondary' }} />
                                    <Typography variant="body2">
                                      {office.location}
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    Not specified
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={1}>
                                  {office.rooms > 0 && (
                                    <Chip
                                      label={`${office.rooms} Rooms`}
                                      size="small"
                                      icon={<MeetingRoom fontSize="small" />}
                                      sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}
                                    />
                                  )}
                                  {office.laboratories > 0 && (
                                    <Chip
                                      label={`${office.laboratories} Labs`}
                                      size="small"
                                      icon={<Science fontSize="small" />}
                                      sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1) }}
                                    />
                                  )}
                                </Stack>
                              </TableCell>
                              <TableCell>
                                {office.qr_code ? (
                                  <Tooltip title="Click to view QR">
                                    <Box
                                      sx={{
                                        p: 0.5,
                                        bgcolor: 'white',
                                        borderRadius: 2,
                                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                        display: 'inline-block',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <QRCode value={office.qr_code} size={40} />
                                    </Box>
                                  </Tooltip>
                                ) : (
                                  <Typography variant="caption" color="text.secondary">
                                    Not generated
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleActionMenuOpen(e, office.id)}
                                  sx={{ color: 'text.secondary' }}
                                >
                                  <MoreVert />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredOffices.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                  />
                </>
              )}
            </Card>
          </Grid>

          {/* Side Panel - Office Details/Edit */}
          <Grid item xs={12} lg={4}>
            <Card 
              elevation={0}
              sx={{
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                height: '100%'
              }}
            >
              <CardContent sx={{ p: 4 }}>
                {!selectedOffice ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        p: 3,
                        borderRadius: '50%',
                        bgcolor: alpha(theme.palette.divider, 0.1),
                        mb: 3
                      }}
                    >
                      <Info sx={{ fontSize: 48, color: alpha(theme.palette.text.secondary, 0.3) }} />
                    </Box>
                    <Typography variant="h6" color="text.secondary" gutterBottom fontWeight={600}>
                      Select an Office
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Click on an office row to view and edit details
                    </Typography>
                  </Box>
                ) : (
                  <Fade in={!!selectedOffice}>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                        <Box>
                          <Typography variant="h5" fontWeight={800} gutterBottom>
                            {editing === selectedOffice.id ? 'Edit Office' : selectedOffice.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Office details and management
                          </Typography>
                        </Box>
                        <IconButton 
                          size="small" 
                          onClick={() => setSelectedOffice(null)}
                          sx={{ color: 'text.secondary' }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>

                      {editing === selectedOffice.id ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <TextField
                            fullWidth
                            label="Office Name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            variant="outlined"
                            size="small"
                          />
                          <TextField
                            fullWidth
                            label="Description"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            multiline
                            rows={3}
                            variant="outlined"
                            size="small"
                          />
                          <TextField
                            fullWidth
                            label="Location"
                            value={editLocation}
                            onChange={(e) => setEditLocation(e.target.value)}
                            variant="outlined"
                            size="small"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <LocationOn fontSize="small" />
                                </InputAdornment>
                              ),
                            }}
                          />
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <TextField
                                fullWidth
                                type="number"
                                label="Rooms"
                                value={editRooms}
                                onChange={(e) => setEditRooms(e.target.value)}
                                variant="outlined"
                                size="small"
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <MeetingRoom fontSize="small" />
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField
                                fullWidth
                                type="number"
                                label="Laboratories"
                                value={editLaboratories}
                                onChange={(e) => setEditLaboratories(e.target.value)}
                                variant="outlined"
                                size="small"
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <Science fontSize="small" />
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            </Grid>
                          </Grid>
                          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                            <Button
                              fullWidth
                              variant="outlined"
                              onClick={() => setEditing(null)}
                              sx={{ borderRadius: 2 }}
                            >
                              Cancel
                            </Button>
                            <Button
                              fullWidth
                              variant="contained"
                              onClick={() => handleUpdate(selectedOffice.id)}
                              sx={{ 
                                borderRadius: 2,
                                bgcolor: theme.palette.primary.main
                              }}
                            >
                              Save Changes
                            </Button>
                          </Stack>
                        </Box>
                      ) : (
                        <>
                          {/* QR Code Preview */}
                          <Paper
                            elevation={0}
                            sx={{
                              p: 3,
                              mb: 4,
                              borderRadius: 3,
                              bgcolor: alpha(theme.palette.primary.main, 0.05),
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                              textAlign: 'center'
                            }}
                          >
                            {selectedOffice.qr_code ? (
                              <>
                                <Box sx={{ mb: 2 }}>
                                  <QRCode 
                                    value={selectedOffice.qr_code} 
                                    size={120} 
                                    style={{ margin: '0 auto' }}
                                  />
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                  Scan to view office details
                                </Typography>
                              </>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                QR code not generated
                              </Typography>
                            )}
                          </Paper>

                          {/* Office Details */}
                          <Stack spacing={2}>
                            <Box>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                DESCRIPTION
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {selectedOffice.description || 'No description provided'}
                              </Typography>
                            </Box>
                            
                            <Box>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                LOCATION
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <LocationOn fontSize="small" sx={{ color: 'text.secondary' }} />
                                <Typography variant="body2">
                                  {selectedOffice.location || 'Not specified'}
                                </Typography>
                              </Box>
                            </Box>

                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Paper
                                  elevation={0}
                                  sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: alpha(theme.palette.info.main, 0.05),
                                    border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
                                  }}
                                >
                                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    ROOMS
                                  </Typography>
                                  <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                                    {selectedOffice.rooms || 0}
                                  </Typography>
                                </Paper>
                              </Grid>
                              <Grid item xs={6}>
                                <Paper
                                  elevation={0}
                                  sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: alpha(theme.palette.warning.main, 0.05),
                                    border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`
                                  }}
                                >
                                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    LABORATORIES
                                  </Typography>
                                  <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                                    {selectedOffice.laboratories || 0}
                                  </Typography>
                                </Paper>
                              </Grid>
                            </Grid>

                            {/* Action Buttons */}
                            <Stack spacing={1} sx={{ mt: 4 }}>
                              <Button
                                fullWidth
                                variant="contained"
                                startIcon={<Edit />}
                                onClick={() => handleEdit(selectedOffice)}
                                sx={{ borderRadius: 2 }}
                              >
                                Edit Office
                              </Button>
                              <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<Download />}
                                onClick={() => handleDownloadQR(selectedOffice)}
                                sx={{ borderRadius: 2 }}
                              >
                                Download QR Code
                              </Button>
                            </Stack>
                          </Stack>
                        </>
                      )}
                    </Box>
                  </Fade>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Add Office Modal */}
      <Dialog 
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 4,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.primary.main, 0.05)
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: 'white'
                }}
              >
                <Add />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                  Add New Office
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create a new office location
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={() => setShowAddModal(false)}
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <form onSubmit={handleCreate}>
          <DialogContent sx={{ pt: 4 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Office Name"
                value={newOffice}
                onChange={e => setNewOffice(e.target.value)}
                placeholder="Enter office name"
                autoFocus
                required
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Business />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="Description"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="Enter description"
                multiline
                rows={3}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Info />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="Location"
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
                placeholder="Enter location"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn />
                    </InputAdornment>
                  ),
                }}
              />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Rooms"
                    value={newRooms}
                    onChange={e => setNewRooms(e.target.value)}
                    placeholder="Number of rooms"
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MeetingRoom />
                        </InputAdornment>
                      ),
                      inputProps: { min: 0 }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Laboratories"
                    value={newLaboratories}
                    onChange={e => setNewLaboratories(e.target.value)}
                    placeholder="Number of laboratories"
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Science />
                        </InputAdornment>
                      ),
                      inputProps: { min: 0 }
                    }}
                  />
                </Grid>
              </Grid>
            </Stack>
          </DialogContent>
          
          <DialogActions sx={{ 
            p: 3, 
            borderTop: 1, 
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.background.default, 0.5)
          }}>
            <Button
              onClick={() => setShowAddModal(false)}
              variant="outlined"
              sx={{ 
                px: 4,
                borderRadius: 2,
                fontWeight: 600
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ 
                px: 4,
                borderRadius: 2,
                fontWeight: 600,
                bgcolor: theme.palette.primary.main,
                '&:hover': { bgcolor: theme.palette.primary.dark }
              }}
            >
              Create Office
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
        PaperProps={{
          sx: { 
            borderRadius: 2,
            minWidth: 200
          }
        }}
      >
        <MenuItem onClick={() => {
          const office = offices.find(o => o.id === selectedOfficeId);
          if (office) handleEdit(office);
          handleActionMenuClose();
        }}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          const office = offices.find(o => o.id === selectedOfficeId);
          if (office) handleDownloadQR(office);
          handleActionMenuClose();
        }}>
          <ListItemIcon>
            <Download fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download QR</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => {
            if (selectedOfficeId) handleDelete(selectedOfficeId);
            handleActionMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </DashboardLayout>
  );
};

export default OfficesPage;