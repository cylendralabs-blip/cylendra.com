/**
 * Copy Trading Notifications
 * 
 * Phase X.17 - Feature Improvements
 * 
 * Notification system for copy trading events
 */

import { supabase } from '@/integrations/supabase/client';

export type NotificationType = 
  | 'TRADE_COPIED'
  | 'TRADE_CLOSED'
  | 'FOLLOWER_ADDED'
  | 'FOLLOWER_STOPPED'
  | 'LOSS_LIMIT_REACHED'
  | 'STRATEGY_PAUSED';

interface NotificationData {
  type: NotificationType;
  strategyId?: string;
  strategyName?: string;
  tradeId?: string;
  symbol?: string;
  followerId?: string;
  followerName?: string;
  masterId?: string;
  masterName?: string;
  amount?: number;
  pnl?: number;
  reason?: string;
}

/**
 * Send notification to user
 */
export async function sendCopyTradingNotification(
  userId: string,
  notification: NotificationData
): Promise<void> {
  try {
    // Create notification record
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'copy_trading',
      title: getNotificationTitle(notification),
      message: getNotificationMessage(notification),
      is_read: false,
    });

    // TODO: Send Telegram notification if user has Telegram connected
    // TODO: Send email notification if enabled
  } catch (error) {
    console.error('Error sending copy trading notification:', error);
  }
}

/**
 * Get notification title
 */
function getNotificationTitle(notification: NotificationData): string {
  switch (notification.type) {
    case 'TRADE_COPIED':
      return `تم نسخ صفقة ${notification.symbol}`;
    case 'TRADE_CLOSED':
      return `تم إغلاق صفقة ${notification.symbol}`;
    case 'FOLLOWER_ADDED':
      return `متابع جديد: ${notification.followerName}`;
    case 'FOLLOWER_STOPPED':
      return `توقف متابع: ${notification.followerName}`;
    case 'LOSS_LIMIT_REACHED':
      return 'تم الوصول لحد الخسارة';
    case 'STRATEGY_PAUSED':
      return `تم إيقاف الاستراتيجية: ${notification.strategyName}`;
    default:
      return 'إشعار نسخ الصفقات';
  }
}

/**
 * Get notification message
 */
function getNotificationMessage(notification: NotificationData): string {
  switch (notification.type) {
    case 'TRADE_COPIED':
      return `تم نسخ صفقة ${notification.symbol} من ${notification.masterName || 'الماستر'}. الحجم: $${notification.amount?.toFixed(2) || 'N/A'}`;
    case 'TRADE_CLOSED':
      const pnlText = notification.pnl && notification.pnl >= 0 
        ? `ربح: $${notification.pnl.toFixed(2)}` 
        : `خسارة: $${Math.abs(notification.pnl || 0).toFixed(2)}`;
      return `تم إغلاق صفقة ${notification.symbol}. ${pnlText}`;
    case 'FOLLOWER_ADDED':
      return `${notification.followerName || 'مستخدم'} بدأ متابعة استراتيجيتك "${notification.strategyName}"`;
    case 'FOLLOWER_STOPPED':
      return `${notification.followerName || 'مستخدم'} توقف عن متابعة استراتيجيتك "${notification.strategyName}"`;
    case 'LOSS_LIMIT_REACHED':
      return `تم الوصول لحد الخسارة ${notification.reason || ''}. تم إيقاف النسخ تلقائياً.`;
    case 'STRATEGY_PAUSED':
      return `تم إيقاف الاستراتيجية "${notification.strategyName}" ${notification.reason ? `: ${notification.reason}` : ''}`;
    default:
      return 'إشعار من نظام نسخ الصفقات';
  }
}

/**
 * Notify follower about copied trade
 */
export async function notifyFollowerTradeCopied(
  followerId: string,
  strategyId: string,
  strategyName: string,
  masterId: string,
  masterName: string,
  symbol: string,
  amount: number
): Promise<void> {
  await sendCopyTradingNotification(followerId, {
    type: 'TRADE_COPIED',
    strategyId,
    strategyName,
    masterId,
    masterName,
    symbol,
    amount,
  });
}

/**
 * Notify follower about closed trade
 */
export async function notifyFollowerTradeClosed(
  followerId: string,
  symbol: string,
  pnl: number
): Promise<void> {
  await sendCopyTradingNotification(followerId, {
    type: 'TRADE_CLOSED',
    symbol,
    pnl,
  });
}

/**
 * Notify master about new follower
 */
export async function notifyMasterNewFollower(
  masterId: string,
  strategyId: string,
  strategyName: string,
  followerId: string,
  followerName: string
): Promise<void> {
  await sendCopyTradingNotification(masterId, {
    type: 'FOLLOWER_ADDED',
    strategyId,
    strategyName,
    followerId,
    followerName,
  });
}

/**
 * Notify master about stopped follower
 */
export async function notifyMasterStoppedFollower(
  masterId: string,
  strategyId: string,
  strategyName: string,
  followerId: string,
  followerName: string
): Promise<void> {
  await sendCopyTradingNotification(masterId, {
    type: 'FOLLOWER_STOPPED',
    strategyId,
    strategyName,
    followerId,
    followerName,
  });
}

/**
 * Notify follower about loss limit reached
 */
export async function notifyFollowerLossLimit(
  followerId: string,
  reason: string
): Promise<void> {
  await sendCopyTradingNotification(followerId, {
    type: 'LOSS_LIMIT_REACHED',
    reason,
  });
}

