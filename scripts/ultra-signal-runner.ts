#!/usr/bin/env node
import 'dotenv/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { UltraSignalAnalyzer, generateUltraSignal, handleUltraSignal } from '@/ai-signals';
import type { Candle } from '@/services/marketData/types';
import type { RawSignalSource, UltraSignal } from '@/ai-signals';
import type { StoredAISettings, UserAISettings } from '@/types/ai-settings';
import { buildEffectiveSettings } from '@/core/ai-settings/settingsManager';

interface RunnerConfig {
  symbols: string[];
  timeframes: string[];
  exchange: 'binance' | 'okx';
  candleLimit: number;
  minCandles: number;
  intervalMs: number;
}

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GET_CANDLES_URL =
  process.env.ULTRA_SIGNAL_CANDLES_URL ||
  (SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/get-candles` : undefined);

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !GET_CANDLES_URL) {
  console.error(
    'Missing Supabase configuration. Ensure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and ULTRA_SIGNAL_CANDLES_URL (or SUPABASE_URL) are set.'
  );
  process.exit(1);
}

const runnerConfig: RunnerConfig = {
  symbols: (process.env.ULTRA_SIGNAL_SYMBOLS || 'BTC/USDT,ETH/USDT')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  timeframes: (process.env.ULTRA_SIGNAL_TIMEFRAMES || '15m,1h,4h')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  exchange: (process.env.ULTRA_SIGNAL_EXCHANGE as 'binance' | 'okx') || 'binance',
  candleLimit: Number(process.env.ULTRA_SIGNAL_CANDLE_LIMIT || 150),
  minCandles: Number(process.env.ULTRA_SIGNAL_MIN_CANDLES || 120),
  intervalMs: Number(process.env.ULTRA_SIGNAL_INTERVAL_MS || 5 * 60 * 1000)
};

const SETTINGS_USER_ID = process.env.ULTRA_SIGNAL_SETTINGS_USER_ID || null;

const supabaseServer = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false
  }
});

const userSettingsCache = new Map<string, StoredAISettings | null>();

const analyzer = new UltraSignalAnalyzer({
  min_candles: runnerConfig.minCandles
});

async function fetchStoredUserSettings(userId: string): Promise<StoredAISettings | null> {
  if (userSettingsCache.has(userId)) {
    return userSettingsCache.get(userId)!;
  }

  const { data, error } = await supabaseServer
    .from('ai_signal_user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.warn('Failed to load AI settings for user', userId, error.message);
    userSettingsCache.set(userId, null);
    return null;
  }

  const stored = (data as StoredAISettings) ?? null;
  userSettingsCache.set(userId, stored);
  return stored;
}

async function fetchCandles(symbol: string, timeframe: string): Promise<Candle[]> {
  const response = await fetch(GET_CANDLES_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      exchange: runnerConfig.exchange,
      symbol,
      timeframe,
      limit: runnerConfig.candleLimit
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch candles: ${response.status}`);
  }

  const result = await response.json();
  return (result.candles || []) as Candle[];
}

async function fetchActiveSymbols(client: SupabaseClient): Promise<string[]> {
  const { data: botSettings } = await client
    .from('bot_settings')
    .select('user_id')
    .eq('is_active', true);

  if (!botSettings || botSettings.length === 0) {
    return runnerConfig.symbols;
  }

  const userIds = botSettings.map((setting) => setting.user_id);
  const { data: watchlist } = await client
    .from('price_watchlist')
    .select('symbol')
    .in('user_id', userIds);

  if (!watchlist || watchlist.length === 0) {
    return runnerConfig.symbols;
  }

  const symbols = Array.from(new Set(watchlist.map((item) => item.symbol)));
  return symbols.length > 0 ? symbols : runnerConfig.symbols;
}

function mapLegacySignal(row: any): RawSignalSource | null {
  if (!row || !row.signal_type) return null;

  const normalizedSide =
    row.signal_type.includes('BUY') ? 'BUY' : row.signal_type.includes('SELL') ? 'SELL' : null;

  if (!normalizedSide) {
    return null;
  }

  return {
    source: 'LEGACY_ENGINE',
    symbol: row.symbol,
    timeframe: row.timeframe,
    side: normalizedSide,
    confidence: row.confidence_score ?? undefined,
    entry: row.entry_price ?? undefined,
    stopLoss: row.stop_loss_price ?? undefined,
    takeProfit: row.take_profit_price ?? undefined,
    rrRatio: row.risk_reward_ratio ?? undefined,
    generatedAt: row.created_at
  };
}

