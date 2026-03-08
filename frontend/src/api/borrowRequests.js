import axios from './axios.jsx';

export const createBorrowRequest = async (payload) => {
  const { data } = await axios.post('/borrow-requests', payload);
  return data;
};

export const getMyBorrowRequests = async () => {
  const { data } = await axios.get('/borrow-requests/my');
  return Array.isArray(data) ? data : [];
};

export const getPendingRequests = async () => {
  const { data } = await axios.get('/borrow-requests/admin/pending');
  return Array.isArray(data) ? data : [];
};

export const approveBorrowRequest = async (id, payload) => {
  const { data } = await axios.patch(`/borrow-requests/${id}/approve`, payload);
  return data;
};

export const rejectBorrowRequest = async (id, payload) => {
  const { data } = await axios.patch(`/borrow-requests/${id}/reject`, payload);
  return data;
};

export const markBorrowed = async (id) => {
  const { data } = await axios.patch(`/borrow-requests/${id}/mark-borrowed`);
  return data;
};

export const markReturned = async (id) => {
  const { data } = await axios.patch(`/borrow-requests/${id}/mark-returned`);
  return data;
};

export const getItemBorrowHistory = async (itemId) => {
  const { data } = await axios.get(`/borrow-requests/item/${itemId}`);
  return Array.isArray(data) ? data : [];
};

export const getLocationBorrowHistory = async (officeId) => {
  const { data } = await axios.get(`/borrow-requests/location/${officeId}`);
  return Array.isArray(data) ? data : [];
};

export const getBorrowRequest = async (id) => {
  const { data } = await axios.get(`/borrow-requests/${id}`);
  return data;
};
