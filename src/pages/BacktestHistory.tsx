/**
 * Backtest History Page
 * 
 * Lists all user backtest runs
 * 
 * Phase 2: Backtest UI - Task 5
 */

import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Eye, TrendingUp, TrendingDown } from 'lucide-react';
import { useUserBacktestRuns } from '@/hooks/useBacktest';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export default function BacktestHistory() {
  const { t } = useTranslation('backtest');
  const navigate = useNavigate();
  const { data: runs, isLoading, error } = useUserBacktestRuns();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>{t('history.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-destructive">
              {error instanceof Error ? error.message : t('history.error')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      running: 'secondary',
      failed: 'destructive',
      pending: 'outline'
    };

    const statusKey = status.toLowerCase() as 'completed' | 'running' | 'failed' | 'pending';

    return (
      <Badge variant={variants[statusKey] || 'outline'}>
        {t(`history.status.${statusKey}`, status)}
      </Badge>
    );
  };

  const getReturnBadge = (returnPct: number | undefined) => {
    if (returnPct === undefined) return null;

    const isPositive = returnPct >= 0;
    return (
      <div className="flex items-center gap-1">
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-green-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500" />
        )}
        <span className={cn(
          "font-semibold",
          isPositive ? "text-green-500" : "text-red-500"
        )}>
          {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
        </span>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('history.title')}</h1>
          <p className="text-muted-foreground">
            {t('history.subtitle')}
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/backtest')}>
          {t('history.new_backtest')}
        </Button>
      </div>

      {!runs || runs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">{t('history.no_backtests')}</p>
              <Button onClick={() => navigate('/dashboard/backtest')}>
                {t('history.create_first')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('history.all_backtests', { count: runs.length })}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('history.table.date')}</TableHead>
                  <TableHead>{t('history.table.pair')}</TableHead>
                  <TableHead>{t('history.table.timeframe')}</TableHead>
                  <TableHead>{t('history.table.strategy')}</TableHead>
                  <TableHead>{t('history.table.period')}</TableHead>
                  <TableHead>{t('history.table.return')}</TableHead>
                  <TableHead>{t('history.table.winrate')}</TableHead>
                  <TableHead>{t('history.table.status')}</TableHead>
                  <TableHead>{t('history.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => {
                  const summary = run.summary || {};
                  const periodFrom = new Date(run.period_from);
                  const periodTo = new Date(run.period_to);
                  const periodDays = Math.ceil((periodTo.getTime() - periodFrom.getTime()) / (1000 * 60 * 60 * 24));

                  return (
                    <TableRow key={run.id}>
                      <TableCell>
                        {new Date(run.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{run.pair}</TableCell>
                      <TableCell>{run.timeframe}</TableCell>
                      <TableCell>{run.strategy_id}</TableCell>
                      <TableCell>{t('history.table.days', { count: periodDays })}</TableCell>
                      <TableCell>
                        {getReturnBadge(summary.totalReturnPct)}
                      </TableCell>
                      <TableCell>
                        {summary.winrate ? `${summary.winrate.toFixed(1)}%` : '-'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(run.status)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (run.status === 'completed') {
                              navigate(`/dashboard/backtest/results/${run.id}`);
                            } else {
                              navigate(`/dashboard/backtest/run/${run.id}`);
                            }
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {t('history.table.view')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

