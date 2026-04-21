import axios from './axios.jsx';
import { cachedGet, invalidateRequestCache } from './requestCache';

export const listDepartments = async (collegeId) => {
  const params = {};
  if (collegeId) params.college_id = collegeId;
  return cachedGet(axios, '/departments', {
    params,
    ttlMs: 5 * 60 * 1000,
    transform: (data) => (Array.isArray(data) ? data : (data.data || [])),
  });
};

export const createDepartment = async (payload) => {
  const { data } = await axios.post('/departments', payload);
  invalidateRequestCache('/departments');
  return data;
};

export const updateDepartment = async (id, payload) => {
  const { data } = await axios.put(`/departments/${id}`, payload);
  invalidateRequestCache('/departments');
  return data;
};

export const deleteDepartment = async (id) => {
  const { data } = await axios.delete(`/departments/${id}`);
  invalidateRequestCache('/departments');
  return data;
};
