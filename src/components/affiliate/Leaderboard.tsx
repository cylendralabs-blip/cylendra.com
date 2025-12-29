/**
 * Leaderboard Component
 * 
 * Displays affiliate leaderboard rankings
 * 
 * Phase 11A: Influence Economy
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LeaderboardEntry } from '@/services/affiliate/types';

export const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('current');

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('affiliate-leaderboard', {
        body: { period, limit: 50 },
      });

      if (error) throw error;

      if (data.success) {
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error: any) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-orange-500" />;
    return <span className="text-muted-foreground">#{rank}</span>;
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      diamond: 'text-blue-500',
      platinum: 'text-gray-400',
      gold: 'text-yellow-500',
      silver: 'text-gray-300',
      bronze: 'text-orange-600',
    };
    return colors[tier] || 'text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Leaderboard</CardTitle>
            <CardDescription>
              Top affiliates by influence weight
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={period === 'current' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('current')}
            >
              Current
            </Button>
            <Button
              variant={period === 'last_month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('last_month')}
            >
              Last Month
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.affiliate_id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                index < 3 ? 'bg-muted' : ''
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-8 text-center">
                  {getRankIcon(entry.rank)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {entry.affiliate?.affiliate_key || entry.affiliate?.referral_code || 'Anonymous'}
                    </span>
                    <Badge variant="outline" className={getTierColor(entry.affiliate?.tier || 'bronze')}>
                      {(entry.affiliate?.tier || 'bronze').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>{entry.total_referrals} referrals</span>
                    <span>{entry.active_referrals} active</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 font-semibold">
                  <TrendingUp className="h-4 w-4" />
                  {entry.influence_weight.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  ${entry.total_earnings_usd.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

