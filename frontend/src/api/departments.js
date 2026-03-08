import axios from './axios.jsx';

export const listDepartments = async (collegeId) => {
  const params = {};
  if (collegeId) params.college_id = collegeId;
  const { data } = await axios.get('/departments', { params });
  return Array.isArray(data) ? data : (data.data || []);
};

export const createDepartment = async (payload) => {
  const { data } = await axios.post('/departments', payload);
  return data;
};

export const updateDepartment = async (id, payload) => {
  const { data } = await axios.put(`/departments/${id}`, payload);
  return data;
};

export const deleteDepartment = async (id) => {
  const { data } = await axios.delete(`/departments/${id}`);
  return data;
};
