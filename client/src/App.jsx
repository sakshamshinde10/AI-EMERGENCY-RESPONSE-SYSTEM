import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import PolicePanel from "./pages/PolicePanel";
import FirePanel from "./pages/FirePanel";
import HospitalPanel from "./pages/HospitalPanel";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import VoiceReportPage from "./pages/VoiceReportPage";

// Redirect wrapper to determine dashboard destination by role
const DashboardRedirect = () => {
  const { user, getDashboardPath } = useAuth();
  return <Navigate to={getDashboardPath(user?.role)} replace />;
};

function App() {
  return (
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
  );
}

export default App;