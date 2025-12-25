/**
 * Admin Layout Component
 * 
 * Separate layout for admin panel - completely isolated from user dashboard
 * Phase Admin F: Complete Admin/User Separation
 */

import { Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useIsMobile } from '@/hooks/use-mobile';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { Navigate } from 'react-router-dom';

const AdminLayout = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Show loading while checking permissions - wait for both auth and admin checks
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // Only redirect if loading is complete and user is not authenticated or not admin
  // This prevents premature redirects during page refresh
  if (!authLoading && !adminLoading && (!user || !isAdmin)) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Admin Sidebar - Fixed on desktop */}
      {!isMobile && (
        <div className="fixed left-0 top-0 h-full z-40">
          <AdminSidebar />
        </div>
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <>
          {/* Overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/70 z-40"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          
          {/* Sliding Sidebar */}
          <div className={`fixed left-0 top-0 h-full z-50 transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <AdminSidebar onClose={() => setIsSidebarOpen(false)} />
          </div>
        </>
      )}
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen ${!isMobile ? 'ml-64' : 'w-full'}`}>
        {/* Admin Header */}
        <AdminHeader 
          onMenuClick={() => setIsSidebarOpen(true)}
          showMenuButton={isMobile}
        />
        
        {/* Admin Content */}
        <main className="flex-1 p-6 bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

