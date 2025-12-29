/**
 * Context Builder
 * 
 * Builds AI context from real data (bot settings, signals, positions, portfolio, etc.)
 * Single source of truth for AI context
 * 
 * Phase 11: AI Assistant Integration - Task 2
 */

import { AIContext, AIMode } from './types';
import { supabase } from '@/integrations/supabase/client';
import { BotSettingsForm } from '@/core/config';

/**
 * Build AI Context
 */
export async function buildAIContext(
  userId: string,
  mode: AIMode,
  options?: {
    signalId?: string;
    positionId?: string;
    backtestId?: string;
    tradeId?: string;
  }
): Promise<AIContext> {
  const context: AIContext = {
    userId,
    mode,
  };

  try {
    // Always include bot settings
    context.botSettings = await fetchBotSettings(userId);

    // Fetch mode-specific data
    switch (mode) {
      case 'trade_explainer':
        if (options?.signalId || options?.tradeId) {
          context.signal = await fetchSignalContext(userId, options.signalId, options.tradeId);
          context.position = await fetchPositionContext(userId, options.tradeId);
          // Add live trading context (recent trades, market conditions)
          context.recentTrades = await fetchRecentTrades(userId, 5);
          context.marketConditions = await fetchMarketConditions(context.signal?.symbol);
          // Add strategy logs for this trade/signal
          context.strategyLogs = await fetchStrategyLogs(userId, options.signalId, options.tradeId);
        }
        break;

      case 'risk_advisor':
        context.portfolio = await fetchPortfolioContext(userId);
        context.riskMetrics = await fetchRiskMetrics(userId);
        context.recentAlerts = await fetchRecentAlerts(userId, 5);
        break;

      case 'settings_optimizer':
        context.portfolio = await fetchPortfolioContext(userId);
        context.riskMetrics = await fetchRiskMetrics(userId);
        // Could add performance history here
        break;

      case 'backtest_summarizer':
        if (options?.backtestId) {
          context.backtestResult = await fetchBacktestResult(userId, options.backtestId);
          // Add comparison with live trading performance
          context.portfolio = await fetchPortfolioContext(userId);
          context.recentTrades = await fetchRecentTrades(userId, 10);
        }
        break;

      case 'user_support':
        // Minimal context for support mode
        break;
    }

    // Always include portfolio snapshot if available
    if (!context.portfolio) {
      context.portfolio = await fetchPortfolioContext(userId);
    }

  } catch (error) {
    console.error('Error building AI context:', error);
    // Return context with what we have
  }

  return context;
}

/**
 * Fetch Bot Settings
 */
