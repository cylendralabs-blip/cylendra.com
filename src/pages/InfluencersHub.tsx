/**
 * Influencers Hub Page
 * 
 * Phase X.12 - Community Signals System
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Crown, TrendingUp, Users, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VerifiedInfluencer } from '@/core/community/types';
import { useTranslation } from 'react-i18next';

const influencerLevelColors: Record<string, string> = {
  Bronze: 'bg-amber-600/15 text-amber-600 border-amber-600/30',
  Silver: 'bg-gray-400/15 text-gray-400 border-gray-400/30',
  Gold: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30',
  Elite: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
};

export default function InfluencersHub() {
  const { t } = useTranslation('signals');
  const { data: influencers = [], isLoading } = useQuery<VerifiedInfluencer[], Error>({
    queryKey: ['verified-influencers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('verified_influencers' as any)
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: false })
        .order('total_followers', { ascending: false });

      if (error) throw error;

      const influencers = ((data || []) as unknown as VerifiedInfluencer[]);
      if (influencers.length === 0) return [];

      const { data: statsData, error: statsError } = await (supabase as any)
        .from('community_trader_stats')
        .select(
          `
          user_id,
          win_rate,
          avg_return,
          reputation_score,
          rank,
          total_signals
        `
        )
        .in(
          'user_id',
          influencers.map((inf) => inf.user_id)
        );

      if (statsError) throw statsError;

      const statsArray = (statsData || []) as any[];
      const statsMap = new Map(statsArray.map((stat: any) => [stat.user_id, stat]));

      return influencers.map((influencer) => ({
        ...influencer,
        stats: statsMap.get(influencer.user_id),
      })) as VerifiedInfluencer[];
    },
    staleTime: 60000,
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Crown className="w-8 h-8 text-primary" />
          {t('influencers.title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('influencers.subtitle')}
        </p>
      </div>

      {/* Influencers Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : influencers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t('influencers.no_influencers')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {influencers.map((influencer) => (
            <Card key={influencer.user_id} className="hover:shadow-lg transition">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-purple-500" />
                      {influencer.user?.email || influencer.user_id}
                    </CardTitle>
                    <Badge className={cn('mt-2', influencerLevelColors[influencer.level])}>
                      {influencer.level}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {influencer.bio && (
                  <p className="text-sm text-muted-foreground">{influencer.bio}</p>
                )}

                {influencer.stats && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t('my_signals.stats.win_rate')}:</span>
                      <span className="font-semibold ml-2">
                        {influencer.stats.win_rate?.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('my_signals.stats.avg_return')}:</span>
                      <span className="font-semibold ml-2">
                        {influencer.stats.avg_return?.toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('my_signals.stats.rank')}:</span>
                      <span className="font-semibold ml-2">{influencer.stats.rank}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('influencers.signals_count', { count: 0 }).replace('0', '').replace('{{count}}', '').trim()}:</span>
                      <span className="font-semibold ml-2">{influencer.stats.total_signals}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{t('influencers.followers', { count: influencer.total_followers })}</span>
                  </div>
                </div>

                {influencer.social_links && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    {influencer.social_links.twitter && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={influencer.social_links.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Twitter
                        </a>
                      </Button>
                    )}
                    {influencer.social_links.telegram && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={influencer.social_links.telegram}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Telegram
                        </a>
                      </Button>
                    )}
                  </div>
                )}

                <Button variant="outline" className="w-full">
                  {t('influencers.follow')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

