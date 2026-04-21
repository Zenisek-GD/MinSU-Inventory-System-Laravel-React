import api from "../api/axios";
import { cachedGet, invalidateRequestCache } from './requestCache';

export const fetchCategories = async () => {
  return cachedGet(api, '/categories', { ttlMs: 10 * 60 * 1000 });
};

export const createCategory = async (data) => {
  const response = await api.post("/categories", data);
  invalidateRequestCache('/categories');
  return response.data;
};

export const updateCategory = async (id, data) => {
  const response = await api.put(`/categories/${id}`, data);
  invalidateRequestCache('/categories');
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await api.delete(`/categories/${id}`);
  invalidateRequestCache('/categories');
  return response.data;
};
