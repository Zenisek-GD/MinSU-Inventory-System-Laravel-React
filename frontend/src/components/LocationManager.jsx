import React, { useEffect, useMemo, useState } from "react";
import { listOffices, createOffice, updateOffice } from "../api/offices";
import { listDepartments } from "../api/departments";
import {
  Alert,
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
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Edit } from "@mui/icons-material";

const OFFICE_TYPES = [
  { value: "office", label: "General Office" },
  { value: "classroom", label: "Classroom" },
  { value: "laboratory", label: "Laboratory" },
  { value: "studio", label: "Studio/Workshop" },
  { value: "lecture_hall", label: "Lecture Hall" },
  { value: "registrar", label: "Registrar Office" },
  { value: "business_center", label: "Business Center" },
  { value: "admin", label: "Administration Office" },
  { value: "dean", label: "Dean/Director Office" },
  { value: "faculty", label: "Faculty Office" },
  { value: "department", label: "Department Office" },
  { value: "student_center", label: "Student Center" },
  { value: "counseling", label: "Counseling/Guidance" },
  { value: "clinic", label: "Clinic" },
  { value: "library", label: "Library" },
  { value: "lounge", label: "Lounge" },
  { value: "storage", label: "Storage" },
  { value: "conference", label: "Conference Room" },
  { value: "cafeteria", label: "Cafeteria" },
  { value: "maintenance", label: "Maintenance" },
  { value: "security", label: "Security" },
  { value: "other", label: "Other" },
];

