import api from './axios.jsx';

export const fetchReceivedSuppliesLogs = async (params = {}) => {
  const res = await api.get('/received-supplies', { params });
  return res.data;
};

export default {
  fetchReceivedSuppliesLogs,
};
