/**
 * Admin Sidebar Component
 * 
 * Separate sidebar for admin panel - only admin links
 * Phase Admin F: Complete Admin/User Separation
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Shield,
  BarChart,
  Ticket,
  Lock,
  Monitor,
  AlertCircle,
  Users,
  Activity,
  FileText,
  Settings,
  LogOut,
  X,
  CreditCard,
  Coins,
  Bug
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';

interface AdminSidebarProps {
  onClose?: () => void;
}

const AdminSidebar = ({ onClose }: AdminSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { isAdmin } = useAdmin();

  const adminMenuItems = [
    {
      title: "لوحة الإدارة",
      url: "/admin",
      icon: Shield,
      description: "الصفحة الرئيسية"
    },
    {
      title: "إدارة المستخدمين",
      url: "/admin/users",
      icon: Users,
      description: "عرض وإدارة المستخدمين"
    },
    {
      title: "إدارة الاشتراكات",
      url: "/admin/billing",
      icon: CreditCard,
      description: "الاشتراكات والدفع"
    },
    {
      title: "المدفوعات المشفرة",
      url: "/admin/payments",
      icon: Coins,
      description: "جميع المدفوعات بالعملات المشفرة"
    },
    {
      title: "تحليلات الأعمال",
      url: "/admin/analytics",
      icon: BarChart,
      description: "تحليلات شاملة"
    },
    {
      title: "إدارة التذاكر",
      url: "/admin/tickets",
      icon: Ticket,
      description: "تذاكر الدعم"
    },
    {
      title: "مقاييس الدعم",
      url: "/admin/support-metrics",
      icon: BarChart,
      description: "إحصائيات الدعم"
    },
    {
      title: "الأمان والصلاحيات",
      url: "/admin/security",
      icon: Lock,
      description: "الأمان والتدقيق"
    },
    {
      title: "مركز التحكم",
      url: "/admin/system-control",
      icon: Monitor,
      description: "إعدادات النظام"
    },
    {
      title: "نظرة عامة على الدعم",
      url: "/admin/support-overview",
      icon: AlertCircle,
      description: "مشاكل النظام"
    },
    {
      title: "Auto Trading Debug",
      url: "/admin/auto-trading-debug",
      icon: Bug,
      description: "تصحيح التداول التلقائي"
    },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="h-full w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-purple-400" />
          <span className="text-white font-bold text-lg">Orbitra AI</span>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-2">
          {adminMenuItems.map((item) => {
            const isActive = location.pathname === item.url || 
                           (item.url !== '/admin' && location.pathname.startsWith(item.url));
            const Icon = item.icon;
            
            return (
              <Button
                key={item.url}
                variant="ghost"
                className={cn(
                  "w-full justify-start font-normal text-sm",
                  isActive
                    ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border-l-2 border-purple-400"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                )}
                onClick={() => {
                  navigate(item.url);
                  if (onClose) onClose();
                }}
              >
                <Icon className="mr-3 h-5 w-5" />
                <div className="flex-1 text-right">
                  <div>{item.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:bg-red-500/20 hover:text-red-400"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          <span>تسجيل الخروج</span>
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;

