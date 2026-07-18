import { useAuthStore } from '../../store/authStore';
import { UserCircle, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { NotificationDropdown } from '../notifications/NotificationDropdown';

export function Header() {
  const { user } = useAuthStore();
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDark]);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 transition-colors">
      <div className="flex-1">
        {/* Placeholder for Breadcrumbs or Page Title if needed */}
      </div>
      
      <div className="flex items-center space-x-6">
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none"
          title="Toggle Dark Mode"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
        </button>

        <NotificationDropdown />

        <div className="flex items-center space-x-3 border-l border-gray-200 pl-6 transition-colors">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-dark-900">
              {user?.userId}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              {user?.role}
            </span>
          </div>
          <div className="h-9 w-9 rounded-full bg-primary-50 flex items-center justify-center border border-primary-100">
            <UserCircle className="w-6 h-6 text-primary-600" />
          </div>
        </div>
      </div>
    </header>
  );
}
