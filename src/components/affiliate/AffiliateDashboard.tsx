/**
 * Affiliate Dashboard Component
 * 
 * Main dashboard for affiliates showing stats, earnings, referrals, etc.
 * 
 * Phase 11A: Influence Economy - Task 5
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  Users,
  DollarSign,
  Award,
  Coins,
  Cpu,
  BarChart3,
  Target,
  Link as LinkIcon,
  Copy,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AffiliateAccount } from '@/services/affiliate/types';
import { EarningsCard } from './EarningsCard';
import { ReferralLinks } from './ReferralLinks';
import { CPUUnitsCard } from './CPUUnitsCard';
import { LPCard } from './LPCard';
import { TokensCard } from './TokensCard';
import { WeightCard } from './WeightCard';
import { MissionsPanel } from './MissionsPanel';
import { Leaderboard } from './Leaderboard';
import { CampaignManager } from './CampaignManager';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface DashboardStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  totalLP: number;
  totalCPU: number;
  totalCPUValue: number;
  totalTokens: number;
  pendingTokens: number;
  influenceWeight: number;
  tier: string;
}

export const AffiliateDashboard = () => {
  const { t } = useTranslation('affiliate');
  const { user } = useAuth();
  const { toast } = useToast();
  const [affiliate, setAffiliate] = useState<AffiliateAccount | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [user]);

  const loadDashboard = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('affiliate-dashboard', {
        body: {},
      });

      if (error) {
        // If it's a 404, user doesn't have affiliate account yet - this is normal
        if (error.status === 404 || error.message?.includes('not found')) {
          setAffiliate(null);
          setStats(null);
          return;
        }
        throw error;
      }

      if (data && data.success) {
        setAffiliate(data.affiliate);
        setStats(data.stats);
      } else {
        setAffiliate(null);
        setStats(null);
      }
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      // Only show error if it's not a "not found" error
      if (!error.message?.includes('not found') && error.status !== 404) {
        toast({
          title: 'Error',
          description: error.message || t('errors.load_failed'),
          variant: 'destructive',
        });
      }
      setAffiliate(null);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('affiliate-register', {
        body: {},
      });

      if (error) {
        // If account already exists, just reload dashboard
        if (error.message?.includes('already exists')) {
          await loadDashboard();
          return;
        }
        throw error;
      }

      if (data && data.success) {
        toast({
          title: 'Success',
          description: t('register.success'),
        });
        await loadDashboard();
      }
    } catch (error: any) {
      console.error('Error registering affiliate:', error);
      toast({
        title: 'خطأ',
        description: error.message || t('register.error'),
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('register.title')}</CardTitle>
            <CardDescription>
              {t('register.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRegister} size="lg" className="w-full">
              {t('register.button')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {t(`tiers.${affiliate.tier}`, affiliate.tier.toUpperCase())} Tier
        </Badge>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.total_referrals')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stats.totalReferrals}</div>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('stats.active', { count: stats.activeReferrals })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.total_earnings')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('stats.pending', { amount: stats.pendingEarnings.toFixed(2) })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.loyalty_points')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stats.totalLP.toLocaleString()}</div>
                <Coins className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.cpu_units')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stats.totalCPU.toFixed(2)}</div>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('stats.value', { amount: stats.totalCPUValue.toFixed(2) })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.influence_tokens')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stats.totalTokens.toFixed(2)}</div>
                <Coins className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pendingTokens.toFixed(2)} {t('stats.pending_release').replace('{{count}}', '')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7">
          <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
          <TabsTrigger value="earnings">{t('tabs.earnings')}</TabsTrigger>
          <TabsTrigger value="referrals">{t('tabs.referrals')}</TabsTrigger>
          <TabsTrigger value="cpu">{t('tabs.cpu')}</TabsTrigger>
          <TabsTrigger value="tokens">{t('tabs.tokens')}</TabsTrigger>
          <TabsTrigger value="missions">{t('tabs.missions')}</TabsTrigger>
          <TabsTrigger value="leaderboard">{t('tabs.leaderboard')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <WeightCard affiliate={affiliate} stats={stats} />
            <ReferralLinks affiliate={affiliate} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LPCard />
            <TokensCard affiliateId={affiliate.id} />
          </div>
          <CampaignManager affiliateId={affiliate.id} />
        </TabsContent>

        <TabsContent value="earnings">
          <EarningsCard affiliateId={affiliate.id} />
        </TabsContent>

        <TabsContent value="referrals">
          <ReferralLinks affiliate={affiliate} showList />
        </TabsContent>

        <TabsContent value="cpu">
          <CPUUnitsCard affiliateId={affiliate.id} />
        </TabsContent>

        <TabsContent value="tokens">
          <TokensCard affiliateId={affiliate.id} />
        </TabsContent>

        <TabsContent value="missions">
          <MissionsPanel affiliateId={affiliate.id} />
        </TabsContent>

        <TabsContent value="leaderboard">
          <Leaderboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

