/**
 * Open Positions Summary
 * 
 * Compact summary of open positions for dashboard
 * Shows: count, best/worst position, total open PnL
 * 
 * Phase 10: UI/UX Improvement - Task 2
 */

import { useEffect, useMemo, useState, memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';

interface PositionSummary {
  id: string;
  symbol: string;
  unrealized_pnl: number | null;
}

export const OpenPositionsSummary = memo(() => {
  const { t } = useTranslation('dashboard');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [positions, setPositions] = useState<PositionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadPositions = async () => {
      try {
        const { data, error } = await supabase
          .from('trades')
          .select('id, symbol, unrealized_pnl')
          .eq('user_id', user.id)
          .eq('status', 'ACTIVE')
          .order('opened_at', { ascending: false });

        if (error) {
          console.error('Error loading positions:', error);
          return;
        }

        if (data) {
          setPositions(data as PositionSummary[]);
        }
      } catch (error) {
        console.error('Error loading positions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPositions();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('positions-summary')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadPositions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const { totalOpenPnL, bestPosition, worstPosition } = useMemo(() => {
    if (positions.length === 0) {
      return {
        totalOpenPnL: 0,
        bestPosition: null,
        worstPosition: null
      };
    }

    let total = 0;
    let best = positions[0];
    let worst = positions[0];

    for (const position of positions) {
      const pnl = position.unrealized_pnl || 0;
      total += pnl;

      if ((position.unrealized_pnl || 0) > (best.unrealized_pnl || 0)) {
        best = position;
      }

      if ((position.unrealized_pnl || 0) < (worst.unrealized_pnl || 0)) {
        worst = position;
      }
    }

    return {
      totalOpenPnL: total,
      bestPosition: best,
      worstPosition: worst
    };
  }, [positions]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <DashboardSectionHeader
            icon={<Activity className="h-4 w-4" />}
            title={t('open_positions.title')}
            actions={
              <Badge variant="outline">
                {positions.length} {positions.length === 1 ? t('open_positions.position') : t('open_positions.positions')}
              </Badge>
            }
          />
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <DashboardSectionHeader
          icon={<Activity className="h-4 w-4" />}
          title={t('open_positions.title')}
          actions={
            <Badge variant="outline">
              {positions.length} {positions.length === 1 ? t('open_positions.position') : t('open_positions.positions')}
            </Badge>
          }
        />
      </CardHeader>
      <CardContent>
        {positions.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('open_positions.no_positions')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Total Open PnL */}
            <div>
              <div className="text-sm text-muted-foreground mb-1">{t('open_positions.total_pnl')}</div>
              <div className={`text-2xl font-bold ${totalOpenPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalOpenPnL >= 0 ? '+' : ''}${totalOpenPnL.toFixed(2)}
              </div>
            </div>

            {/* Best Position */}
            {bestPosition && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">{t('open_positions.best')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{bestPosition.symbol}</span>
                  <span className="text-sm font-bold text-green-600">
                    +${(bestPosition.unrealized_pnl || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Worst Position */}
            {worstPosition && worstPosition.id !== bestPosition?.id && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-600">{t('open_positions.worst')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{worstPosition.symbol}</span>
                  <span className="text-sm font-bold text-red-600">
                    ${(worstPosition.unrealized_pnl || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* View All Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/dashboard/portfolio')}
            >
              {t('open_positions.view_all')}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

OpenPositionsSummary.displayName = 'OpenPositionsSummary';

