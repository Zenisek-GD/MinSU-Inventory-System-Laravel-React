import api from "../api/axios";

export const fetchPurchaseRequests = async () => {
  const response = await api.get("/purchase-requests");
  return response.data;
};

export const createPurchaseRequest = async (data) => {
  const response = await api.post("/purchase-requests", data);
  return response.data;
};

export const fetchPurchaseRequest = async (id) => {
  const response = await api.get(`/purchase-requests/${id}`);
  return response.data;
};

export const updatePurchaseRequest = async (id, data) => {
  const response = await api.put(`/purchase-requests/${id}`, data);
  return response.data;
};

export const deletePurchaseRequest = async (id) => {
  const response = await api.delete(`/purchase-requests/${id}`);
  return response.data;
};
