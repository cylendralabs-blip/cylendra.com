/**
 * Backtest Results Page
 * 
 * Displays comprehensive backtest results with charts, metrics, and trades
 * 
 * Phase 2: Backtest UI - Task 4
 */

import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { useBacktestRun, useBacktestTrades } from '@/hooks/useBacktest';
import { BacktestTradesTable } from '@/components/backtest/BacktestTradesTable';
import { EquityCurveChart } from '@/components/backtest/EquityCurveChart';
import { PerformanceReport } from '@/components/backtest/PerformanceReport';
import { AIAnalysisPanel } from '@/components/backtest/AIAnalysisPanel';
import { BacktestTrade } from '@/core/models/BacktestTrade';
import { EquityPoint } from '@/core/models/EquityPoint';
import { PerformanceMetrics } from '@/core/models/BacktestResult';
import { Loader2 } from 'lucide-react';

export default function BacktestResults() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  
  const { data: run, isLoading: loadingRun } = useBacktestRun(runId || null, {
    enabled: !!runId,
    refetchInterval: 0 // Don't poll on results page
  });

  const { data: trades, isLoading: loadingTrades } = useBacktestTrades(runId || null);

  if (loadingRun || !run) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  if (run.status !== 'completed') {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground mb-4">
              Backtest is not completed yet. Status: {run.status}
            </p>
            <Button onClick={() => navigate(`/dashboard/backtest/run/${runId}`)}>
              View Status
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary = run.summary || {};
  
  // Convert trades to BacktestTrade format
  const backtestTrades: BacktestTrade[] = (trades || []).map((trade: any) => ({
    id: trade.id,
    symbol: trade.symbol,
    side: trade.side as 'buy' | 'sell',
    entryTime: Number(trade.entry_time),
    entryPrice: Number(trade.entry_price),
    entryQty: Number(trade.entry_qty || 0),
    entryFee: Number(trade.entry_fee || 0),
    exitTime: trade.exit_time ? Number(trade.exit_time) : undefined,
    exitPrice: trade.exit_price ? Number(trade.exit_price) : undefined,
    exitQty: trade.exit_qty ? Number(trade.exit_qty || 0) : undefined,
    exitFee: Number(trade.exit_fee || 0),
    dcaFills: Array.isArray(trade.dca_fills) ? trade.dca_fills.map((f: any) => ({
      time: Number(f.time || f.timestamp || 0),
      price: Number(f.price || 0),
      qty: Number(f.qty || f.quantity || 0),
      fee: Number(f.fee || 0)
    })) : [],
    tpFills: Array.isArray(trade.tp_fills) ? trade.tp_fills.map((f: any) => ({
      time: Number(f.time || f.timestamp || 0),
      price: Number(f.price || 0),
      qty: Number(f.qty || f.quantity || 0),
      fee: Number(f.fee || 0)
    })) : [],
    slFill: trade.sl_fill ? {
      time: Number(trade.sl_fill.time || trade.sl_fill.timestamp || 0),
      price: Number(trade.sl_fill.price || 0),
      qty: Number(trade.sl_fill.qty || trade.sl_fill.quantity || 0),
      fee: Number(trade.sl_fill.fee || 0)
    } : undefined,
    pnlUsd: Number(trade.pnl_usd || 0),
    pnlPct: Number(trade.pnl_pct || 0),
    maxAdverseMovePct: Number(trade.max_adverse_move_pct || 0),
    maxFavorableMovePct: Number(trade.max_favorable_move_pct || 0),
    status: trade.status || 'closed',
    exitReason: trade.exit_reason || undefined,
    metadata: trade.metadata || undefined
  }));

  // Build equity curve from trades (simplified - in real implementation, this should come from DB)
  const equityCurve: EquityPoint[] = [];
  let currentEquity = summary.initialCapital || 1000;
  const startTime = new Date(run.period_from).getTime();
  
  // Add initial point
  equityCurve.push({
    time: startTime,
    equity: currentEquity
  });

  // Build equity curve from trades
  backtestTrades.forEach((trade, index) => {
    if (trade.exitTime && trade.exitPrice) {
      currentEquity += trade.pnlUsd;
      equityCurve.push({
        time: trade.exitTime,
        equity: currentEquity,
        realizedPnl: trade.pnlUsd
      });
    }
  });

  // Build performance metrics
  const metrics: PerformanceMetrics = {
    totalReturnPct: summary.totalReturnPct || 0,
    winRate: summary.winrate || 0,
    avgWin: summary.avgWin || 0,
    avgLoss: summary.avgLoss || 0,
    profitFactor: summary.profitFactor || 0,
    maxDrawdownPct: summary.maxDrawdown || 0,
    expectancy: summary.expectancy || 0,
    maxWinStreak: summary.maxWinStreak || 0,
    maxLossStreak: summary.maxLossStreak || 0,
    totalTrades: summary.numTrades || backtestTrades.length,
    winningTrades: backtestTrades.filter(t => t.pnlUsd > 0).length,
    losingTrades: backtestTrades.filter(t => t.pnlUsd <= 0).length,
    sharpeRatio: summary.sharpeRatio,
    cagr: summary.cagr
  };

  // Calculate monthly breakdown (simplified)
  const monthlyBreakdown = calculateMonthlyBreakdown(backtestTrades, equityCurve);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard/backtest')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Backtest Lab
          </Button>
          <h1 className="text-3xl font-bold mb-2">Backtest Results</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{run.pair}</span>
            <span>•</span>
            <span>{run.timeframe}</span>
            <span>•</span>
            <span>{run.strategy_id}</span>
            <span>•</span>
            <span>{new Date(run.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      {/* SECTION A: Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Total PnL</div>
            <div className={`text-2xl font-bold ${(summary.totalPnL || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${(summary.totalPnL || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Return %</div>
            <div className={`text-2xl font-bold ${(summary.totalReturnPct || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {(summary.totalReturnPct || 0).toFixed(2)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Winrate</div>
            <div className="text-2xl font-bold">
              {(summary.winrate || 0).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Max Drawdown</div>
            <div className="text-2xl font-bold text-red-500">
              {(summary.maxDrawdown || 0).toFixed(2)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Trades</div>
            <div className="text-2xl font-bold">
              {summary.numTrades || backtestTrades.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Profit Factor</div>
            <div className="text-2xl font-bold">
              {(summary.profitFactor || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION B: Equity Curve Chart */}
      <EquityCurveChart equityCurve={equityCurve} />

      {/* SECTION C: Monthly Breakdown */}
      {monthlyBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyBreakdown.map((month, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{month.month}</p>
                    <p className="text-sm text-muted-foreground">{month.trades} trades</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${month.return >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {month.return >= 0 ? '+' : ''}{month.return.toFixed(2)}%
                    </p>
                    <p className="text-sm text-muted-foreground">${month.pnl.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION D: Performance Report */}
      <PerformanceReport metrics={metrics} />

      {/* SECTION G: AI Analysis */}
      <AIAnalysisPanel runId={runId!} />

      {/* SECTION E: Trades Table */}
      {!loadingTrades && (
        <BacktestTradesTable trades={backtestTrades} />
      )}

      {/* SECTION F: Strategy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Strategy Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Strategy</p>
              <p className="font-medium">{run.strategy_id}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Pair</p>
              <p className="font-medium">{run.pair}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Timeframe</p>
              <p className="font-medium">{run.timeframe}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Period</p>
              <p className="font-medium">
                {new Date(run.period_from).toLocaleDateString()} - {new Date(run.period_to).toLocaleDateString()}
              </p>
            </div>
            {run.metadata && (
              <>
                {run.metadata.initial_balance && (
                  <div>
                    <p className="text-muted-foreground">Initial Balance</p>
                    <p className="font-medium">${run.metadata.initial_balance}</p>
                  </div>
                )}
                {run.metadata.fees && (
                  <div>
                    <p className="text-muted-foreground">Fees</p>
                    <p className="font-medium">
                      Maker: {run.metadata.fees.makerPct}% | Taker: {run.metadata.fees.takerPct}%
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Calculate monthly breakdown from trades
 */
function calculateMonthlyBreakdown(trades: BacktestTrade[], equityCurve: EquityPoint[]): Array<{
  month: string;
  trades: number;
  return: number;
  pnl: number;
}> {
  const monthly: Record<string, { trades: number; pnl: number }> = {};

  trades.forEach(trade => {
    if (trade.exitTime) {
      const date = new Date(trade.exitTime);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthly[monthKey]) {
        monthly[monthKey] = { trades: 0, pnl: 0 };
      }
      
      monthly[monthKey].trades++;
      monthly[monthKey].pnl += trade.pnlUsd;
    }
  });

  return Object.entries(monthly)
    .map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      trades: data.trades,
      pnl: data.pnl,
      return: (data.pnl / 1000) * 100 // Simplified - should use actual equity
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

