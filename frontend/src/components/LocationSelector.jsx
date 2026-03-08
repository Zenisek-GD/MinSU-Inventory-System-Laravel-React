import { useEffect, useState } from 'react';
import { listColleges } from '../api/colleges.js';
import { listDepartments } from '../api/departments.js';
import { listOffices } from '../api/offices.js';
import { TextField, MenuItem, Grid, Box, Typography, Alert } from '@mui/material';

export default function LocationSelector({ value, onChange, disabled }) {
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(false);

  const { college_id, department_id, office_id } = value || {};

  // Room type labels and emojis
  const roomTypeMap = {
    classroom: { label: "Classroom", emoji: "📚" },
    laboratory: { label: "Laboratory", emoji: "🔬" },
    studio: { label: "Studio/Workshop", emoji: "🎨" },
    lecture_hall: { label: "Lecture Hall", emoji: "🎓" },
    office: { label: "General Office", emoji: "💼" },
    registrar: { label: "Registrar Office", emoji: "📋" },
    business_center: { label: "Business Center", emoji: "💰" },
    admin: { label: "Administration Office", emoji: "🏛️" },
    dean: { label: "Dean/Director Office", emoji: "👔" },
    faculty: { label: "Faculty Room", emoji: "👨‍🏫" },
    department: { label: "Department Office", emoji: "📁" },
    student_center: { label: "Student Center", emoji: "👥" },
    counseling: { label: "Counseling/Guidance", emoji: "💬" },
    clinic: { label: "Medical Clinic", emoji: "🏥" },
    library: { label: "Library", emoji: "📖" },
    lounge: { label: "Lounge/Recreation", emoji: "🪑" },
    storage: { label: "Storage Room", emoji: "📦" },
    conference: { label: "Conference Room", emoji: "🤝" },
    cafeteria: { label: "Cafeteria/Dining", emoji: "🍽️" },
    maintenance: { label: "Maintenance Room", emoji: "🔧" },
    security: { label: "Security Office", emoji: "🛡️" },
  };

  const getRoomDisplay = (room) => {
    const typeInfo = roomTypeMap[room.type] || { label: room.type, emoji: "🚪" };
    return `${typeInfo.emoji} ${room.name} (${typeInfo.label})`;
  };

  useEffect(() => {
    loadColleges();
  }, []);

  useEffect(() => {
    if (college_id) {
      loadDepartments(college_id);
    } else {
      setDepartments([]);
      setOffices([]);
    }
  }, [college_id]);

  useEffect(() => {
    if (department_id) {
      loadOffices(department_id);
    } else {
      setOffices([]);
    }
  }, [department_id]);

  const loadColleges = async () => {
    try {
      const data = await listColleges();
      setColleges(data);
    } catch (err) {
      setColleges([]);
    }
  };

  const loadDepartments = async (collegeId) => {
    try {
      setLoading(true);
      const data = await listDepartments(collegeId);
      setDepartments(data);
    } catch (err) {
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOffices = async (departmentId) => {
    try {
      setLoading(true);
      const allOffices = await listOffices();
      const filtered = allOffices.filter(o => o.department_id === departmentId);
      setOffices(filtered);
    } catch (err) {
      setOffices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (patch) => {
    const updated = { college_id, department_id, office_id, ...(patch || {}) };
    
    // Reset dependent fields when parent changes
    if (patch?.college_id !== undefined) {
      updated.department_id = undefined;
      updated.office_id = undefined;
    }
    if (patch?.department_id !== undefined) {
      updated.office_id = undefined;
    }
    
    onChange?.(updated);
  };

  const getCollegeName = (id) => colleges.find(c => c.id === id)?.name || '';
  const getDepartmentName = (id) => departments.find(d => d.id === id)?.name || '';
  const getOfficeName = (id) => offices.find(o => o.id === id)?.name || '';

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
        📍 Select Location
      </Typography>

      <Grid container spacing={2}>
        {/* College Selection */}
        <Grid item xs={12} md={4}>
          <TextField
            select
            fullWidth
            label="🏫 College"
            value={college_id || ''}
            disabled={disabled}
            onChange={(e) => handleChange({ college_id: e.target.value || undefined })}
          >
            <MenuItem value="">-- Select College --</MenuItem>
            {colleges.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Department Selection */}
        <Grid item xs={12} md={4}>
          <TextField
            select
            fullWidth
            label="🏢 Department"
            value={department_id || ''}
            disabled={disabled || !college_id || loading}
            onChange={(e) => handleChange({ department_id: e.target.value || undefined })}
          >
            <MenuItem value="">-- Select Department --</MenuItem>
            {departments.map((d) => (
              <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Office/Room Selection */}
        <Grid item xs={12} md={4}>
          <TextField
            select
            fullWidth
            label="🚪 Room/Location"
            value={office_id || ''}
            disabled={disabled || !department_id || loading}
            onChange={(e) => handleChange({ office_id: e.target.value || undefined })}
          >
            <MenuItem value="">-- Select Room --</MenuItem>
            {offices.map((o) => (
              <MenuItem key={o.id} value={o.id}>{getRoomDisplay(o)}</MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {/* Help text for selected location */}
      {college_id && department_id && office_id && (
        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Selected Location:
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {getCollegeName(college_id)} → {getDepartmentName(department_id)} → {getOfficeName(office_id)}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

