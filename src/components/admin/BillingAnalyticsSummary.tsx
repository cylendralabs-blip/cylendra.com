/**
 * Billing Analytics Summary Component
 * 
 * Phase Admin Billing: Display billing analytics at the top of the dashboard
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Users, Crown, AlertTriangle, RefreshCw, DollarSign } from 'lucide-react';
import type { BillingAnalytics } from '@/services/admin/BillingService';

interface BillingAnalyticsSummaryProps {
  analytics: BillingAnalytics;
}

export default function BillingAnalyticsSummary({ analytics }: BillingAnalyticsSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">إجمالي الاشتراكات النشطة</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.total_active_subscriptions}</div>
          <p className="text-xs text-muted-foreground">
            نشط + تجريبي
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">مستخدمين PRO</CardTitle>
          <Crown className="h-4 w-4 text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.active_pro_users}</div>
          <p className="text-xs text-muted-foreground">
            مستخدمين PRO نشطين
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">مستخدمين VIP</CardTitle>
          <Crown className="h-4 w-4 text-yellow-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.active_vip_users}</div>
          <p className="text-xs text-muted-foreground">
            مستخدمين VIP نشطين
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">تنتهي خلال 7 أيام</CardTitle>
          <AlertTriangle className="h-4 w-4 text-yellow-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-400">{analytics.expiring_in_7_days}</div>
          <p className="text-xs text-muted-foreground">
            اشتراكات تنتهي قريباً
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">تجديدات يدوية</CardTitle>
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.total_manual_renewals}</div>
          <p className="text-xs text-muted-foreground">
            تجديدات يدوية نشطة
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">تجارب نشطة</CardTitle>
          <Users className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-400">{analytics.total_trials_active}</div>
          <p className="text-xs text-muted-foreground">
            تجارب مجانية نشطة
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

