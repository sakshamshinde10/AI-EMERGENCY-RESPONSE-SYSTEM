import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import PageLoadingFallback from "./components/ui/PageLoadingFallback";

// Lazy-loaded route components for optimal initial bundle & fast TTI
const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const PolicePanel = lazy(() => import("./pages/PolicePanel"));
const FirePanel = lazy(() => import("./pages/FirePanel"));
const HospitalPanel = lazy(() => import("./pages/HospitalPanel"));
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard"));
const VoiceReportPage = lazy(() => import("./pages/VoiceReportPage"));

// Redirect wrapper to determine dashboard destination by role
const DashboardRedirect = () => {
  const { user, getDashboardPath } = useAuth();
  return <Navigate to={getDashboardPath(user?.role)} replace />;
};

function App() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/report-emergency" element={<VoiceReportPage />} />

        {/* Admin Central Command Overview */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Department-Specific Control Panels */}
        <Route
          path="/police"
          element={
            <ProtectedRoute allowedRoles={["police", "admin"]}>
              <PolicePanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fire"
          element={
            <ProtectedRoute allowedRoles={["fire", "admin"]}>
              <FirePanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital"
          element={
            <ProtectedRoute allowedRoles={["hospital", "admin"]}>
              <HospitalPanel />
            </ProtectedRoute>
          }
        />

        {/* Analytics Dashboard */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AnalyticsDashboard />
            </ProtectedRoute>
          }
        />

        {/* Universal Dashboard URL Redirect */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          }
        />

        {/* Fallback Catch-All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;