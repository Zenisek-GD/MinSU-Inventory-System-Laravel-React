import api from "./axios";

export const fetchDashboardStats = async () => {
  const [users, offices, items, purchaseRequests] = await Promise.all([
    api.get("/users/role-counts"),
    api.get("/offices"),
    api.get("/items"),
    api.get("/purchase-requests")
  ]);
  return {
    users: users.data,
    offices: offices.data,
    items: items.data,
    purchaseRequests: purchaseRequests.data
  };
};
