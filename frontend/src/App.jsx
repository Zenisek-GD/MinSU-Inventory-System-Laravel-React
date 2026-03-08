import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SessionWarningDialog from "./components/SessionWarningDialog";
import { UserProvider, useUser } from "./context/UserContext.jsx";

// Lazy load all page components for code splitting
const BorrowsPage = lazy(() => import("./pages/Borrows"));
const ItemsInventoryPage = lazy(() => import("./pages/ItemsInventory"));
const CategoriesPage = lazy(() => import("./pages/Categories"));
const UsersPage = lazy(() => import("./pages/Users"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const OfficesPage = lazy(() => import("./pages/Offices"));
const DepartmentsPage = lazy(() => import("./pages/Departments"));
const LocationsPage = lazy(() => import("./pages/Locations"));
const MemorandumReceiptsPage = lazy(() => import("./pages/MemorandumReceipts"));
const MyRequestsPage = lazy(() => import("./pages/MyRequests"));
const QRScanner = lazy(() => import("./pages/QRScanner"));
const MobileScannerPage = lazy(() => import("./pages/MobileScannerPage"));
const DesktopScannerWithMobile = lazy(() => import("./pages/DesktopScannerWithMobile"));
const ItemByQrPage = lazy(() => import("./pages/ItemByQr"));
const ReportsPage = lazy(() => import("./pages/Reports"));
const ConditionAuditsPage = lazy(() => import("./pages/ConditionAudits"));
const RequestItemPage = lazy(() => import("./pages/RequestItem"));
const AvailableItemsPage = lazy(() => import("./pages/AvailableItems"));
const CurrentBorrowsPage = lazy(() => import("./pages/CurrentBorrows"));
const StockMovementsPage = lazy(() => import("./pages/StockMovements"));
const StockDashboardPage = lazy(() => import("./pages/StockDashboard"));
const StaffDashboardPage = lazy(() => import("./pages/StaffDashboard"));
const MemorandumReceiptDetailPage = lazy(() => import("./pages/MemorandumReceiptDetail"));


// ProtectedRoute wrapper component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useUser();

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return children;
};

// AppRoutes uses the user context - inside Router to access routing hooks
const AppRoutes = () => {
  const { user, loading } = useUser();

  if (loading) return null;

  return (
    <>
      <SessionWarningDialog />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/borrows" element={
            <ProtectedRoute>
              <BorrowsPage />
            </ProtectedRoute>
          } />
          <Route path="/borrow-item" element={
            <ProtectedRoute>
              {user && user.role === 'staff' ? (
                <BorrowsPage />
              ) : (
                <Navigate to="/dashboard" />
              )}
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/staff-dashboard" element={
            <ProtectedRoute>
              {user && user.role === 'staff' ? (
                <StaffDashboardPage />
              ) : (
                <Navigate to="/dashboard" />
              )}
            </ProtectedRoute>
          } />
          <Route path="/offices" element={
            <ProtectedRoute>
              {user && user.role === 'admin' ? (
                <OfficesPage />
              ) : (
                <Navigate to="/dashboard" />
              )}
            </ProtectedRoute>
          } />
          <Route path="/departments" element={
            <ProtectedRoute>
              {user && user.role === 'admin' ? (
                <DepartmentsPage />
              ) : (
                <Navigate to="/dashboard" />
              )}
            </ProtectedRoute>
          } />
          <Route path="/locations" element={
            <ProtectedRoute>
              {user && user.role === 'admin' ? (
                <LocationsPage />
              ) : (
                <Navigate to="/dashboard" />
              )}
            </ProtectedRoute>
          } />
          <Route path="/memorandum-receipts" element={
            <ProtectedRoute>
              {(user && (user.role === 'admin' || user.role === 'supply_officer')) ? (
                <MemorandumReceiptsPage />
              ) : (
                <Navigate to="/dashboard" />
              )}
            </ProtectedRoute>
          } />
          <Route path="/memorandum-receipts/:id" element={
            <ProtectedRoute>
              <MemorandumReceiptDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/my-requests" element={
            <ProtectedRoute>
              {user && user.role === 'staff' ? (
                <MyRequestsPage />
              ) : (
                <Navigate to="/dashboard" />
              )}
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute>
              {user && user.role === 'admin' ? (
                <UsersPage />
              ) : (
                <Navigate to="/dashboard" />
              )}
            </ProtectedRoute>
          } />
          <Route path="/categories" element={
            <ProtectedRoute>
              {user && user.role === 'admin' ? (
                <CategoriesPage />
              ) : (
                <Navigate to="/dashboard" />
              )}
            </ProtectedRoute>
          } />
          <Route path="/items" element={
            <ProtectedRoute>
              <>
                {(user && (user.role === 'admin' || user.role === 'supply_officer')) ? (
                  <ItemsInventoryPage />
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
                  <ItemsInventoryPage />
                ) : (
                  <Navigate to="/dashboard" />
                )}
              </>
            </ProtectedRoute>
          } />
          <Route path="/stock-movements" element={
            <ProtectedRoute>
              <>
                {(user && (user.role === 'admin' || user.role === 'supply_officer')) ? (
                  <StockMovementsPage />
                ) : (
                  <Navigate to="/dashboard" />
                )}
              </>
            </ProtectedRoute>
          } />
          <Route path="/stock-dashboard" element={
            <ProtectedRoute>
              <>
                {(user && (user.role === 'admin' || user.role === 'supply_officer')) ? (
                  <StockDashboardPage />
                ) : (
                  <Navigate to="/dashboard" />
                )}
              </>
            </ProtectedRoute>
          } />
          <Route path="/request-item" element={
            <ProtectedRoute>
              {user && user.role === 'staff' ? (
                <RequestItemPage />
              ) : (
                <Navigate to="/dashboard" />
              )}
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
          <Route path="/available-items" element={
            <ProtectedRoute>
              {user && user.role === 'staff' ? (
                <AvailableItemsPage />
              ) : (
                <Navigate to="/dashboard" />
              )}
            </ProtectedRoute>
          } />
          <Route path="/current-borrows" element={
            <ProtectedRoute>
              {user && user.role === 'staff' ? (
                <CurrentBorrowsPage />
              ) : (
                <Navigate to="/dashboard" />
              )}
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
              <QRScanner />
            </ProtectedRoute>
          } />
          <Route path="/scanner/mobile" element={
            <ProtectedRoute>
              <MobileScannerPage />
            </ProtectedRoute>
          } />
          <Route path="/scanner/desktop-mobile" element={
            <ProtectedRoute>
              <DesktopScannerWithMobile />
            </ProtectedRoute>
          } />
          <Route path="/items/qr/:qr" element={
            <ProtectedRoute>
              <ItemByQrPage />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              {user && (user.role === 'admin' || user.role === 'supply_officer') ? (
                <ReportsPage />
              ) : (
                <Navigate to="/dashboard" />
              )}
            </ProtectedRoute>
          } />
          <Route path="/condition-audits" element={
            <ProtectedRoute>
              {user && (user.role === 'admin' || user.role === 'supply_officer') ? (
                <ConditionAuditsPage />
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
      </Suspense>
    </>
  );
};

const App = () => (
  <UserProvider>
    <Router>
      <AppRoutes />
    </Router>
  </UserProvider>
);

export default App;