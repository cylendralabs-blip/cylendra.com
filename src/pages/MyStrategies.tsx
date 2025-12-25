/**
 * My Strategies Page
 * 
 * Phase X.17 - Copy Trading System
 * 
 * View and manage your copy trading strategies (for masters)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

export default function MyStrategies() {
  const { t } = useTranslation('copy_trading');
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: strategies = [], isLoading } = useQuery({
    queryKey: ['my-copy-strategies', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from('copy_strategies')
        .select(`
          *,
          performance:copy_strategy_performance(*)
        `)
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('my_strategies.title')}</h1>
          <p className="text-muted-foreground">{t('my_strategies.subtitle')}</p>
        </div>
        <Button onClick={() => navigate('/dashboard/copy-strategy/new')}>
          <Plus className="w-4 h-4 mr-2" />
          {t('my_strategies.new_strategy')}
        </Button>
      </div>

      {strategies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">{t('my_strategies.no_strategies')}</p>
            <Button onClick={() => navigate('/dashboard/copy-strategy/new')}>
              {t('my_strategies.create_first')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {strategies.map((strategy: any) => (
            <Card key={strategy.id} className="hover:shadow-lg transition cursor-pointer" onClick={() => navigate(`/dashboard/copy-strategy/${strategy.id}/manage`)}>
              <CardHeader>
                <CardTitle>{strategy.name}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={strategy.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {strategy.status === 'ACTIVE' ? t('my_strategies.badges.active') : t('my_strategies.badges.inactive')}
                  </Badge>
                  {strategy.is_public && <Badge variant="outline">{t('my_strategies.badges.public')}</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4" />
                    <span>{t('my_strategies.stats.followers', { count: strategy.performance?.total_copiers || 0 })}</span>
                  </div>
                  {strategy.performance && (
                    <div className="text-sm">
                      <p>{t('my_strategies.stats.win_rate', { rate: strategy.performance.win_rate?.toFixed(1) || 0 })}</p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dashboard/copy-strategy/${strategy.id}/manage`);
                    }}
                  >
                    {t('my_strategies.manage')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

