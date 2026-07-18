import { LogOut, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsLoggingOut(true);
      await onConfirm();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden flex flex-col">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <LogOut className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-center text-dark-900 mb-2">
            Sign Out
          </h2>
          <p className="text-center text-sm text-gray-500 mb-6">
            Are you sure you want to log out of your account? You will need to sign in again to access the dashboard.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoggingOut}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoggingOut}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70"
            >
              {isLoggingOut ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Yes, log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
