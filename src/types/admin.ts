
export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  username?: string;
  created_at: string;
  last_sign_in_at: string;
  roles: string[];
  is_active: boolean;
  total_trades: number;
  closed_trades?: number;
  active_trades?: number;
  winning_trades?: number;
  win_rate?: number;
  total_strategies: number;
  active_strategies?: number;
  strategy_types?: string[];
  account_balance: number;
  total_profit?: number;
  total_invested?: number;
  connected_platforms?: string[];
  portfolio_balances?: PortfolioBalance[];
  total_portfolio_value?: number;
  bot_settings?: BotSettings;
  bot_active?: boolean;
  risk_level?: number;
  total_capital?: number;
  api_keys?: ApiKeyInfo[];
  api_keys_count?: number;
  testnet_keys?: number;
  mainnet_keys?: number;
  recent_trades?: Trade[];
  recent_strategies?: Strategy[];
  recent_dca_orders?: DCAOrder[];
  recent_notifications?: Notification[];
  recent_security_logs?: SecurityLog[];
  login_count?: number;
}

export interface PortfolioBalance {
  symbol: string;
  total_balance: number;
  usd_value?: number;
  platform?: string;
}

export interface ApiKeyInfo {
  platform: string;
  is_active: boolean;
  testnet: boolean;
  created_at: string;
}

export interface BotSettings {
  is_active: boolean;
  total_capital: number;
  risk_percentage: number;
  default_platform?: string;
  leverage?: number;
  stop_loss_percentage?: number;
  take_profit_percentage?: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: string;
  status: string;
  entry_price: number;
  current_price?: number;
  quantity: number;
  realized_pnl?: number;
  unrealized_pnl?: number;
  platform?: string;
  created_at: string;
  closed_at?: string;
}

export interface Strategy {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  description?: string;
  created_at: string;
}

export interface DCAOrder {
  id: string;
  trade_id: string;
  dca_level: number;
  target_price: number;
  quantity: number;
  status: string;
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface SecurityLog {
  id: string;
  action: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  created_at: string;
}

export interface SystemStats {
  id: string;
  date: string;
  total_users: number;
  active_users: number;
  new_signups: number;
  total_trades: number;
  total_strategies: number;
  total_signals: number;
  system_health: Record<string, any>;
  created_at: string;
}

export interface AdminActivity {
  id: string;
  admin_user_id: string;
  action_type: string;
  target_user_id: string | null;
  action_details: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
  updated_at: string;
  created_by: string | null;
}
