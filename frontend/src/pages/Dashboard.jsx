import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, logout } from "../api/Auth";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await getProfile();
        console.log("Profile loaded:", res.data);
        setUser(res.data.user);
      } catch (err) {
        console.error("Unauthorized or session expired:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (loading) return <div>Loading...</div>;

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
