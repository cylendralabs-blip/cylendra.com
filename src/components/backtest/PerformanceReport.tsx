/**
 * Performance Report Component
 * 
 * Displays comprehensive performance metrics
 * 
 * Phase 9: Backtesting Engine - Task 10
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PerformanceMetrics } from '@/core/models/BacktestResult';

interface PerformanceReportProps {
  metrics: PerformanceMetrics;
}

export const PerformanceReport = ({ metrics }: PerformanceReportProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Return</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${metrics.totalReturnPct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {metrics.totalReturnPct.toFixed(2)}%
          </div>
          {metrics.cagr && (
            <p className="text-xs text-muted-foreground">
              CAGR: {metrics.cagr.toFixed(2)}%
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.winRate.toFixed(2)}%</div>
          <p className="text-xs text-muted-foreground">
            {metrics.winningTrades}W / {metrics.losingTrades}L
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.profitFactor.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Avg Win: ${metrics.avgWin.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">
            {metrics.maxDrawdownPct.toFixed(2)}%
          </div>
          {metrics.maxDrawdownDurationDays && (
            <p className="text-xs text-muted-foreground">
              Duration: {metrics.maxDrawdownDurationDays.toFixed(1)} days
            </p>
          )}
        </CardContent>
      </Card>

      {metrics.sharpeRatio && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.sharpeRatio.toFixed(2)}</div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalTrades}</div>
          {metrics.avgTradeDurationHours && (
            <p className="text-xs text-muted-foreground">
              Avg Duration: {metrics.avgTradeDurationHours.toFixed(1)}h
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Streaks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="text-sm">
              <span className="text-green-500">Win:</span> {metrics.maxWinStreak}
            </div>
            <div className="text-sm">
              <span className="text-red-500">Loss:</span> {metrics.maxLossStreak}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Expectancy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${metrics.expectancy >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${metrics.expectancy.toFixed(2)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

