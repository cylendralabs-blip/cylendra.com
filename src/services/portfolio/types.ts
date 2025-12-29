/**
 * Portfolio Types
 * 
 * Shared types for portfolio services
 * 
 * Phase 7: Portfolio & Wallet Integration
 */

/**
 * Portfolio Sync Result
 */
export interface PortfolioSyncResult {
  success: boolean;
  userId: string;
  apiKeyId: string;
  platform: string;
  totalEquity?: number;
  spotEquity?: number;
  futuresEquity?: number;
  unrealizedPnl?: number;
  realizedPnl?: number;
  openPositionsCount?: number;
  errors: string[];
  warnings: string[];
}

