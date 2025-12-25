/**
 * Weight Card Component
 * 
 * Displays influence weight and tier information
 * 
 * Phase 11A: Influence Economy
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Award, BarChart3 } from 'lucide-react';
import { AffiliateAccount } from '@/services/affiliate/types';
import { getTierBenefits, getTierFromWeight } from '@/services/affiliate/weightCalculator';

interface WeightCardProps {
  affiliate: AffiliateAccount;
  stats: any;
}

export const WeightCard = ({ affiliate, stats }: WeightCardProps) => {
  const weight = parseFloat(affiliate.influence_weight?.toString() || '0');
  const tier = affiliate.tier;
  const benefits = getTierBenefits(tier);

  // Calculate progress to next tier
  const tierThresholds: Record<string, number> = {
    bronze: 0,
    silver: 500,
    gold: 2000,
    platinum: 5000,
    diamond: 10000,
  };

  const currentThreshold = tierThresholds[tier] || 0;
  const nextTier = tier === 'bronze' ? 'silver' : tier === 'silver' ? 'gold' : tier === 'gold' ? 'platinum' : 'diamond';
  const nextThreshold = tierThresholds[nextTier] || 10000;
  const progress = ((weight - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Influence Weight
        </CardTitle>
        <CardDescription>
          Your influence power in the ecosystem
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Weight */}
        <div className="text-center p-6 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Current Weight</p>
          <p className="text-4xl font-bold">{weight.toLocaleString()}</p>
          <Badge variant="outline" className="mt-2">
            {tier.toUpperCase()} Tier
          </Badge>
        </div>

        {/* Progress to Next Tier */}
        {tier !== 'diamond' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress to {nextTier.toUpperCase()}</span>
              <span>{Math.max(0, Math.min(100, progress)).toFixed(1)}%</span>
            </div>
            <Progress value={Math.max(0, Math.min(100, progress))} />
            <p className="text-xs text-muted-foreground">
              {Math.max(0, nextThreshold - weight).toFixed(0)} weight needed
            </p>
          </div>
        )}

        {/* Tier Benefits */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Tier Benefits</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">CPA Rate:</span>
              <span className="ml-2 font-semibold">${benefits.cpaRate.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Revenue Share:</span>
              <span className="ml-2 font-semibold">{benefits.revenueSharePct}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">LP Multiplier:</span>
              <span className="ml-2 font-semibold">{benefits.lpMultiplier}x</span>
            </div>
            <div>
              <span className="text-muted-foreground">Token Multiplier:</span>
              <span className="ml-2 font-semibold">{benefits.tokenMultiplier}x</span>
            </div>
          </div>
        </div>

        {/* Weight Factors */}
        {stats && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="font-semibold text-sm">Weight Breakdown</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Users:</span>
                <span>{stats.activeReferrals || 0} × 3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Referrals:</span>
                <span>{stats.totalReferrals || 0} × 1</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

