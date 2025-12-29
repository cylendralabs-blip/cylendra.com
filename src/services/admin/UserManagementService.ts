
import { supabase } from '@/integrations/supabase/client';
import { AdminUser } from '@/types/admin';
import { logAdminAction } from './AdminActivityService';

export class UserManagementService {
  // الحصول على جميع المستخدمين
  static async getAllUsers(): Promise<AdminUser[]> {
    try {
      console.log('Fetching all users via Edge Function...');
      
      // Get current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found - user not authenticated');
        return [];
      }

      const { data, error } = await supabase.functions.invoke('admin-users', {
        method: 'POST',
        body: { action: 'list' },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Error fetching users from Edge Function:', error);
        throw error;
      }

      if (!data || !data.users) {
        console.log('No users data received from Edge Function');
        return [];
      }

      console.log('Received users from Edge Function:', data.users.length);
      return data.users;
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      return [];
    }
  }

  // الحصول على تفاصيل مستخدم واحد
  static async getUserDetails(userId: string): Promise<AdminUser | null> {
    try {
      console.log('Fetching user details via Edge Function for userId:', userId);

      // Get current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found - user not authenticated');
        return null;
      }

      const { data, error } = await supabase.functions.invoke('admin-users', {
        method: 'POST',
        body: { action: 'get', userId },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Error fetching user details from Edge Function:', error);
        return null;
      }

      if (!data || !data.user) {
        console.log('No user data received from Edge Function');
        return null;
      }

      console.log('User details retrieved successfully from Edge Function');
      return data.user;
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  }

  // البحث عن المستخدمين
  static async searchUsers(query: string): Promise<AdminUser[]> {
    try {
      if (!query.trim()) {
        return [];
      }

      console.log('Searching users via Edge Function with query:', query);

      // Get current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found - user not authenticated');
        return [];
      }

      const { data, error } = await supabase.functions.invoke('admin-users', {
        method: 'POST',
        body: { action: 'search', query },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Error searching users from Edge Function:', error);
        return [];
      }

      if (!data || !data.users) {
        console.log('No search results received from Edge Function');
        return [];
      }

      console.log('Search results from Edge Function:', data.users.length);
      return data.users;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  // إضافة دور للمستخدم
  static async addUserRole(userId: string, role: 'admin' | 'moderator' | 'user', adminUserId: string): Promise<void> {
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: role,
        created_by: adminUserId
      });

    if (error) throw error;

    // تسجيل النشاط
    await logAdminAction('ROLE_ADDED', {
      targetType: 'user',
      targetId: userId,
      metadata: { role_added: role }
    });
  }

  // إزالة دور من المستخدم
  static async removeUserRole(userId: string, role: string, adminUserId: string): Promise<void> {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role as 'admin' | 'moderator' | 'user');

    if (error) throw error;

    // تسجيل النشاط
    await logAdminAction('ROLE_REMOVED', {
      targetType: 'user',
      targetId: userId,
      metadata: { role_removed: role }
    });
  }

  // تعطيل حساب مستخدم
  static async deactivateUser(_userId: string, _adminUserId: string): Promise<void> {
    // TODO: Implement when strategy_templates table is created
    console.warn('User deactivation disabled - strategy_templates table does not exist');
  }

  // تفعيل حساب مستخدم
  static async activateUser(userId: string, adminUserId: string): Promise<void> {
    // تسجيل النشاط
    await logAdminAction('USER_ACTIVATED', {
      targetType: 'user',
      targetId: userId
    });
  }

  // حذف حساب مستخدم
  static async deleteUser(userId: string, adminUserId: string): Promise<void> {
    try {
      // حذف جميع البيانات المرتبطة بالمستخدم
      const deletePromises = [
        supabase.from('trades').delete().eq('user_id', userId),
        supabase.from('bot_settings').delete().eq('user_id', userId),
        supabase.from('user_roles').delete().eq('user_id', userId),
        supabase.from('profiles').delete().eq('user_id', userId)
      ];

      await Promise.all(deletePromises);

      await logAdminAction('USER_DELETED', {
        targetType: 'user',
        targetId: userId
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Phase Admin A: Enable/Disable trading for a user
  static async disableUserTrading(
    userId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await (supabase as any)
        .from('user_trading_status')
        .upsert({
          user_id: userId,
          trading_enabled: false,
          disabled_reason: reason,
          disabled_by: user.id,
          disabled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('Error disabling user trading:', error);
        return { success: false, error: error.message };
      }

      await logAdminAction('USER_TRADING_DISABLED', {
        targetType: 'user',
        targetId: userId,
        metadata: { reason },
      });

      return { success: true };
    } catch (error) {
      console.error('Error in disableUserTrading:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async enableUserTrading(
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await (supabase as any)
        .from('user_trading_status')
        .upsert({
          user_id: userId,
          trading_enabled: true,
          enabled_by: user.id,
          enabled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('Error enabling user trading:', error);
        return { success: false, error: error.message };
      }

      await logAdminAction('USER_TRADING_ENABLED', {
        targetType: 'user',
        targetId: userId,
      });

      return { success: true };
    } catch (error) {
      console.error('Error in enableUserTrading:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getUserTradingStatus(
    userId: string
  ): Promise<{ enabled: boolean; error?: string }> {
    try {
      const { data, error } = await (supabase as any)
        .from('user_trading_status')
        .select('trading_enabled')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user trading status:', error);
        return { enabled: true, error: error.message }; // Default to enabled
      }

      return { enabled: (data as any)?.trading_enabled ?? true }; // Default to enabled if not found
    } catch (error) {
      console.error('Error in getUserTradingStatus:', error);
      return { enabled: true }; // Default to enabled on error
    }
  }
}
