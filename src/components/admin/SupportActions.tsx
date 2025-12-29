/**
 * Support Actions Component
 * 
 * Phase Admin D: Admin support tools and actions
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Play, Pause, RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import {
  forcePortfolioSync,
  forcePositionRefresh,
  disableUserTrading,
  resetUserRiskLimits,
  forceBotExecution,
  clearUserCache,
} from '@/services/admin/SupportActionsService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface SupportActionsProps {
  userId: string;
}

export default function SupportActions({ userId }: SupportActionsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handleAction = async (
    actionKey: string,
    actionFn: (userId: string, adminId: string) => Promise<{ success: boolean; error?: string }>
  ) => {
    if (!user?.id) {
      toast({
        title: '❌ خطأ',
        description: 'يجب تسجيل الدخول كأدمن',
        variant: 'destructive',
      });
      return;
    }

    setLoading({ ...loading, [actionKey]: true });
    try {
      const { success, error } = await actionFn(userId, user.id);
      if (success) {
        toast({
          title: '✅ نجح',
          description: `تم تنفيذ ${actionKey} بنجاح`,
        });
      } else {
        toast({
          title: '❌ خطأ',
          description: error || `فشل في تنفيذ ${actionKey}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error(`Error executing ${actionKey}:`, error);
      toast({
        title: '❌ خطأ',
        description: `حدث خطأ أثناء تنفيذ ${actionKey}`,
        variant: 'destructive',
      });
    } finally {
      setLoading({ ...loading, [actionKey]: false });
    }
  };

  const actions = [
    {
      key: 'portfolio-sync',
      title: 'إجبار مزامنة Portfolio',
      description: 'إعادة مزامنة بيانات Portfolio من Exchange',
      icon: RefreshCw,
      action: forcePortfolioSync,
      variant: 'default' as const,
    },
    {
      key: 'position-refresh',
      title: 'تحديث المراكز',
      description: 'إعادة جلب المراكز المفتوحة من Exchange',
      icon: RefreshCw,
      action: forcePositionRefresh,
      variant: 'default' as const,
    },
    {
      key: 'disable-trading',
      title: 'تعطيل التداول',
      description: 'إيقاف جميع عمليات التداول للمستخدم',
      icon: Pause,
      action: disableUserTrading,
      variant: 'destructive' as const,
    },
    {
      key: 'reset-risk',
      title: 'إعادة تعيين حدود المخاطر',
      description: 'إعادة تعيين Daily Loss و Drawdown counters',
      icon: RotateCcw,
      action: resetUserRiskLimits,
      variant: 'outline' as const,
    },
    {
      key: 'force-bot',
      title: 'إجبار تنفيذ البوت',
      description: 'تشغيل البوت يدوياً لأغراض التصحيح',
      icon: Play,
      action: forceBotExecution,
      variant: 'default' as const,
    },
    {
      key: 'clear-cache',
      title: 'مسح Cache',
      description: 'مسح البيانات المخزنة مؤقتاً للمستخدم',
      icon: Trash2,
      action: clearUserCache,
      variant: 'outline' as const,
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            إجراءات الدعم
          </CardTitle>
          <CardDescription>
            أدوات إدارية لإصلاح مشاكل المستخدم
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {actions.map((action) => {
              const Icon = action.icon;
              const isLoading = loading[action.key];

              return (
                <Card key={action.key} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon className="w-5 h-5" />
                      {action.title}
                    </CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant={action.variant}
                      onClick={() => handleAction(action.key, action.action)}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          جاري التنفيذ...
                        </>
                      ) : (
                        <>
                          <Icon className="w-4 h-4 mr-2" />
                          تنفيذ
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

