/**
 * Backtest Export Service
 * 
 * Export backtest results to PDF, CSV, or JSON
 * 
 * Phase 4: Advanced Features - Task 5
 */

import { supabase } from '@/integrations/supabase/client';
import type { BacktestRunStatus } from './backtestService';

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'json';
  includeTrades?: boolean;
  includeCharts?: boolean;
  includeAnalysis?: boolean;
}

/**
 * Export backtest to CSV
 */
export async function exportToCSV(runId: string): Promise<string> {
  const { data: run } = await supabase
    .from('backtest_runs' as any)
    .select('*')
    .eq('id', runId)
    .single();

  if (!run) {
    throw new Error('Backtest not found');
  }

  // Fetch trades
  const { data: trades } = await supabase
    .from('backtest_trades' as any)
    .select('*')
    .eq('backtest_run_id', runId)
    .order('entry_time');

  // Build CSV
  const headers = [
    'Entry Time',
    'Exit Time',
    'Symbol',
    'Side',
    'Entry Price',
    'Exit Price',
    'Quantity',
    'PnL (USD)',
    'PnL (%)',
    'Duration (ms)',
    'Exit Reason'
  ];

  const rows = (trades || []).map((trade: any) => {
    const t = trade as any;
    return [
      new Date(t.entry_time).toISOString(),
      t.exit_time ? new Date(t.exit_time).toISOString() : '',
      t.symbol,
      t.side,
      t.entry_price,
      t.exit_price || '',
      t.entry_qty,
      t.pnl_usd,
      t.pnl_pct,
      t.duration || '',
      t.exit_reason || ''
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Export backtest to JSON
 */
export async function exportToJSON(runId: string): Promise<any> {
  const { data: run } = await supabase
    .from('backtest_runs' as any)
    .select('*')
    .eq('id', runId)
    .single();

  if (!run) {
    throw new Error('Backtest not found');
  }

  // Fetch trades
  const { data: trades } = await supabase
    .from('backtest_trades' as any)
    .select('*')
    .eq('backtest_run_id', runId)
    .order('entry_time');

  const runData = run as any;
  return {
    backtest: {
      id: runData.id,
      pair: runData.pair,
      timeframe: runData.timeframe,
      strategy: runData.strategy_id,
      period: {
        from: runData.period_from,
        to: runData.period_to
      },
      summary: runData.summary,
      metadata: runData.metadata,
      created_at: runData.created_at
    },
    trades: trades || []
  };
}

/**
 * Export backtest to PDF (via server function)
 */
export async function exportToPDF(runId: string): Promise<Blob> {
  const { data, error } = await supabase.functions.invoke('backtest-export', {
    body: {
      runId,
      format: 'pdf'
    }
  });

  if (error) {
    throw new Error(`PDF export failed: ${error.message}`);
  }

  // Convert base64 to blob
  const base64Data = data.pdf;
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: 'application/pdf' });
}

/**
 * Download exported file
 */
export function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

