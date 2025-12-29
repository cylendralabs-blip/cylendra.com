/**
 * Referral Links Component
 * 
 * Displays referral links and codes with copy functionality
 * 
 * Phase 11A: Influence Economy
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link as LinkIcon, Copy, CheckCircle2, QrCode, ExternalLink } from 'lucide-react';
import { AffiliateAccount } from '@/services/affiliate/types';
import { generateReferralLink } from '@/services/affiliate/referralService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReferralLinksProps {
  affiliate: AffiliateAccount;
  showList?: boolean;
}

export const ReferralLinks = ({ affiliate, showList = false }: ReferralLinksProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin
    : 'https://app.cylendra.com';
  
  const referralLink = generateReferralLink(baseUrl, affiliate.referral_code);

  useEffect(() => {
    if (showList) {
      loadReferrals();
    }
  }, [showList, affiliate.id]);

  const loadReferrals = async () => {
    try {
      // Use type assertion to avoid deep type inference issues
      // The affiliate_users table exists but isn't in generated types yet
      const referralsResult = await (supabase
        .from('affiliate_users' as any)
        .select('*, referred_user_id')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false })
        .limit(50) as any) as { data: any[] | null; error: any };

      if (referralsResult.error) throw referralsResult.error;
      setReferrals(referralsResult.data || []);
    } catch (error: any) {
      console.error('Error loading referrals:', error);
    }
  };

  const handleCopy = (text: string, type: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopied(type);
    toast({
      title: 'Copied',
      description: `${type} copied to clipboard`,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Referral Links</CardTitle>
          <CardDescription>
            Share these links to earn rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Referral Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Referral Code</label>
            <div className="flex gap-2">
              <Input value={affiliate.referral_code} readOnly />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(affiliate.referral_code, 'Referral code')}
              >
                {copied === 'code' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Referral Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Referral Link</label>
            <div className="flex gap-2">
              <Input value={referralLink} readOnly />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(referralLink, 'Referral link')}
              >
                {copied === 'link' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Affiliate Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Affiliate Key</label>
            <div className="flex gap-2">
              <Input value={affiliate.affiliate_key} readOnly />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(affiliate.affiliate_key, 'Affiliate key')}
              >
                {copied === 'key' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1">
              <QrCode className="h-4 w-4 mr-2" />
              Generate QR Code
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referrals List */}
      {showList && (
        <Card>
          <CardHeader>
            <CardTitle>Your Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Bot Active</TableHead>
                  <TableHead>Earnings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell>
                      {new Date(referral.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          referral.status === 'active'
                            ? 'default'
                            : referral.status === 'verified'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {referral.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{referral.referral_source}</TableCell>
                    <TableCell>
                      {referral.is_premium ? (
                        <Badge variant="default">Yes</Badge>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {referral.bot_activated ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <span className="text-muted-foreground">Inactive</span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${(
                        parseFloat(referral.cpa_earned_usd?.toString() || '0') +
                        parseFloat(referral.revenue_share_earned_usd?.toString() || '0')
                      ).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

