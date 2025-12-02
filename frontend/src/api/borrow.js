import api from "../api/axios";

export const fetchBorrows = async (params = {}) => {
  const response = await api.get("/borrows", { params });
  return response.data;
};

export const fetchBorrowRecords = async (params = {}) => {
  const response = await api.get("/borrows", { params });
  return response.data;
};

export const createBorrow = async (data) => {
  const response = await api.post("/borrows", data);
  return response.data;
};

export const fetchBorrow = async (id) => {
  const response = await api.get(`/borrows/${id}`);
  return response.data;
};


// Update status (generic update)
export const updateBorrow = async (id, data) => {
  // If status is being set to Approved, use custom endpoint
  if (data.status === "Approved") {
    const response = await api.put(`/borrows/${id}/approve`, data);
    return response.data;
  }
  // If status is being set to Rejected, use custom endpoint
  if (data.status === "Rejected") {
    const response = await api.put(`/borrows/${id}/reject`, data);
    return response.data;
  }
  // Otherwise, use default update
  const response = await api.put(`/borrows/${id}`, data);
  return response.data;
};

export const deleteBorrow = async (id) => {
  const response = await api.delete(`/borrows/${id}`);
  return response.data;
};

// Return a borrowed item (record a return, condition, notes)
export const returnBorrow = async (id, data) => {
  // Many backends implement this as a PUT to /borrows/{id}/return
  const response = await api.put(`/borrows/${id}/return`, data);
  return response.data;
};
