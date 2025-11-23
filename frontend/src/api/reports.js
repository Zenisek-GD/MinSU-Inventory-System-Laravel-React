import api from "./axios";

// Fetch items report with optional filters
export const fetchItemsReport = async (params = {}) => {
  // params: { start_date, end_date, office_id, category_id, status }
  const response = await api.get("/reports/items", { params });
  return response.data;
};

export default {
  fetchItemsReport,
};