export default function LocationManager() {
  const [offices, setOffices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "office",
    category: "facility",
    department_id: null,
    building: "",
    floor: "",
    room_number: "",
    room_id: "",
    year_level: "",
    assigned_professor: "",
  });

  const [createForm, setCreateForm] = useState({
    name: "",
    type: "office",
    category: "facility",
    department_id: "",
    building: "",
    floor: "",
    room_number: "",
    room_id: "",
    year_level: "",
    assigned_professor: "",
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listOffices();
      setOffices(data);
    } catch (e) {
      setError("Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await listDepartments();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (e) {
      setDepartments([]);
    }
  };

  useEffect(() => {
    load();
    loadDepartments();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return offices.filter((o) => {
      if (typeFilter && o.type !== typeFilter) return false;
      if (!q) return true;
      const hay = [
        o.room_id,
        o.name,
        o.building,
        o.floor,
        o.room_number,
        o.department?.name,
        o.department?.college?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [offices, query, typeFilter]);

  const openEdit = (office) => {
    setEditingOffice(office);
    setForm({
      name: office.name || "",
      type: office.type || "office",
      category: office.category || "facility",
      department_id: office.department_id ?? null,
      building: office.building || "",
      floor: office.floor || "",
      room_number: office.room_number || "",
      room_id: office.room_id || "",
      year_level: office.year_level ?? "",
      assigned_professor: office.assigned_professor || "",
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editingOffice?.id) return;
    setError(null);
    try {
      const payload = {
        name: form.name,
        type: form.type,
        category: form.category,
        department_id: form.department_id,
        building: form.building || null,
        floor: form.floor || null,
        room_number: form.room_number || null,
        room_id: form.room_id || null,
        year_level: form.year_level ? Number(form.year_level) : null,
        assigned_professor: form.assigned_professor || null,
      };

      const updated = await updateOffice(editingOffice.id, payload);
      setOffices((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setEditOpen(false);
      setEditingOffice(null);
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data?.message || "Failed to update location");
    }
  };

  const openCreate = () => {
    setError(null);
    setCreateForm({
      name: "",
      type: "office",
      category: "facility",
      department_id: "",
      building: "",
      floor: "",
      room_number: "",
      room_id: "",
      year_level: "",
      assigned_professor: "",
    });
    setCreateOpen(true);
  };

  const saveCreate = async () => {
    setError(null);
    try {
      if (!createForm.name.trim()) {
        setError("Name is required");
        return;
      }
      if (!createForm.department_id) {
        setError("Department/Admin Building is required");
        return;
      }

      const payload = {
        name: createForm.name,
        type: createForm.type,
        category: createForm.category,
        department_id: Number(createForm.department_id),
        building: createForm.building || null,
        floor: createForm.floor || null,
        room_number: createForm.room_number || null,
        room_id: createForm.room_id || null,
        year_level: createForm.year_level ? Number(createForm.year_level) : null,
        assigned_professor: createForm.assigned_professor || null,
      };

      const created = await createOffice(payload);
      setOffices((prev) => [created, ...prev]);
      setCreateOpen(false);
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data?.message || "Failed to create room/location");
    }
  };

  return (
    <Box>
      <Card elevation={0} sx={{ borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Update Existing Locations
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Search by `room_id`, name, building/floor, or department.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button onClick={openCreate} variant="contained" startIcon={<Add />}>
                Add Room/Location
              </Button>
              <Button onClick={load} variant="outlined">
                Refresh
              </Button>
            </Stack>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., CBM-2F-R01, REG-OFFICE, Library"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  {OFFICE_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Stack direction="row" spacing={1} sx={{ height: "100%", alignItems: "center" }}>
                <Chip label={`Results: ${filtered.length}`} />
                <Chip
                  color="warning"
                  variant="outlined"
                  label={`Missing room_id: ${filtered.filter((o) => !o.room_id).length}`}
                />
              </Stack>
            </Grid>
          </Grid>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>room_id</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Building</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Floor</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Room</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((o) => (
                    <TableRow key={o.id} hover>
                      <TableCell>{o.room_id || "—"}</TableCell>
                      <TableCell>{o.name}</TableCell>
                      <TableCell>{o.type}</TableCell>
                      <TableCell>{o.building || "—"}</TableCell>
                      <TableCell>{o.floor || "—"}</TableCell>
                      <TableCell>{o.room_number || "—"}</TableCell>
                      <TableCell>{o.department?.name || "—"}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => openEdit(o)} title="Edit">
                          <Edit fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Location</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={form.type}
                    label="Type"
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                  >
                    {OFFICE_TYPES.map((t) => (
                      <MenuItem key={t.value} value={t.value}>
                        {t.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={form.category}
                    label="Category"
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  >
                    <MenuItem value="facility">facility</MenuItem>
                    <MenuItem value="departmental">departmental</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Room ID (room_id)"
              value={form.room_id}
              onChange={(e) => setForm((p) => ({ ...p, room_id: e.target.value.toUpperCase() }))}
              placeholder="CBM-2F-R01 or REG-OFFICE"
              helperText="Recommended: use standardized room_id for tracking"
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Building"
                  value={form.building}
                  onChange={(e) => setForm((p) => ({ ...p, building: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Floor"
                  value={form.floor}
                  onChange={(e) => setForm((p) => ({ ...p, floor: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Room"
                  value={form.room_number}
                  onChange={(e) => setForm((p) => ({ ...p, room_number: e.target.value }))}
                />
              </Grid>
            </Grid>

            {form.type === "classroom" && (
              <TextField
                fullWidth
                label="Year Level (1-4)"
                value={form.year_level}
                onChange={(e) => setForm((p) => ({ ...p, year_level: e.target.value }))}
              />
            )}

            {form.type === "faculty" && (
              <TextField
                fullWidth
                label="Assigned Professor"
                value={form.assigned_professor}
                onChange={(e) => setForm((p) => ({ ...p, assigned_professor: e.target.value }))}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Room/Location</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Name"
              value={createForm.name}
              onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
            />

            <FormControl fullWidth>
              <InputLabel>Department / Admin Building</InputLabel>
              <Select
                value={createForm.department_id}
                label="Department / Admin Building"
                onChange={(e) => setCreateForm((p) => ({ ...p, department_id: e.target.value }))}
              >
                {departments.map((d) => (
                  <MenuItem key={d.id} value={String(d.id)}>
                    {(d.college?.name ? `${d.college.name} — ` : "") + d.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={createForm.type}
                    label="Type"
                    onChange={(e) => setCreateForm((p) => ({ ...p, type: e.target.value }))}
                  >
                    {OFFICE_TYPES.map((t) => (
                      <MenuItem key={t.value} value={t.value}>
                        {t.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={createForm.category}
                    label="Category"
                    onChange={(e) => setCreateForm((p) => ({ ...p, category: e.target.value }))}
                  >
                    <MenuItem value="facility">facility</MenuItem>
                    <MenuItem value="departmental">departmental</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Room ID (room_id)"
              value={createForm.room_id}
              onChange={(e) => setCreateForm((p) => ({ ...p, room_id: e.target.value.toUpperCase() }))}
              placeholder="CBM-2F-R01 or REG-OFFICE"
              helperText="If left blank, it can be inferred from building/floor/room"
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Building"
                  value={createForm.building}
                  onChange={(e) => setCreateForm((p) => ({ ...p, building: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Floor"
                  value={createForm.floor}
                  onChange={(e) => setCreateForm((p) => ({ ...p, floor: e.target.value }))}
                  placeholder="e.g., 2F"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Room Code"
                  value={createForm.room_number}
                  onChange={(e) => setCreateForm((p) => ({ ...p, room_number: e.target.value }))}
                  placeholder="e.g., R01, LAB02"
                />
              </Grid>
            </Grid>

            {createForm.type === "classroom" && (
              <TextField
                fullWidth
                label="Year Level (1-4)"
                value={createForm.year_level}
                onChange={(e) => setCreateForm((p) => ({ ...p, year_level: e.target.value }))}
              />
            )}

            {createForm.type === "faculty" && (
              <TextField
                fullWidth
                label="Assigned Professor"
                value={createForm.assigned_professor}
                onChange={(e) => setCreateForm((p) => ({ ...p, assigned_professor: e.target.value }))}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveCreate}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
