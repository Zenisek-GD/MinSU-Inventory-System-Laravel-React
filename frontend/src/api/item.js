// Fetch item by QR code
import api from "../api/axios";

export const fetchItemByQr = async (qrCode) => {
  const response = await api.get(`/items/qr/${qrCode}`);
  return response.data;
};

// Update item status
export const updateItemStatus = async (id, data) => {
  const response = await api.put(`/items/${id}`, data);
  return response.data;
};

// fetchItems accepts optional `params` object which is forwarded to axios
export const fetchItems = async (params = {}) => {
  const response = await api.get("/items", { params });
  return response.data;
};

export const createItem = async (data) => {
  const response = await api.post("/items", data);
  return response.data;
};

export const updateItem = async (id, data) => {
  const response = await api.put(`/items/${id}`, data);
  return response.data;
};

export const deleteItem = async (id) => {
  const response = await api.delete(`/items/${id}`);
  return response.data;
};
