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

// Fetch user notifications from database
export const fetchUserNotifications = async () => {
  const response = await api.get("/notifications");
  return response.data;
};

// Mark a notification as read
export const markNotificationRead = async (notificationId) => {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response.data;
};

// Mark all notifications as read
export const markAllNotificationsRead = async () => {
  const response = await api.put("/notifications/mark-all-read");
  return response.data;
};

export default {
  fetchItemsReport,
  fetchBorrowsReport,
  fetchStockLevelsReport,
  fetchNotificationAlerts,
  fetchUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};

