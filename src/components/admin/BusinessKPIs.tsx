/**
 * Business KPIs Component
 * 
 * Phase Admin C: Display key business metrics
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, Users, UserPlus, Activity, Target, ArrowUp, ArrowDown, Download, RefreshCw } from 'lucide-react';
import { getBusinessKPIs, type BusinessKPIs } from '@/services/admin/BusinessAnalyticsService';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { exportBusinessKPIsToCSV } from '@/services/admin/ExportService';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

export default function BusinessKPIs() {
  const { toast } = useToast();

  const { data: kpis, isLoading: loading, refetch } = useQuery({
    queryKey: ['business-kpis'],
    queryFn: async () => {
      const { kpis: kpisData, error } = await getBusinessKPIs();
      if (error) {
        toast({
          title: '❌ خطأ',
          description: error,
          variant: 'destructive',
        });
        throw new Error(error);
      }
      return kpisData;
    },
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  });

  if (loading && !kpis) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (!kpis) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          لا توجد بيانات متاحة
        </CardContent>
      </Card>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercent = (num: number) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">مؤشرات الأداء الرئيسية</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={loading}
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            تحديث
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => kpis && exportBusinessKPIsToCSV(kpis)}
            disabled={!kpis}
          >
            <Download className="w-4 h-4 mr-2" />
            تصدير CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              إجمالي المستخدمين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(kpis.totalUsers)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4" />
              المستخدمين النشطين (30 يوم)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(kpis.activeUsers30d)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.totalUsers > 0 ? ((kpis.activeUsers30d / kpis.totalUsers) * 100).toFixed(1) : 0}% من إجمالي المستخدمين
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              مستخدمين جدد (هذا الشهر)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(kpis.newUsersThisMonth)}</div>
            <div className={cn(
              'flex items-center gap-1 text-xs mt-1',
              kpis.userGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {kpis.userGrowthRate >= 0 ? (
                <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowDown className="w-3 h-3" />
              )}
              <span>{formatPercent(kpis.userGrowthRate)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              معدل الاحتفاظ (30 يوم)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.retentionRate30d.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              معدل الاحتفاظ 7 أيام: {kpis.retentionRate7d.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              المستخدمين حسب الخطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(kpis.usersByPlan).map(([plan, count]) => (
                <div key={plan} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{plan}</span>
                  <span className="font-medium">{formatNumber(count)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              معدل التحويل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.conversionRateFreeToPaid.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              من Free إلى Paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              معدل التسرب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{kpis.churnRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              المستخدمين الذين توقفوا
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

