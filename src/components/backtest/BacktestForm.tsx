/**
 * Backtest Form Component
 * 
 * Form for configuring and running backtests
 * 
 * Phase 9: Backtesting Engine - Task 10
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BacktestConfig, validateBacktestConfig, getDefaultBacktestConfig } from '@/core/models/BacktestConfig';
import { useAuth } from '@/hooks/useAuth';
import { logInfo } from '@/services/logger';
import { LOG_ACTIONS } from '@/core/config/logging.taxonomy';

interface BacktestFormProps {
  onSubmit: (config: BacktestConfig) => Promise<void>;
  loading?: boolean;
}

export const BacktestForm = ({ onSubmit, loading = false }: BacktestFormProps) => {
  const { user } = useAuth();
  const [config, setConfig] = useState<Partial<BacktestConfig>>(() => ({
    ...getDefaultBacktestConfig(user?.id || ''),
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // Today
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please log in to run backtests');
      return;
    }
    
    // Validate config
    const validation = validateBacktestConfig(config as BacktestConfig);
    if (!validation.valid) {
      alert(`Invalid configuration: ${validation.errors.join(', ')}`);
      return;
    }
    
    logInfo('ui', LOG_ACTIONS.UI.BOT_ENABLED, 'Starting backtest', { config });
    
    await onSubmit(config as BacktestConfig);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backtest Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Strategy */}
          <div>
            <Label htmlFor="strategy">Strategy</Label>
            <Select
              value={config.strategyId || 'main-strategy'}
              onValueChange={(value) => setConfig({ ...config, strategyId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main-strategy">Main Strategy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Exchange */}
          <div>
            <Label htmlFor="exchange">Exchange</Label>
            <Select
              value={config.exchange || 'binance'}
              onValueChange={(value) => setConfig({ ...config, exchange: value as 'binance' | 'okx' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="binance">Binance</SelectItem>
                <SelectItem value="okx">OKX</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Symbol */}
          <div>
            <Label htmlFor="symbol">Symbol</Label>
            <Input
              id="symbol"
              value={config.symbols?.[0] || ''}
              onChange={(e) => setConfig({ ...config, symbols: [e.target.value] })}
              placeholder="BTCUSDT"
            />
          </div>

          {/* Timeframe */}
          <div>
            <Label htmlFor="timeframe">Timeframe</Label>
            <Select
              value={config.timeframe || '1h'}
              onValueChange={(value) => setConfig({ ...config, timeframe: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 Hour</SelectItem>
                <SelectItem value="4h">4 Hours</SelectItem>
                <SelectItem value="1d">1 Day</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={config.startDate?.split('T')[0] || ''}
                onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={config.endDate?.split('T')[0] || ''}
                onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
              />
            </div>
          </div>

          {/* Initial Capital */}
          <div>
            <Label htmlFor="capital">Initial Capital (USD)</Label>
            <Input
              id="capital"
              type="number"
              value={config.initialCapitalUsd || 10000}
              onChange={(e) => setConfig({ ...config, initialCapitalUsd: parseFloat(e.target.value) })}
              min={100}
              step={1000}
            />
          </div>

          {/* Fees */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="makerFee">Maker Fee (%)</Label>
              <Input
                id="makerFee"
                type="number"
                value={config.fees?.makerPct || 0.1}
                onChange={(e) => setConfig({
                  ...config,
                  fees: { ...config.fees, makerPct: parseFloat(e.target.value) } as any
                })}
                step={0.01}
              />
            </div>
            <div>
              <Label htmlFor="takerFee">Taker Fee (%)</Label>
              <Input
                id="takerFee"
                type="number"
                value={config.fees?.takerPct || 0.1}
                onChange={(e) => setConfig({
                  ...config,
                  fees: { ...config.fees, takerPct: parseFloat(e.target.value) } as any
                })}
                step={0.01}
              />
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Running Backtest...' : 'Run Backtest'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

