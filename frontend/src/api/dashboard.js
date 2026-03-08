import api from "./axios";

export const fetchDashboardStats = async () => {
  const [users, offices, items, memorandumReceipts] = await Promise.all([
    api.get("/users/role-counts"),
    api.get("/offices"),
    api.get("/items"),
    api.get("/memorandum-receipts")
  ]);
  return {
    users: users.data,
    offices: offices.data,
    items: items.data,
    memorandumReceipts: memorandumReceipts.data
  };
};