function mapTradingViewSignal(row: any): RawSignalSource | null {
  if (!row || !row.signal_type) return null;
  const normalizedSide =
    row.signal_type.includes('BUY') ? 'BUY' : row.signal_type.includes('SELL') ? 'SELL' : null;

  if (!normalizedSide) {
    return null;
  }

  return {
    source: 'TV_WEBHOOK',
    symbol: row.symbol,
    timeframe: row.timeframe,
    side: normalizedSide,
    confidence: row.confidence_score ?? undefined,
    entry: row.entry_price ?? undefined,
    stopLoss: row.stop_loss_price ?? undefined,
    takeProfit: row.take_profit_price ?? undefined,
    rrRatio: row.risk_reward_ratio ?? undefined,
    generatedAt: row.created_at
  };
}

async function fetchLegacySource(
  client: SupabaseClient,
  symbol: string,
  timeframe: string
): Promise<RawSignalSource | null> {
  const { data } = await client
    .from('trading_signals')
    .select('symbol,timeframe,signal_type,confidence_score,entry_price,stop_loss_price,take_profit_price,risk_reward_ratio,created_at')
    .eq('symbol', symbol)
    .eq('timeframe', timeframe)
    .order('created_at', { ascending: false })
    .limit(1);

  return data && data[0] ? mapLegacySignal(data[0]) : null;
}

async function fetchTradingViewSources(
  client: SupabaseClient,
  symbol: string,
  timeframe: string
): Promise<RawSignalSource[]> {
  const { data } = await client
    .from('tradingview_signals')
    .select('symbol,timeframe,signal_type,confidence_score,entry_price,stop_loss_price,take_profit_price,risk_reward_ratio,created_at')
    .eq('symbol', symbol)
    .eq('timeframe', timeframe)
    .order('created_at', { ascending: false })
    .limit(3);

  if (!data) return [];
  return data.map(mapTradingViewSignal).filter((item): item is RawSignalSource => !!item);
}

async function processSymbol(symbol: string, timeframe: string, settings?: UserAISettings) {
  try {
    const candles = await fetchCandles(symbol, timeframe);

    if (candles.length < runnerConfig.minCandles) {
      console.warn(
        `Skipping ${symbol} ${timeframe}: insufficient candles (${candles.length}/${runnerConfig.minCandles})`
      );
      return;
    }

    const analysis = await analyzer.analyzeMarket({
      symbol,
      timeframe: timeframe as any,
      candles,
      settings
    });

    const [legacySource, tradingViewSources] = await Promise.all([
      fetchLegacySource(supabaseServer, symbol, timeframe),
      fetchTradingViewSources(supabaseServer, symbol, timeframe)
    ]);

    const sources: RawSignalSource[] = [];
    if (legacySource) sources.push(legacySource);
    if (tradingViewSources.length > 0) sources.push(...tradingViewSources);

    if (analysis.bias === 'WAIT' && sources.length === 0) {
      console.log(`No actionable bias for ${symbol} ${timeframe}, skipping fusion.`);
      return;
    }

    const ultraSignal = generateUltraSignal({
      symbol,
      timeframe,
      analysisResult: analysis,
      legacySignals: legacySource ? [legacySource] : undefined,
      tradingViewSignals: tradingViewSources,
      marketPrice: candles[candles.length - 1]?.close,
      settings
    });

    await dispatchUltraSignal(ultraSignal);
  } catch (error) {
    console.error(`Error processing ${symbol} ${timeframe}:`, error);
  }
}

async function dispatchUltraSignal(signal: UltraSignal) {
  const telegramConfig = {
    enabled:
      (process.env.TELEGRAM_ENABLED || process.env.VITE_TELEGRAM_ENABLED || 'false') === 'true',
  botToken:
      process.env.TELEGRAM_BOT_TOKEN ||
      process.env.VITE_TELEGRAM_BOT_TOKEN ||
      '',
    chatId:
      process.env.TELEGRAM_CHAT_ID ||
      process.env.VITE_TELEGRAM_CHAT_ID ||
      ''
  };

  await handleUltraSignal(signal, {
    supabaseClient: supabaseServer,
    telegram: telegramConfig
  });
}

async function runCycle() {
  const symbols = await fetchActiveSymbols(supabaseServer);
  console.log(
    `Running Ultra Signal cycle for symbols: ${symbols.join(', ')} across ${runnerConfig.timeframes.join(', ')}`
  );

  const storedSettings = SETTINGS_USER_ID ? await fetchStoredUserSettings(SETTINGS_USER_ID) : null;

  for (const timeframe of runnerConfig.timeframes) {
    const effectiveSettings = storedSettings
      ? buildEffectiveSettings(storedSettings, timeframe as any)
      : undefined;
    for (const symbol of symbols) {
      await processSymbol(symbol, timeframe, effectiveSettings);
    }
  }
}

async function main() {
  const watchMode = process.argv.includes('--watch');

  await runCycle();

  if (watchMode) {
    console.log(`Entering watch mode (interval ${runnerConfig.intervalMs}ms)...`);
    setInterval(() => {
      runCycle().catch((error) => console.error('Cycle error:', error));
    }, runnerConfig.intervalMs);
  } else {
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Ultra signal runner crashed:', error);
  process.exit(1);
});

