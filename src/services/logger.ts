/**
 * Unified Logger Service
 * 
 * Frontend logging service with batching, retry, and localStorage fallback
 * 
 * Phase 8: Logging + Monitoring + Alerting System - Task 2
 */

import { supabase } from '@/integrations/supabase/client';
import { LogLevel, LogCategory, getDefaultLogLevel, isValidCategory, isValidLevel } from '@/core/config/logging.taxonomy';

/**
 * Log Entry
 */
export interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  action: string;
  message: string;
  context?: any;
  tradeId?: string;
  positionId?: string;
  signalId?: string;
  exchange?: string;
  marketType?: 'spot' | 'futures';
  symbol?: string;
  source?: string;
  timestamp?: string;
}

/**
 * Logger Configuration
 */
const LOGGER_CONFIG = {
  /** Batch size before sending */
  BATCH_SIZE: 10,
  /** Batch timeout in milliseconds */
  BATCH_TIMEOUT_MS: 5000,
  /** Retry attempts */
  MAX_RETRIES: 3,
  /** Retry delay in milliseconds */
  RETRY_DELAY_MS: 1000,
  /** localStorage key for queued logs */
  QUEUE_KEY: 'logger_queue',
  /** Max queue size in localStorage */
  MAX_QUEUE_SIZE: 100
};

/**
 * Log Queue
 */
let logQueue: LogEntry[] = [];
let batchTimeout: ReturnType<typeof setTimeout> | null = null;
let isProcessing = false;

/**
 * Get logs from localStorage queue
 */
function getQueuedLogs(): LogEntry[] {
  try {
    const stored = localStorage.getItem(LOGGER_CONFIG.QUEUE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to read queued logs from localStorage:', error);
  }
  return [];
}

/**
 * Save logs to localStorage queue
 */
function saveQueuedLogs(logs: LogEntry[]): void {
  try {
    // Limit queue size
    const limitedLogs = logs.slice(-LOGGER_CONFIG.MAX_QUEUE_SIZE);
    localStorage.setItem(LOGGER_CONFIG.QUEUE_KEY, JSON.stringify(limitedLogs));
  } catch (error) {
    console.error('Failed to save queued logs to localStorage:', error);
  }
}

/**
 * Clear logs from localStorage queue
 */
function clearQueuedLogs(): void {
  try {
    localStorage.removeItem(LOGGER_CONFIG.QUEUE_KEY);
  } catch (error) {
    console.error('Failed to clear queued logs from localStorage:', error);
  }
}

/**
 * Send logs batch to server
 */
async function sendLogsBatch(logs: LogEntry[], retryCount = 0): Promise<boolean> {
  if (logs.length === 0) {
    return true;
  }
  
  try {
    const { error } = await supabase
      .from('logs' as any)
      .insert(
        logs.map(log => ({
          level: log.level,
          category: log.category,
          action: log.action,
          message: log.message,
          context: log.context || {},
          trade_id: log.tradeId || null,
          position_id: log.positionId || null,
          signal_id: log.signalId || null,
          exchange: log.exchange || null,
          market_type: log.marketType || null,
          symbol: log.symbol || null,
          source: log.source || 'FRONTEND',
          created_at: log.timestamp || new Date().toISOString()
        })) as any
      );
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error: any) {
    console.error('Failed to send logs batch:', error);
    
    // Retry logic
    if (retryCount < LOGGER_CONFIG.MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, LOGGER_CONFIG.RETRY_DELAY_MS));
      return sendLogsBatch(logs, retryCount + 1);
    }
    
    // If retries failed, save to localStorage
    const existingQueue = getQueuedLogs();
    const newQueue = [...existingQueue, ...logs];
    saveQueuedLogs(newQueue);
    
    return false;
  }
}

/**
 * Process log queue
 */
