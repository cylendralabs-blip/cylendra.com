/**
 * Risk Snapshot Service
 * 
 * Service for creating and storing risk snapshots
 * Phase 5: Risk Management Engine (Advanced)
 */

import { createClient } from '@supabase/supabase-js';
import { BotSettingsForm } from '@/core/config';
import { Trade } from '@/core/models/Trade';
import { Position } from '@/core/models/Position';
import { calculateDailyPnL } from './dailyLossTracker';
import { calculateTotalExposure } from './exposureTracker';
import { calculateDrawdown, updatePeakEquity } from './drawdownCalculator';
import { isKillSwitchActive } from './killSwitch';

/**
 * Risk Snapshot Data
 */
export interface RiskSnapshotData {
  user_id: string;
  equity: number;
  peak_equity: number;
  starting_equity: number;
  daily_pnl: number;
  daily_pnl_percentage: number;
  current_drawdown_percentage: number;
  max_drawdown_percentage: number;
  total_exposure: number;
  total_exposure_percentage: number;
  symbol_exposures: Record<string, any>;
  active_trades_count: number;
  risk_flags: string[];
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  warnings: string[];
  alerts: string[];
  is_killed: boolean;
  kill_switch_reason?: string;
}

/**
 * Create comprehensive risk snapshot
 */
