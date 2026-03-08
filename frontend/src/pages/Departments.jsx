import React, { useEffect, useState } from "react";
import { listDepartments, createDepartment, updateDepartment, deleteDepartment } from "../api/departments";
import { listColleges } from "../api/colleges";
import DashboardLayout from "../components/Layout/DashboardLayout";
import { 
  Add, 
  Edit, 
  Delete, 
  Close, 
  School,
  Domain,
  Search,
  FilterList,
  MoreVert,
  Download,
  Visibility,
  ArrowForward
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
  Fade,
  FormControl,
  InputLabel,
  Select
} from "@mui/material";

const DepartmentsPage = () => {
  const theme = useTheme();
  const [departments, setDepartments] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add", "edit"
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [name, setName] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [deptsData, collegesData] = await Promise.all([
        listDepartments(),
        listColleges()
      ]);
      setDepartments(deptsData);
      setColleges(collegesData);
      setError(null);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !collegeId) {
      setError("Department name and college are required");
      return;
    }
    try {
      const created = await createDepartment({ 
        name, 
        college_id: collegeId
      });
      setDepartments(prev => [...prev, created]);
      setShowModal(false);
      resetForm();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create department");
    }
  };

  const handleEdit = (dept) => {
    setSelectedDepartment(dept);
    setName(dept.name);
    setCollegeId(dept.college_id || "");
    setModalMode("edit");
    setShowModal(true);
  };

  const handleUpdate = async () => {
    if (!name.trim() || !collegeId) {
      setError("Department name and college are required");
      return;
    }
    try {
      const updated = await updateDepartment(selectedDepartment.id, { 
        name, 
        college_id: collegeId
      });
      setDepartments(prev => prev.map(d => d.id === selectedDepartment.id ? updated : d));
      setShowModal(false);
      resetForm();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update department");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    try {
      await deleteDepartment(id);
      setDepartments(prev => prev.filter(d => d.id !== id));
      setSelectedDepartment(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete department");
    }
  };

  const resetForm = () => {
    setName("");
    setCollegeId("");
    setSelectedDepartment(null);
  };

  const getCollegeName = (collegeId) => {
    return colleges.find(c => c.id === collegeId)?.name || "Unknown";
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCollegeName(dept.college_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleActionMenuOpen = (event, deptId) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
    setSelectedDepartmentId(deptId);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedDepartmentId(null);
  };

  const getModalTitle = () => {
    return modalMode === "add" ? "Add New Department" : "Edit Department";
  };

  const getModalIcon = () => {
    return modalMode === "add" ? <Add /> : <Edit />;
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
                Departments
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage academic departments and their college affiliations
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                resetForm();
                setModalMode("add");
                setShowModal(true);
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
              Add Department
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
                    <School />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={800}>
                      {departments.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Departments
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
                    <Domain />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={800}>
                      {new Set(departments.map(d => d.college_id)).size}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Colleges
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
                    <ArrowForward />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={800}>
                      {departments.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active
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
                placeholder="Search departments by name or college..."
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

        {/* Main Content - Departments Table */}
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
          ) : filteredDepartments.length === 0 ? (
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
                <School sx={{ fontSize: 64, color: alpha(theme.palette.text.secondary, 0.3) }} />
              </Box>
              <Typography variant="h6" color="text.secondary" gutterBottom fontWeight={600}>
                No Departments Found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first department'}
              </Typography>
              {!searchTerm && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    resetForm();
                    setModalMode("add");
                    setShowModal(true);
                  }}
                  sx={{
                    px: 4,
                    borderRadius: 3
                  }}
                >
                  Add First Department
                </Button>
              )}
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table sx={{ minWidth: 1000 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                      <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Department Name</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>College</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.secondary', textAlign: 'right' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDepartments
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((dept) => (
                        <TableRow 
                          key={dept.id} 
                          hover 
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.02)
                            }
                          }}
                          onClick={() => handleEdit(dept)}
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
                                {dept.name.charAt(0)}
                              </Avatar>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {dept.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getCollegeName(dept.college_id)}
                              size="small"
                              icon={<Domain fontSize="small" />}
                              sx={{ 
                                bgcolor: alpha(theme.palette.info.main, 0.1),
                                color: theme.palette.info.dark,
                                fontWeight: 500
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={(e) => handleActionMenuOpen(e, dept.id)}
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
                count={filteredDepartments.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </Card>
      </Box>

      {/* Department Modal */}
      <Dialog 
        open={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
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
          bgcolor: alpha(
            modalMode === "add" ? theme.palette.primary.main : theme.palette.warning.main, 
            0.05
          )
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: modalMode === "add" ? theme.palette.primary.main : theme.palette.warning.main,
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
                  {modalMode === "add" ? "Create a new academic department" : "Update department information"}
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <form onSubmit={modalMode === "add" ? handleCreate : (e) => { e.preventDefault(); handleUpdate(); }}>
          <DialogContent sx={{ pt: 4 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Department Name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., BSIT, BSCpE, etc."
                autoFocus
                required
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <School />
                    </InputAdornment>
                  ),
                }}
              />
              
              <FormControl fullWidth required>
                <InputLabel>College</InputLabel>
                <Select
                  value={collegeId}
                  onChange={e => setCollegeId(e.target.value)}
                  label="College"
                >
                  <MenuItem value="">-- Select College --</MenuItem>
                  {colleges.map(college => (
                    <MenuItem key={college.id} value={college.id}>
                      {college.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          
          <DialogActions sx={{ 
            p: 3, 
            borderTop: 1, 
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.background.default, 0.5)
          }}>
            <Button
              onClick={() => {
                setShowModal(false);
                resetForm();
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
              type="submit"
              variant="contained"
              sx={{ 
                px: 4,
                borderRadius: 2,
                fontWeight: 600,
                bgcolor: modalMode === "add" ? theme.palette.primary.main : theme.palette.warning.main,
                '&:hover': { 
                  bgcolor: modalMode === "add" ? theme.palette.primary.dark : theme.palette.warning.dark 
                }
              }}
            >
              {modalMode === "add" ? "Create Department" : "Update Department"}
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
          const dept = departments.find(d => d.id === selectedDepartmentId);
          if (dept) handleEdit(dept);
          handleActionMenuClose();
        }}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          // View details action - could be expanded
          const dept = departments.find(d => d.id === selectedDepartmentId);
          handleActionMenuClose();
        }}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          // Export/Download action
          const dept = departments.find(d => d.id === selectedDepartmentId);
          handleActionMenuClose();
        }}>
          <ListItemIcon>
            <Download fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export Data</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => {
            if (selectedDepartmentId) handleDelete(selectedDepartmentId);
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

export default DepartmentsPage;