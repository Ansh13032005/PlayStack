import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/axios';
import { 
  LayoutDashboard, 
  Users, 
  Network, 
  LogOut, 
  Briefcase,
  Building,
  Clock,
  CalendarOff,
  Mail,
  ShieldAlert,
  IndianRupee
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { LogoutModal } from './LogoutModal';

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Super Admin', 'HR Manager'] },
    { name: 'Employees', path: '/employees', icon: Users, roles: ['Super Admin', 'HR Manager'] },
    { name: 'Departments', path: '/departments', icon: Building, roles: ['Super Admin', 'HR Manager'] },
    { name: 'Org Chart', path: '/org-chart', icon: Network, roles: ['Super Admin', 'HR Manager'] },
    { name: 'Attendance', path: '/attendance', icon: Clock, roles: ['Super Admin', 'HR Manager', 'Employee'] },
    { name: 'Leaves', path: '/leaves', icon: CalendarOff, roles: ['Super Admin', 'HR Manager', 'Employee'] },
    { name: 'Payroll', path: '/payroll', icon: IndianRupee, roles: ['Super Admin', 'HR Manager'] },
    { name: 'My Payslips', path: '/my-payslips', icon: IndianRupee, roles: ['Employee'] },
    { name: 'Messages', path: '/messages', icon: Mail, roles: ['Super Admin', 'HR Manager', 'Employee'] },
    { name: 'My Profile', path: '/profile', icon: Users, roles: ['Employee'] },
  ];

  const allowedNavItems = navItems.filter(item => 
    item.roles.includes(user?.role || '')
  );

  return (
    <aside className="w-64 bg-dark-900 text-white flex flex-col h-screen shrink-0 border-r border-dark-800">
      <div className="h-16 flex items-center px-5 border-b border-dark-800 bg-dark-900/50 gap-3">
        <div className="w-8 h-8 border border-white/20 rounded-lg flex items-center justify-center bg-white/5 shrink-0">
          <Briefcase className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-white text-base tracking-tight">NexaHR</span>
          <span className="block text-gray-500 text-[9px] uppercase tracking-widest">Enterprise Suite</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
        <nav className="space-y-1">
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200',
                    isActive 
                      ? 'bg-primary-500/10 text-primary-500' 
                      : 'text-gray-400 hover:bg-dark-800 hover:text-white'
                  )
                }
              >
                <Icon className="w-5 h-5 mr-3 shrink-0" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Administration Section for Super Admin */}
        {user?.role === 'Super Admin' && (
          <div>
            <div className="px-3 mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Administration
              </h3>
            </div>
            <nav className="space-y-1">
              <NavLink
                to="/audit-logs"
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200',
                    isActive 
                      ? 'bg-primary-500/10 text-primary-500' 
                      : 'text-gray-400 hover:bg-dark-800 hover:text-white'
                  )
                }
              >
                <ShieldAlert className="w-5 h-5 mr-3 shrink-0" />
                Audit Logs
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-dark-800">
        <button
          onClick={() => setIsLogoutModalOpen(true)}
          className="flex items-center w-full px-3 py-2.5 rounded-md text-sm font-medium text-gray-400 hover:bg-dark-800 hover:text-white transition-colors duration-200"
        >
          <LogOut className="w-5 h-5 mr-3 shrink-0" />
          Sign Out
        </button>
      </div>

      <LogoutModal 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)} 
        onConfirm={async () => {
          try {
            await api.post('/auth/logout');
          } catch (error) {
            console.error('Logout error', error);
          } finally {
            logout();
          }
        }} 
      />
    </aside>
  );
}
