/**
 * Copy Marketplace Page
 * 
 * Phase X.17 - Copy Trading System
 * 
 * Browse and discover copy trading strategies
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, TrendingUp, Users, ArrowRight, Shield, Zap, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import CopyTradingOnboarding from '@/components/copy-trading/CopyTradingOnboarding';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useTranslation } from 'react-i18next';

export default function CopyMarketplace() {
  const { t } = useTranslation('copy_trading');
  const navigate = useNavigate();
  const { data: copyTradingEnabled = true, isLoading: flagLoading } = useFeatureFlag('copy_trading');

  // Phase Admin B: Check if copy trading feature is enabled
  if (!flagLoading && !copyTradingEnabled) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="w-5 h-5" />
              {t('marketplace.feature_disabled.title')}
            </CardTitle>
            <CardDescription>
              {t('marketplace.feature_disabled.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('marketplace.feature_disabled.message')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: strategies = [], isLoading } = useQuery({
    queryKey: ['copy-strategies-public'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('copy_strategies')
        .select(`
          *,
          performance:copy_strategy_performance(*)
        `)
        .eq('is_public', true)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
  });

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'LOW':
        return 'bg-green-500/15 text-green-500 border-green-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30';
      case 'HIGH':
        return 'bg-red-500/15 text-red-500 border-red-500/30';
      default:
        return 'bg-gray-500/15 text-gray-500 border-gray-500/30';
    }
  };

  const formatStrategyType = (type: string) => {
    const types: Record<string, string> = {
      AI_MASTER: 'AI Master',
      HUMAN_BOT: 'Human + Bot',
      INFLUENCER: 'Influencer',
    };
    return types[type] || type;
  };

  return (
    <>
      <CopyTradingOnboarding />
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-primary" />
            {t('marketplace.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('marketplace.subtitle')}
          </p>
        </div>

        {/* Strategies Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : strategies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">{t('marketplace.no_strategies')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategies.map((strategy: any) => (
              <Card key={strategy.id} className="hover:shadow-lg transition cursor-pointer" onClick={() => navigate(`/dashboard/copy-strategy/${strategy.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        {strategy.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {strategy.description || t('marketplace.no_description')}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline">{formatStrategyType(strategy.strategy_type)}</Badge>
                    {strategy.risk_label && (
                      <Badge className={cn(getRiskColor(strategy.risk_label))}>
                        {String(t(`marketplace.risk.${strategy.risk_label.toLowerCase()}`, strategy.risk_label))}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Performance Metrics */}
                    {strategy.performance && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">{t('marketplace.metrics.win_rate')}</p>
                          <p className="font-semibold">{strategy.performance.win_rate?.toFixed(1) || 0}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t('marketplace.metrics.return_30d')}</p>
                          <p className={cn(
                            'font-semibold',
                            (strategy.performance.last_30d_return || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                          )}>
                            {(strategy.performance.last_30d_return || 0).toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t('marketplace.metrics.max_drawdown')}</p>
                          <p className="font-semibold text-red-500">
                            {(strategy.performance.max_drawdown || 0).toFixed(2)}%
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <p className="text-muted-foreground">{t('marketplace.metrics.copiers')}</p>
                          <p className="font-semibold">{strategy.performance.total_copiers || 0}</p>
                        </div>
                      </div>
                    )}

                    {/* Min Deposit */}
                    {strategy.min_deposit > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                          {t('marketplace.min_deposit', { amount: strategy.min_deposit.toFixed(2) })}
                        </p>
                      </div>
                    )}

                    <Button className="w-full" onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dashboard/copy-strategy/${strategy.id}`);
                    }}>
                      {t('marketplace.view_details')}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

