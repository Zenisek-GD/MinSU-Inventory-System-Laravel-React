import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import SupplyOfficerDashboard from "./pages/Dashboard/SupplyOfficerDashboard";
import StaffDashboard from "./pages/Dashboard/StaffDashboard";
import Loading from "./components/common/Loading";
import { UserProvider, useUser } from "./context/UserContext";

// ...existing code...

// AppRoutes uses the user context
const AppRoutes = () => {
  const { user, loading } = useUser();

  const RoleBasedDashboard = () => {
    if (!user) return <Navigate to="/login" />;
    switch (user.role) {
      case 'admin': return <AdminDashboard />;
      case 'supply_officer': return <SupplyOfficerDashboard />;
      case 'staff': return <StaffDashboard />;
      default: return <Navigate to="/login" />;
    }
  };

  const ProtectedRoute = ({ children }) => {
    if (loading) return <Loading />;
    if (!user) return <Navigate to="/login" />;
    return children;
  };

  if (loading) return <Loading />;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <RoleBasedDashboard />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" />} />
        {/* 404 Route */}
        <Route path="*" element={
          <div style={{ padding: 20, textAlign: 'center' }}>
            <h1>404 - Page Not Found</h1>
            <p>The page you're looking for doesn't exist.</p>
          </div>
        } />
      </Routes>
    </Router>
  );
};

const App = () => (
  <UserProvider>
    <AppRoutes />
  </UserProvider>
);

export default App;