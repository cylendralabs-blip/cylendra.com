/**
 * Admin Header Component
 * 
 * Separate header for admin panel
 * Phase Admin F: Complete Admin/User Separation
 */

import { Menu, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';

interface AdminHeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

const AdminHeader = ({ onMenuClick, showMenuButton }: AdminHeaderProps) => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  return (
    <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="text-gray-300 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </Button>
        )}
        
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-purple-400" />
          <div>
            <h1 className="text-lg font-bold text-white">لوحة الإدارة</h1>
            <p className="text-xs text-gray-400">Orbitra AI Admin Panel</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isAdmin && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-medium">متصل</span>
          </div>
        )}
        
        {user && (
          <div className="text-right">
            <p className="text-sm text-white font-medium">{user.email}</p>
            <p className="text-xs text-gray-400">Owner</p>
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;

