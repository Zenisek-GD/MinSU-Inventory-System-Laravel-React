import api from "../api/axios";

export const fetchBorrows = async () => {
  const response = await api.get("/borrows");
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

export const updateBorrow = async (id, data) => {
  const response = await api.put(`/borrows/${id}`, data);
  return response.data;
};

export const deleteBorrow = async (id) => {
  const response = await api.delete(`/borrows/${id}`);
  return response.data;
};
