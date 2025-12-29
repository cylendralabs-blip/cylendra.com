/**
 * RBAC Hook
 * 
 * Phase Admin F: React hook for role and permission checks
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getUserRoles, userHasRole, userHasPermission } from '@/services/admin/RBACService';
import type { Role } from '@/services/admin/RBACService';

export function useRBAC() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadRoles();
    } else {
      setRoles([]);
      setLoading(false);
    }
  }, [user?.id]);

  const loadRoles = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { roles: userRoles } = await getUserRoles(user.id);
      setRoles(userRoles);
    } catch (error) {
      console.error('Error loading roles:', error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = async (roleName: Role['name']): Promise<boolean> => {
    if (!user?.id) return false;
    return await userHasRole(user.id, roleName);
  };

  const hasPermission = async (permissionKey: string): Promise<boolean> => {
    if (!user?.id) return false;
    return await userHasPermission(user.id, permissionKey);
  };

  const isOwner = roles.some(role => role.name === 'owner');
  const isAdmin = roles.some(role => role.name === 'admin' || role.name === 'owner');
  const isSupport = roles.some(role => role.name === 'support' || role.name === 'admin' || role.name === 'owner');
  const isAnalyst = roles.some(role => role.name === 'analyst' || role.name === 'admin' || role.name === 'owner');

  return {
    roles,
    loading,
    hasRole,
    hasPermission,
    isOwner,
    isAdmin,
    isSupport,
    isAnalyst,
    refreshRoles: loadRoles,
  };
}

