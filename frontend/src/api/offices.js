import axios from './axios.jsx';
import { cachedGet, invalidateRequestCache } from './requestCache';

export const listOffices = async (departmentId) => {
  const params = {};
  if (departmentId) params.department_id = departmentId;
  return cachedGet(axios, '/offices', {
    params,
    ttlMs: 2 * 60 * 1000,
    transform: (data) => {
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.data)) return data.data;
      return [];
    },
  });
};

export const createOffice = async (payload) => {
  const { data } = await axios.post('/offices', payload);
  invalidateRequestCache('/offices');
  return data;
};

export const updateOffice = async (id, payload) => {
  const { data } = await axios.put(`/offices/${id}`, payload);
  invalidateRequestCache('/offices');
  return data;
};

export const deleteOffice = async (id) => {
  const { data } = await axios.delete(`/offices/${id}`);
  invalidateRequestCache('/offices');
  return data;
};
