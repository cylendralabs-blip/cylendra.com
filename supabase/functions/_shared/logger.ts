/**
 * Shared Logger for Supabase Edge Functions
 * 
 * Unified logging system for all Edge Functions with database persistence
 * 
 * Phase 8: Logging + Monitoring + Alerting System - Task 3
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Log Levels (aligned with database schema)
 */
export type LogLevel = 'info' | 'warn' | 'error' | 'critical';

/**
 * Log Categories (aligned with database schema)
 */
export type LogCategory = 
  | 'signal'
  | 'decision'
  | 'order'
  | 'risk'
  | 'position'
  | 'portfolio'
  | 'system'
  | 'ui';

/**
 * Log Entry for Database
 */
export interface DatabaseLogEntry {
  user_id?: string;
  level: LogLevel;
  category: LogCategory;
  action: string;
  message: string;
  context?: any;
  trade_id?: string;
  position_id?: string;
  signal_id?: string;
  exchange?: string;
  market_type?: 'spot' | 'futures';
  symbol?: string;
  source?: string;
  created_at?: string;
}

/**
 * Logger Class for Edge Functions
 */
export class Logger {
  private functionName: string;
  private supabaseClient: ReturnType<typeof createClient> | null;
  private userId: string | null;
  
  constructor(functionName: string, supabaseClient?: ReturnType<typeof createClient>, userId?: string) {
    this.functionName = functionName;
    this.supabaseClient = supabaseClient || null;
    this.userId = userId || null;
  }
  
  /**
   * Log Info message
   */
  info(category: LogCategory, action: string, message: string, context?: any) {
    this.log('info', category, action, message, context);
  }
  
  /**
   * Log Warning message
   */
  warn(category: LogCategory, action: string, message: string, context?: any) {
    this.log('warn', category, action, message, context);
  }
  
  /**
   * Log Error message
   */
  error(category: LogCategory, action: string, message: string, context?: any, error?: Error) {
    const errorContext = {
      ...context,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    };
    this.log('error', category, action, message, errorContext);
  }
  
  /**
   * Log Critical message
   */
  critical(category: LogCategory, action: string, message: string, context?: any, error?: Error) {
    const errorContext = {
      ...context,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    };
    this.log('critical', category, action, message, errorContext);
  }
  
  /**
   * Internal log method
   */
  private async log(
    level: LogLevel,
    category: LogCategory,
    action: string,
    message: string,
    context?: any
  ) {
    const timestamp = new Date().toISOString();
    
    // Format console log
    const logMessage = `[${level.toUpperCase()}] [${this.functionName}] [${category}] ${action}: ${message}`;
    
    // Output to console based on level
    switch (level) {
      case 'info':
        console.log(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'error':
      case 'critical':
        console.error(logMessage);
        if (context?.error) {
          console.error('Error details:', context.error);
        }
        break;
    }
    
    // Store in database if supabase client is available
    if (this.supabaseClient) {
      try {
        const logEntry: DatabaseLogEntry = {
          user_id: this.userId || undefined,
          level,
          category,
          action,
          message,
          context: context || {},
          source: this.functionName.toUpperCase(),
          created_at: timestamp
        };
        
        // Extract context fields if present
        if (context) {
          if (context.tradeId) logEntry.trade_id = context.tradeId;
          if (context.positionId) logEntry.position_id = context.positionId;
          if (context.signalId) logEntry.signal_id = context.signalId;
          if (context.exchange) logEntry.exchange = context.exchange;
          if (context.marketType) logEntry.market_type = context.marketType;
          if (context.symbol) logEntry.symbol = context.symbol;
        }
        
        await this.supabaseClient
          .from('logs')
          .insert(logEntry);
      } catch (dbError) {
        // Don't throw - logging should not break the application
        console.error('Failed to store log in database:', dbError);
      }
    }
  }
  
  /**
   * Create child logger
   */
  child(subFunction: string): Logger {
    return new Logger(
      `${this.functionName}:${subFunction}`,
      this.supabaseClient,
      this.userId || undefined
    );
  }
}

/**
 * Create Logger instance
 */
export function createLogger(
  functionName: string,
  supabaseClient?: ReturnType<typeof createClient>,
  userId?: string
): Logger {
  return new Logger(functionName, supabaseClient, userId);
}

/**
 * Quick log functions (for convenience)
 */
export async function logToDatabase(
  supabaseClient: ReturnType<typeof createClient>,
  logEntry: DatabaseLogEntry
): Promise<void> {
  try {
    await supabaseClient
      .from('logs')
      .insert({
        ...logEntry,
        created_at: logEntry.created_at || new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log to database:', error);
  }
}


