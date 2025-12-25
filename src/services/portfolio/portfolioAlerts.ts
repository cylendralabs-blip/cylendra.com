/**
 * Portfolio Alerts Service
 * 
 * Manages alerts and notifications for portfolio sync failures
 * and risk warnings
 * 
 * Phase 7: Portfolio & Wallet Integration - Task 9
 */

import { PortfolioSyncResult } from '@/services/portfolio/types';

/**
 * Alert Types
 */
export type AlertType = 
  | 'sync_failure'
  | 'api_error'
  | 'exposure_warning'
  | 'equity_drop'
  | 'balance_mismatch';

/**
 * Alert Severity
 */
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Portfolio Alert
 */
export interface PortfolioAlert {
  id: string;
  userId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  details?: any;
  acknowledged: boolean;
  acknowledgedAt?: string;
  createdAt: string;
}

/**
 * Create alert for sync failure
 */
export function createSyncFailureAlert(
  userId: string,
  apiKeyId: string,
  platform: string,
  error: string
): PortfolioAlert {
  return {
    id: crypto.randomUUID(),
    userId,
    type: 'sync_failure',
    severity: 'high',
    title: `Portfolio Sync Failed - ${platform}`,
    message: `Failed to sync portfolio from ${platform}`,
    details: {
      apiKeyId,
      platform,
      error
    },
    acknowledged: false,
    createdAt: new Date().toISOString()
  };
}

/**
 * Create alert for API error
 */
export function createAPIErrorAlert(
  userId: string,
  apiKeyId: string,
  platform: string,
  errorCode: string,
  errorMessage: string
): PortfolioAlert {
  let severity: AlertSeverity = 'medium';
  
  // Determine severity based on error code
  if (errorCode.includes('INVALID') || errorCode.includes('UNAUTHORIZED')) {
    severity = 'critical';
  } else if (errorCode.includes('RATE_LIMIT')) {
    severity = 'high';
  }
  
  return {
    id: crypto.randomUUID(),
    userId,
    type: 'api_error',
    severity,
    title: `API Error - ${platform}`,
    message: errorMessage || 'API request failed',
    details: {
      apiKeyId,
      platform,
      errorCode,
      errorMessage
    },
    acknowledged: false,
    createdAt: new Date().toISOString()
  };
}

/**
 * Create alert for exposure warning
 */
export function createExposureWarningAlert(
  userId: string,
  currentExposurePct: number,
  maxExposurePct: number,
  symbol?: string
): PortfolioAlert {
  const severity: AlertSeverity = currentExposurePct > maxExposurePct * 1.2 
    ? 'critical' 
    : currentExposurePct > maxExposurePct 
    ? 'high' 
    : 'medium';
  
  return {
    id: crypto.randomUUID(),
    userId,
    type: 'exposure_warning',
    severity,
    title: symbol 
      ? `Exposure Warning - ${symbol}`
      : 'Exposure Warning',
    message: symbol
      ? `${symbol} exposure (${currentExposurePct.toFixed(2)}%) exceeds limit (${maxExposurePct}%)`
      : `Total exposure (${currentExposurePct.toFixed(2)}%) exceeds limit (${maxExposurePct}%)`,
    details: {
      symbol,
      currentExposurePct,
      maxExposurePct
    },
    acknowledged: false,
    createdAt: new Date().toISOString()
  };
}

/**
 * Create alert for equity drop
 */
export function createEquityDropAlert(
  userId: string,
  currentEquity: number,
  previousEquity: number,
  dropPct: number
): PortfolioAlert {
  const severity: AlertSeverity = dropPct > 20
    ? 'critical'
    : dropPct > 10
    ? 'high'
    : 'medium';
  
  return {
    id: crypto.randomUUID(),
    userId,
    type: 'equity_drop',
    severity,
    title: 'Equity Drop Alert',
    message: `Portfolio equity dropped ${dropPct.toFixed(2)}%`,
    details: {
      currentEquity,
      previousEquity,
      dropPct
    },
    acknowledged: false,
    createdAt: new Date().toISOString()
  };
}

/**
 * Create alert for balance mismatch
 */
export function createBalanceMismatchAlert(
  userId: string,
  apiKeyId: string,
  platform: string,
  expectedBalance: number,
  actualBalance: number,
  difference: number
): PortfolioAlert {
  return {
    id: crypto.randomUUID(),
    userId,
    type: 'balance_mismatch',
    severity: 'medium',
    title: `Balance Mismatch - ${platform}`,
    message: `Balance mismatch detected. Difference: ${difference.toFixed(2)} USD`,
    details: {
      apiKeyId,
      platform,
      expectedBalance,
      actualBalance,
      difference
    },
    acknowledged: false,
    createdAt: new Date().toISOString()
  };
}

/**
 * Store alert in database (via Supabase)
 * Note: This should be called from Edge Function or client with proper auth
 */
export async function storeAlert(
  alert: PortfolioAlert,
  supabaseClient?: any
): Promise<void> {
  if (!supabaseClient) {
    // In client-side, log to console
    console.warn('Portfolio Alert:', alert);
    return;
  }
  
  // Store in database (portfolio_alerts table should exist)
  try {
    const { error } = await supabaseClient
      .from('portfolio_alerts')
      .insert({
        id: alert.id,
        user_id: alert.userId,
        alert_type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        details: alert.details || {},
        acknowledged: alert.acknowledged,
        acknowledged_at: alert.acknowledgedAt,
        created_at: alert.createdAt
      });
    
    if (error) {
      console.error('Failed to store alert:', error);
    }
  } catch (error) {
    console.error('Error storing alert:', error);
  }
}

/**
 * Acknowledge alert
 */
export async function acknowledgeAlert(
  alertId: string,
  userId: string,
  supabaseClient?: any
): Promise<void> {
  if (!supabaseClient) {
    return;
  }
  
  try {
    const { error } = await supabaseClient
      .from('portfolio_alerts')
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', alertId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  } catch (error) {
    console.error('Error acknowledging alert:', error);
  }
}

/**
 * Get unacknowledged alerts for user
 */
export async function getUnacknowledgedAlerts(
  userId: string,
  supabaseClient?: any
): Promise<PortfolioAlert[]> {
  if (!supabaseClient) {
    return [];
  }
  
  try {
    const { data, error } = await supabaseClient
      .from('portfolio_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('acknowledged', false)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Failed to fetch alerts:', error);
      return [];
    }
    
    return (data || []).map((alert: any) => ({
      id: alert.id,
      userId: alert.user_id,
      type: alert.alert_type as AlertType,
      severity: alert.severity as AlertSeverity,
      title: alert.title,
      message: alert.message,
      details: alert.details,
      acknowledged: alert.acknowledged,
      acknowledgedAt: alert.acknowledged_at,
      createdAt: alert.created_at
    }));
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
}

