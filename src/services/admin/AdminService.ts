
import { AdminAuthService } from './AdminAuthService';
import { UserManagementService } from './UserManagementService';
import { getStatsForLastDays, recordDailyStats, SystemStats as SystemStatsData } from './SystemStatsService';
import { getRecentActivity, logAdminAction } from './AdminActivityService';
import { AdminUser, AdminActivity } from '@/types/admin';
// Phase Admin F: RBAC integration
import { userHasRole, getUserRoles } from './RBACService';

export class AdminService {
  // Admin Authentication Methods
  static async isAdmin(userId: string): Promise<boolean> {
    // Phase Admin F: Check RBAC first, then fallback to old method
    try {
      console.log('🔍 AdminService.isAdmin called for userId:', userId);
      
      const hasOwnerRole = await userHasRole(userId, 'owner');
      console.log('🔍 Has owner role:', hasOwnerRole);
      if (hasOwnerRole) return true;
      
      const hasAdminRole = await userHasRole(userId, 'admin');
      console.log('🔍 Has admin role:', hasAdminRole);
      if (hasAdminRole) return true;
      
      console.log('🔍 No RBAC roles found, checking old method...');
      // Fallback to old method for backward compatibility
      const oldMethodResult = await AdminAuthService.isAdmin(userId);
      console.log('🔍 Old method result:', oldMethodResult);
      return oldMethodResult;
    } catch (error) {
      console.error('❌ Error checking admin status via RBAC:', error);
      // Fallback to old method
      const fallbackResult = await AdminAuthService.isAdmin(userId);
      console.log('🔍 Fallback result:', fallbackResult);
      return fallbackResult;
    }
  }

  // User Management Methods
  static async getAllUsers(): Promise<AdminUser[]> {
    return UserManagementService.getAllUsers();
  }

  static async getUserDetails(userId: string): Promise<AdminUser | null> {
    return UserManagementService.getUserDetails(userId);
  }

  static async addUserRole(userId: string, role: 'admin' | 'moderator' | 'user', adminUserId: string): Promise<void> {
    return UserManagementService.addUserRole(userId, role, adminUserId);
  }

  static async removeUserRole(userId: string, role: string, adminUserId: string): Promise<void> {
    return UserManagementService.removeUserRole(userId, role, adminUserId);
  }

  static async deactivateUser(userId: string, adminUserId: string): Promise<void> {
    return UserManagementService.deactivateUser(userId, adminUserId);
  }

  static async activateUser(userId: string, adminUserId: string): Promise<void> {
    return UserManagementService.activateUser(userId, adminUserId);
  }

  static async deleteUser(userId: string, adminUserId: string): Promise<void> {
    return UserManagementService.deleteUser(userId, adminUserId);
  }

  static async searchUsers(query: string): Promise<AdminUser[]> {
    return UserManagementService.searchUsers(query);
  }

  // System Statistics Methods
  static async getSystemStats(): Promise<SystemStatsData[]> {
    const { stats } = await getStatsForLastDays(30);
    return stats;
  }

  static async calculateSystemStats(): Promise<void> {
    // This would typically be called by a cron job
    // For now, we'll just record stats for today
    await recordDailyStats({
      activeUsers: 0,
      totalTrades: 0,
      totalVolumeUsd: 0,
      failedJobs: 0
    });
  }

  // Admin Activity Methods
  static async getAdminActivities(limit: number = 50): Promise<AdminActivity[]> {
    const { logs } = await getRecentActivity(limit);
    // Map AdminActivityLog to AdminActivity format
    return logs.map(log => ({
      id: log.id,
      admin_user_id: log.admin_id,
      action_type: log.action,
      target_user_id: log.target_id || undefined,
      action_details: log.metadata || {},
      ip_address: log.ip_address || null,
      user_agent: log.user_agent || null,
      created_at: log.created_at
    })) as AdminActivity[];
  }

  static async logAdminActivity(
    adminUserId: string,
    actionType: string,
    targetUserId?: string,
    actionDetails?: Record<string, any>
  ): Promise<void> {
    await logAdminAction(actionType, {
      targetType: targetUserId ? 'user' : undefined,
      targetId: targetUserId,
      metadata: actionDetails
    });
  }
}
