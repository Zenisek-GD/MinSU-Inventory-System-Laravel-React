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


// Update status (generic update)
export const updatePurchaseRequest = async (id, data) => {
  // If status is being set to Approved, use custom endpoint
  if (data.status === "Approved") {
    const response = await api.put(`/purchase-requests/${id}/approve`, data);
    return response.data;
  }
  // If status is being set to Rejected, use custom endpoint
  if (data.status === "Rejected") {
    const response = await api.put(`/purchase-requests/${id}/reject`, data);
    return response.data;
  }
  // Otherwise, use default update
  const response = await api.put(`/purchase-requests/${id}`, data);
  return response.data;
};

export const deletePurchaseRequest = async (id) => {
  const response = await api.delete(`/purchase-requests/${id}`);
  return response.data;
};
