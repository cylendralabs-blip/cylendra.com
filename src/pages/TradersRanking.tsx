/**
 * Top Traders Ranking Page
 * 
 * Phase X.12 - Community Signals System
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTraderRanking } from '@/hooks/useTraderRanking';
import { Loader2, Trophy, Crown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RankingFilters, RankLevel } from '@/core/community/types';

const rankColors: Record<RankLevel, string> = {
  Newbie: 'bg-gray-500/15 text-gray-500 border-gray-500/30',
  Skilled: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  Pro: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
  Elite: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  Master: 'bg-orange-500/15 text-orange-500 border-orange-500/30',
  Legend: 'bg-red-500/15 text-red-500 border-red-500/30',
};

const rankIcons: Record<RankLevel, any> = {
  Newbie: null,
  Skilled: null,
  Pro: null,
  Elite: Trophy,
  Master: Crown,
  Legend: Crown,
};

import { useTranslation } from 'react-i18next';

export default function TradersRanking() {
  const { t } = useTranslation('copy_trading');
  const [filters, setFilters] = useState<RankingFilters>({
    limit: 50,
  });

  const { data: rankings = [], isLoading } = useTraderRanking(filters);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="w-8 h-8 text-primary" />
          {t('traders_ranking.title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('traders_ranking.subtitle')}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('traders_ranking.filters.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('traders_ranking.filters.rank')}</label>
              <Select
                value={filters.rank || 'ALL'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, rank: value === 'ALL' ? undefined : value as RankLevel }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('traders_ranking.filters.all')}</SelectItem>
                  <SelectItem value="Newbie">Newbie</SelectItem>
                  <SelectItem value="Skilled">Skilled</SelectItem>
                  <SelectItem value="Pro">Pro</SelectItem>
                  <SelectItem value="Elite">Elite</SelectItem>
                  <SelectItem value="Master">Master</SelectItem>
                  <SelectItem value="Legend">Legend</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('traders_ranking.filters.min_reputation')}</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-md"
                value={filters.min_reputation || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, min_reputation: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('traders_ranking.filters.min_win_rate')}</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-md"
                value={filters.min_win_rate || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, min_win_rate: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="0"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.influencer_only || false}
                onChange={(e) => setFilters(prev => ({ ...prev, influencer_only: e.target.checked || undefined }))}
              />
              {t('traders_ranking.filters.influencer_only')}
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Rankings Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('traders_ranking.table.rank')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : rankings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('traders_ranking.table.no_results')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('traders_ranking.table.rank')}</TableHead>
                  <TableHead>{t('traders_ranking.table.user')}</TableHead>
                  <TableHead>{t('traders_ranking.table.level')}</TableHead>
                  <TableHead>{t('traders_ranking.table.win_rate')}</TableHead>
                  <TableHead>{t('traders_ranking.table.avg_return')}</TableHead>
                  <TableHead>{t('traders_ranking.table.reputation')}</TableHead>
                  <TableHead>{t('traders_ranking.table.weight')}</TableHead>
                  <TableHead>{t('traders_ranking.table.lp_points')}</TableHead>
                  <TableHead>{t('traders_ranking.table.signals')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankings.map((trader, index) => {
                  const RankIcon = rankIcons[trader.rank];
                  return (
                    <TableRow key={trader.user_id}>
                      <TableCell className="font-bold">#{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {trader.verified && (
                            <Crown className="w-4 h-4 text-purple-500" />
                          )}
                          <span>{trader.user?.email || trader.user_id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(rankColors[trader.rank])}>
                          {RankIcon && <RankIcon className="w-3 h-3 mr-1" />}
                          {trader.rank}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          'font-semibold',
                          trader.win_rate >= 60 ? 'text-emerald-500' :
                            trader.win_rate >= 50 ? 'text-amber-500' : 'text-red-500'
                        )}>
                          {trader.win_rate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          'font-semibold',
                          trader.avg_return > 0 ? 'text-emerald-500' : 'text-red-500'
                        )}>
                          {trader.avg_return > 0 ? '+' : ''}{trader.avg_return.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell>{trader.reputation_score}</TableCell>
                      <TableCell>{trader.weight.toFixed(1)}</TableCell>
                      <TableCell>{trader.lp_points}</TableCell>
                      <TableCell>{trader.total_signals}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

