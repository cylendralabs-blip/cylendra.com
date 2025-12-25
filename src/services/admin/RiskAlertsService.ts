/**
 * Risk Alerts Service
 * 
 * Phase Admin B: Risk alerts and monitoring system
 */

import { supabase } from '@/integrations/supabase/client';
import { logAdminAction } from './AdminActivityService';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface RiskAlert {
  id: string;
  user_id: string;
  user_email?: string;
  alert_type: string;
  severity: AlertSeverity;
  message: string;
  metadata?: Record<string, any>;
  triggered_at: string;
  resolved: boolean;
  resolved_at?: string;
}

export type AlertType = 
  | 'daily_loss_limit_breached'
  | 'max_drawdown_exceeded'
  | 'rapid_loss_spike'
  | 'multiple_bot_failures'
  | 'api_connection_error'
  | 'failed_orders_threshold'
  | 'kill_switch_triggered'
  | 'high_exposure'
  | 'unusual_activity';

/**
 * Get all active risk alerts
 */
export async function getActiveRiskAlerts(
  filters?: {
    severity?: AlertSeverity;
    userId?: string;
    alertType?: AlertType;
  }
): Promise<{ alerts: RiskAlert[]; error?: string }> {
  try {
    // Get risk events from risk_event_logs
    let query = (supabase as any)
      .from('risk_event_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filters?.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.alertType) {
      query = query.eq('event_type', filters.alertType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching risk alerts:', error);
      return { alerts: [], error: error.message };
    }

    // Convert to RiskAlert format
    const alerts: RiskAlert[] = await Promise.all(
      ((data || []) as any[]).map(async (event: any) => {
        // Get user email
        let userEmail: string | undefined;
        if (event.user_id) {
          try {
            const { data: profile } = await (supabase as any)
              .from('profiles')
              .select('email')
              .eq('id', event.user_id)
              .maybeSingle();
            userEmail = profile?.email;
          } catch (e) {
            // Ignore errors
          }
        }

        return {
          id: event.id,
          user_id: event.user_id || '',
          user_email: userEmail,
          alert_type: event.event_type,
          severity: event.severity as AlertSeverity,
          message: event.description || event.event_type,
          metadata: event.metadata,
          triggered_at: event.created_at,
          resolved: false, // TODO: Add resolved tracking
        };
      })
    );

    return { alerts };
  } catch (error) {
    console.error('Error in getActiveRiskAlerts:', error);
    return {
      alerts: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Detect risk alerts from current system state
 */
export async function detectRiskAlerts(): Promise<{ alerts: RiskAlert[]; error?: string }> {
  try {
    const alerts: RiskAlert[] = [];

    // 1. Check for daily loss limit breaches
    const { data: dailyLossSnapshots } = await (supabase as any)
      .from('daily_loss_snapshots')
      .select('*')
      .eq('date', new Date().toISOString().split('T')[0])
      .lt('daily_pnl_percentage', -10); // Alert if loss > 10%

    if (dailyLossSnapshots) {
      for (const snapshot of dailyLossSnapshots) {
        alerts.push({
          id: `daily_loss_${snapshot.user_id}_${snapshot.date}`,
          user_id: snapshot.user_id,
          alert_type: 'daily_loss_limit_breached',
          severity: snapshot.daily_pnl_percentage < -20 ? 'critical' : snapshot.daily_pnl_percentage < -15 ? 'high' : 'medium',
          message: `Daily loss limit breached: ${snapshot.daily_pnl_percentage.toFixed(2)}%`,
          metadata: {
            daily_pnl: snapshot.daily_pnl,
            daily_pnl_percentage: snapshot.daily_pnl_percentage,
            current_equity: snapshot.current_equity,
          },
          triggered_at: snapshot.updated_at || snapshot.created_at,
          resolved: false,
        });
      }
    }

    // 2. Check for drawdown issues
    const { data: drawdownSnapshots } = await (supabase as any)
      .from('drawdown_snapshots')
      .select('*')
      .gt('current_drawdown_percentage', 20); // Alert if drawdown > 20%

    if (drawdownSnapshots) {
      for (const snapshot of drawdownSnapshots) {
        alerts.push({
          id: `drawdown_${snapshot.user_id}_${snapshot.id}`,
          user_id: snapshot.user_id,
          alert_type: 'max_drawdown_exceeded',
          severity: snapshot.current_drawdown_percentage > 30 ? 'critical' : snapshot.current_drawdown_percentage > 25 ? 'high' : 'medium',
          message: `Max drawdown exceeded: ${snapshot.current_drawdown_percentage.toFixed(2)}%`,
          metadata: {
            current_drawdown: snapshot.current_drawdown,
            current_drawdown_percentage: snapshot.current_drawdown_percentage,
            peak_equity: snapshot.peak_equity,
            current_equity: snapshot.current_equity,
          },
          triggered_at: snapshot.created_at,
          resolved: false,
        });
      }
    }

    // 3. Check for kill switch states
    const { data: killSwitches } = await (supabase as any)
      .from('kill_switch_states')
      .select('*')
      .eq('is_active', true);

    if (killSwitches) {
      for (const ks of killSwitches) {
        alerts.push({
          id: `kill_switch_${ks.user_id}_${ks.id}`,
          user_id: ks.user_id,
          alert_type: 'kill_switch_triggered',
          severity: 'high',
          message: `Kill switch active: ${ks.reason || 'Unknown reason'}`,
          metadata: {
            exchange: ks.exchange,
            symbol: ks.symbol,
            reason: ks.reason,
            triggered_at: ks.triggered_at,
          },
          triggered_at: ks.triggered_at || ks.created_at,
          resolved: false,
        });
      }
    }

    return { alerts };
  } catch (error) {
    console.error('Error in detectRiskAlerts:', error);
    return {
      alerts: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Log a risk event
 */
export async function logRiskEvent(
  userId: string,
  eventType: AlertType,
  severity: AlertSeverity,
  description: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from('risk_event_logs')
      .insert({
        user_id: userId,
        event_type: eventType,
        severity,
        description,
        metadata: metadata || {},
      });

    if (error) {
      console.error('Error logging risk event:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in logRiskEvent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

