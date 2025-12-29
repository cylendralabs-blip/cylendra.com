/**
 * User Risk Profile Service
 * 
 * Phase Admin B: Detailed risk overview for individual users
 */

import { supabase } from '@/integrations/supabase/client';

export interface UserRiskProfile {
  userId: string;
  userEmail?: string;
  currentEquity: number;
  currentDailyLoss: number;
  currentDailyLossPercent: number;
  currentDrawdown: number;
  currentDrawdownPercent: number;
  totalExposure: number;
  activeBotsCount: number;
  activePositionsCount: number;
}

export interface RiskTimelinePoint {
  timestamp: string;
  equity: number;
  drawdown: number;
  drawdownPercent: number;
  dailyLoss: number;
  dailyLossPercent: number;
}

export interface BotOverview {
  botId: string;
  botName: string;
  strategyType: string;
  status: 'running' | 'paused' | 'failed' | 'stopped';
  lastExecutionTime?: string;
  lastTradeResult?: 'success' | 'failure' | 'partial';
  lastError?: string;
  isActive: boolean;
}

/**
 * Get user risk profile
 */
export async function getUserRiskProfile(
  userId: string
): Promise<{ profile: UserRiskProfile | null; error?: string }> {
  try {
    // Get user email
    let userEmail: string | undefined;
    try {
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .maybeSingle();
      userEmail = profile?.email;
    } catch (e) {
      // Ignore errors
    }

    // Get latest daily loss snapshot
    const today = new Date().toISOString().split('T')[0];
    const { data: dailyLoss } = await (supabase as any)
      .from('daily_loss_snapshots')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get latest drawdown snapshot
    const { data: drawdown } = await (supabase as any)
      .from('drawdown_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get latest portfolio snapshot
    const { data: portfolio } = await (supabase as any)
      .from('portfolio_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get active positions count
    const { count: activePositionsCount } = await (supabase as any)
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['ACTIVE', 'OPEN', 'PENDING']);

    // Get active bots count
    const { count: activeBotsCount } = await (supabase as any)
      .from('bot_settings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    // Get total exposure from exposure snapshots
    const { data: exposure } = await (supabase as any)
      .from('exposure_snapshots')
      .select('total_exposure')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    const profile: UserRiskProfile = {
      userId,
      userEmail,
      currentEquity: portfolio?.total_equity || drawdown?.current_equity || 0,
      currentDailyLoss: dailyLoss?.daily_pnl || 0,
      currentDailyLossPercent: dailyLoss?.daily_pnl_percentage || 0,
      currentDrawdown: drawdown?.current_drawdown || 0,
      currentDrawdownPercent: drawdown?.current_drawdown_percentage || 0,
      totalExposure: exposure?.total_exposure || 0,
      activeBotsCount: activeBotsCount || 0,
      activePositionsCount: activePositionsCount || 0,
    };

    return { profile };
  } catch (error) {
    console.error('Error in getUserRiskProfile:', error);
    return {
      profile: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get risk timeline for a user
 */
export async function getUserRiskTimeline(
  userId: string,
  days: number = 30
): Promise<{ timeline: RiskTimelinePoint[]; error?: string }> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get drawdown snapshots
    const { data: drawdownSnapshots } = await (supabase as any)
      .from('drawdown_snapshots')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: true });

    // Get daily loss snapshots
    const { data: dailyLossSnapshots } = await (supabase as any)
      .from('daily_loss_snapshots')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    // Combine snapshots into timeline
    const timelineMap = new Map<string, RiskTimelinePoint>();

    // Add drawdown snapshots
    if (drawdownSnapshots) {
      for (const snapshot of drawdownSnapshots) {
        const key = new Date(snapshot.timestamp).toISOString().split('T')[0];
        timelineMap.set(key, {
          timestamp: snapshot.timestamp,
          equity: snapshot.current_equity,
          drawdown: snapshot.current_drawdown,
          drawdownPercent: snapshot.current_drawdown_percentage,
          dailyLoss: 0,
          dailyLossPercent: 0,
        });
      }
    }

    // Add daily loss data
    if (dailyLossSnapshots) {
      for (const snapshot of dailyLossSnapshots) {
        const key = snapshot.date;
        const existing = timelineMap.get(key);
        if (existing) {
          existing.dailyLoss = snapshot.daily_pnl;
          existing.dailyLossPercent = snapshot.daily_pnl_percentage;
        } else {
          timelineMap.set(key, {
            timestamp: snapshot.created_at,
            equity: snapshot.current_equity,
            drawdown: 0,
            drawdownPercent: 0,
            dailyLoss: snapshot.daily_pnl,
            dailyLossPercent: snapshot.daily_pnl_percentage,
          });
        }
      }
    }

    const timeline = Array.from(timelineMap.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return { timeline };
  } catch (error) {
    console.error('Error in getUserRiskTimeline:', error);
    return {
      timeline: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get bot overview for a user
 */
export async function getUserBotOverview(
  userId: string
): Promise<{ bots: BotOverview[]; error?: string }> {
  try {
    const { data: botSettings, error } = await (supabase as any)
      .from('bot_settings')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching bot settings:', error);
      return { bots: [], error: error.message };
    }

    const bots: BotOverview[] = (botSettings || []).map((bot: any) => ({
      botId: bot.id,
      botName: bot.bot_name || 'Unnamed Bot',
      strategyType: bot.strategy_type || 'unknown',
      status: bot.is_active ? 'running' : 'stopped',
      isActive: bot.is_active || false,
      // TODO: Get last execution time and results from execution logs
    }));

    return { bots };
  } catch (error) {
    console.error('Error in getUserBotOverview:', error);
    return {
      bots: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

