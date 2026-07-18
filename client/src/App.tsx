import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { Departments } from './pages/Departments';
import { OrgChart } from './pages/OrgChart';
import { Profile } from './pages/Profile';
import { Attendance } from './pages/Attendance';
import { Leaves } from './pages/Leaves';
import { Messages } from './pages/Messages';
import { AuditLogs } from './pages/AuditLogs';
import { PayrollAdmin } from './pages/PayrollAdmin';
import { MyPayslips } from './pages/MyPayslips';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/login/:role" element={<Navigate to="/login" replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/forgot-password/:role" element={<Navigate to="/forgot-password" replace />} />

          {/* Protected Routes inside Layout */}
          <Route element={<DashboardLayout />}>
            {/* Super Admin only */}
            <Route element={<ProtectedRoute allowedRoles={['Super Admin']} />}>
              <Route path="/audit-logs" element={<AuditLogs />} />
            </Route>

            {/* Super Admin & HR Manager only */}
            <Route element={<ProtectedRoute allowedRoles={['Super Admin', 'HR Manager']} />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/departments" element={<Departments />} />
              <Route path="/org-chart" element={<OrgChart />} />
              <Route path="/payroll" element={<PayrollAdmin />} />
            </Route>

            {/* All authenticated roles */}
            <Route element={<ProtectedRoute allowedRoles={['Super Admin', 'HR Manager', 'Employee']} />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/leaves" element={<Leaves />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/my-payslips" element={<MyPayslips />} />
            </Route>
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
