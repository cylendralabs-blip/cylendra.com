
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Desktop Sidebar - Hidden on mobile via CSS */}
      <div className="hidden md:block fixed left-0 top-0 h-full z-40">
        <Sidebar />
      </div>

      {/* Mobile Sidebar - Using isMobile for logic but controlled via CSS/State */}
      {isMobile && (
        <>
          {/* Overlay */}
          <div
            className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Sliding Sidebar */}
          <div className={`fixed left-0 top-0 h-full z-50 transform transition-transform duration-300 ease-in-out md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
            <Sidebar onClose={() => setIsSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen w-full md:ml-64 transition-all duration-300">
        {/* Header component */}
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          showMenuButton={isMobile}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 w-full overflow-x-hidden">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default Layout;
