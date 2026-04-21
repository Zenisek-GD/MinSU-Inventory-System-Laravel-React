import axios from './axios.jsx';
import { cachedGet, invalidateRequestCache } from './requestCache';

export const listColleges = async () => {
  return cachedGet(axios, '/colleges', { ttlMs: 10 * 60 * 1000 });
};

export const createCollege = async (payload) => {
  const { data } = await axios.post('/colleges', payload);
  invalidateRequestCache('/colleges');
  return data;
};

export const updateCollege = async (id, payload) => {
  const { data } = await axios.put(`/colleges/${id}`, payload);
  invalidateRequestCache('/colleges');
  return data;
};

export const deleteCollege = async (id) => {
  const { data } = await axios.delete(`/colleges/${id}`);
  invalidateRequestCache('/colleges');
  return data;
};
