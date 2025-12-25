/**
 * RBAC Protected Component
 * 
 * Phase Admin F: Component wrapper for role/permission-based access control
 */

import { ReactNode, useState, useEffect } from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import type { Role } from '@/services/admin/RBACService';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';

interface RBACProtectedProps {
  children: ReactNode;
  requiredRole?: Role['name'];
  requiredPermission?: string;
  fallback?: ReactNode;
}

export default function RBACProtected({
  children,
  requiredRole,
  requiredPermission,
  fallback,
}: RBACProtectedProps) {
  const { roles, loading, hasRole, hasPermission, isOwner, isAdmin } = useRBAC();
  const [hasAccess, setHasAccess] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (loading) {
        setChecking(true);
        return;
      }

      let access = false;

      // Owner has access to everything
      if (isOwner) {
        access = true;
      } else if (requiredRole) {
        access = await hasRole(requiredRole);
      } else if (requiredPermission) {
        access = await hasPermission(requiredPermission);
      } else {
        // If no requirement specified, allow if user has any admin role
        access = isAdmin;
      }

      setHasAccess(access);
      setChecking(false);
    };

    checkAccess();
  }, [loading, requiredRole, requiredPermission, roles, hasRole, hasPermission, isOwner, isAdmin]);

  if (checking || loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="w-8 h-8 animate-pulse mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">غير مصرح بالوصول</h3>
          <p className="text-muted-foreground">
            ليس لديك الصلاحيات المطلوبة للوصول إلى هذا القسم
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}

