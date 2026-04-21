import React from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import DashboardLayout from "../components/Layout/DashboardLayout";
import { DashboardSkeleton } from "../components/common/SkeletonLoader";

// Import new v2 dashboards
import AdminDashboard from "./Dashboard/AdminDashboard_v2";
import StaffDashboard from "./Dashboard/StaffDashboard_v2";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();

  if (userLoading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  // Render based on role
  if (user.role === 'admin' || user.role === 'supply_officer') {
    return <AdminDashboard />;
  } else {
    return <StaffDashboard />;
  }
}
