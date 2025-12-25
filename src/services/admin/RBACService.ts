/**
 * RBAC Service
 * 
 * Phase Admin F: Role-Based Access Control
 */

import { supabase } from '@/integrations/supabase/client';

export interface Role {
  id: string;
  name: 'owner' | 'admin' | 'support' | 'analyst';
  display_name: string;
  description: string | null;
  permissions: Record<string, any>;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by: string | null;
  assigned_at: string;
  expires_at: string | null;
  is_active: boolean;
}

/**
 * Get user's roles
 */
export async function getUserRoles(
  userId: string
): Promise<{ roles: Role[]; error?: string }> {
  try {
    const now = new Date().toISOString();
    
    console.log('🔍 getUserRoles called for userId:', userId);
    
    // Method 1: Try to fetch assignments first
    const { data: assignments, error: assignmentsError } = await (supabase as any)
      .from('user_role_assignments')
      .select('role_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`);
    
    if (assignmentsError) {
      console.error('❌ Error fetching assignments:', assignmentsError);
      return { roles: [], error: assignmentsError.message };
    }
    
    if (!assignments || assignments.length === 0) {
      console.log('⚠️ No role assignments found for user');
      return { roles: [] };
    }
    
    const roleIds = assignments.map((a: any) => a.role_id).filter(Boolean);
    console.log('🔍 Role IDs found:', roleIds);
    
    if (roleIds.length === 0) {
      console.log('⚠️ No valid role IDs found');
      return { roles: [] };
    }
    
    // Method 2: Fetch roles separately (more reliable with RLS)
    const { data: rolesData, error: rolesError } = await (supabase as any)
      .from('roles')
      .select('*')
      .in('id', roleIds);
    
    if (rolesError) {
      console.error('❌ Error fetching roles:', rolesError);
      // Try alternative: Use RPC or direct query
      console.log('🔄 Trying alternative method...');
      
      // Fallback: Try with join again but handle null roles
      const { data: joinData, error: joinError } = await (supabase as any)
        .from('user_role_assignments')
        .select(`
          role_id,
          roles!inner(*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${now}`);
      
      if (joinError) {
        console.error('❌ Error with join method:', joinError);
        return { roles: [], error: rolesError.message };
      }
      
      const extractedRoles = (joinData || [])
        .map((item: any) => item.roles)
        .filter((role: any) => role !== null && role !== undefined);
      
      console.log('🔍 Roles from join fallback:', extractedRoles);
      return { roles: extractedRoles as Role[] };
    }
    
    console.log('✅ Roles fetched successfully:', rolesData);
    return { roles: (rolesData || []) as Role[] };
  } catch (error) {
    console.error('❌ Exception in getUserRoles:', error);
    return {
      roles: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if user has role
 */
export async function userHasRole(
  userId: string,
  roleName: Role['name']
): Promise<boolean> {
  try {
    const { roles } = await getUserRoles(userId);
    return roles.some(role => role.name === roleName);
  } catch (error) {
    return false;
  }
}

/**
 * Check if user has permission
 */
export async function userHasPermission(
  userId: string,
  permissionKey: string
): Promise<boolean> {
  try {
    const { roles } = await getUserRoles(userId);

    // Owner has all permissions
    if (roles.some(role => role.name === 'owner')) {
      return true;
    }

    // Check permissions in each role
    for (const role of roles) {
      if (role.permissions && role.permissions['*'] === true) {
        return true;
      }
      if (role.permissions && role.permissions[permissionKey] === true) {
        return true;
      }
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Assign role to user
 */
export async function assignRoleToUser(
  userId: string,
  roleId: string,
  assignedBy: string,
  expiresAt?: Date
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from('user_role_assignments')
      .upsert({
        user_id: userId,
        role_id: roleId,
        assigned_by: assignedBy,
        expires_at: expiresAt?.toISOString() || null,
        is_active: true,
      }, {
        onConflict: 'user_id,role_id',
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Remove role from user
 */
export async function removeRoleFromUser(
  userId: string,
  roleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from('user_role_assignments')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('role_id', roleId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all roles
 */
export async function getAllRoles(): Promise<{ roles: Role[]; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('roles')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return { roles: [], error: error.message };
    }

    return { roles: data || [] };
  } catch (error) {
    return {
      roles: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get role permissions
 */
export async function getRolePermissions(
  roleId: string
): Promise<{ permissions: Record<string, boolean>; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('role_permissions')
      .select('*')
      .eq('role_id', roleId);

    if (error) {
      return { permissions: {}, error: error.message };
    }

    const permissions: Record<string, boolean> = {};
    (data || []).forEach((perm: any) => {
      permissions[perm.permission_key] = perm.allowed;
    });

    return { permissions };
  } catch (error) {
    return {
      permissions: {},
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update role permission
 */
export async function updateRolePermission(
  roleId: string,
  permissionKey: string,
  allowed: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from('role_permissions')
      .upsert({
        role_id: roleId,
        permission_key: permissionKey,
        allowed,
      }, {
        onConflict: 'role_id,permission_key',
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

