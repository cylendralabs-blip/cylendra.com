/**
 * Community Signals Feed Page
 * 
 * Phase X.12 - Community Signals System
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SignalCard } from '@/components/community/SignalCard';
import { PublishSignalModal } from '@/components/community/PublishSignalModal';
import { useCommunitySignals } from '@/hooks/useCommunitySignals';
import { Loader2, Filter, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserPlan } from '@/hooks/useUserPlan';
import { FeatureLock } from '@/components/plans/FeatureLock';
import type { CommunitySignal, SignalFilters } from '@/core/community/types';
import { useTranslation } from 'react-i18next';

export default function CommunitySignals() {
  const { t } = useTranslation('signals');
  const { user } = useAuth();
  const { data: userPlan } = useUserPlan();
  const [filters, setFilters] = useState<SignalFilters>({
    limit: 20,
    sort_by: 'newest',
  });
  const [selectedSignal, setSelectedSignal] = useState<CommunitySignal | null>(null);

  const { data: signals = [], isLoading } = useCommunitySignals(filters);

  const handleFilterChange = (key: keyof SignalFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Check if user has access (basic plan feature)
  const hasAccess = userPlan?.features?.signals?.web_basic !== false;

  if (!hasAccess && user) {
    return (
      <FeatureLock
        featureName={t('community_signals.feature_lock.name')}
        requiredPlan="FREE"
        currentPlan={userPlan?.code}
        description={t('community_signals.feature_lock.description')}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-primary" />
            {t('community_signals.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('community_signals.subtitle')}
          </p>
        </div>
        {user && <PublishSignalModal />}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {t('community_signals.filters.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('community_signals.filters.symbol')}</label>
              <Input
                placeholder={t('community_signals.filters.symbol_placeholder')}
                value={filters.symbol || ''}
                onChange={(e) => handleFilterChange('symbol', e.target.value || undefined)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('community_signals.filters.timeframe')}</label>
              <Select
                value={filters.timeframe || 'ALL'}
                onValueChange={(value) => handleFilterChange('timeframe', value === 'ALL' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('community_signals.filters.all')}</SelectItem>
                  <SelectItem value="1m">1m</SelectItem>
                  <SelectItem value="5m">5m</SelectItem>
                  <SelectItem value="15m">15m</SelectItem>
                  <SelectItem value="1h">1h</SelectItem>
                  <SelectItem value="4h">4h</SelectItem>
                  <SelectItem value="1d">1d</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('community_signals.filters.side')}</label>
              <Select
                value={filters.side || 'ALL'}
                onValueChange={(value) => handleFilterChange('side', value === 'ALL' ? undefined : value as 'BUY' | 'SELL')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('community_signals.filters.all')}</SelectItem>
                  <SelectItem value="BUY">{t('community_signals.filters.buy')}</SelectItem>
                  <SelectItem value="SELL">{t('community_signals.filters.sell')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('community_signals.filters.sort')}</label>
              <Select
                value={filters.sort_by || 'newest'}
                onValueChange={(value) => handleFilterChange('sort_by', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t('community_signals.filters.newest')}</SelectItem>
                  <SelectItem value="votes">{t('community_signals.filters.most_voted')}</SelectItem>
                  <SelectItem value="reputation">{t('community_signals.filters.highest_reputation')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.verified_only || false}
                onChange={(e) => handleFilterChange('verified_only', e.target.checked || undefined)}
              />
              {t('community_signals.filters.influencers_only')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.ai_verified || false}
                onChange={(e) => handleFilterChange('ai_verified', e.target.checked || undefined)}
              />
              {t('community_signals.filters.ai_verified_only')}
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Signals Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : signals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t('community_signals.no_signals')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {signals.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              onSelect={setSelectedSignal}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {signals.length > 0 && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setFilters(prev => ({ ...prev, offset: (prev.offset || 0) + (prev.limit || 20) }))}
          >
            {t('community_signals.load_more')}
          </Button>
        </div>
      )}
    </div>
  );
}

