/**
 * Copy Trading Audit Logger
 * 
 * Phase X.17 - Security Improvements
 * 
 * Audit logging for copy trading operations
 */

import { supabase } from '@/integrations/supabase/client';

export type AuditAction = 
  | 'FOLLOW'
  | 'UNFOLLOW'
  | 'CREATE_STRATEGY'
  | 'UPDATE_STRATEGY'
  | 'DELETE_STRATEGY'
  | 'PAUSE_STRATEGY'
  | 'RESUME_STRATEGY'
  | 'TRADE_COPIED'
  | 'TRADE_FAILED'
  | 'TRADE_SKIPPED'
  | 'SETTINGS_UPDATED';

export type AuditEntityType = 'STRATEGY' | 'FOLLOWER' | 'TRADE';

interface AuditLogData {
  userId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log audit event
 */
export async function logCopyTradingAudit(data: AuditLogData): Promise<void> {
  try {
    await (supabase as any).rpc('log_copy_trading_audit', {
      p_user_id: data.userId,
      p_action: data.action,
      p_entity_type: data.entityType,
      p_entity_id: data.entityId || null,
      p_details: data.details || null,
      p_ip_address: data.ipAddress || null,
      p_user_agent: data.userAgent || null,
    });
  } catch (error) {
    console.error('Error logging audit event:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Log follow action
 */
export async function auditLogFollow(
  userId: string,
  strategyId: string,
  config: any
): Promise<void> {
  await logCopyTradingAudit({
    userId,
    action: 'FOLLOW',
    entityType: 'FOLLOWER',
    entityId: strategyId,
    details: {
      strategy_id: strategyId,
      allocation_mode: config.allocation_mode,
      allocation_value: config.allocation_value,
      max_daily_loss: config.max_daily_loss,
      max_total_loss: config.max_total_loss,
    },
  });
}

/**
 * Log unfollow action
 */
export async function auditLogUnfollow(
  userId: string,
  strategyId: string,
  closeAllTrades: boolean
): Promise<void> {
  await logCopyTradingAudit({
    userId,
    action: 'UNFOLLOW',
    entityType: 'FOLLOWER',
    entityId: strategyId,
    details: {
      strategy_id: strategyId,
      close_all_trades: closeAllTrades,
    },
  });
}

/**
 * Log strategy creation
 */
export async function auditLogCreateStrategy(
  userId: string,
  strategyId: string,
  strategyData: any
): Promise<void> {
  await logCopyTradingAudit({
    userId,
    action: 'CREATE_STRATEGY',
    entityType: 'STRATEGY',
    entityId: strategyId,
    details: {
      name: strategyData.name,
      strategy_type: strategyData.strategy_type,
      is_public: strategyData.is_public,
    },
  });
}

/**
 * Log trade copied
 */
export async function auditLogTradeCopied(
  followerId: string,
  strategyId: string,
  tradeId: string,
  symbol: string
): Promise<void> {
  await logCopyTradingAudit({
    userId: followerId,
    action: 'TRADE_COPIED',
    entityType: 'TRADE',
    entityId: tradeId,
    details: {
      strategy_id: strategyId,
      symbol,
    },
  });
}

/**
 * Log trade failed
 */
export async function auditLogTradeFailed(
  followerId: string,
  strategyId: string,
  symbol: string,
  reason: string
): Promise<void> {
  await logCopyTradingAudit({
    userId: followerId,
    action: 'TRADE_FAILED',
    entityType: 'TRADE',
    details: {
      strategy_id: strategyId,
      symbol,
      reason,
    },
  });
}

