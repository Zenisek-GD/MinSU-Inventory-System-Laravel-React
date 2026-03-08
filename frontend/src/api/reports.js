import api from "./axios";

// Fetch items report with optional filters
// params: { start_date, end_date, office_id, category_id, status }
export const fetchItemsReport = async (params = {}) => {
  const response = await api.get("/reports/items", { params });
  return response.data;
};

// Fetch borrow records report with optional filters
// params: { start_date, end_date, office_id, status }
export const fetchBorrowsReport = async (params = {}) => {
  const response = await api.get("/reports/borrows", { params });
  return response.data;
};

// Fetch consumable stock levels report with optional filters
// params: { office_id, category_id, stock_status }
export const fetchStockLevelsReport = async (params = {}) => {
  const response = await api.get("/reports/stock-levels", { params });
  return response.data;
};

// Fetch aggregated notification alerts (pending borrows, overdue, low-stock, maintenance)
export const fetchNotificationAlerts = async () => {
  const response = await api.get("/reports/alerts");
  return response.data;
};

export default {
  fetchItemsReport,
  fetchBorrowsReport,
  fetchStockLevelsReport,
  fetchNotificationAlerts,
};
