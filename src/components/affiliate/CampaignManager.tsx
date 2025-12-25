/**
 * Campaign Manager Component
 * 
 * Manages UTM campaigns and tracking
 * 
 * Phase 11A: Influence Economy
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ExternalLink, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Campaign } from '@/services/affiliate/types';
import { generateReferralLink } from '@/services/affiliate/referralService';
import { useToast } from '@/hooks/use-toast';

interface CampaignManagerProps {
  affiliateId: string;
}

export const CampaignManager = ({ affiliateId }: CampaignManagerProps) => {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    campaign_name: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
  });

  useEffect(() => {
    loadCampaigns();
  }, [affiliateId]);

  const loadCampaigns = async () => {
    try {
      // Use type assertion to avoid deep type inference issues
      // The affiliate_campaigns table exists but isn't in generated types yet
      const campaignsResult = await (supabase
        .from('affiliate_campaigns' as any)
        .select('*')
        .eq('affiliate_id', affiliateId)
        .order('created_at', { ascending: false }) as any) as { data: Campaign[] | null; error: any };

      if (campaignsResult.error) throw campaignsResult.error;
      setCampaigns(campaignsResult.data || []);
    } catch (error: any) {
      console.error('Error loading campaigns:', error);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      // Get affiliate referral code
      // Use type assertion to avoid deep type inference issues
      const affiliateResult = await (supabase
        .from('affiliates' as any)
        .select('referral_code')
        .eq('id', affiliateId)
        .single() as any) as { data: { referral_code: string } | null; error: any };
      
      const affiliate = affiliateResult.data;

      if (!affiliate) throw new Error('Affiliate not found');

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.cylendra.com';
      const referralLink = generateReferralLink(baseUrl, affiliate.referral_code, {
        source: newCampaign.utm_source,
        medium: newCampaign.utm_medium,
        campaign: newCampaign.utm_campaign,
        content: newCampaign.utm_content,
      });

      // Use type assertion to avoid deep type inference issues
      const insertResult = await (supabase
        .from('affiliate_campaigns' as any)
        .insert({
          affiliate_id: affiliateId,
          campaign_name: newCampaign.campaign_name,
          utm_source: newCampaign.utm_source,
          utm_medium: newCampaign.utm_medium,
          utm_campaign: newCampaign.utm_campaign,
          utm_content: newCampaign.utm_content,
          referral_link: referralLink,
        } as any) as any) as { error: any };
      
      const error = insertResult.error;

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Campaign created successfully',
      });

      setShowCreate(false);
      setNewCampaign({
        campaign_name: '',
        utm_source: '',
        utm_medium: '',
        utm_campaign: '',
        utm_content: '',
      });
      loadCampaigns();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create campaign',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Campaigns</CardTitle>
            <CardDescription>
              Create and track UTM campaigns
            </CardDescription>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create Campaign Form */}
        {showCreate && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Create New Campaign</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input
                  value={newCampaign.campaign_name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, campaign_name: e.target.value })}
                  placeholder="e.g., YouTube Video Q1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>UTM Source</Label>
                  <Input
                    value={newCampaign.utm_source}
                    onChange={(e) => setNewCampaign({ ...newCampaign, utm_source: e.target.value })}
                    placeholder="e.g., youtube"
                  />
                </div>
                <div className="space-y-2">
                  <Label>UTM Medium</Label>
                  <Input
                    value={newCampaign.utm_medium}
                    onChange={(e) => setNewCampaign({ ...newCampaign, utm_medium: e.target.value })}
                    placeholder="e.g., video"
                  />
                </div>
                <div className="space-y-2">
                  <Label>UTM Campaign</Label>
                  <Input
                    value={newCampaign.utm_campaign}
                    onChange={(e) => setNewCampaign({ ...newCampaign, utm_campaign: e.target.value })}
                    placeholder="e.g., q1-2025"
                  />
                </div>
                <div className="space-y-2">
                  <Label>UTM Content (Optional)</Label>
                  <Input
                    value={newCampaign.utm_content}
                    onChange={(e) => setNewCampaign({ ...newCampaign, utm_content: e.target.value })}
                    placeholder="e.g., banner-ad"
                  />
                </div>
              </div>
              <Button onClick={handleCreateCampaign} className="w-full">
                Create Campaign
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Campaigns List */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>UTM Parameters</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>Conversions</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium">{campaign.campaign_name}</TableCell>
                <TableCell>
                  <div className="text-xs space-y-1">
                    {campaign.utm_source && <div>Source: {campaign.utm_source}</div>}
                    {campaign.utm_medium && <div>Medium: {campaign.utm_medium}</div>}
                    {campaign.utm_campaign && <div>Campaign: {campaign.utm_campaign}</div>}
                  </div>
                </TableCell>
                <TableCell>{campaign.clicks}</TableCell>
                <TableCell>{campaign.conversions}</TableCell>
                <TableCell>
                  {campaign.conversion_rate > 0 ? (
                    <span className="font-semibold">{campaign.conversion_rate.toFixed(2)}%</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={campaign.is_active ? 'default' : 'outline'}>
                    {campaign.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(campaign.referral_link);
                      toast({ title: 'Copied', description: 'Link copied to clipboard' });
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

