/**
 * Admin Security Service
 * 
 * Phase Admin F: Admin login protection, 2FA, session management
 */

import { supabase } from '@/integrations/supabase/client';
import { logAdminAuditAction } from './AuditLogService';
import { logSecurityEvent } from './SecurityEventService';

export interface AdminSecuritySettings {
  id: string;
  user_id: string;
  two_factor_enabled: boolean;
  two_factor_secret: string | null;
  two_factor_backup_codes: string[] | null;
  login_alerts_enabled: boolean;
  session_timeout_hours: number;
  last_login_at: string | null;
  last_login_ip: string | null;
  last_login_user_agent: string | null;
  failed_login_attempts: number;
  account_locked_until: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get admin security settings
 */
export async function getAdminSecuritySettings(
  userId: string
): Promise<{ settings: AdminSecuritySettings | null; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('admin_security_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle missing records

    if (error) {
      console.error('Error fetching admin security settings:', error);
      return { settings: null, error: error.message };
    }

    return { settings: data || null };
  } catch (error) {
    console.error('Exception in getAdminSecuritySettings:', error);
    return {
      settings: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Log login attempt
 */
export async function logLoginAttempt(
  userId: string | null,
  email: string,
  ipAddress: string,
  userAgent: string | null,
  success: boolean,
  failureReason?: string,
  twoFactorUsed: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from('admin_login_attempts')
      .insert({
        user_id: userId,
        email,
        ip_address: ipAddress,
        user_agent: userAgent,
        success,
        failure_reason: failureReason,
        two_factor_used: twoFactorUsed,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Update security settings if successful
    if (success && userId) {
      await (supabase as any)
        .from('admin_security_settings')
        .upsert({
          user_id: userId,
          last_login_at: new Date().toISOString(),
          last_login_ip: ipAddress,
          last_login_user_agent: userAgent,
          failed_login_attempts: 0,
        }, {
          onConflict: 'user_id',
        });
    } else if (!success && userId) {
      // Increment failed attempts
      const { data: current } = await (supabase as any)
        .from('admin_security_settings')
        .select('failed_login_attempts')
        .eq('user_id', userId)
        .single();

      const failedAttempts = (current?.failed_login_attempts || 0) + 1;
      const maxAttempts = 5;
      const lockDurationMinutes = 30;

      let accountLockedUntil = null;
      if (failedAttempts >= maxAttempts) {
        accountLockedUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000).toISOString();
        
        // Log security event
        await logSecurityEvent('brute_force_detected', 'high', {
          userId: userId,
          metadata: {
            email,
            ip_address: ipAddress,
            failed_attempts: failedAttempts,
          },
        });
      }

      await (supabase as any)
        .from('admin_security_settings')
        .upsert({
          user_id: userId,
          failed_login_attempts: failedAttempts,
          account_locked_until: accountLockedUntil,
        }, {
          onConflict: 'user_id',
        });
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
 * Check if account is locked
 */
export async function isAccountLocked(
  userId: string
): Promise<{ locked: boolean; lockedUntil?: string; error?: string }> {
  try {
    const { settings } = await getAdminSecuritySettings(userId);
    if (!settings) {
      return { locked: false };
    }

    if (settings.account_locked_until) {
      const lockedUntil = new Date(settings.account_locked_until);
      const now = new Date();
      
      if (lockedUntil > now) {
        return { locked: true, lockedUntil: settings.account_locked_until };
      } else {
        // Unlock account
        await (supabase as any)
          .from('admin_security_settings')
          .update({
            account_locked_until: null,
            failed_login_attempts: 0,
          })
          .eq('user_id', userId);
      }
    }

    return { locked: false };
  } catch (error) {
    return {
      locked: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Enable 2FA for admin
 */
export async function enable2FA(
  userId: string,
  secret: string,
  backupCodes: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from('admin_security_settings')
      .upsert({
        user_id: userId,
        two_factor_enabled: true,
        two_factor_secret: secret, // TODO: Encrypt this
        two_factor_backup_codes: backupCodes, // TODO: Encrypt these
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      return { success: false, error: error.message };
    }

    await logAdminAuditAction(userId, '2fa_enabled', {
      metadata: { enabled_at: new Date().toISOString() },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Disable 2FA for admin
 */
export async function disable2FA(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from('admin_security_settings')
      .update({
        two_factor_enabled: false,
        two_factor_secret: null,
        two_factor_backup_codes: null,
      })
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    await logAdminAuditAction(userId, '2fa_disabled', {
      metadata: { disabled_at: new Date().toISOString() },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get active sessions for user
 */
export async function getActiveSessions(
  userId: string
): Promise<{ sessions: any[]; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('admin_active_sessions')
      .select('*')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('last_activity_at', { ascending: false });

    if (error) {
      return { sessions: [], error: error.message };
    }

    return { sessions: data || [] };
  } catch (error) {
    return {
      sessions: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Revoke session
 */
export async function revokeSession(
  sessionId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from('admin_active_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      return { success: false, error: error.message };
    }

    await logAdminAuditAction(adminId, 'session_revoked', {
      targetType: 'session',
      targetId: sessionId,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Revoke all sessions for user (except current)
 */
export async function revokeAllSessions(
  userId: string,
  currentSessionId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from('admin_active_sessions')
      .delete()
      .eq('user_id', userId)
      .neq('id', currentSessionId);

    if (error) {
      return { success: false, error: error.message };
    }

    await logAdminAuditAction(adminId, 'all_sessions_revoked', {
      targetType: 'user',
      targetId: userId,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

