/**
 * Trading Monitor Service
 * 
 * Phase Admin B: Real-time trading monitor for admin panel
 */

import { supabase } from '@/integrations/supabase/client';

export interface OpenPosition {
  id: string;
  user_id: string;
  user_email?: string;
  symbol: string;
  side: string;
  entry_price: number;
  current_price: number | null;
  quantity: number;
  total_invested: number;
  unrealized_pnl: number | null;
  unrealized_pnl_percentage: number | null;
  platform: string | null;
  status: string | null;
  opened_at: string | null;
  strategy_id?: string;
  bot_name?: string;
  leverage: number | null;
}

export interface TradingMonitorFilters {
  userId?: string;
  exchange?: string;
  symbol?: string;
  strategyId?: string;
  minPnlPercent?: number;
  maxPnlPercent?: number;
  status?: string;
}

/**
 * Get all open positions across all users
 */
export async function getAllOpenPositions(
  filters?: TradingMonitorFilters
): Promise<{ positions: OpenPosition[]; error?: string }> {
  try {
    let query = (supabase as any)
      .from('trades')
      .select(`
        id,
        user_id,
        symbol,
        side,
        entry_price,
        current_price,
        quantity,
        total_invested,
        unrealized_pnl,
        platform,
        status,
        opened_at,
        leverage
      `)
      .in('status', ['ACTIVE', 'OPEN', 'PENDING'])
      .order('opened_at', { ascending: false });

    // Apply filters
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.exchange) {
      query = query.eq('platform', filters.exchange);
    }
    if (filters?.symbol) {
      query = query.ilike('symbol', `%${filters.symbol}%`);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching open positions:', error);
      return { positions: [], error: error.message };
    }

    // Calculate PnL percentage and enrich with user data
    const positions: OpenPosition[] = await Promise.all(
      (data || []).map(async (trade: any) => {
        // Calculate PnL percentage
        let pnlPercentage: number | null = null;
        if (trade.current_price && trade.entry_price && trade.unrealized_pnl !== null) {
          pnlPercentage = (trade.unrealized_pnl / trade.total_invested) * 100;
        }

        // Get user email
        let userEmail: string | undefined;
        try {
          const { data: profile } = await (supabase as any)
            .from('profiles')
            .select('email')
            .eq('id', trade.user_id)
            .maybeSingle();
          userEmail = profile?.email;
        } catch (e) {
          // Ignore errors
        }

        // Get bot name if available
        let botName: string | undefined;
        try {
          const { data: botSettings } = await (supabase as any)
            .from('bot_settings')
            .select('bot_name')
            .eq('user_id', trade.user_id)
            .maybeSingle();
          botName = botSettings?.bot_name;
        } catch (e) {
          // Ignore errors
        }

        return {
          id: trade.id,
          user_id: trade.user_id,
          user_email: userEmail,
          symbol: trade.symbol,
          side: trade.side,
          entry_price: trade.entry_price,
          current_price: trade.current_price,
          quantity: trade.quantity,
          total_invested: trade.total_invested,
          unrealized_pnl: trade.unrealized_pnl,
          unrealized_pnl_percentage: pnlPercentage,
          platform: trade.platform,
          status: trade.status,
          opened_at: trade.opened_at,
          leverage: trade.leverage,
          bot_name: botName,
        };
      })
    );

    // Apply PnL filters if specified
    let filteredPositions = positions;
    if (filters?.minPnlPercent !== undefined) {
      filteredPositions = filteredPositions.filter(
        p => p.unrealized_pnl_percentage !== null && p.unrealized_pnl_percentage >= filters.minPnlPercent!
      );
    }
    if (filters?.maxPnlPercent !== undefined) {
      filteredPositions = filteredPositions.filter(
        p => p.unrealized_pnl_percentage !== null && p.unrealized_pnl_percentage <= filters.maxPnlPercent!
      );
    }

    return { positions: filteredPositions };
  } catch (error) {
    console.error('Error in getAllOpenPositions:', error);
    return {
      positions: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get position statistics
 */
export async function getPositionStatistics(): Promise<{
  totalPositions: number;
  totalExposure: number;
  totalUnrealizedPnl: number;
  positionsByExchange: Record<string, number>;
  positionsByStatus: Record<string, number>;
  error?: string;
}> {
  try {
    const { positions } = await getAllOpenPositions();

    const stats = {
      totalPositions: positions.length,
      totalExposure: positions.reduce((sum, p) => sum + (p.total_invested || 0), 0),
      totalUnrealizedPnl: positions.reduce((sum, p) => sum + (p.unrealized_pnl || 0), 0),
      positionsByExchange: {} as Record<string, number>,
      positionsByStatus: {} as Record<string, number>,
    };

    positions.forEach(p => {
      const exchange = p.platform || 'unknown';
      const status = p.status || 'unknown';
      
      stats.positionsByExchange[exchange] = (stats.positionsByExchange[exchange] || 0) + 1;
      stats.positionsByStatus[status] = (stats.positionsByStatus[status] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error in getPositionStatistics:', error);
    return {
      totalPositions: 0,
      totalExposure: 0,
      totalUnrealizedPnl: 0,
      positionsByExchange: {},
      positionsByStatus: {},
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

