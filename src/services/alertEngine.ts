/**
 * Alert Engine
 * 
 * Manages alerts and notifications across multiple channels
 * Telegram, Email, In-App
 * 
 * Phase 8: Logging + Monitoring + Alerting System - Task 5
 */

import { supabase } from '@/integrations/supabase/client';
import { PortfolioAlert, AlertType, AlertSeverity } from '@/services/portfolio/portfolioAlerts';

/**
 * Alert Rule
 */
export interface AlertRule {
  id: string;
  userId: string;
  type: AlertType | 'error' | 'risk' | 'order_fill' | 'pnl' | 'drawdown' | 'system';
  channel: 'telegram' | 'email' | 'in_app' | 'all';
  name: string;
  description?: string;
  conditions: any;
  isEnabled: boolean;
  isSystem: boolean;
}

/**
 * Alert Context
 */
export interface AlertContext {
  tradeId?: string;
  positionId?: string;
  signalId?: string;
  exchange?: string;
  symbol?: string;
  userId?: string;
  [key: string]: any;
}

/**
 * Send Telegram Alert
 */
export async function sendTelegramAlert(
  chatId: string,
  title: string,
  body: string,
  level: AlertSeverity
): Promise<boolean> {
  if (!chatId) {
    console.warn('sendTelegramAlert: chatId is required');
    return false;
  }

  try {
    const { data, error } = await supabase.functions.invoke('telegram-alert', {
      body: {
        chatId,
        title,
        body,
        level
      }
    });

    if (error) {
      console.error('Failed to send Telegram alert via Edge Function:', error);
      return false;
    }

    return data?.success !== false;
  } catch (err) {
    console.error('Unexpected error sending Telegram alert:', err);
    return false;
  }
}

/**
 * Send Email Alert (placeholder - requires email service)
 */
export async function sendEmailAlert(
  email: string,
  title: string,
  body: string,
  level: AlertSeverity
): Promise<boolean> {
  // TODO: Implement email service integration
  // For now, return false (not implemented)
  console.warn('Email alerts not yet implemented');
  return false;
}

/**
 * Create In-App Alert
 */
export async function createInAppAlert(
  userId: string,
  level: AlertSeverity,
  type: string,
  title: string,
  body: string,
  context?: AlertContext,
  ruleId?: string
): Promise<string | null> {
  try {
    // Map severity to alert level
    const alertLevel = level === 'critical' || level === 'high' ? 'critical' :
                       level === 'medium' ? 'error' : 'warn';
    
    const { data, error } = await supabase
      .from('alerts' as any)
      .insert({
        user_id: userId,
        rule_id: ruleId || null,
        level: alertLevel,
        type: type as any,
        title,
        body,
        context: context || {},
        trade_id: context?.tradeId || null,
        position_id: context?.positionId || null,
        signal_id: context?.signalId || null,
        in_app_sent: true,
        channels_sent: ['in_app'],
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Failed to create in-app alert:', error);
      return null;
    }
    
    return (data as unknown as { id: string } | null)?.id || null;
  } catch (error) {
    console.error('Error creating in-app alert:', error);
    return null;
  }
}

/**
 * Evaluate alert rules and send alerts
 */
export async function evaluateAndSendAlerts(
  userId: string,
  type: string,
  level: AlertSeverity,
  title: string,
  body: string,
  context?: AlertContext
): Promise<void> {
  try {
    // Fetch enabled alert rules for this user and type
    const { data: rules, error } = await supabase
      .from('alert_rules' as any)
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('is_enabled', true);
    
    if (error || !rules || rules.length === 0) {
      // No rules found, send default in-app alert
      await createInAppAlert(userId, level, type, title, body, context);
      return;
    }
    
    // Evaluate each rule
    for (const rule of rules as any) {
      // Check if rule conditions match
      const matches = evaluateRuleConditions(rule.conditions, context, level);
      
      if (matches) {
        // Determine channels
        const channels = rule.channel === 'all' 
          ? ['telegram', 'email', 'in_app'] 
          : [rule.channel];
        
        let alertId: string | null = null;
        
        // Send to each channel
        for (const channel of channels) {
          let sent = false;
          
          if (channel === 'in_app') {
            alertId = await createInAppAlert(userId, level, type, title, body, context, rule.id);
            sent = !!alertId;
          } else if (channel === 'telegram') {
            // Get user's Telegram chat ID from context or user settings
            const telegramChatId = context?.telegramChatId;
            if (telegramChatId) {
              sent = await sendTelegramAlert(telegramChatId, title, body, level);
            } else {
              console.warn('Telegram chat ID not found for user');
            }
          } else if (channel === 'email') {
            // Get user's email from context or auth
            const email = context?.email;
            if (email) {
              sent = await sendEmailAlert(email, title, body, level);
            }
          }
          
          // Update alert with sent status if alert was created
          if (alertId && (channel === 'telegram' || channel === 'email')) {
            await updateAlertChannelStatus(alertId, channel, sent);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error evaluating and sending alerts:', error);
  }
}

/**
 * Evaluate rule conditions
 */
function evaluateRuleConditions(
  conditions: any,
  context?: AlertContext,
  level?: AlertSeverity
): boolean {
  if (!conditions || Object.keys(conditions).length === 0) {
    return true; // No conditions = always match
  }
  
  // Example condition evaluation (can be extended)
  // Conditions format: { minLevel: 'high', symbols: ['BTC', 'ETH'], exchanges: ['binance'] }
  
  if (conditions.minLevel) {
    const levelPriority = { low: 0, medium: 1, high: 2, critical: 3 };
    const minPriority = levelPriority[conditions.minLevel as keyof typeof levelPriority] || 0;
    const currentPriority = level ? levelPriority[level] || 0 : 0;
    
    if (currentPriority < minPriority) {
      return false;
    }
  }
  
  if (conditions.symbols && context?.symbol) {
    if (!conditions.symbols.includes(context.symbol)) {
      return false;
    }
  }
  
  if (conditions.exchanges && context?.exchange) {
    if (!conditions.exchanges.includes(context.exchange)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Update alert channel status
 */
async function updateAlertChannelStatus(
  alertId: string,
  channel: 'telegram' | 'email',
  sent: boolean
): Promise<void> {
  try {
    // Note: array_append RPC function may not exist in Supabase types
    // Using a simpler approach - update channels_sent directly
    const updateData: any = {};
    
    if (channel === 'telegram') {
      updateData.telegram_sent = sent;
      updateData.telegram_sent_at = sent ? new Date().toISOString() : null;
    } else if (channel === 'email') {
      updateData.email_sent = sent;
      updateData.email_sent_at = sent ? new Date().toISOString() : null;
    }
    
    await supabase
      .from('alerts' as any)
      .update(updateData)
      .eq('id', alertId);
  } catch (error) {
    console.error('Failed to update alert channel status:', error);
  }
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(alertId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('alerts' as any)
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', alertId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Failed to mark alert as read:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error marking alert as read:', error);
    return false;
  }
}

/**
 * Acknowledge alert
 */
export async function acknowledgeAlert(alertId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('alerts' as any)
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', alertId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Failed to acknowledge alert:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    return false;
  }
}

/**
 * Get unread alerts for user
 */
export async function getUnreadAlerts(userId: string, limit: number = 50): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('alerts' as any)
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Failed to fetch unread alerts:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching unread alerts:', error);
    return [];
  }
}

