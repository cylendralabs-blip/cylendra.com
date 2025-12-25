/**
 * Business Analytics Page
 * 
 * Phase Admin C: Business & Revenue Analytics Dashboard
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TrendingUp, Users, DollarSign, BarChart3, Activity, Target, Zap } from 'lucide-react';
import BusinessKPIs from '@/components/admin/BusinessKPIs';
import RevenueDashboard from '@/components/admin/RevenueDashboard';
import FeatureUsageAnalytics from '@/components/admin/FeatureUsageAnalytics';
import UserFunnelAnalytics from '@/components/admin/UserFunnelAnalytics';
import CohortAnalysis from '@/components/admin/CohortAnalysis';
import { useQueryClient } from '@tanstack/react-query';

export default function BusinessAnalytics() {
  const queryClient = useQueryClient();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      // Invalidate all analytics queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['business-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['revenue-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['feature-usage'] });
      queryClient.invalidateQueries({ queryKey: ['user-funnel'] });
      queryClient.invalidateQueries({ queryKey: ['cohort-analysis'] });
      setLastRefresh(new Date());
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [queryClient]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            تحليلات الأعمال والإيرادات
          </h1>
          <p className="text-muted-foreground mt-1">
            نظرة شاملة على نمو المنصة والإيرادات واستخدام الميزات
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          آخر تحديث: {lastRefresh.toLocaleTimeString('ar')}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="revenue">الإيرادات</TabsTrigger>
          <TabsTrigger value="features">استخدام الميزات</TabsTrigger>
          <TabsTrigger value="funnel">مسار المستخدم</TabsTrigger>
          <TabsTrigger value="cohorts">تحليل الأفواج</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <BusinessKPIs />
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <RevenueDashboard />
        </TabsContent>

        {/* Feature Usage Tab */}
        <TabsContent value="features" className="space-y-4">
          <FeatureUsageAnalytics />
        </TabsContent>

        {/* User Funnel Tab */}
        <TabsContent value="funnel" className="space-y-4">
          <UserFunnelAnalytics />
        </TabsContent>

        {/* Cohort Analysis Tab */}
        <TabsContent value="cohorts" className="space-y-4">
          <CohortAnalysis />
        </TabsContent>
      </Tabs>
    </div>
  );
}

