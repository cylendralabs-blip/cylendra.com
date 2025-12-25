/**
 * AI Assistant Types
 * 
 * Type definitions for AI Assistant service
 * 
 * Phase 11: AI Assistant Integration
 */

/**
 * AI Interaction Modes
 */
export type AIMode =
  | 'trade_explainer'
  | 'risk_advisor'
  | 'settings_optimizer'
  | 'backtest_summarizer'
  | 'user_support';

/**
 * AI Response
 */
export interface AIResponse {
  content: string;
  suggestions?: AISuggestion[];
  warnings?: string[];
  confidence?: number;
  metadata?: Record<string, any>;
}

/**
 * AI Suggestion
 */
export interface AISuggestion {
  type: 'setting_change' | 'action' | 'warning' | 'info';
  title: string;
  description: string;
  data?: Record<string, any>;
  requiresConfirmation?: boolean;
}

/**
 * AI Context
 */
export interface AIContext {
  userId: string;
  mode: AIMode;
  botSettings?: Record<string, any>;
  signal?: {
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    reason?: string;
    indicators?: Record<string, any>;
  };
  position?: {
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    entryPrice: number;
    currentPrice: number;
    unrealizedPnl: number;
    dcaLevels: number;
  };
  portfolio?: {
    totalEquity: number;
    totalExposure: number;
    exposurePercentage: number;
    dailyPnl: number;
    unrealizedPnl: number;
  };
  riskMetrics?: {
    dailyLoss: number;
    dailyLossLimit: number;
    maxDrawdown: number;
    currentDrawdown: number;
    exposurePercentage: number;
  };
  backtestResult?: {
    totalReturn: number;
    winRate: number;
    profitFactor: number;
    maxDrawdown: number;
    sharpeRatio: number;
    totalTrades: number;
    config?: Record<string, any>;
  };
  recentTrades?: Array<{
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    status: string;
    openedAt: string;
    closedAt?: string;
  }>;
  marketConditions?: {
    symbol: string;
    currentPrice: number;
    change24h: number;
    volume24h: number;
  };
  recentAlerts?: Array<{
    level: string;
    message: string;
    timestamp: string;
  }>;
  strategyLogs?: Array<{
    id: string;
    category: string;
    action: string;
    message: string;
    context?: Record<string, any>;
    created_at: string;
  }>;
}

/**
 * AI Client Configuration
 */
export interface AIClientConfig {
  provider: 'openai' | 'anthropic' | 'local';
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  enableStreaming?: boolean;
}

/**
 * AI Request
 */
export interface AIRequest {
  prompt: string;
  context: AIContext;
  mode: AIMode;
  userId: string;
  stream?: boolean;
}

/**
 * AI Streaming Response
 */
export interface AIStreamResponse {
  chunk: string;
  done: boolean;
  error?: string;
}