async function processQueue(): Promise<void> {
  if (isProcessing || logQueue.length === 0) {
    return;
  }
  
  isProcessing = true;
  
  try {
    // Get current batch
    const batch = logQueue.splice(0, LOGGER_CONFIG.BATCH_SIZE);
    
    if (batch.length > 0) {
      await sendLogsBatch(batch);
    }
    
    // Process queued logs from localStorage if any
    const queuedLogs = getQueuedLogs();
    if (queuedLogs.length > 0) {
      clearQueuedLogs();
      const success = await sendLogsBatch(queuedLogs);
      if (!success) {
        // Re-queue if sending failed
        saveQueuedLogs(queuedLogs);
      }
    }
  } catch (error) {
    console.error('Error processing log queue:', error);
  } finally {
    isProcessing = false;
    
    // Schedule next batch if queue is not empty
    if (logQueue.length > 0) {
      scheduleBatch();
    }
  }
}

/**
 * Schedule batch processing
 */
function scheduleBatch(): void {
  if (batchTimeout) {
    clearTimeout(batchTimeout);
  }
  
  batchTimeout = setTimeout(() => {
    processQueue();
    batchTimeout = null;
  }, LOGGER_CONFIG.BATCH_TIMEOUT_MS);
}

/**
 * Add log to queue
 */
function addToQueue(log: LogEntry): void {
  // Validate log entry
  if (!isValidCategory(log.category)) {
    console.warn('Invalid log category:', log.category);
    return;
  }
  
  if (!isValidLevel(log.level)) {
    console.warn('Invalid log level:', log.level);
    return;
  }
  
  // Set default source if not provided
  if (!log.source) {
    log.source = 'FRONTEND';
  }
  
  // Set timestamp if not provided
  if (!log.timestamp) {
    log.timestamp = new Date().toISOString();
  }
  
  // Add to queue
  logQueue.push(log);
  
  // If queue is full, process immediately
  if (logQueue.length >= LOGGER_CONFIG.BATCH_SIZE) {
    processQueue();
  } else {
    // Otherwise, schedule batch processing
    scheduleBatch();
  }
  
  // Also log to console in development
  if (typeof window !== 'undefined' && (window as any).__DEV__) {
    const consoleMethod = log.level === 'error' || log.level === 'critical' 
      ? 'error' 
      : log.level === 'warn' 
      ? 'warn' 
      : 'log';
    console[consoleMethod](`[${log.level.toUpperCase()}] [${log.category}] ${log.action}:`, log.message, log.context);
  }
}

/**
 * Log Info
 */
export function logInfo(
  category: LogCategory,
  action: string,
  message: string,
  context?: any
): void {
  addToQueue({
    level: 'info',
    category,
    action,
    message,
    context
  });
}

/**
 * Log Warning
 */
export function logWarn(
  category: LogCategory,
  action: string,
  message: string,
  context?: any
): void {
  addToQueue({
    level: 'warn',
    category,
    action,
    message,
    context
  });
}

/**
 * Log Error
 */
export function logError(
  category: LogCategory,
  action: string,
  message: string,
  context?: any
): void {
  addToQueue({
    level: 'error',
    category,
    action,
    message,
    context
  });
}

/**
 * Log Critical
 */
export function logCritical(
  category: LogCategory,
  action: string,
  message: string,
  context?: any
): void {
  addToQueue({
    level: 'critical',
    category,
    action,
    message,
    context
  });
}

/**
 * Log with full context
 */
export function log(
  level: LogLevel,
  category: LogCategory,
  action: string,
  message: string,
  context?: Partial<LogEntry>
): void {
  addToQueue({
    level,
    category,
    action,
    message,
    ...context
  });
}

/**
 * Initialize logger (process any queued logs from localStorage)
 */
export async function initializeLogger(): Promise<void> {
  const queuedLogs = getQueuedLogs();
  if (queuedLogs.length > 0) {
    logInfo('system', LOG_ACTIONS.SYSTEM.WORKER_STARTED, `Processing ${queuedLogs.length} queued logs from localStorage`);
    await processQueue();
  }
}

/**
 * Flush all pending logs (useful before page unload)
 */
export async function flushLogs(): Promise<void> {
  if (logQueue.length > 0) {
    await sendLogsBatch(logQueue);
    logQueue = [];
  }
  
  const queuedLogs = getQueuedLogs();
  if (queuedLogs.length > 0) {
    await sendLogsBatch(queuedLogs);
    clearQueuedLogs();
  }
}

// Auto-flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushLogs();
  });
}

// Import LOG_ACTIONS for convenience
import { LOG_ACTIONS } from '@/core/config/logging.taxonomy';

