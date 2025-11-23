// Fetch item by QR code
export const fetchItemByQr = async (qrCode) => {
  const response = await api.get(`/items/qr/${qrCode}`);
  return response.data;
};

// Update item status
export const updateItemStatus = async (id, data) => {
  const response = await api.put(`/items/${id}`, data);
  return response.data;
};
import api from "../api/axios";

export const fetchItems = async () => {
  const response = await api.get("/items");
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
