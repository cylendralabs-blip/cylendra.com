/**
 * Tokens Card Component
 *
 * Displays influence token rewards and balances
 *
 * Phase 11A: Influence Economy
 */

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Coins, RefreshCw } from 'lucide-react';
import {
  TokenReward,
  TokenRewardStatus,
} from '@/services/affiliate/types';
import {
  calculateTokenTotals,
  fetchTokenRewards,
  TokenTotals,
} from '@/services/affiliate/tokenService';

interface TokensCardProps {
  affiliateId: string;
}

const STATUS_LABELS: Record<TokenRewardStatus, string> = {
  pending: 'قيد المراجعة',
  allocated: 'مخصصة',
  vested: 'قابلة للسحب',
  claimed: 'تم السحب',
  forfeited: 'ملغاة',
};

export const TokensCard = ({ affiliateId }: TokensCardProps) => {
  const [rewards, setRewards] = useState<TokenReward[]>([]);
  const [totals, setTotals] = useState<TokenTotals>({
    total: 0,
    pending: 0,
    allocated: 0,
    vested: 0,
    claimed: 0,
    forfeited: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (affiliateId) {
      loadTokens();
    }
  }, [affiliateId]);

  const loadTokens = async () => {
    setLoading(true);
    try {
      const data = await fetchTokenRewards(affiliateId, 50);
      setRewards(data);
      setTotals(calculateTokenTotals(data));
    } catch (error) {
      console.error('Error loading token rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Influence Tokens
          </CardTitle>
          <CardDescription>
            مكافآت التوكن المخصصة لحساب الإحالة الخاص بك
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={loadTokens}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 bg-muted/40">
            <p className="text-xs text-muted-foreground">إجمالي التوكن</p>
            <p className="text-2xl font-semibold">{totals.total.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border p-3 bg-muted/40">
            <p className="text-xs text-muted-foreground">قيد الانتظار</p>
            <p className="text-2xl font-semibold">
              {(totals.pending + totals.allocated).toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg border p-3 bg-muted/40">
            <p className="text-xs text-muted-foreground">قابلة للسحب</p>
            <p className="text-2xl font-semibold">
              {(totals.vested + totals.claimed).toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg border p-3 bg-muted/40">
            <p className="text-xs text-muted-foreground">تم سحبها</p>
            <p className="text-2xl font-semibold">{totals.claimed.toFixed(2)}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">أحدث المكافآت</h4>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>المقدار</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rewards.map((reward) => (
                <TableRow key={reward.id}>
                  <TableCell>{new Date(reward.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{reward.reward_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        reward.status === 'claimed'
                          ? 'default'
                          : reward.status === 'pending'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {STATUS_LABELS[reward.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {reward.token_amount.toFixed(2)} TOK
                  </TableCell>
                </TableRow>
              ))}
              {rewards.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    لا توجد مكافآت حالياً
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