async function fetchBotSettings(userId: string): Promise<Partial<BotSettingsForm> | undefined> {
  try {
    const { data, error } = await supabase
      .from('bot_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Handle error gracefully - settings might not exist yet
    if (error && error.code !== 'PGRST116') {
      console.warn('Error fetching bot settings context:', error);
      return undefined;
    }

    if (!data) return undefined;

    // Type assertion to handle fields that may not be in Supabase types
    const settingsData = data as any;

    // Return only relevant fields (no sensitive data)
    return {
      risk_percentage: settingsData.risk_percentage,
      leverage: settingsData.leverage,
      max_active_trades: settingsData.max_active_trades,
      dca_levels: settingsData.dca_levels,
      take_profit_percentage: settingsData.take_profit_percentage,
      stop_loss_percentage: settingsData.stop_loss_percentage,
      max_daily_loss_pct: settingsData.max_daily_loss_pct,
      max_drawdown_pct: settingsData.max_drawdown_pct,
      max_exposure_pct_total: settingsData.max_exposure_pct_total,
    };
  } catch (error) {
    console.error('Error fetching bot settings:', error);
    return undefined;
  }
}

/**
 * Fetch Signal Context
 */
async function fetchSignalContext(
  userId: string,
  signalId?: string,
  tradeId?: string
): Promise<AIContext['signal']> {
  try {
    let query = supabase
      .from('trading_signals' as any)
      .select('id, symbol, side, meta, created_at')
      .eq('user_id', userId);

    if (signalId) {
      query = query.eq('id', signalId);
    } else if (tradeId) {
      // Get signal from trade
      const { data: trade } = await supabase
        .from('trades')
        .select('signal_id')
        .eq('id', tradeId)
        .eq('user_id', userId)
        .single();

      const tradeData = trade as { signal_id?: string } | null;
      
      if (tradeData?.signal_id) {
        query = query.eq('id', tradeData.signal_id);
      }
    } else {
      // Get latest signal
      query = query.order('created_at', { ascending: false }).limit(1);
    }

    const { data, error } = await query.single();

    if (error || !data) return undefined;

    // Type assertion to handle fields from trading_signals table
    const signalData = (data as unknown) as {
      id: string;
      symbol: string;
      side: string;
      meta?: {
        reason?: string;
        explanation?: string;
        indicators?: any;
        indicatorsSnapshot?: any;
      };
    };

    return {
      id: signalData.id,
      symbol: signalData.symbol,
      side: signalData.side as 'buy' | 'sell',
      reason: signalData.meta?.reason || signalData.meta?.explanation,
      indicators: signalData.meta?.indicators || signalData.meta?.indicatorsSnapshot,
    };
  } catch (error) {
    console.error('Error fetching signal context:', error);
    return undefined;
  }
}

/**
 * Fetch Position Context
 */
async function fetchPositionContext(
  userId: string,
  tradeId?: string
): Promise<AIContext['position']> {
  try {
    let query = supabase
      .from('trades')
      .select('id, symbol, side, entry_price, current_price, unrealized_pnl, dca_levels_completed')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE');

    if (tradeId) {
      query = query.eq('id', tradeId);
    } else {
      query = query.order('opened_at', { ascending: false }).limit(1);
    }

    const { data, error } = await query.single();

    if (error || !data) return undefined;

    // Type assertion to handle fields from trades table
    const tradeData = (data as unknown) as {
      id: string;
      symbol: string;
      side: string;
      entry_price?: string | number;
      current_price?: string | number;
      unrealized_pnl?: string | number;
      dca_levels_completed?: number;
    };

    return {
      id: tradeData.id,
      symbol: tradeData.symbol,
      side: tradeData.side as 'buy' | 'sell',
      entryPrice: parseFloat(String(tradeData.entry_price || '0')),
      currentPrice: parseFloat(String(tradeData.current_price || tradeData.entry_price || '0')),
      unrealizedPnl: parseFloat(String(tradeData.unrealized_pnl || '0')),
      dcaLevels: tradeData.dca_levels_completed || 0,
    };
  } catch (error) {
    console.error('Error fetching position context:', error);
    return undefined;
  }
}

/**
 * Fetch Portfolio Context
 */
async function fetchPortfolioContext(userId: string): Promise<AIContext['portfolio']> {
  try {
    const { data, error } = await supabase
      .from('users_portfolio_state' as any)
      .select('total_equity, unrealized_pnl, realized_pnl')
      .eq('user_id', userId)
      .order('last_sync_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Handle error gracefully - portfolio might not exist yet
    if (error && error.code !== 'PGRST116') {
      console.warn('Error fetching portfolio context:', error);
      return undefined;
    }

    if (!data) return undefined;

    // Type assertion to handle fields from users_portfolio_state table
    const portfolioData = (data as unknown) as {
      total_equity?: string | number;
      unrealized_pnl?: string | number;
      realized_pnl?: string | number;
    };

    // Calculate exposure from active trades
    const { data: activeTrades } = await supabase
      .from('trades')
      .select('total_invested')
      .eq('user_id', userId)
      .in('status', ['ACTIVE', 'PENDING']);

    const totalExposure = activeTrades?.reduce(
      (sum, t) => sum + parseFloat((t as any).total_invested || '0'),
      0
    ) || 0;

    const totalEquity = parseFloat(String(portfolioData.total_equity || '0'));
    const exposurePercentage = totalEquity > 0 ? (totalExposure / totalEquity) * 100 : 0;

    // Calculate daily PnL
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: dailyTrades } = await supabase
      .from('trades')
      .select('realized_pnl')
      .eq('user_id', userId)
      .eq('status', 'CLOSED')
      .gte('closed_at', today.toISOString());

    const dailyPnl = dailyTrades?.reduce(
      (sum, t) => sum + parseFloat((t as any).realized_pnl || '0'),
      0
    ) || 0;

    return {
      totalEquity,
      totalExposure,
      exposurePercentage,
      dailyPnl,
      unrealizedPnl: parseFloat(String(portfolioData.unrealized_pnl || '0')),
    };
  } catch (error) {
    console.error('Error fetching portfolio context:', error);
    return undefined;
  }
}

/**
 * Fetch Risk Metrics
 */
async function fetchRiskMetrics(userId: string): Promise<AIContext['riskMetrics']> {
  try {
    // Get daily loss from risk snapshots or calculate
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: dailyTrades } = await supabase
      .from('trades')
      .select('realized_pnl')
      .eq('user_id', userId)
      .eq('status', 'CLOSED')
      .gte('closed_at', today.toISOString());

    const dailyLoss = Math.abs(
      dailyTrades?.reduce((sum, t) => {
        const pnl = parseFloat(String((t as any).realized_pnl || '0'));
        return sum + (pnl < 0 ? pnl : 0);
      }, 0) || 0
    );

    // Get settings for limits
    // Try to fetch specific columns, but fallback to all columns if they don't exist
    let settings: any = null;
    const { data: settingsData, error: settingsError } = await supabase
      .from('bot_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Handle error gracefully - settings might not exist yet
    if (settingsError && settingsError.code !== 'PGRST116') {
      console.warn('Error fetching bot settings for risk metrics:', settingsError);
    } else if (settingsData) {
      settings = {
        max_daily_loss_usd: (settingsData as any).max_daily_loss_usd,
        max_daily_loss_pct: (settingsData as any).max_daily_loss_pct,
        max_drawdown_pct: (settingsData as any).max_drawdown_pct,
      };
    }

    const { data: portfolio, error: portfolioError } = await supabase
      .from('users_portfolio_state' as any)
      .select('total_equity')
      .eq('user_id', userId)
      .order('last_sync_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Handle error gracefully - portfolio might not exist yet
    if (portfolioError && portfolioError.code !== 'PGRST116') {
      console.warn('Error fetching portfolio state for risk metrics:', portfolioError);
    }

    const portfolioData = portfolio as { total_equity?: string | number } | null;
    const totalEquity = parseFloat(String(portfolioData?.total_equity || '0'));
    const dailyLossLimit = settings?.max_daily_loss_usd || 
      (settings?.max_daily_loss_pct ? (totalEquity * settings.max_daily_loss_pct / 100) : 1000);

    return {
      dailyLoss,
      dailyLossLimit,
      maxDrawdown: settings?.max_drawdown_pct || 20,
      currentDrawdown: 0, // TODO: Calculate from performance history
      exposurePercentage: 0, // Will be filled from portfolio context
    };
  } catch (error) {
    console.error('Error fetching risk metrics:', error);
    return undefined;
  }
}

/**
 * Fetch Recent Alerts
 */
async function fetchRecentAlerts(userId: string, limit: number = 5) {
  try {
    const { data, error } = await supabase
      .from('alerts' as any)
      .select('level, title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    // Type assertion to handle fields from alerts table
    const alertsData = (data as unknown) as Array<{
      level: string;
      title: string;
      created_at: string;
    }>;

    return alertsData.map(alert => ({
      level: alert.level,
      message: alert.title,
      timestamp: alert.created_at,
    }));
  } catch (error) {
    console.error('Error fetching recent alerts:', error);
    return [];
  }
}

/**
 * Fetch Backtest Result
 */
async function fetchBacktestResult(
  userId: string,
  backtestId: string
): Promise<AIContext['backtestResult']> {
  try {
    // Try backtests table first (new structure)
    let { data, error } = await supabase
      .from('backtests' as any)
      .select('*, backtest_metrics(*)')
      .eq('id', backtestId)
      .eq('user_id', userId)
      .single();

    // If not found, try backtest_results table (old structure)
    if (error || !data) {
      const { data: oldData, error: oldError } = await supabase
        .from('backtest_results' as any)
        .select('*')
        .eq('id', backtestId)
        .eq('user_id', userId)
        .single();

      if (oldError || !oldData) return undefined;
      data = oldData;
    }

    // Extract metrics from either structure
    const metrics = (data as any).backtest_metrics?.[0] || data;
    
    return {
      totalReturn: parseFloat(metrics.total_return || metrics.total_return_pct || '0'),
      winRate: parseFloat(metrics.win_rate || '0'),
      profitFactor: parseFloat(metrics.profit_factor || '0'),
      maxDrawdown: parseFloat(metrics.max_drawdown || metrics.max_drawdown_pct || '0'),
      sharpeRatio: parseFloat(metrics.sharpe_ratio || '0'),
      totalTrades: metrics.total_trades || 0,
      config: (data as any).config || undefined,
    };
  } catch (error) {
    console.error('Error fetching backtest result:', error);
    return undefined;
  }
}

/**
 * Fetch Recent Trades
 */
async function fetchRecentTrades(
  userId: string,
  limit: number = 5
): Promise<AIContext['recentTrades']> {
  try {
    const { data, error } = await supabase
      .from('trades')
      .select('id, symbol, side, entry_price, exit_price, realized_pnl, status, opened_at, closed_at')
      .eq('user_id', userId)
      .order('opened_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    // Type assertion to handle fields from trades table
    const tradesData = (data as unknown) as Array<{
      id: string;
      symbol: string;
      side: string;
      entry_price?: string | number;
      exit_price?: string | number;
      realized_pnl?: string | number;
      status: string;
      opened_at: string;
      closed_at?: string | null;
    }>;

    return tradesData.map(trade => ({
      id: trade.id,
      symbol: trade.symbol,
      side: trade.side as 'buy' | 'sell',
      entryPrice: parseFloat(String(trade.entry_price || '0')),
      exitPrice: parseFloat(String(trade.exit_price || trade.entry_price || '0')),
      pnl: parseFloat(String(trade.realized_pnl || '0')),
      status: trade.status,
      openedAt: trade.opened_at,
      closedAt: trade.closed_at || null,
    }));
  } catch (error) {
    console.error('Error fetching recent trades:', error);
    return [];
  }
}

/**
 * Fetch Market Conditions
 */
async function fetchMarketConditions(symbol?: string): Promise<AIContext['marketConditions']> {
  if (!symbol) return undefined;

  try {
    // Fetch current price and 24h change
    const { data, error } = await supabase.functions.invoke('get-live-prices', {
      body: { symbols: [symbol] }
    });

    if (error || !data?.prices?.[symbol]) return undefined;

    const priceData = data.prices[symbol];

    return {
      symbol,
      currentPrice: parseFloat(priceData.price || '0'),
      change24h: parseFloat(priceData.change24h || '0'),
      volume24h: parseFloat(priceData.volume24h || '0'),
    };
  } catch (error) {
    console.error('Error fetching market conditions:', error);
    return undefined;
  }
}

/**
 * Fetch Strategy Logs
 */
async function fetchStrategyLogs(
  userId: string,
  signalId?: string,
  tradeId?: string
): Promise<AIContext['strategyLogs']> {
  try {
    let query = supabase
      .from('logs' as any)
      .select('id, category, action, message, context, created_at')
      .eq('user_id', userId)
      .in('category', ['signal', 'decision', 'strategy', 'order']);

    // Filter by signal or trade if provided
    if (signalId) {
      query = query.eq('signal_id', signalId);
    } else if (tradeId) {
      query = query.eq('trade_id', tradeId);
    }

    const { data, error } = await (query
      .order('created_at', { ascending: false })
      .limit(20) as any) as { data: any[] | null; error: any };

    if (error || !data) return [];

    return data.map(log => ({
      id: log.id,
      category: log.category,
      action: log.action,
      message: log.message,
      context: log.context,
      created_at: log.created_at,
    }));
  } catch (error) {
    console.error('Error fetching strategy logs:', error);
    return [];
  }
}

