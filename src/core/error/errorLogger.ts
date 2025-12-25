/**
 * Error Logger System
 * 
 * Phase X.15 - Stability Improvements
 * Centralized error logging with unified error codes
 */

import { supabase } from '@/integrations/supabase/client';
import { ErrorCode, createError, type AppError } from './errorCodes';

interface ErrorLogEntry {
  code: ErrorCode;
  message: string;
  details?: any;
  userId?: string;
  context?: Record<string, any>;
  stack?: string;
  timestamp: string;
}

class ErrorLogger {
  private buffer: ErrorLogEntry[] = [];
  private flushInterval: number | null = null;
  private readonly BUFFER_SIZE = 10;
  private readonly FLUSH_INTERVAL_MS = 5000; // 5 seconds

  /**
   * Log error to system_logs
   */
  async logError(
    error: Error | AppError | string,
    userId?: string,
    context?: Record<string, any>
  ): Promise<void> {
    try {
      let errorEntry: ErrorLogEntry;

      if (typeof error === 'string') {
        errorEntry = {
          code: ErrorCode.SYSTEM_ERROR,
          message: error,
          userId,
          context,
          timestamp: new Date().toISOString(),
        };
      } else if ('code' in error) {
        // AppError
        errorEntry = {
          code: error.code,
          message: error.message,
          details: error.details,
          userId: error.userId || userId,
          context: error.context || context,
          timestamp: error.timestamp,
        };
      } else {
        // Standard Error
        errorEntry = {
          code: ErrorCode.SYSTEM_ERROR,
          message: error.message,
          details: error.stack,
          userId,
          context,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        };
      }

      // Add to buffer
      this.buffer.push(errorEntry);

      // Flush if buffer is full
      if (this.buffer.length >= this.BUFFER_SIZE) {
        await this.flush();
      } else {
        // Start flush interval if not already started
        if (this.flushInterval === null) {
          this.flushInterval = window.setTimeout(() => {
            this.flush();
          }, this.FLUSH_INTERVAL_MS);
        }
      }
    } catch (err) {
      console.error('Failed to log error:', err);
    }
  }

  /**
   * Flush buffered errors to database
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      if (this.flushInterval !== null) {
        clearTimeout(this.flushInterval);
        this.flushInterval = null;
      }
      return;
    }

    const errorsToFlush = [...this.buffer];
    this.buffer = [];

    if (this.flushInterval !== null) {
      clearTimeout(this.flushInterval);
      this.flushInterval = null;
    }

    try {
      // Insert errors into system_logs via Edge Function
      const { error } = await supabase.functions.invoke('system-logs-writer', {
        body: {
          logs: errorsToFlush.map(entry => ({
            level: 'error',
            code: entry.code,
            message: entry.message,
            details: entry.details || entry.stack,
            user_id: entry.userId,
            metadata: {
              context: entry.context,
              timestamp: entry.timestamp,
            },
          })),
        },
      });

      if (error) {
        console.error('Failed to write error logs:', error);
        // Re-add to buffer if write failed
        this.buffer.unshift(...errorsToFlush);
      }
    } catch (err) {
      console.error('Error flushing logs:', err);
      // Re-add to buffer if flush failed
      this.buffer.unshift(...errorsToFlush);
    }
  }

  /**
   * Log error immediately (bypass buffer)
   */
  async logErrorImmediate(
    error: Error | AppError | string,
    userId?: string,
    context?: Record<string, any>
  ): Promise<void> {
    await this.logError(error, userId, context);
    await this.flush();
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    errorLogger.flush();
  });
}

