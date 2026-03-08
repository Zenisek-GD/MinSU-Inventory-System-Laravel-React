import axios from './axios.jsx';

export const listOffices = async (departmentId) => {
  const params = {};
  if (departmentId) params.department_id = departmentId;
  const { data } = await axios.get('/offices', { params });
  // Ensure always returns an array
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export const createOffice = async (payload) => {
  const { data } = await axios.post('/offices', payload);
  return data;
};

export const updateOffice = async (id, payload) => {
  const { data } = await axios.put(`/offices/${id}`, payload);
  return data;
};

export const deleteOffice = async (id) => {
  const { data } = await axios.delete(`/offices/${id}`);
  return data;
};
