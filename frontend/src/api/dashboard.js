import api from "./axios";

export const fetchDashboardStats = async () => {
  const { data } = await api.get('/dashboard/stats');
  return data;
};

export const fetchDashboardMrTimeline = async (params = {}) => {
  const { data } = await api.get('/dashboard/mr-timeline', { params });
  return data?.data || [];
};
