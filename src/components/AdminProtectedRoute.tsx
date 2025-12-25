
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Navigate } from 'react-router-dom';
import ErrorBoundary from './admin/ErrorBoundary';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  // Show loading state while checking auth - wait for auth to fully load
  if (loading) {
    return (
      <div className="min-h-screen bg-trading-bg dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // After auth is loaded, check if user exists
  // If no user after loading is complete, redirect to login
  if (!loading && !user) {
    return <Navigate to="/admin/login" replace />;
  }

  // While checking admin status, show loading (but user is authenticated)
  // This ensures we don't redirect prematurely during page refresh
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-trading-bg dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated but not admin, redirect to login
  // Only check this after adminLoading is false
  if (!loading && !adminLoading && user && !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  // User is authenticated and is admin - render children
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
};

export default AdminProtectedRoute;