export async function createRiskSnapshot(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  trades: Trade[],
  positions: Position[],
  botSettings: BotSettingsForm,
  currentEquity: number,
  startingEquity?: number,
  peakEquity?: number,
  killSwitchState?: any
): Promise<string | null> {
  try {
    // Calculate starting equity (use total_capital if not provided)
    const startingEq = startingEquity || botSettings.total_capital;
    
    // Calculate peak equity (update if current is higher)
    const peakEq = peakEquity || startingEq;
    const { peakEquity: updatedPeak } = updatePeakEquity(currentEquity, peakEq);
    
    // Calculate daily PnL
    const dailyPnLData = calculateDailyPnL(trades, currentEquity, startingEq);
    
    // Calculate drawdown
    const drawdown = calculateDrawdown(currentEquity, updatedPeak);
    
    // Calculate exposure
    const exposureData = calculateTotalExposure(trades, currentEquity);
    
    // Get active trades count
    const activeTradesCount = trades.filter(t => 
      t.status === 'ACTIVE' || t.status === 'PENDING'
    ).length;
    
    // Determine risk flags
    const riskFlags: string[] = [];
    const warnings: string[] = [];
    const alerts: string[] = [];
    
    // Check daily loss limit
    const maxDailyLossUsd = botSettings.max_daily_loss_usd;
    const maxDailyLossPct = botSettings.max_daily_loss_pct || 5.0;
    
    if (maxDailyLossUsd && Math.abs(dailyPnLData.dailyPnL) >= maxDailyLossUsd) {
      riskFlags.push('DAILY_LOSS_LIMIT_HIT');
      alerts.push(`Daily loss limit exceeded: $${Math.abs(dailyPnLData.dailyPnL).toFixed(2)} >= $${maxDailyLossUsd.toFixed(2)}`);
    } else if (Math.abs(dailyPnLData.dailyPnLPercentage) >= maxDailyLossPct) {
      riskFlags.push('DAILY_LOSS_LIMIT_HIT');
      alerts.push(`Daily loss percentage exceeded: ${Math.abs(dailyPnLData.dailyPnLPercentage).toFixed(2)}% >= ${maxDailyLossPct}%`);
    }
    
    // Check max drawdown
    const maxDrawdownPct = botSettings.max_drawdown_pct || 20.0;
    if (drawdown.currentDrawdownPercentage >= maxDrawdownPct) {
      riskFlags.push('MAX_DRAWDOWN_EXCEEDED');
      alerts.push(`Max drawdown exceeded: ${drawdown.currentDrawdownPercentage.toFixed(2)}% >= ${maxDrawdownPct}%`);
    } else if (drawdown.currentDrawdownPercentage >= maxDrawdownPct * 0.8) {
      riskFlags.push('DRAWDOWN_WARNING');
      warnings.push(`Drawdown approaching limit: ${drawdown.currentDrawdownPercentage.toFixed(2)}% / ${maxDrawdownPct}%`);
    }
    
    // Check exposure limits
    const maxExposurePerSymbol = botSettings.max_exposure_pct_per_symbol || 30.0;
    const maxExposureTotal = botSettings.max_exposure_pct_total || 80.0;
    
    if (exposureData.totalExposurePercentage >= maxExposureTotal) {
      riskFlags.push('TOTAL_EXPOSURE_EXCEEDED');
      alerts.push(`Total exposure exceeded: ${exposureData.totalExposurePercentage.toFixed(2)}% >= ${maxExposureTotal}%`);
    } else if (exposureData.totalExposurePercentage >= maxExposureTotal * 0.9) {
      riskFlags.push('EXPOSURE_WARNING');
      warnings.push(`Total exposure approaching limit: ${exposureData.totalExposurePercentage.toFixed(2)}% / ${maxExposureTotal}%`);
    }
    
    // Check per-symbol exposure
    Object.keys(exposureData.symbolExposures).forEach(symbol => {
      const symbolExp = exposureData.symbolExposures[symbol];
      if (symbolExp.exposurePercentage >= maxExposurePerSymbol) {
        riskFlags.push(`EXPOSURE_PER_SYMBOL_EXCEEDED:${symbol}`);
        alerts.push(`Exposure for ${symbol} exceeded: ${symbolExp.exposurePercentage.toFixed(2)}% >= ${maxExposurePerSymbol}%`);
      }
    });
    
    // Check max active trades
    if (activeTradesCount >= botSettings.max_active_trades) {
      riskFlags.push('MAX_TRADES_REACHED');
      warnings.push(`Max active trades reached: ${activeTradesCount} >= ${botSettings.max_active_trades}`);
    }
    
    // Check kill switch
    const isKilled = killSwitchState ? isKillSwitchActive(killSwitchState) : false;
    if (isKilled) {
      riskFlags.push('KILL_SWITCH_ACTIVE');
      alerts.push(`Kill switch is active: ${killSwitchState?.reason || 'Unknown reason'}`);
    }
    
    // Determine overall risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (alerts.length > 0 || riskFlags.some(f => f.includes('EXCEEDED') || f.includes('KILL'))) {
      riskLevel = 'CRITICAL';
    } else if (warnings.length > 0 || riskFlags.length > 0) {
      riskLevel = drawdown.currentDrawdownPercentage > maxDrawdownPct * 0.7 ? 'HIGH' : 'MEDIUM';
    } else if (drawdown.currentDrawdownPercentage > maxDrawdownPct * 0.5) {
      riskLevel = 'MEDIUM';
    }
    
    // Create snapshot data
    const snapshotData: RiskSnapshotData = {
      user_id: userId,
      equity: currentEquity,
      peak_equity: updatedPeak,
      starting_equity: startingEq,
      daily_pnl: dailyPnLData.dailyPnL,
      daily_pnl_percentage: dailyPnLData.dailyPnLPercentage,
      current_drawdown_percentage: drawdown.currentDrawdownPercentage,
      max_drawdown_percentage: Math.max(drawdown.currentDrawdownPercentage, maxDrawdownPct),
      total_exposure: exposureData.totalExposure,
      total_exposure_percentage: exposureData.totalExposurePercentage,
      symbol_exposures: exposureData.symbolExposures,
      active_trades_count: activeTradesCount,
      risk_flags: riskFlags,
      risk_level: riskLevel,
      warnings,
      alerts,
      is_killed: isKilled,
      kill_switch_reason: killSwitchState?.reason
    };
    
    // Save to database
    const { data, error } = await supabaseClient
      .from('risk_snapshots' as any)
      .insert({
        ...snapshotData,
        timestamp: new Date().toISOString()
      } as any)
      .select('id')
      .single();
    
    if (error) {
      console.error('Error saving risk snapshot:', error);
      return null;
    }
    
    const result = data as { id: string } | null;
    return result?.id || null;
    
  } catch (error) {
    console.error('Error creating risk snapshot:', error);
    return null;
  }
}

/**
 * Get latest risk snapshot for user
 */
export async function getLatestRiskSnapshot(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string
): Promise<RiskSnapshotData | null> {
  try {
    const { data, error } = await supabaseClient
      .from('risk_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data as RiskSnapshotData;
    
  } catch (error) {
    console.error('Error fetching risk snapshot:', error);
    return null;
  }
}

/**
 * Get risk snapshots for date range
 */
export async function getRiskSnapshots(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  startDate?: string,
  endDate?: string,
  limit: number = 100
): Promise<RiskSnapshotData[]> {
  try {
    let query = supabaseClient
      .from('risk_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (startDate) {
      query = query.gte('timestamp', startDate);
    }
    
    if (endDate) {
      query = query.lte('timestamp', endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching risk snapshots:', error);
      return [];
    }
    
    return (data || []) as RiskSnapshotData[];
    
  } catch (error) {
    console.error('Error fetching risk snapshots:', error);
    return [];
  }
}

