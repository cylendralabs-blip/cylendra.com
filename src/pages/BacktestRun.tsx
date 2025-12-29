/**
 * Backtest Run Status Page
 * 
 * Shows backtest execution status and redirects to results when completed
 * 
 * Phase 2: Backtest UI - Task 3
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useBacktestRun } from '@/hooks/useBacktest';
import { useToast } from '@/hooks/use-toast';

export default function BacktestRun() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [shouldPoll, setShouldPoll] = useState(true);
  
  const { data: run, isLoading, error } = useBacktestRun(runId || null, {
    enabled: !!runId && shouldPoll,
    refetchInterval: shouldPoll ? 2000 : 0
  });

  // Stop polling when completed or failed
  useEffect(() => {
    if (run?.status === 'completed' || run?.status === 'failed') {
      setShouldPoll(false);
    }
  }, [run?.status]);

  useEffect(() => {
    if (run?.status === 'completed') {
      // Redirect to results page
      navigate(`/dashboard/backtest/results/${runId}`);
    }
  }, [run?.status, runId, navigate]);

  if (isLoading && !run) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p>Loading backtest status...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'Failed to load backtest status'}
            </p>
            <Button onClick={() => navigate('/dashboard/backtest')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Backtest Lab
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Backtest not found</p>
            <Button 
              className="mt-4 w-full" 
              onClick={() => navigate('/dashboard/backtest')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Backtest Lab
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (run.status) {
      case 'pending':
        return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />;
      case 'running':
        return <Loader2 className="h-6 w-6 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-destructive" />;
      default:
        return <AlertCircle className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getStatusMessage = () => {
    switch (run.status) {
      case 'pending':
        return 'Your backtest is in queue...';
      case 'running':
        return 'Backtest in progress...';
      case 'completed':
        return 'Backtest completed successfully!';
      case 'failed':
        return 'Backtest failed';
      default:
        return 'Unknown status';
    }
  };

  const getProgressValue = () => {
    if (run.status === 'pending') return 10;
    if (run.status === 'running') return 50;
    if (run.status === 'completed') return 100;
    return 0;
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard/backtest')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Backtest Lab
        </Button>
        <h1 className="text-3xl font-bold mb-2">Backtest Status</h1>
        <p className="text-muted-foreground">
          Run ID: {runId?.slice(0, 8)}...
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle>{getStatusMessage()}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {run.pair} • {run.timeframe} • {run.strategy_id}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          {(run.status === 'pending' || run.status === 'running') && (
            <div className="space-y-2">
              <Progress value={getProgressValue()} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {run.status === 'pending' && 'Waiting to start...'}
                {run.status === 'running' && 'Processing historical data and simulating trades...'}
              </p>
            </div>
          )}

          {/* Error Message */}
          {run.status === 'failed' && run.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Backtest Failed</AlertTitle>
              <AlertDescription>{run.error}</AlertDescription>
            </Alert>
          )}

          {/* Summary (if completed) */}
          {run.status === 'completed' && run.summary && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Quick Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Return</p>
                  <p className="font-semibold">
                    {run.summary.totalReturnPct?.toFixed(2) || 0}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Winrate</p>
                  <p className="font-semibold">
                    {run.summary.winrate?.toFixed(1) || 0}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Trades</p>
                  <p className="font-semibold">
                    {run.summary.numTrades || 0}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Max Drawdown</p>
                  <p className="font-semibold">
                    {run.summary.maxDrawdown?.toFixed(2) || 0}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Execution Time */}
          {run.execution_time_ms && (
            <div className="text-xs text-muted-foreground">
              Execution time: {(run.execution_time_ms / 1000).toFixed(2)}s
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            {run.status === 'failed' && (
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard/backtest')}
                className="flex-1"
              >
                Try Again
              </Button>
            )}
            {run.status === 'completed' && (
              <Button 
                onClick={() => navigate(`/dashboard/backtest/results/${runId}`)}
                className="flex-1"
              >
                View Results
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard/backtest/history')}
            >
              View History
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

