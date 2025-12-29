/**
 * Metrics Bar Component
 * 
 * Displays portfolio metrics (Total Equity, Daily PnL, Unrealized PnL, Exposure)
 * 
 * Phase 7: Portfolio & Wallet Integration - Task 8
 */

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

interface PortfolioMetrics {
  totalEquity: number;
  spotEquity: number;
  futuresEquity: number;
  unrealizedPnl: number;
  realizedPnl: number;
  dailyPnl: number;
  dailyPnlPct: number;
  totalExposureUsd: number;
  totalExposurePct: number;
}

export const MetricsBar = () => {
  const { t } = useTranslation('dashboard');
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch current portfolio state
        // Use type assertion to avoid deep type inference issues
        // The users_portfolio_state table exists but isn't in generated types yet
        const portfolioResult = await (supabase
          .from('users_portfolio_state' as any)
          .select('*')
          .eq('user_id', user.id)
          .order('last_sync_at', { ascending: false })
          .limit(1)
          .maybeSingle() as any) as { data: any; error: any };

        // Handle error gracefully - portfolio might not exist yet
        if (portfolioResult.error && portfolioResult.error.code !== 'PGRST116') { // PGRST116 = no rows found
          console.warn('Error fetching portfolio state:', portfolioResult.error);
          // Don't throw - just show "No portfolio data available"
          setLoading(false);
          return;
        }

        const data = portfolioResult.data;

        if (data) {
          // Fetch daily PnL from today's trades
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const dailyTradesResult = await (supabase
            .from('trades')
            .select('realized_pnl')
            .eq('user_id', user.id)
            .eq('status', 'CLOSED')
            .gte('closed_at', today.toISOString()) as any) as { data: any[] | null; error: any };
          const dailyTrades = dailyTradesResult.data;

          const dailyPnl = dailyTrades?.reduce((sum, t) =>
            sum + (parseFloat(t.realized_pnl || '0')), 0
          ) || 0;

          // Calculate total exposure from active trades
          const activeTradesResult = await (supabase
            .from('trades')
            .select('total_invested')
            .eq('user_id', user.id)
            .in('status', ['ACTIVE', 'PENDING']) as any) as { data: any[] | null; error: any };
          const activeTrades = activeTradesResult.data;

          const totalExposureUsd = activeTrades?.reduce((sum, t) =>
            sum + (parseFloat(t.total_invested || '0')), 0
          ) || 0;

          const totalEquity = parseFloat(data.total_equity || '0');
          const totalExposurePct = totalEquity > 0
            ? (totalExposureUsd / totalEquity) * 100
            : 0;

          setMetrics({
            totalEquity,
            spotEquity: parseFloat(data.spot_equity || '0'),
            futuresEquity: parseFloat(data.futures_equity || '0'),
            unrealizedPnl: parseFloat(data.unrealized_pnl || '0'),
            realizedPnl: parseFloat(data.realized_pnl || '0'),
            dailyPnl,
            dailyPnlPct: totalEquity > 0 ? (dailyPnl / totalEquity) * 100 : 0,
            totalExposureUsd,
            totalExposurePct
          });
        }
      } catch (err: any) {
        console.error('Error fetching portfolio metrics:', err);
        setError(err.message || 'Failed to fetch metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    // Subscribe to portfolio state updates
    const channel = supabase
      .channel('portfolio-metrics-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users_portfolio_state',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getPnlColor = (value: number) => {
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{t('metrics.error', { error })}</span>
          </div>
        </CardContent>
      </Card >
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">{t('metrics.no_data')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Equity */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>{t('metrics.total_equity')}</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(metrics.totalEquity)}</p>
          </div>

          {/* Daily PnL */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {metrics.dailyPnl >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span>{t('metrics.daily_pnl')}</span>
            </div>
            <div className="flex items-center gap-2">
              <p className={`text-xl font-bold ${getPnlColor(metrics.dailyPnl)}`}>
                {formatCurrency(metrics.dailyPnl)}
              </p>
              <Badge
                variant={metrics.dailyPnlPct >= 0 ? 'default' : 'destructive'}
                className="text-xs"
              >
                {formatPercentage(metrics.dailyPnlPct)}
              </Badge>
            </div>
          </div>

          {/* Unrealized PnL */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {metrics.unrealizedPnl >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span>{t('metrics.unrealized_pnl')}</span>
            </div>
            <p className={`text-xl font-bold ${getPnlColor(metrics.unrealizedPnl)}`}>
              {formatCurrency(metrics.unrealizedPnl)}
            </p>
          </div>

          {/* Exposure */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>{t('metrics.exposure')}</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold">{formatCurrency(metrics.totalExposureUsd)}</p>
              <Badge
                variant={metrics.totalExposurePct > 80 ? 'destructive' : 'default'}
                className="text-xs"
              >
                {formatPercentage(metrics.totalExposurePct)}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

