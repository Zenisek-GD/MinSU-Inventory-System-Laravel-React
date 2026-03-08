import axios from './axios.jsx';

export const listColleges = async () => {
  const { data } = await axios.get('/colleges');
  return data;
};

export const createCollege = async (payload) => {
  const { data } = await axios.post('/colleges', payload);
  return data;
};

export const updateCollege = async (id, payload) => {
  const { data } = await axios.put(`/colleges/${id}`, payload);
  return data;
};

export const deleteCollege = async (id) => {
  const { data } = await axios.delete(`/colleges/${id}`);
  return data;
};
