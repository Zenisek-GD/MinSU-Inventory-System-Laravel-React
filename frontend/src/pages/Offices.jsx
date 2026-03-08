import React, { useEffect, useState } from "react";
import { listOffices, createOffice, updateOffice } from "../api/offices";
import LocationSelector from "../components/LocationSelector";
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
  Cancel,
  Visibility,
  QrCode
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
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add", "view", "edit"
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [newOffice, setNewOffice] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newRooms, setNewRooms] = useState(0);
  const [newLaboratories, setNewLaboratories] = useState(0);
  const [newLocationFields, setNewLocationFields] = useState({ college_id: '', department_id: '', room_number: '', building: '', floor: '' });
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editRooms, setEditRooms] = useState(0);
  const [editLaboratories, setEditLaboratories] = useState(0);
  const [editLocationFields, setEditLocationFields] = useState({ college_id: '', department_id: '', room_number: '', building: '', floor: '' });
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedOfficeId, setSelectedOfficeId] = useState(null);

  useEffect(() => {
    loadOffices();
  }, []);

  const loadOffices = async () => {
    setLoading(true);
    try {
      const data = await listOffices();
      setOffices(data);
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
    if (!newLocationFields.college_id || !newLocationFields.department_id) {
      setError("College and Department are required");
      return;
    }
    try {
      const created = await createOffice({
        name: newOffice,
        description: newDescription,
        location: newLocation,
        rooms: Number(newRooms) || 0,
        laboratories: Number(newLaboratories) || 0,
        department_id: newLocationFields.department_id,
        room_number: newLocationFields.room_number,
        building: newLocationFields.building,
        floor: newLocationFields.floor,
      });
      setOffices(prev => [...prev, created]);
      resetAddForm();
      setShowModal(false);
      setError(null);
    } catch {
      setError("Failed to create office");
    }
  };

  const handleViewOffice = (office) => {
    setSelectedOffice(office);
    setModalMode("view");
    setShowModal(true);
  };

  const handleEditOffice = (office) => {
    setSelectedOffice(office);
    setEditName(office.name);
    setEditDescription(office.description || "");
    setEditLocation(office.location || "");
    setEditRooms(office.rooms || 0);
    setEditLaboratories(office.laboratories || 0);
    setEditLocationFields({
      college_id: office.department?.college?.id || '',
      department_id: office.department?.id || '',
      room_number: office.room_number || '',
      building: office.building || '',
      floor: office.floor || '',
    });
    setModalMode("edit");
    setShowModal(true);
  };

  const handleUpdate = async () => {
    if (!editName.trim()) {
      setError("Office name is required");
      return;
    }
    if (!editLocationFields.college_id || !editLocationFields.department_id) {
      setError("College and Department are required");
      return;
    }
    try {
      const updated = await updateOffice(selectedOffice.id, {
        name: editName,
        description: editDescription,
        location: editLocation,
        rooms: Number(editRooms) || 0,
        laboratories: Number(editLaboratories) || 0,
        department_id: editLocationFields.department_id,
        room_number: editLocationFields.room_number,
        building: editLocationFields.building,
        floor: editLocationFields.floor,
      });
      setOffices(prev => prev.map(o => o.id === selectedOffice.id ? updated : o));
      setSelectedOffice(updated);
      setModalMode("view");
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
      if (selectedOffice?.id === id) {
        setSelectedOffice(null);
        setShowModal(false);
      }
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
    setNewLocationFields({ college_id: '', department_id: '', room_number: '', building: '', floor: '' });
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

  const handleAddOfficeClick = () => {
    resetAddForm();
    setModalMode("add");
    setShowModal(true);
  };

  const getModalTitle = () => {
    switch (modalMode) {
      case "add": return "Add New Office";
      case "edit": return "Edit Office";
      case "view": return "Office Details";
      default: return "Office";
    }
  };

  const getModalIcon = () => {
    switch (modalMode) {
      case "add": return <Add />;
      case "edit": return <Edit />;
      case "view": return <Visibility />;
      default: return <Business />;
    }
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
                Manage office rooms per department (Admin, Cashier, Registrar, Supply, etc.)
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddOfficeClick}
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

        {/* Main Content - Full Width Table */}
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
          ) : error ? (
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
                  onClick={handleAddOfficeClick}
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
                <Table sx={{ minWidth: 1000 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                      <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Office Name</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Department</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Room Details</TableCell>
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
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.02)
                            }
                          }}
                          onClick={() => handleViewOffice(office)}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar
                                sx={{
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  color: theme.palette.primary.main,
                                  fontWeight: 600
                                }}
                              >
                                {office.name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1" fontWeight={600}>
                                  {office.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {office.description || 'No description'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={office.department?.name || 'No Department'}
                              size="small"
                              icon={<MeetingRoom fontSize="small" />}
                              sx={{ 
                                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                color: theme.palette.secondary.dark,
                                fontWeight: 500
                              }}
                            />
                            {office.department?.college && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                {office.department.college.name}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Stack spacing={0.5}>
                              {office.room_number && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="caption" sx={{ minWidth: 60 }}>
                                    Room:
                                  </Typography>
                                  <Typography variant="body2" fontWeight={600}>
                                    {office.room_number}
                                  </Typography>
                                </Box>
                              )}
                              {office.building && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="caption" sx={{ minWidth: 60 }}>
                                    Building:
                                  </Typography>
                                  <Typography variant="body2" fontWeight={600}>
                                    {office.building}
                                  </Typography>
                                </Box>
                              )}
                              {office.floor && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="caption" sx={{ minWidth: 60 }}>
                                    Floor:
                                  </Typography>
                                  <Typography variant="body2" fontWeight={600}>
                                    {office.floor}
                                  </Typography>
                                </Box>
                              )}
                              {!office.room_number && !office.building && !office.floor && (
                                <Typography variant="caption" color="text.secondary">
                                  No details
                                </Typography>
                              )}
                            </Stack>
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
      </Box>

      {/* Office Modal */}
      <Dialog 
        open={showModal}
        onClose={() => {
          setShowModal(false);
          if (modalMode === "edit") {
            setModalMode("view");
          }
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 4,
            overflow: 'hidden',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: alpha(
            modalMode === "add" ? theme.palette.primary.main : 
            modalMode === "edit" ? theme.palette.warning.main :
            theme.palette.info.main, 
            0.05
          )
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: 
                    modalMode === "add" ? theme.palette.primary.main : 
                    modalMode === "edit" ? theme.palette.warning.main :
                    theme.palette.info.main,
                  color: 'white'
                }}
              >
                {getModalIcon()}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                  {getModalTitle()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {modalMode === "add" ? "Create a new office location" :
                   modalMode === "edit" ? "Modify office details" :
                   "View office information and QR code"}
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={() => {
                setShowModal(false);
                if (modalMode === "edit") {
                  setModalMode("view");
                }
              }}
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 4, overflow: 'auto' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {modalMode === "add" ? (
            <form onSubmit={handleCreate}>
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
                <LocationSelector value={newLocationFields} onChange={setNewLocationFields} />
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
            </form>
          ) : modalMode === "edit" ? (
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Office Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                variant="outlined"
                autoFocus
              />
              <LocationSelector value={editLocationFields} onChange={setEditLocationFields} />
              <TextField
                fullWidth
                label="Description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                multiline
                rows={3}
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Location"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                variant="outlined"
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
            </Stack>
          ) : selectedOffice && (
            <Grid container spacing={4}>
              {/* Left Column - Office Details */}
              <Grid item xs={12} md={6}>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      OFFICE NAME
                    </Typography>
                    <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
                      {selectedOffice.name}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      DESCRIPTION
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {selectedOffice.description || 'No description provided'}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      LOCATION
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <LocationOn sx={{ color: 'text.secondary' }} />
                      <Typography variant="body1">
                        {selectedOffice.location || 'Not specified'}
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 3,
                          borderRadius: 3,
                          bgcolor: alpha(theme.palette.info.main, 0.05),
                          border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <MeetingRoom sx={{ color: theme.palette.info.main }} />
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            ROOMS
                          </Typography>
                        </Box>
                        <Typography variant="h3" fontWeight={800}>
                          {selectedOffice.rooms || 0}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 3,
                          borderRadius: 3,
                          bgcolor: alpha(theme.palette.warning.main, 0.05),
                          border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <Science sx={{ color: theme.palette.warning.main }} />
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            LABORATORIES
                          </Typography>
                        </Box>
                        <Typography variant="h3" fontWeight={800}>
                          {selectedOffice.laboratories || 0}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Stack>
              </Grid>

              {/* Right Column - QR Code */}
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    textAlign: 'center',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {selectedOffice.qr_code ? (
                    <>
                      <Box sx={{ mb: 3 }}>
                        <QRCode 
                          value={selectedOffice.qr_code} 
                          size={200} 
                          style={{ margin: '0 auto' }}
                        />
                      </Box>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Office QR Code
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 300 }}>
                        Scan this QR code to view office details or share location information
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Download />}
                        onClick={() => handleDownloadQR(selectedOffice)}
                        sx={{ 
                          borderRadius: 2,
                          px: 4,
                          bgcolor: theme.palette.primary.main
                        }}
                      >
                        Download QR Code
                      </Button>
                    </>
                  ) : (
                    <Box>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          p: 3,
                          borderRadius: '50%',
                          bgcolor: alpha(theme.palette.divider, 0.1),
                          mb: 3
                        }}
                      >
                        <QrCode sx={{ fontSize: 64, color: alpha(theme.palette.text.secondary, 0.3) }} />
                      </Box>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        QR Code Not Generated
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 300 }}>
                        Generate a QR code for this office to enable quick access and sharing
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<QrCode />}
                        sx={{ borderRadius: 2, px: 4 }}
                      >
                        Generate QR Code
                      </Button>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 3, 
          borderTop: 1, 
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.background.default, 0.5)
        }}>
          {modalMode === "add" ? (
            <>
              <Button
                onClick={() => setShowModal(false)}
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
                onClick={handleCreate}
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
            </>
          ) : modalMode === "edit" ? (
            <>
              <Button
                onClick={() => {
                  setModalMode("view");
                  // Reset to original values
                  setEditName(selectedOffice.name);
                  setEditDescription(selectedOffice.description || "");
                  setEditLocation(selectedOffice.location || "");
                  setEditRooms(selectedOffice.rooms || 0);
                  setEditLaboratories(selectedOffice.laboratories || 0);
                }}
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
                variant="contained"
                onClick={handleUpdate}
                sx={{ 
                  px: 4,
                  borderRadius: 2,
                  fontWeight: 600,
                  bgcolor: theme.palette.warning.main,
                  '&:hover': { bgcolor: theme.palette.warning.dark }
                }}
              >
                Save Changes
              </Button>
            </>
          ) : selectedOffice && (
            <>
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleDelete(selectedOffice.id)}
                sx={{ 
                  px: 4,
                  borderRadius: 2,
                  fontWeight: 600
                }}
              >
                Delete
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button
                variant="outlined"
                onClick={() => setShowModal(false)}
                sx={{ 
                  px: 4,
                  borderRadius: 2,
                  fontWeight: 600
                }}
              >
                Close
              </Button>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => handleEditOffice(selectedOffice)}
                sx={{ 
                  px: 4,
                  borderRadius: 2,
                  fontWeight: 600,
                  bgcolor: theme.palette.primary.main
                }}
              >
                Edit Office
              </Button>
            </>
          )}
        </DialogActions>
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
          if (office) handleViewOffice(office);
          handleActionMenuClose();
        }}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          const office = offices.find(o => o.id === selectedOfficeId);
          if (office) handleEditOffice(office);
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