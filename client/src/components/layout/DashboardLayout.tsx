import { Outlet, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '../../store/authStore';
import { ForcePasswordChangeModal } from '../auth/ForcePasswordChangeModal';

export function DashboardLayout() {
  const { token, user } = useAuthStore();

  useEffect(() => {
    if (user?.role === 'Super Admin') {
      document.documentElement.setAttribute('data-theme', 'admin');
    } else if (user?.role === 'Employee') {
      document.documentElement.setAttribute('data-theme', 'employee');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [user?.role]);

  // Protect the dashboard routes
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-bg-subtle overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
      <ForcePasswordChangeModal />
    </div>
  );
}
