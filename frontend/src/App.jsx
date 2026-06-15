import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Dashboard from "./pages/manager/Dashboard";
import Customers from "./pages/manager/Customers";
import CustomerDetail from "./pages/manager/CustomerDetail";
import Roster from "./pages/manager/Roster";
import LiveMap from "./pages/manager/LiveMap";
import UsersPage from "./pages/manager/Users";
import Reports from "./pages/manager/Reports";
import MIS from "./pages/manager/MIS";
import Attendance from "./pages/hr/Attendance";
import Payroll from "./pages/hr/Payroll";
import MyJobs from "./pages/technician/MyJobs";
import JobDetail from "./pages/technician/JobDetail";
import ExecuteJob from "./pages/technician/ExecuteJob";

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "technician") return <Navigate to="/technician/jobs" replace />;
  if (user.role === "support_staff") return <Navigate to="/technician/jobs" replace />;
  return <Navigate to="/manager/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RootRedirect />} />

      <Route
        path="/manager/*"
        element={
          <ProtectedRoute roles={["admin", "manager"]}>
            <Layout>
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="customers" element={<Customers />} />
                <Route path="customers/:id" element={<CustomerDetail />} />
                <Route path="roster" element={<Roster />} />
                <Route path="map" element={<LiveMap />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="reports" element={<Reports />} />
                <Route path="mis" element={<MIS />} />
                <Route path="hr/attendance" element={<Attendance />} />
                <Route path="hr/payroll" element={<Payroll />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/technician/*"
        element={
          <ProtectedRoute roles={["technician"]}>
            <Layout>
              <Routes>
                <Route path="jobs" element={<MyJobs />} />
                <Route path="jobs/:id" element={<JobDetail />} />
                <Route path="jobs/:id/execute" element={<ExecuteJob />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
