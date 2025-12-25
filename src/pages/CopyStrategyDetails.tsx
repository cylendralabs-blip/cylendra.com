/**
 * Copy Strategy Details Page
 * 
 * Phase X.17 - Copy Trading System
 * 
 * View detailed information about a copy strategy and follow it
 */

import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, TrendingUp, Users, Shield, Zap, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { logFeatureUsage } from '@/services/admin/FeatureUsageService';
import { updateUserFunnelStage } from '@/services/admin/UserFunnelService';

import { useTranslation } from 'react-i18next';

export default function CopyStrategyDetails() {
  const { t } = useTranslation('copy_trading');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: strategy, isLoading } = useQuery({
    queryKey: ['copy-strategy', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('copy_strategies')
        .select(`
          *,
          performance:copy_strategy_performance(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: isFollowing } = useQuery({
    queryKey: ['copy-follower', id, user?.id],
    queryFn: async () => {
      if (!user || !id) return false;
      const { data, error } = await (supabase as any)
        .from('copy_followers')
        .select('id, status')
        .eq('strategy_id', id)
        .eq('follower_user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return (data as { status?: string } | null)?.status === 'ACTIVE';
    },
    enabled: !!user && !!id,
  });

  const followMutation = useMutation({
    mutationFn: async (config: any) => {
      const { data, error } = await supabase.functions.invoke('copy-follow-strategy', {
        body: {
          strategy_id: id,
          ...config,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      toast({
        title: t('details.follow.success.title'),
        description: t('details.follow.success.message'),
      });
      queryClient.invalidateQueries({ queryKey: ['copy-follower'] });
      queryClient.invalidateQueries({ queryKey: ['copy-strategies-public'] });

      // Phase Admin C: Log feature usage and update funnel
      if (user?.id) {
        try {
          await Promise.all([
            logFeatureUsage(user.id, 'copy_trading'),
            updateUserFunnelStage(user.id, 'first_feature_used'),
          ]);
        } catch (e) {
          console.error('Error logging feature usage:', e);
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: t('details.follow.error.title'),
        description: error.message || t('details.follow.error.message'),
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t('details.not_found')}</p>
            <Button className="mt-4" onClick={() => navigate('/dashboard/copy-market')}>
              {t('details.back_to_market')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const performance = strategy.performance || {};

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/dashboard/copy-market')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{strategy.name}</h1>
          <p className="text-muted-foreground">{strategy.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>{t('details.performance.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('details.performance.win_rate')}</p>
                  <p className="text-2xl font-bold">{performance.win_rate?.toFixed(1) || 0}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('details.performance.return_30d')}</p>
                  <p className={cn(
                    'text-2xl font-bold',
                    (performance.last_30d_return || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  )}>
                    {(performance.last_30d_return || 0).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('details.performance.return_7d')}</p>
                  <p className={cn(
                    'text-2xl font-bold',
                    (performance.last_7d_return || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  )}>
                    {(performance.last_7d_return || 0).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('details.performance.max_drawdown')}</p>
                  <p className="text-2xl font-bold text-red-500">
                    {(performance.max_drawdown || 0).toFixed(2)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategy Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('details.info.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{t('details.info.type', { type: strategy.strategy_type })}</Badge>
                {strategy.risk_label && (
                  <Badge className={cn(
                    strategy.risk_label === 'LOW' ? 'bg-green-500/15 text-green-500' :
                      strategy.risk_label === 'MEDIUM' ? 'bg-yellow-500/15 text-yellow-500' :
                        'bg-red-500/15 text-red-500'
                  )}>
                    {strategy.risk_label}
                  </Badge>
                )}
              </div>
              {strategy.min_deposit > 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('details.info.min_deposit', { amount: strategy.min_deposit.toFixed(2) })}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Follow Action */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>{t('details.follow.title')}</CardTitle>
              <CardDescription>
                {t('details.follow.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isFollowing ? (
                <div className="space-y-2">
                  <Badge className="w-full justify-center py-2">
                    <Check className="w-4 h-4 mr-2" />
                    {t('details.follow.following')}
                  </Badge>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/dashboard/my-copying')}
                  >
                    {t('details.follow.manage')}
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => followMutation.mutate({
                    allocation_mode: 'PERCENT',
                    allocation_value: 10,
                    max_daily_loss: 5,
                    max_total_loss: 20,
                    max_open_trades: 10,
                    max_leverage: 3,
                    risk_multiplier: 1,
                  })}
                  disabled={followMutation.isPending}
                >
                  {followMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('details.follow.following_loading')}
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      {t('details.follow.start_now')}
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

