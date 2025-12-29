/**
 * Orbitra AI - Strategy System Types (Phase 1)
 * 
 * Two-level strategy system:
 * 1. Strategy Template (System-level, fixed)
 * 2. Strategy Instance (User-level, configurable with versioning)
 */

// ============================================================================
// STRATEGY TEMPLATE (System-level)
// ============================================================================

export interface StrategyTemplate {
  id: string;
  key: string;                    // Unique key: "grid_classic", "dca_basic", etc.
  name: string;                   // Display name
  category: StrategyCategory;
  description: string;
  icon: string;                   // Icon name for UI
  risk_level: RiskLevel;
  
  // Schema defines configuration fields
  schema: StrategySchema;
  
  // Default configuration
  default_config: Record<string, any>;
  
  // Feature flags
  supports_spot: boolean;
  supports_futures: boolean;
  supports_leverage: boolean;
  
  // Status
  is_active: boolean;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export type StrategyCategory = 'DCA' | 'GRID' | 'MOMENTUM' | 'ARBITRAGE' | 'SCALPING';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface StrategySchema {
  fields: StrategyField[];
}

export interface StrategyField {
  key: string;
  type: 'number' | 'string' | 'boolean' | 'array' | 'select';
  label: string;
  description?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  default?: any;
}

// ============================================================================
// STRATEGY INSTANCE (User-level with Versioning)
// ============================================================================

export interface StrategyInstance {
  id: string;
  
  // Ownership
  user_id: string;
  
  // Template reference
  template_id: string;
  template?: StrategyTemplate;  // Populated via join
  
  // Instance details
  name: string;
  description?: string;
  
  // Versioning
  version: number;
  parent_id: string | null;
  parent?: StrategyInstance;    // Populated via join
  
  // Configuration (specific to this instance)
  config: Record<string, any>;
  
  // Status
  status: StrategyInstanceStatus;
  
  // Usage tracking
  is_in_use: boolean;           // Is assigned to any bot?
  last_used_at: string | null;
  
  // Performance tracking (optional)
  performance_data?: StrategyPerformanceData;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export type StrategyInstanceStatus = 'active' | 'archived' | 'draft';

export interface StrategyPerformanceData {
  total_trades?: number;
  winning_trades?: number;
  losing_trades?: number;
  win_rate?: number;
  total_profit?: number;
  total_loss?: number;
  net_profit?: number;
  max_drawdown?: number;
  profit_factor?: number;
  sharpe_ratio?: number;
}

// ============================================================================
// STRATEGY INSTANCE WITH VERSION HISTORY
// ============================================================================

export interface StrategyInstanceWithHistory extends StrategyInstance {
  versions: StrategyInstance[];  // All versions of this strategy
  latest_version: number;
  is_latest: boolean;
}

// ============================================================================
// CREATE/UPDATE DTOs
// ============================================================================

export interface CreateStrategyInstanceDto {
  template_id: string;
  name: string;
  description?: string;
  config: Record<string, any>;
  status?: StrategyInstanceStatus;
}

export interface UpdateStrategyInstanceDto {
  name?: string;
  description?: string;
  config?: Record<string, any>;
  status?: StrategyInstanceStatus;
}

// ============================================================================
// VERSIONING TYPES
// ============================================================================

export interface StrategyVersionInfo {
  version: number;
  created_at: string;
  changes_summary?: string;
  is_current: boolean;
  is_in_use: boolean;
}

// ============================================================================
// BOT SETTINGS INTEGRATION
// ============================================================================

export interface BotStrategyAssignment {
  bot_id: string;
  strategy_instance_id: string;
  strategy_instance?: StrategyInstance;
  assigned_at: string;
}

