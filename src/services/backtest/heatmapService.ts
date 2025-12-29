/**
 * Heatmap Analysis Service
 * 
 * Analyze backtest performance by time, day, volume, and market conditions
 * 
 * Phase 4: Advanced Features - Task 7
 */

import { supabase } from '@/integrations/supabase/client';

export interface HeatmapData {
  timeBlocks: Array<{
    hour: number;
    dayOfWeek: number;
    profit: number;
    trades: number;
    winrate: number;
  }>;
  volumeBins: Array<{
    volumeRange: string;
    profit: number;
    trades: number;
    winrate: number;
  }>;
  marketConditions: Array<{
    condition: 'trending_up' | 'trending_down' | 'sideways';
    profit: number;
    trades: number;
    winrate: number;
  }>;
}

/**
 * Generate heatmap data from backtest trades
 */
export async function generateHeatmapData(runId: string): Promise<HeatmapData> {
  // Fetch trades
  const { data: trades } = await supabase
    .from('backtest_trades' as any)
    .select('*')
    .eq('backtest_run_id', runId)
    .order('entry_time');

  if (!trades || trades.length === 0) {
    return {
      timeBlocks: [],
      volumeBins: [],
      marketConditions: []
    };
  }

  // Group by time blocks (hour + day of week)
  const timeBlockMap = new Map<string, { profit: number; trades: number; wins: number }>();
  
  // Group by volume bins
  const volumeBinMap = new Map<string, { profit: number; trades: number; wins: number }>();
  
  // Group by market conditions (simplified - would need price data)
  const conditionMap = new Map<string, { profit: number; trades: number; wins: number }>();

  for (const trade of trades) {
    const tradeData = trade as any;
    if (!tradeData.entry_time) continue;
    
    const entryDate = new Date(tradeData.entry_time);
    const hour = entryDate.getUTCHours();
    const dayOfWeek = entryDate.getUTCDay();
    const timeKey = `${dayOfWeek}-${hour}`;
    
    // Time block analysis
    if (!timeBlockMap.has(timeKey)) {
      timeBlockMap.set(timeKey, { profit: 0, trades: 0, wins: 0 });
    }
    const timeBlock = timeBlockMap.get(timeKey)!;
    timeBlock.profit += Number(tradeData.pnl_usd || 0);
    timeBlock.trades += 1;
    if (Number(tradeData.pnl_usd || 0) > 0) {
      timeBlock.wins += 1;
    }
    
    // Volume analysis (would need volume data from candles)
    // For now, use a placeholder
    const volumeKey = 'medium'; // Would calculate from actual volume
    if (!volumeBinMap.has(volumeKey)) {
      volumeBinMap.set(volumeKey, { profit: 0, trades: 0, wins: 0 });
    }
    const volumeBin = volumeBinMap.get(volumeKey)!;
    volumeBin.profit += Number(tradeData.pnl_usd || 0);
    volumeBin.trades += 1;
    if (Number(tradeData.pnl_usd || 0) > 0) {
      volumeBin.wins += 1;
    }
    
    // Market condition (simplified - would analyze price action)
    const condition = 'sideways'; // Would analyze from price data
    if (!conditionMap.has(condition)) {
      conditionMap.set(condition, { profit: 0, trades: 0, wins: 0 });
    }
    const conditionData = conditionMap.get(condition)!;
    conditionData.profit += Number(tradeData.pnl_usd || 0);
    conditionData.trades += 1;
    if (Number(tradeData.pnl_usd || 0) > 0) {
      conditionData.wins += 1;
    }
  }

  // Convert maps to arrays
  const timeBlocks = Array.from(timeBlockMap.entries()).map(([key, data]) => {
    const [day, hour] = key.split('-').map(Number);
    return {
      hour,
      dayOfWeek: day,
      profit: data.profit,
      trades: data.trades,
      winrate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0
    };
  });

  const volumeBins = Array.from(volumeBinMap.entries()).map(([range, data]) => ({
    volumeRange: range,
    profit: data.profit,
    trades: data.trades,
    winrate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0
  }));

  const marketConditions = Array.from(conditionMap.entries()).map(([condition, data]) => ({
    condition: condition as 'trending_up' | 'trending_down' | 'sideways',
    profit: data.profit,
    trades: data.trades,
    winrate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0
  }));

  return {
    timeBlocks,
    volumeBins,
    marketConditions
  };
}

