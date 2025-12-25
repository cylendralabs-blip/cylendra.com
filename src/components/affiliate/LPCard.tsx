/**
 * LP (Loyalty Points) Card Component
 * 
 * Displays LP balance, transactions, and redemption options
 * 
 * Phase 11A: Influence Economy
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Coins, TrendingUp, TrendingDown, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LPTransaction } from '@/services/affiliate/types';
import { useAuth } from '@/hooks/useAuth';

export const LPCard = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<LPTransaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLPData();
    }
  }, [user]);

  const loadLPData = async () => {
    if (!user) return;

    try {
      // Use type assertion to avoid deep type inference issues
      // The lp_transactions table exists but isn't in generated types yet
      const lpTransactionsResult = await (supabase
        .from('lp_transactions' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50) as any) as { data: LPTransaction[] | null; error: any };

      if (lpTransactionsResult.error) throw lpTransactionsResult.error;

      const data = lpTransactionsResult.data;
      setTransactions(data || []);

      // Calculate balance
      const calculatedBalance = (data || []).reduce((balance, tx) => {
        if (tx.transaction_type === 'earn' || tx.transaction_type === 'bonus') {
          return balance + tx.lp_amount;
        } else {
          return balance - tx.lp_amount;
        }
      }, 0);

      setBalance(calculatedBalance);
    } catch (error: any) {
      console.error('Error loading LP data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Loyalty Points
        </CardTitle>
        <CardDescription>
          Earn LP from referrals, activity, and missions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance */}
        <div className="text-center p-6 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Your Balance</p>
          <p className="text-4xl font-bold">{balance.toLocaleString()} LP</p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            <Gift className="h-4 w-4 mr-2" />
            Redeem LP
          </Button>
        </div>

        {/* Transactions */}
        <div>
          <h4 className="font-semibold mb-2">Recent Transactions</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    {new Date(tx.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {tx.transaction_type === 'earn' || tx.transaction_type === 'bonus' ? (
                      <Badge variant="default" className="gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {tx.transaction_type}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <TrendingDown className="h-3 w-3" />
                        {tx.transaction_type}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {tx.transaction_type === 'earn' || tx.transaction_type === 'bonus' ? '+' : '-'}
                    {tx.lp_amount.toLocaleString()} LP
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{tx.source}</Badge>
                  </TableCell>
                  <TableCell>{tx.balance_after.toLocaleString()} LP</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

