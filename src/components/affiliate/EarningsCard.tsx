/**
 * Earnings Card Component
 * 
 * Displays affiliate earnings (CPA + Revenue Share)
 * 
 * Phase 11A: Influence Economy
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Download, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AffiliateReward } from '@/services/affiliate/types';
import { useToast } from '@/hooks/use-toast';

interface EarningsCardProps {
  affiliateId: string;
}

export const EarningsCard = ({ affiliateId }: EarningsCardProps) => {
  const { toast } = useToast();
  const [rewards, setRewards] = useState<AffiliateReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    loadRewards();
  }, [affiliateId]);

  const loadRewards = async () => {
    try {
      // Use type assertion to avoid deep type inference issues
      // The affiliate_rewards table exists but isn't in generated types yet
      const rewardsResult = await (supabase
        .from('affiliate_rewards' as any)
        .select('*')
        .eq('affiliate_id', affiliateId)
        .order('created_at', { ascending: false })
        .limit(50) as any) as { data: AffiliateReward[] | null; error: any };

      if (rewardsResult.error) throw rewardsResult.error;
      setRewards(rewardsResult.data || []);
    } catch (error: any) {
      console.error('Error loading rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const { data, error } = await supabase.functions.invoke('affiliate-claim', {
        body: { claimType: 'cash' },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Success',
          description: `Claimed $${data.claimed_amount.toFixed(2)}`,
        });
        loadRewards();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to claim',
        variant: 'destructive',
      });
    } finally {
      setClaiming(false);
    }
  };

  const pendingRewards = rewards.filter(r => r.status === 'pending' || r.status === 'approved');
  const totalPending = pendingRewards.reduce((sum, r) => sum + parseFloat(r.amount_usd.toString()), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Earnings</CardTitle>
          {totalPending > 0 && (
            <Button onClick={handleClaim} disabled={claiming} size="sm">
              {claiming ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Claim ${totalPending.toFixed(2)}
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rewards.map((reward) => (
              <TableRow key={reward.id}>
                <TableCell>
                  {new Date(reward.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{reward.reward_type}</Badge>
                </TableCell>
                <TableCell className="font-semibold">
                  ${parseFloat(reward.amount_usd.toString()).toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      reward.status === 'paid'
                        ? 'default'
                        : reward.status === 'approved'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {reward.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {reward.description || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

