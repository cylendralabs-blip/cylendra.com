
import { supabase } from '@/integrations/supabase/client';
import { BotSettingsForm } from '@/types/botSettings';

export const fetchBotSettings = async (userId: string): Promise<BotSettingsForm | null> => {
  try {
    console.log('Fetching bot settings for user:', userId);
    
    const { data: settingsData, error } = await supabase
      .from('bot_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching bot settings:', error);
      return null;
    }

    if (!settingsData) {
      console.log('No bot settings found for user');
      return null;
    }

    console.log('Bot settings fetched successfully');

    return {
      bot_name: settingsData.bot_name || 'SmartTraderBot',
      is_active: settingsData.is_active || false,
      default_platform: settingsData.default_platform || '',
      total_capital: Number(settingsData.total_capital) || 1000,
      risk_percentage: Number(settingsData.risk_percentage) || 2.0,
      max_active_trades: settingsData.max_active_trades || 5,
      market_type: (settingsData.market_type as 'spot' | 'futures') || 'spot',
      leverage: settingsData.leverage || 1,
      stop_loss_percentage: Number(settingsData.stop_loss_percentage) || 5.0,
      stop_loss_calculation_method: ((settingsData as any).stop_loss_calculation_method as 'initial_entry' | 'average_position') || 'initial_entry',
      take_profit_percentage: Number(settingsData.take_profit_percentage) || 3.0,
      profit_taking_strategy: (settingsData.profit_taking_strategy as 'fixed' | 'trailing' | 'partial' | 'custom') || 'fixed',
      initial_order_percentage: Number(settingsData.initial_order_percentage) || 25.0,
      dca_levels: settingsData.dca_levels || 5,
      strategy_type: (settingsData.strategy_type as 'basic_dca' | 'dca_with_leverage_new' | 'dca_with_leverage_modify') || 'basic_dca',
      leverage_strategy: (settingsData.leverage_strategy as 'none' | 'auto' | 'manual') || 'none',
      risk_reward_ratio: Number(settingsData.risk_reward_ratio) || 2.0,
      auto_leverage: settingsData.auto_leverage || false,
      max_leverage_increase: Number(settingsData.max_leverage_increase) || 3.0,
      order_type: (settingsData.order_type as 'market' | 'limit') || 'market',
      default_trade_direction: (settingsData.default_trade_direction as 'long' | 'short' | 'both') || 'long',
      allow_short_trades: settingsData.allow_short_trades !== false,
      allow_long_trades: settingsData.allow_long_trades !== false,
      // إعدادات جني الأرباح المتقدمة with safe property access
      partial_tp_level_1: Number((settingsData as any).partial_tp_level_1) || 2.0,
      partial_tp_level_2: Number((settingsData as any).partial_tp_level_2) || 4.0,
      partial_tp_level_3: Number((settingsData as any).partial_tp_level_3) || 6.0,
      partial_tp_level_4: Number((settingsData as any).partial_tp_level_4) || 10.0,
      partial_tp_percentage_1: Number((settingsData as any).partial_tp_percentage_1) || 25,
      partial_tp_percentage_2: Number((settingsData as any).partial_tp_percentage_2) || 25,
      partial_tp_percentage_3: Number((settingsData as any).partial_tp_percentage_3) || 25,
      partial_tp_percentage_4: Number((settingsData as any).partial_tp_percentage_4) || 25,
      trailing_stop_distance: Number((settingsData as any).trailing_stop_distance) || 2.0,
      trailing_stop_activation: Number((settingsData as any).trailing_stop_activation) || 3.0,
      capital_protection_enabled: (settingsData as any).capital_protection_enabled || false,
      capital_protection_profit: Number((settingsData as any).capital_protection_profit) || 5.0,
      auto_reentry_enabled: (settingsData as any).auto_reentry_enabled || false,
      dynamic_tp_enabled: (settingsData as any).dynamic_tp_enabled || false,
      min_profit_threshold: Number((settingsData as any).min_profit_threshold) || 1.0,
      
      // Phase X: Auto Trading from Signals
      auto_trading_enabled: (settingsData as any).auto_trading_enabled || false,
      auto_trading_mode: ((settingsData as any).auto_trading_mode as 'off' | 'full_auto' | 'semi_auto') || 'off',
      allowed_signal_sources: Array.isArray((settingsData as any).allowed_signal_sources)
        ? (settingsData as any).allowed_signal_sources
        : [],
      min_signal_confidence: (settingsData as any).min_signal_confidence ? Number((settingsData as any).min_signal_confidence) : null,
      allowed_directions: Array.isArray((settingsData as any).allowed_directions)
        ? (settingsData as any).allowed_directions
        : ['long', 'short'],
      max_auto_trades_per_day: (settingsData as any).max_auto_trades_per_day ? Number((settingsData as any).max_auto_trades_per_day) : null,
      max_concurrent_auto_positions: (settingsData as any).max_concurrent_auto_positions ? Number((settingsData as any).max_concurrent_auto_positions) : null,
      auto_trading_notes: (settingsData as any).auto_trading_notes || undefined,
    };
  } catch (error) {
    console.error('Error in fetchBotSettings:', error);
    return null;
  }
};

export const fetchTradingPerformance = async (userId: string) => {
  try {
    console.log('Fetching trading performance for user:', userId);
    
    const { data: performanceData, error } = await supabase
      .from('trading_performance')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .maybeSingle();

    if (error) {
      console.log('No performance data available yet');
      return null;
    }

    if (!performanceData) {
      console.log('No performance data found - will be created after first trades');
      return null;
    }

    console.log('Trading performance fetched successfully');
    return performanceData;
  } catch (error) {
    console.log('Trading performance will be available after completing trades');
    return null;
  }
};

export const fetchActiveTrades = async (userId: string) => {
  try {
    console.log('Fetching active trades for user:', userId);
    
    const { data: activeTrades, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching active trades:', error);
      return [];
    }

    console.log(`Found ${activeTrades?.length || 0} active trades`);
    return activeTrades || [];
  } catch (error) {
    console.error('Error in fetchActiveTrades:', error);
    return [];
  }
};
