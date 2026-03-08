import React, { useEffect, useState } from "react";
import { listColleges, createCollege, updateCollege, deleteCollege } from "../api/colleges";
import { listDepartments, createDepartment, updateDepartment, deleteDepartment } from "../api/departments";
import { listOffices, createOffice, updateOffice, deleteOffice } from "../api/offices";
import DashboardLayout from "../components/Layout/DashboardLayout";
import {
  Add,
  Edit,
  Delete,
  School,
  Domain,
  BusinessCenter,
  ExpandMore,
  ChevronRight,
  Warning,
  CheckCircle,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
  Alert,
  Paper,
  Collapse,
  Avatar,
  alpha,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

const LocationsPage = () => {
  const theme = useTheme();

  // Data states
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Expanded state for hierarchy
  const [expandedColleges, setExpandedColleges] = useState({});
  const [expandedDepartments, setExpandedDepartments] = useState({});
  const [expandedAdminBuildings, setExpandedAdminBuildings] = useState({});

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("college"); // college | department | room | admin_building
  const [modalMode, setModalMode] = useState("add");
  const [parentCollege, setParentCollege] = useState(null);
  const [parentDepartment, setParentDepartment] = useState(null);
  const [parentAdminBuilding, setParentAdminBuilding] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    building: "",
    floor: "",
    roomNumber: "",
    type: "office",
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const collegesData = await listColleges();
      const departmentsData = await listDepartments();
      const officesData = await listOffices();

      setColleges(collegesData);
      setDepartments(departmentsData);
      setOffices(officesData);
    } catch (err) {
      setError("Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  // Modal handlers
  const openCollegeModal = (mode = "add", college = null) => {
    setModalType("college");
    setModalMode(mode);
    setParentCollege(college);
    setFormData(college ? { name: college.name, building: "", floor: "", roomNumber: "", type: "office" } : { name: "", building: "", floor: "", roomNumber: "", type: "office" });
    setShowModal(true);
  };

  const openDepartmentModal = (mode = "add", college, department = null) => {
    setModalType("department");
    setModalMode(mode);
    setParentCollege(college);
    setParentDepartment(department);
    setFormData(
      department
        ? { name: department.name, building: department.building || "", floor: department.floor || "", roomNumber: department.room_number || "", type: "office" }
        : { name: "", building: "", floor: "", roomNumber: "", type: "office" }
    );
    setShowModal(true);
  };

  const openRoomModal = (mode = "add", college, department, room = null) => {
    setModalType("room");
    setModalMode(mode);
    setParentCollege(college);
    setParentDepartment(department);
    setFormData(
      room
        ? { name: room.name, building: room.building || "", floor: room.floor || "", roomNumber: room.room_number || "", type: room.type || "office" }
        : { name: "", building: "", floor: "", roomNumber: "", type: "office" }
    );
    setShowModal(true);
  };

  const openAdminBuildingModal = (mode = "add", building = null) => {
    setModalType("admin_building");
    setModalMode(mode);
    setParentAdminBuilding(building);
    setFormData(
      building
        ? { name: building.name, building: building.building || "", floor: building.floor || "", roomNumber: building.room_number || "", type: "office" }
        : { name: "", building: "", floor: "", roomNumber: "", type: "office" }
    );
    setShowModal(true);
  };

  const openAdminRoomModal = (mode = "add", adminBuilding, room = null) => {
    setModalType("room");
    setModalMode(mode);
    setParentCollege(null);
    setParentDepartment(adminBuilding);
    setFormData(
      room
        ? { name: room.name, building: room.building || "", floor: room.floor || "", roomNumber: room.room_number || "", type: room.type || "office" }
        : { name: "", building: "", floor: "", roomNumber: "", type: "office" }
    );
    setShowModal(true);
  };

  // Save handlers
  const handleSaveModal = async () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    try {
      if (modalType === "college") {
        if (modalMode === "add") {
          const created = await createCollege({ name: formData.name });
          setColleges([...colleges, created]);
        } else {
          const updated = await updateCollege(parentCollege.id, { name: formData.name });
          setColleges(colleges.map((c) => (c.id === parentCollege.id ? updated : c)));
        }
      } else if (modalType === "department") {
        const deptData = {
          name: formData.name,
          college_id: parentCollege.id,
          building: formData.building || null,
          floor: formData.floor || null,
          room_number: formData.roomNumber || null,
        };

        if (modalMode === "add") {
          const created = await createDepartment(deptData);
          setDepartments([...departments, created]);
        } else {
          const updated = await updateDepartment(parentDepartment.id, deptData);
          setDepartments(departments.map((d) => (d.id === parentDepartment.id ? updated : d)));
        }
      } else if (modalType === "admin_building") {
        // Administrative buildings are departments without a college_id
        const adminData = {
          name: formData.name,
          college_id: null,
          building: formData.building || null,
          floor: formData.floor || null,
          room_number: formData.roomNumber || null,
        };

        if (modalMode === "add") {
          const created = await createDepartment(adminData);
          setDepartments([...departments, created]);
        } else {
          const updated = await updateDepartment(parentAdminBuilding.id, adminData);
          setDepartments(departments.map((d) => (d.id === parentAdminBuilding.id ? updated : d)));
        }
      } else if (modalType === "room") {
        const officeData = {
          name: formData.name,
          department_id: parentDepartment.id,
          type: formData.type,
          building: formData.building || null,
          floor: formData.floor || null,
          room_number: formData.roomNumber || null,
          category: "facility",
        };

        if (modalMode === "add") {
          const created = await createOffice(officeData);
          setOffices([...offices, created]);
        } else {
          const updated = await updateOffice(offices.find((o) => o.name === parentDepartment.name)?.id, officeData);
          setOffices(offices.map((o) => (o.id === updated.id ? updated : o)));
        }
      }

      setShowModal(false);
      setFormData({ name: "", building: "", floor: "", roomNumber: "", type: "office" });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to save ${modalType}`);
    }
  };

  // Delete handlers
  const handleDeleteCollege = async (collegeId) => {
    if (!window.confirm("Delete this college? All associated departments and rooms will be unassigned.")) return;
    try {
      await deleteCollege(collegeId);
      setColleges(colleges.filter((c) => c.id !== collegeId));
    } catch (err) {
      setError("Failed to delete college");
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    if (!window.confirm("Delete this department? All associated rooms will be unassigned.")) return;
    try {
      await deleteDepartment(deptId);
      setDepartments(departments.filter((d) => d.id !== deptId));
    } catch (err) {
      setError("Failed to delete department");
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Delete this room?")) return;
    try {
      await deleteOffice(roomId);
      setOffices(offices.filter((o) => o.id !== roomId));
    } catch (err) {
      setError("Failed to delete room");
    }
  };

  const handleDeleteAdminBuilding = async (buildingId) => {
    if (!window.confirm("Delete this administrative building? All associated offices will be unassigned.")) return;
    try {
      await deleteDepartment(buildingId);
      setDepartments(departments.filter((d) => d.id !== buildingId));
    } catch (err) {
      setError("Failed to delete administrative building");
    }
  };

  // Helper functions
  const toggleCollegeExpand = (collegeId) => {
    setExpandedColleges((prev) => ({
      ...prev,
      [collegeId]: !prev[collegeId],
    }));
  };

  const toggleDepartmentExpand = (deptId) => {
    setExpandedDepartments((prev) => ({
      ...prev,
      [deptId]: !prev[deptId],
    }));
  };

  const toggleAdminBuildingExpand = (buildingId) => {
    setExpandedAdminBuildings((prev) => ({
      ...prev,
      [buildingId]: !prev[buildingId],
    }));
  };

  const getDepartmentsByCollege = (collegeId) => {
    return departments.filter((d) => d.college_id === collegeId);
  };

  const getRoomsByDepartment = (deptId) => {
    return offices.filter((o) => o.department_id === deptId);
  };

  const getAdminBuildings = () => {
    return departments.filter((d) => !d.college_id);
  };

  const getCollegeDepartments = (collegeId) => {
    return departments.filter((d) => d.college_id === collegeId);
  };

  const getModalTitle = () => {
    const action = modalMode === "add" ? "Add New" : "Edit";
    if (modalType === "college") return `${action} College`;
    if (modalType === "department") return `${action} Department`;
    if (modalType === "admin_building") return `${action} Administrative Building`;
    return `${action} Room/Location`;
  };

  // Get readable room type label
  const getRoomTypeLabel = (type) => {
    const labels = {
      // Teaching Spaces
      classroom: "Classroom",
      laboratory: "Laboratory",
      studio: "Studio/Workshop",
      lecture_hall: "Lecture Hall",
      // Administrative Offices
      office: "General Office",
      registrar: "Registrar Office",
      business_center: "Business Center",
      admin: "Administration Office",
      dean: "Dean/Director Office",
      faculty: "Faculty Room",
      department: "Department Office",
      // Student Services
      student_center: "Student Center",
      counseling: "Counseling/Guidance",
      clinic: "Medical Clinic",
      library: "Library",
      lounge: "Lounge/Recreation",
      // Support Facilities
      storage: "Storage Room",
      conference: "Conference Room",
      cafeteria: "Cafeteria/Dining",
      maintenance: "Maintenance Room",
      security: "Security Office",
    };
    return labels[type] || type;
  };

  // Get room type emoji/icon
  const getRoomTypeEmoji = (type) => {
    const emojis = {
      // Teaching
      classroom: "📚",
      laboratory: "🔬",
      studio: "🎨",
      lecture_hall: "🎓",
      // Administrative
      office: "💼",
      registrar: "📋",
      business_center: "💰",
      admin: "🏛️",
      dean: "👔",
      faculty: "👨‍🏫",
      department: "📁",
      // Student Services
      student_center: "👥",
      counseling: "💬",
      clinic: "🏥",
      library: "📖",
      lounge: "🪑",
      // Support
      storage: "📦",
      conference: "🤝",
      cafeteria: "🍽️",
      maintenance: "🔧",
      security: "🛡️",
    };
    return emojis[type] || "🚪";
  };

  // College Card Component
  const CollegeCard = ({ college }) => {
    const depts = getDepartmentsByCollege(college.id);
    const isExpanded = expandedColleges[college.id];

    return (
      <Card key={college.id} sx={{ mb: 2, borderRadius: 2, overflow: "hidden" }}>
        <CardContent sx={{ pb: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.2) }}>
                <School sx={{ color: theme.palette.primary.main }} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {college.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {depts.length} {depts.length === 1 ? "Department" : "Departments"}
                </Typography>
              </Box>
            </Box>

            <Box>
              <IconButton size="small" onClick={() => openCollegeModal("edit", college)} title="Edit">
                <Edit fontSize="small" />
              </IconButton>
              <IconButton size="small" color="error" onClick={() => handleDeleteCollege(college.id)} title="Delete">
                <Delete fontSize="small" />
              </IconButton>
              {depts.length > 0 && (
                <IconButton size="small" onClick={() => toggleCollegeExpand(college.id)}>
                  {isExpanded ? <ExpandMore /> : <ChevronRight />}
                </IconButton>
              )}
            </Box>
          </Box>

          {depts.length > 0 && (
            <Button size="small" startIcon={<Add />} onClick={() => openDepartmentModal("add", college)} sx={{ mb: 2, textTransform: "none" }}>
              Add Department
            </Button>
          )}

          {depts.length === 0 && (
            <Box sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No departments yet. <Button size="small" onClick={() => openDepartmentModal("add", college)}>Create one</Button>
              </Typography>
            </Box>
          )}
        </CardContent>

        <Collapse in={isExpanded && depts.length > 0}>
          <Divider />
          <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02), p: 2 }}>
            {depts.map((dept) => (
              <DepartmentCard key={dept.id} college={college} department={dept} />
            ))}
          </Box>
        </Collapse>
      </Card>
    );
  };

  // Department Card Component
  const DepartmentCard = ({ college, department }) => {
    const rooms = getRoomsByDepartment(department.id);
    const isExpanded = expandedDepartments[department.id];

    return (
      <Card key={department.id} sx={{ mb: 2, borderRadius: 1.5, overflow: "hidden", bgcolor: "background.paper" }}>
        <CardContent sx={{ pb: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.2), width: 36, height: 36 }}>
                <Domain sx={{ color: theme.palette.info.main, fontSize: 20 }} />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {department.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {department.building && `${department.building}`}
                  {department.floor && `, Floor ${department.floor}`}
                  {rooms.length > 0 && ` • ${rooms.length} ${rooms.length === 1 ? "Room" : "Rooms"}`}
                </Typography>
              </Box>
            </Box>

            <Box>
              <IconButton size="small" onClick={() => openDepartmentModal("edit", college, department)} title="Edit">
                <Edit fontSize="small" />
              </IconButton>
              <IconButton size="small" color="error" onClick={() => handleDeleteDepartment(department.id)} title="Delete">
                <Delete fontSize="small" />
              </IconButton>
              {rooms.length > 0 && (
                <IconButton size="small" onClick={() => toggleDepartmentExpand(department.id)}>
                  {isExpanded ? <ExpandMore /> : <ChevronRight />}
                </IconButton>
              )}
            </Box>
          </Box>

          <Button size="small" startIcon={<Add />} onClick={() => openRoomModal("add", college, department)} sx={{ mb: 2, textTransform: "none" }}>
            Add Room
          </Button>

          {rooms.length === 0 && (
            <Box sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No rooms yet.
              </Typography>
            </Box>
          )}
        </CardContent>

        <Collapse in={isExpanded && rooms.length > 0}>
          <Divider />
          <Box sx={{ bgcolor: alpha(theme.palette.info.main, 0.02), p: 2 }}>
            {rooms.map((room) => (
              <RoomCard key={room.id} college={college} department={department} room={room} />
            ))}
          </Box>
        </Collapse>
      </Card>
    );
  };

  // Admin Building Card Component
  const AdminBuildingCard = ({ building }) => {
    const rooms = getRoomsByDepartment(building.id);
    const isExpanded = expandedAdminBuildings[building.id];

    return (
      <Card sx={{ mb: 2, borderRadius: 2, overflow: "hidden" }}>
        <CardContent sx={{ pb: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.2) }}>
                <BusinessCenter sx={{ color: theme.palette.warning.main }} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {building.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {building.building && `${building.building}`}
                  {building.floor && `, Floor ${building.floor}`}
                  {rooms.length > 0 && ` • ${rooms.length} ${rooms.length === 1 ? "Office" : "Offices"}`}
                </Typography>
              </Box>
            </Box>

            <Box>
              <IconButton size="small" onClick={() => openAdminBuildingModal("edit", building)} title="Edit">
                <Edit fontSize="small" />
              </IconButton>
              <IconButton size="small" color="error" onClick={() => handleDeleteAdminBuilding(building.id)} title="Delete">
                <Delete fontSize="small" />
              </IconButton>
              {rooms.length > 0 && (
                <IconButton size="small" onClick={() => toggleAdminBuildingExpand(building.id)}>
                  {isExpanded ? <ExpandMore /> : <ChevronRight />}
                </IconButton>
              )}
            </Box>
          </Box>

          <Button size="small" startIcon={<Add />} onClick={() => openAdminRoomModal("add", building)} sx={{ mb: 2, textTransform: "none" }}>
            Add Office
          </Button>

          {rooms.length === 0 && (
            <Box sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No offices yet.
              </Typography>
            </Box>
          )}
        </CardContent>

        <Collapse in={isExpanded && rooms.length > 0}>
          <Divider />
          <Box sx={{ bgcolor: alpha(theme.palette.warning.main, 0.02), p: 2 }}>
            {rooms.map((room) => (
              <RoomCard key={room.id} college={null} department={building} room={room} />
            ))}
          </Box>
        </Collapse>
      </Card>
    );
  };

  // Room Card Component
  const RoomCard = ({ college, department, room }) => {
    return (
      <Paper elevation={0} sx={{ p: 2, mb: 1.5, bgcolor: "background.default", borderRadius: 1, border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.2), width: 32, height: 32 }}>
              <Typography variant="body1">{getRoomTypeEmoji(room.type)}</Typography>
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {room.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getRoomTypeLabel(room.type)} {room.room_number && `• Room ${room.room_number}`}
              </Typography>
            </Box>
          </Box>

          <Box>
            <IconButton size="small" onClick={() => openRoomModal("edit", college, department, room)} title="Edit">
              <Edit fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={() => handleDeleteRoom(room.id)} title="Delete">
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    );
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            📍 Location Management
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Organize your institution's colleges, departments, and rooms. This helps track item locations and manage inventory across campus.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Colleges
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {colleges.length}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Departments
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {departments.length}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Rooms/Locations
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {offices.length}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.05), borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {colleges.length + departments.length + offices.length}
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Add College Button */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <Button variant="contained" startIcon={<Add />} onClick={() => openCollegeModal("add")}>
            Create New College
          </Button>
          <Button variant="outlined" startIcon={<Add />} onClick={() => openAdminBuildingModal("add")}>
            Add Administrative Building
          </Button>
        </Box>

        {/* Loading State */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
            <CircularProgress />
          </Box>
        ) : colleges.length === 0 ? (
          <Box>
            {/* Show admin buildings section even if no colleges */}
            {getAdminBuildings().length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <Typography variant="h5" fontWeight={700}>
                    🏢 Administrative Buildings & Services
                  </Typography>
                  <Chip label={getAdminBuildings().length} />
                </Box>
                <Stack spacing={2}>
                  {getAdminBuildings().map((building) => (
                    <AdminBuildingCard key={building.id} building={building} />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Empty state for colleges */}
            <Card elevation={0} sx={{ p: 4, textAlign: "center", bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: 2 }}>
              <School sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                No colleges yet. Start by creating your first college.
              </Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => openCollegeModal("add")}>
                Create College
              </Button>
            </Card>
          </Box>
        ) : (
          <Stack spacing={3}>
            {/* Administrative Buildings Section */}
            {getAdminBuildings().length > 0 && (
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <Typography variant="h5" fontWeight={700}>
                    🏢 Administrative Buildings & Services
                  </Typography>
                  <Chip label={getAdminBuildings().length} />
                </Box>
                <Stack spacing={2}>
                  {getAdminBuildings().map((building) => (
                    <AdminBuildingCard key={building.id} building={building} />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Academic Colleges Section */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Typography variant="h5" fontWeight={700}>
                  🎓 Academic Colleges & Departments
                </Typography>
                <Chip label={colleges.length} />
              </Box>
              <Stack spacing={2}>
                {colleges.map((college) => (
                  <CollegeCard key={college.id} college={college} />
                ))}
              </Stack>
            </Box>
          </Stack>
        )}
      </Box>

      {/* Modal Dialog */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ py: 2.5, px: 3, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6" fontWeight={700}>
            {getModalTitle()}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ py: 3, px: 3 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={modalType === "college" ? "e.g., College of Engineering" : modalType === "department" ? "e.g., Computer Science Department" : "e.g., Lab A, Admin Room"}
              autoFocus
            />

            {(modalType === "department" || modalType === "admin_building" || modalType === "room") && (
              <>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Building (Optional)"
                      value={formData.building}
                      onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                      placeholder="e.g., Building A"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Floor (Optional)"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                      placeholder="e.g., 3rd, Ground"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Room Number (Optional)"
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                      placeholder="e.g., 301"
                      size="small"
                    />
                  </Grid>
                </Grid>
              </>
            )}

            {modalType === "room" && (
              <FormControl fullWidth>
                <InputLabel>Room Type</InputLabel>
                <Select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} label="Room Type">
                  {/* Teaching Spaces */}
                  <MenuItem disabled sx={{ fontWeight: 700, bgcolor: '#f5f5f5' }}>📚 Teaching Spaces</MenuItem>
                  <MenuItem value="classroom">Classroom</MenuItem>
                  <MenuItem value="laboratory">Laboratory</MenuItem>
                  <MenuItem value="studio">Studio/Workshop</MenuItem>
                  <MenuItem value="lecture_hall">Lecture Hall</MenuItem>

                  {/* Administrative Offices */}
                  <MenuItem disabled sx={{ fontWeight: 700, bgcolor: '#f5f5f5', mt: 1 }}>🏢 Administrative Offices</MenuItem>
                  <MenuItem value="office">General Office</MenuItem>
                  <MenuItem value="registrar">Registrar Office</MenuItem>
                  <MenuItem value="business_center">Business Center</MenuItem>
                  <MenuItem value="admin">Administration Office</MenuItem>
                  <MenuItem value="dean">Dean/Director Office</MenuItem>
                  <MenuItem value="faculty">Faculty Room</MenuItem>
                  <MenuItem value="department">Department Office</MenuItem>

                  {/* Student Services */}
                  <MenuItem disabled sx={{ fontWeight: 700, bgcolor: '#f5f5f5', mt: 1 }}>👥 Student Services</MenuItem>
                  <MenuItem value="student_center">Student Center</MenuItem>
                  <MenuItem value="counseling">Counseling/Guidance</MenuItem>
                  <MenuItem value="clinic">Medical Clinic</MenuItem>
                  <MenuItem value="library">Library</MenuItem>
                  <MenuItem value="lounge">Lounge/Recreation</MenuItem>

                  {/* Support Facilities */}
                  <MenuItem disabled sx={{ fontWeight: 700, bgcolor: '#f5f5f5', mt: 1 }}>🔧 Support Facilities</MenuItem>
                  <MenuItem value="storage">Storage Room</MenuItem>
                  <MenuItem value="conference">Conference Room</MenuItem>
                  <MenuItem value="cafeteria">Cafeteria/Dining</MenuItem>
                  <MenuItem value="maintenance">Maintenance Room</MenuItem>
                  <MenuItem value="security">Security Office</MenuItem>
                </Select>
              </FormControl>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: 1, borderColor: "divider" }}>
          <Button onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleSaveModal} variant="contained">
            {modalMode === "add" ? "Create" : "Update"}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
};

export default LocationsPage;
