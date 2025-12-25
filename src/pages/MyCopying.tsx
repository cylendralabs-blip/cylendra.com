/**
 * My Copying Page
 * 
 * Phase X.17 - Copy Trading System
 * 
 * View and manage strategies you're following
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, TrendingUp, Pause, Play, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { logFeatureUsage } from '@/services/admin/FeatureUsageService';
import { updateUserFunnelStage } from '@/services/admin/UserFunnelService';

export default function MyCopying() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: followers = [], isLoading } = useQuery({
    queryKey: ['my-copy-followers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from('copy_followers')
        .select(`
          *,
          strategy:copy_strategies(*)
        `)
        .eq('follower_user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const unfollowMutation = useMutation({
    mutationFn: async (strategyId: string) => {
      const { data, error } = await supabase.functions.invoke('copy-unfollow-strategy', {
        body: { strategy_id: strategyId, close_all_trades: false },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      toast({ title: 'تم بنجاح', description: 'تم إيقاف المتابعة' });
      queryClient.invalidateQueries({ queryKey: ['my-copy-followers'] });
      
      // Phase Admin C: Log feature usage
      if (user?.id) {
        try {
          await logFeatureUsage(user.id, 'copy_trading');
        } catch (e) {
          console.error('Error logging feature usage:', e);
        }
      }
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">متابعاتي</h1>
        <p className="text-muted-foreground">الاستراتيجيات التي تتابعها</p>
      </div>

      {followers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">لا توجد متابعات حالياً</p>
            <Button onClick={() => navigate('/dashboard/copy-market')}>
              استكشف الاستراتيجيات
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {followers.map((follower: any) => (
            <Card key={follower.id}>
              <CardHeader>
                <CardTitle>{follower.strategy?.name}</CardTitle>
                <Badge variant={follower.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {follower.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-1">
                  <p>الوضع: {follower.allocation_mode === 'PERCENT' ? 'نسبة' : 'مبلغ ثابت'}</p>
                  <p>القيمة: {follower.allocation_value}{follower.allocation_mode === 'PERCENT' ? '%' : '$'}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/dashboard/copy-strategy/${follower.strategy_id}`)}
                  >
                    التفاصيل
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => unfollowMutation.mutate(follower.strategy_id)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    إيقاف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

