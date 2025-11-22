import BorrowsPage from "./pages/Borrows";
import ItemsPage from "./pages/Items";
import CategoriesPage from "./pages/Categories";
import UsersPage from "./pages/Users";
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import SupplyOfficerDashboard from "./pages/Dashboard/SupplyOfficerDashboard";
import StaffDashboard from "./pages/Dashboard/StaffDashboard";
import Loading from "./components/common/Loading";

import OfficesPage from "./pages/Offices";
import PurchaseRequestsPage from "./pages/PurchaseRequests";
import InventoryPage from "./pages/Inventory";

import { UserProvider, useUser } from "./context/UserContext.jsx";

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
        <Route path="/borrows" element={
          <ProtectedRoute>
            <>
              {(user && (user.role === 'admin' || user.role === 'supply_officer')) ? (
                <React.Suspense fallback={<Loading />}>
                  <BorrowsPage />
                </React.Suspense>
              ) : (
                <Navigate to="/dashboard" />
              )}
            </>
          </ProtectedRoute>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <RoleBasedDashboard />
          </ProtectedRoute>
        } />
        <Route path="/offices" element={
          <ProtectedRoute>
            {user && user.role === 'admin' ? (
              <React.Suspense fallback={<Loading />}>
                <OfficesPage />
              </React.Suspense>
            ) : (
              <Navigate to="/dashboard" />
            )}
          </ProtectedRoute>
        } />
        <Route path="/purchase-requests" element={
          <ProtectedRoute>
            {(user && (user.role === 'admin' || user.role === 'supply_officer')) ? (
              <React.Suspense fallback={<Loading />}>
                <PurchaseRequestsPage />
              </React.Suspense>
            ) : (
              <Navigate to="/dashboard" />
            )}
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute>
            {user && user.role === 'admin' ? (
              <React.Suspense fallback={<Loading />}>
                <UsersPage />
              </React.Suspense>
            ) : (
              <Navigate to="/dashboard" />
            )}
          </ProtectedRoute>
        } />
        <Route path="/categories" element={
          <ProtectedRoute>
            {user && user.role === 'admin' ? (
              <React.Suspense fallback={<Loading />}>
                <CategoriesPage />
              </React.Suspense>
            ) : (
              <Navigate to="/dashboard" />
            )}
          </ProtectedRoute>
        } />
        <Route path="/items" element={
          <ProtectedRoute>
            <>
              {(user && (user.role === 'admin' || user.role === 'supply_officer')) ? (
                <React.Suspense fallback={<Loading />}>
                  <ItemsPage />
                </React.Suspense>
              ) : (
                <Navigate to="/dashboard" />
              )}
            </>
          </ProtectedRoute>
        } />
        <Route path="/inventory" element={
          <ProtectedRoute>
            <>
              {(user && (user.role === 'admin' || user.role === 'supply_officer')) ? (
                <React.Suspense fallback={<Loading />}>
                  <InventoryPage />
                </React.Suspense>
              ) : (
                <Navigate to="/dashboard" />
              )}
            </>
          </ProtectedRoute>
        } />
        <Route path="/monitoring" element={
          <ProtectedRoute>
            <>
              {user && user.role === 'supply_officer' ? (
                <div style={{ padding: 20 }}>Monitoring Page (to be implemented)</div>
              ) : (
                <Navigate to="/dashboard" />
              )}
            </>
          </ProtectedRoute>
        } />
        <Route path="/transaction-logs" element={
          <ProtectedRoute>
            {user && user.role === 'supply_officer' ? (
              <div style={{ padding: 20 }}>Transaction Logs Page (to be implemented)</div>
            ) : (
              <Navigate to="/dashboard" />
            )}
          </ProtectedRoute>
        } />
        <Route path="/return-processing" element={
          <ProtectedRoute>
            {user && user.role === 'supply_officer' ? (
              <div style={{ padding: 20 }}>Return Processing Page (to be implemented)</div>
            ) : (
              <Navigate to="/dashboard" />
            )}
          </ProtectedRoute>
        } />
        <Route path="/qr-scanner" element={
          <ProtectedRoute>
            {user && user.role === 'supply_officer' ? (
              <div style={{ padding: 20 }}>QR Scanner Page (to be implemented)</div>
            ) : (
              <Navigate to="/dashboard" />
            )}
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