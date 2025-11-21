import React from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../api/Auth";
import { useUser } from "../context/UserContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading } = useUser();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (loading) return <div>Loading...</div>;
  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="p-6">
      <div className="bg-white dark:bg-gray-800 shadow-md p-5 rounded">
        <h1 className="text-2xl font-semibold mb-3">Welcome, {user?.name}</h1>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
        <button onClick={handleLogout} className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
          Logout
        </button>
      </div>
    </div>
  );
}
