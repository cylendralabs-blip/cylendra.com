/**
 * System Control Center Types
 * 
 * Phase X.14 - Unified AI System Dashboard + Control Center
 */

export interface SystemStatus {
  id: string;
  service_name: string;
  status: 'OK' | 'WARNING' | 'ERROR';
  last_run?: string;
  last_success?: string;
  error_message?: string;
  error_count: number;
  success_count: number;
  avg_response_time_ms?: number;
  metadata?: Record<string, any>;
  updated_at: string;
  created_at: string;
}

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description?: string;
  updated_by?: string;
  updated_at: string;
  created_at: string;
}

export interface SystemLog {
  id: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  source: string;
  message: string;
  metadata?: Record<string, any>;
  stack_trace?: string;
  user_id?: string;
  created_at: string;
}

export interface RecoveryEvent {
  id: string;
  service_name: string;
  action: 'restart' | 'cleanup' | 'reset' | 'reconnect' | 'rebuild_cache';
  status: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS';
  error_before?: string;
  logs?: Record<string, any>;
  recovery_time_ms?: number;
  triggered_by: 'auto' | 'manual';
  triggered_by_user?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface SystemHealthSummary {
  [serviceName: string]: {
    status: 'OK' | 'WARNING' | 'ERROR';
    last_run?: string;
    last_success?: string;
    error_message?: string;
    error_count: number;
    success_count: number;
    avg_response_time_ms?: number;
    updated_at: string;
  };
}

export interface SystemStatistics {
  total_logs: number;
  error_logs: number;
  warning_logs: number;
  critical_logs: number;
  recovery_events: number;
  successful_recoveries: number;
  failed_recoveries: number;
  services_ok: number;
  services_warning: number;
  services_error: number;
}

export interface AISafetyModeConfig {
  enabled: boolean;
  max_leverage: number;
  risk_threshold: number;
  disable_wave_signals: boolean;
  disable_high_risk_signals: boolean;
  enable_volume_filter: boolean;
  reduce_sensitivity: boolean;
}

