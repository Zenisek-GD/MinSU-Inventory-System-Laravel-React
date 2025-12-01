import api from './axios';

export const fetchStockMovements = async (params = {}) => {
  const res = await api.get('/stock-movements', { params });
  return res.data;
};

export const createStockMovement = async (data) => {
  const res = await api.post('/stock-movements', data);
  return res.data;
};

export default {
  fetchStockMovements,
  createStockMovement,
};
