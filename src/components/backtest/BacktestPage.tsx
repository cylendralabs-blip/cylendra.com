/**
 * Backtest Page Component
 *
 * Main dashboard for launching backtests (Phase 9)
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BacktestForm } from './BacktestForm';
import { BacktestConfig } from '@/core/models/BacktestConfig';
import { BacktestResult, PerformanceMetrics } from '@/core/models/BacktestResult';
import { BacktestTrade } from '@/core/models/BacktestTrade';
import { EquityPoint } from '@/core/models/EquityPoint';
import { runBacktest } from '@/backtest/backtestRunner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { EquityCurveChart } from './EquityCurveChart';
import { BacktestTradesTable } from './BacktestTradesTable';
import { PerformanceReport } from './PerformanceReport';
import { AiBacktestSummaryPanel } from '@/components/ai/AiBacktestSummaryPanel';
import { AiSettingsSuggestionCard } from '@/components/ai/AiSettingsSuggestionCard';
import { AISuggestion } from '@/services/ai/types';
import { useBotSettings } from '@/hooks/useBotSettings';
import { useBotSettingsMutation } from '@/hooks/useBotSettingsMutation';
import { useToast } from '@/hooks/use-toast';
import { BotSettingsForm } from '@/core/config';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type JobStatus = 'idle' | 'pending' | 'running' | 'completed' | 'failed';

export const BacktestPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { botSettings: currentSettings } = useBotSettings();
  const { mutate: updateSettings } = useBotSettingsMutation();

  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 100, message: '' });
  const [backtestId, setBacktestId] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [jobStatus, setJobStatus] = useState<JobStatus>('idle');
  const [jobMessage, setJobMessage] = useState<string>('');
  const [jobError, setJobError] = useState<string | null>(null);
  const [listeningForRemoteJob, setListeningForRemoteJob] = useState(false);

  const handleRunBacktest = async (config: BacktestConfig) => {
    if (!user) {
      toast({
        title: 'يلزم تسجيل الدخول',
        description: 'يرجى تسجيل الدخول لتشغيل الباك تست.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    setResult(null);
    setAiSuggestions([]);
    setJobStatus('pending');
    setJobMessage('جاري إنشاء مهمة الباك تست على الخادم...');
    setJobError(null);
    setProgress({ current: 0, total: 100, message: 'Preparing backtest...' });

    try {
      const { data: job, error: jobError } = await supabase
        .from('backtests' as any)
        .insert({
          user_id: user.id,
          config,
          status: 'pending'
        })
        .select('id')
        .single();

      const jobData = (job as unknown) as { id: string } | null;
      
      if (jobError || !jobData?.id) {
        console.error('Failed to create backtest job:', jobError);
        toast({
          title: 'تعذر إنشاء المهمة',
          description: jobError?.message || 'سيتم تشغيل الباك تست محلياً.',
          variant: 'destructive'
        });
        await runBacktestLocally(config);
        return;
      }

      setBacktestId(jobData.id);
      setListeningForRemoteJob(true);
      setJobMessage('تم إنشاء المهمة. جاري استدعاء الخادم...');

      const { data: workerResponse, error: workerError } = await supabase.functions.invoke('backtest-worker', {
        body: { backtestId: jobData.id }
      });

      if (workerError) {
        console.error('Backtest worker error:', workerError);
        toast({
          title: 'الخادم غير متاح',
          description: 'سيتم تشغيل الباك تست محلياً.',
          variant: 'destructive'
        });
        await runBacktestLocally(config, jobData.id);
        return;
      }

      if (
        workerResponse?.message?.toString().toLowerCase().includes('not yet implemented') ||
        workerResponse?.success === false
      ) {
        console.warn('Backtest worker placeholder detected. Falling back to local execution.');
        await runBacktestLocally(config, jobData.id);
        return;
      }

      setJobStatus('running');
      setJobMessage('يتم تشغيل الباك تست على الخادم...');
      setProgress({ current: 50, total: 100, message: 'Backtest is running on server...' });
    } catch (error: any) {
      console.error('Backtest error:', error);
      toast({
        title: 'فشل تشغيل الباك تست',
        description: error.message || 'سيتم تشغيل الباك تست محلياً.',
        variant: 'destructive'
      });
      await runBacktestLocally(config);
    }
  };

  const runBacktestLocally = async (config: BacktestConfig, jobId?: string) => {
    setListeningForRemoteJob(false);
    setJobStatus('running');
    setJobMessage('يتم تشغيل الباك تست محلياً...');

    try {
      const localResult = await runBacktest(config, (progress) => {
        setProgress(progress);
      });

      setResult(localResult);
      setBacktestId((prev) => prev ?? jobId ?? localResult.id);
      setJobStatus('completed');
      setJobMessage('اكتمل الباك تست محلياً.');
      setLoading(false);

      if (jobId) {
        await supabase
          .from('backtests' as any)
          .update({
            status: 'completed',
            started_at: localResult.startedAt ? new Date(localResult.startedAt).toISOString() : new Date().toISOString(),
            completed_at: localResult.completedAt
              ? new Date(localResult.completedAt).toISOString()
              : new Date().toISOString(),
            execution_time_ms: localResult.executionTimeMs,
            metadata: {
              ...localResult.metadata,
              source: 'local-run'
            }
          })
          .eq('id', jobId);
      }
    } catch (error: any) {
      console.error('Local backtest error:', error);
      setJobStatus('failed');
      setJobError(error.message || 'Unknown error');
      setLoading(false);

      if (jobId) {
        await supabase
          .from('backtests' as any)
          .update({
            status: 'failed',
            error: error.message || 'Unknown error'
          })
          .eq('id', jobId);
      }

      toast({
        title: 'فشل الباك تست',
        description: error.message || 'حدث خطأ أثناء تشغيل الباك تست.',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    if (!backtestId || !listeningForRemoteJob) {
      return;
    }

    const channel = supabase
      .channel(`backtest-status-${backtestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'backtests',
          filter: `id=eq.${backtestId}`
        },
        (payload) => {
          const row = payload.new as any;
          if (!row) return;

          setJobStatus(row.status);
          if (row.status === 'running') {
            setJobMessage('الباك تست قيد التشغيل على الخادم...');
          }

          if (row.status === 'failed') {
            setJobError(row.error || 'Backtest failed on server');
            setJobMessage('فشل الباك تست على الخادم');
            setLoading(false);
          }

          if (row.status === 'completed') {
            setJobMessage('تم اكتمال الباك تست على الخادم. يتم تحميل النتائج...');
            fetchBacktestResultFromServer(row.id);
          }
        }
      )
      .subscribe();

    fetchBacktestResultFromServer(backtestId);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [backtestId, listeningForRemoteJob]);

  const fetchBacktestResultFromServer = async (id: string) => {
    try {
      const { data: backtestRow, error: backtestError } = await supabase
        .from('backtests' as any)
        .select('*')
        .eq('id', id)
        .single();

      if (backtestError || !backtestRow || (backtestRow as any).status !== 'completed') {
        return;
      }

      const [tradesRes, equityRes, metricsRes] = await Promise.all([
        supabase.from('backtest_trades' as any).select('*').eq('backtest_id', id).order('entry_time'),
        supabase.from('backtest_equity_curve' as any).select('*').eq('backtest_id', id).order('time'),
        supabase.from('backtest_metrics' as any).select('*').eq('backtest_id', id).single()
      ]);

      const mappedResult = buildBacktestResultFromServer({
        backtest: backtestRow,
        trades: tradesRes.data || [],
        equity: equityRes.data || [],
        metrics: metricsRes.data || null
      });

      if (mappedResult) {
        setResult(mappedResult);
        setJobStatus('completed');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching backtest results:', error);
    }
  };

  const buildBacktestResultFromServer = ({
    backtest,
    trades,
    equity,
    metrics
  }: {
    backtest: any;
    trades: any[];
    equity: any[];
    metrics: any;
  }): BacktestResult | null => {
    if (!backtest?.config) {
      return null;
    }

    const config: BacktestConfig = backtest.config as BacktestConfig;

    const mappedTrades: BacktestTrade[] = trades.map((trade) => ({
      id: trade.id,
      symbol: trade.symbol,
      side: trade.side,
      entryTime: Number(trade.entry_time),
      entryPrice: Number(trade.entry_price),
      entryQty: Number(trade.entry_qty),
      entryFee: Number(trade.entry_fee || 0),
      exitTime: trade.exit_time ? Number(trade.exit_time) : undefined,
      exitPrice: trade.exit_price ? Number(trade.exit_price) : undefined,
      exitQty: trade.exit_qty ? Number(trade.exit_qty) : undefined,
      exitFee: trade.exit_fee ? Number(trade.exit_fee) : undefined,
      dcaFills: Array.isArray(trade.dca_fills) ? trade.dca_fills.map(mapFill) : [],
      tpFills: Array.isArray(trade.tp_fills) ? trade.tp_fills.map(mapFill) : [],
      slFill: trade.sl_fill ? mapFill(trade.sl_fill) : undefined,
      pnlUsd: Number(trade.pnl_usd || 0),
      pnlPct: Number(trade.pnl_pct || 0),
      maxAdverseMovePct: Number(trade.max_adverse_move_pct || 0),
      maxFavorableMovePct: Number(trade.max_favorable_move_pct || 0),
      status: trade.status,
      exitReason: trade.exit_reason || undefined,
      metadata: trade.metadata || undefined
    }));

    const mappedEquity: EquityPoint[] = equity.map((point) => ({
      time: Number(point.time),
      equity: Number(point.equity),
      unrealizedPnl: point.unrealized_pnl ? Number(point.unrealized_pnl) : undefined,
      realizedPnl: point.realized_pnl ? Number(point.realized_pnl) : undefined,
      openPositions: point.open_positions ?? undefined
    }));

    const mappedMetrics: PerformanceMetrics = metrics
      ? {
          totalReturnPct: Number(metrics.total_return_pct || 0),
          cagr: metrics.cagr ? Number(metrics.cagr) : undefined,
          winRate: Number(metrics.win_rate || 0),
          avgWin: Number(metrics.avg_win || 0),
          avgLoss: Number(metrics.avg_loss || 0),
          profitFactor: Number(metrics.profit_factor || 0),
          maxDrawdownPct: Number(metrics.max_drawdown_pct || 0),
          maxDrawdownDurationDays: metrics.max_drawdown_duration_days
            ? Number(metrics.max_drawdown_duration_days)
            : undefined,
          sharpeRatio: metrics.sharpe_ratio ? Number(metrics.sharpe_ratio) : undefined,
          expectancy: Number(metrics.expectancy || 0),
          maxWinStreak: Number(metrics.max_win_streak || 0),
          maxLossStreak: Number(metrics.max_loss_streak || 0),
          totalTrades: Number(metrics.total_trades || mappedTrades.length),
          winningTrades: Number(metrics.winning_trades || 0),
          losingTrades: Number(metrics.losing_trades || 0),
          avgTradeDurationHours: metrics.avg_trade_duration_hours
            ? Number(metrics.avg_trade_duration_hours)
            : undefined,
          volatility: metrics.volatility ? Number(metrics.volatility) : undefined,
          calmarRatio: metrics.calmar_ratio ? Number(metrics.calmar_ratio) : undefined
        }
      : {
          totalReturnPct: 0,
          winRate: 0,
          avgWin: 0,
          avgLoss: 0,
          profitFactor: 0,
          maxDrawdownPct: 0,
          expectancy: 0,
          maxWinStreak: 0,
          maxLossStreak: 0,
          totalTrades: mappedTrades.length,
          winningTrades: mappedTrades.filter((t) => t.pnlUsd > 0).length,
          losingTrades: mappedTrades.filter((t) => t.pnlUsd <= 0).length
        };

    return {
      id: backtest.id,
      config,
      trades: mappedTrades,
      equityCurve: mappedEquity,
      metrics: mappedMetrics,
      status: backtest.status,
      startedAt: backtest.started_at ? new Date(backtest.started_at).getTime() : undefined,
      completedAt: backtest.completed_at ? new Date(backtest.completed_at).getTime() : undefined,
      executionTimeMs: backtest.execution_time_ms || undefined,
      error: backtest.error || undefined,
      metadata: backtest.metadata || undefined
    };
  };

  const mapFill = (fill: any) => ({
    time: Number(fill?.time || fill?.timestamp || 0),
    price: Number(fill?.price || 0),
    qty: Number(fill?.qty || fill?.quantity || 0),
    fee: Number(fill?.fee || 0)
  });

  const handleApplySettings = (settings: Partial<BotSettingsForm>) => {
    updateSettings(settings, {
      onSuccess: () => {
        toast({
          title: 'Settings Applied',
          description: 'Backtest-optimized settings have been applied to your bot.',
        });
        setTimeout(() => {
          navigate('/dashboard/bot-settings');
        }, 1500);
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to apply settings.',
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Backtesting</h1>
      </div>

      {/* Progress */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{jobMessage || progress.message}</span>
                <span>
                  {progress.current}/{progress.total}
                </span>
              </div>
              <Progress value={(progress.current / progress.total) * 100} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      {!loading && !result && (
        <BacktestForm onSubmit={handleRunBacktest} loading={loading} />
      )}

      {jobStatus === 'failed' && jobError && (
        <Card>
          <CardHeader>
            <CardTitle>Backtest Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-500">{jobError}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && backtestId && (
        <div className="space-y-6">
          {/* Performance Report */}
          <PerformanceReport metrics={result.metrics} />

          {/* AI Backtest Summary */}
          <AiBacktestSummaryPanel
            backtestId={backtestId}
            onSettingsSuggested={(suggestions) => setAiSuggestions(suggestions)}
          />

          {/* Equity Curve */}
          <EquityCurveChart equityCurve={result.equityCurve} />

          {/* Trades Table */}
          <BacktestTradesTable trades={result.trades} />

          {/* AI Settings Suggestions */}
          {aiSuggestions.length > 0 && (
            <AiSettingsSuggestionCard
              suggestions={aiSuggestions}
              currentSettings={currentSettings || {}}
              onApply={handleApplySettings}
            />
          )}
        </div>
      )}
    </div>
  );
};
