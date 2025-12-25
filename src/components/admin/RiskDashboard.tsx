/**
 * Risk Dashboard Component
 * 
 * Phase Admin B: Risk alerts and monitoring dashboard
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw, AlertTriangle, AlertCircle, AlertOctagon, Info } from 'lucide-react';
import { getActiveRiskAlerts, detectRiskAlerts, RiskAlert, AlertSeverity, AlertType } from '@/services/admin/RiskAlertsService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export default function RiskDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Filters
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');
  const [alertTypeFilter, setAlertTypeFilter] = useState<AlertType | 'all'>('all');

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const filters: { severity?: AlertSeverity; alertType?: AlertType } = {};
      if (severityFilter !== 'all') {
        filters.severity = severityFilter;
      }
      if (alertTypeFilter !== 'all') {
        filters.alertType = alertTypeFilter;
      }

      const [activeAlertsResult, detectedAlertsResult] = await Promise.all([
        getActiveRiskAlerts(filters),
        detectRiskAlerts(),
      ]);

      // Combine alerts
      const allAlerts = [
        ...(activeAlertsResult.alerts || []),
        ...(detectedAlertsResult.alerts || []),
      ];

      // Remove duplicates
      const uniqueAlerts = Array.from(
        new Map(allAlerts.map(alert => [alert.id, alert])).values()
      );

      setAlerts(uniqueAlerts.sort((a, b) => 
        new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime()
      ));
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحميل التنبيهات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [severityFilter, alertTypeFilter]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadAlerts();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, severityFilter, alertTypeFilter]);

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertOctagon className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityBadgeVariant = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
    }
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      daily_loss_limit_breached: 'تجاوز حد الخسارة اليومية',
      max_drawdown_exceeded: 'تجاوز الحد الأقصى للتراجع',
      rapid_loss_spike: 'ارتفاع سريع في الخسائر',
      multiple_bot_failures: 'فشل متعدد للبوتات',
      api_connection_error: 'خطأ في الاتصال بالـ API',
      failed_orders_threshold: 'تجاوز عتبة الأوامر الفاشلة',
      kill_switch_triggered: 'تفعيل Kill Switch',
      high_exposure: 'تعرض عالي',
      unusual_activity: 'نشاط غير عادي',
    };
    return labels[type] || type;
  };

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const highAlerts = alerts.filter(a => a.severity === 'high');
  const mediumAlerts = alerts.filter(a => a.severity === 'medium');
  const lowAlerts = alerts.filter(a => a.severity === 'low');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">لوحة المخاطر</h2>
          <p className="text-muted-foreground">
            مراقبة المخاطر والتنبيهات في الوقت الفعلي
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAlerts}
            disabled={loading}
          >
            <RefreshCw className={cn('w-4 h-4 mr-1', loading && 'animate-spin')} />
            تحديث
          </Button>
          <Badge variant={autoRefresh ? 'default' : 'secondary'}>
            {autoRefresh ? 'تحديث تلقائي' : 'تحديث يدوي'}
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
              حرجة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 dark:border-orange-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400">
              عالية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{highAlerts.length}</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              متوسطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{mediumAlerts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              منخفضة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowAlerts.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>الفلاتر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">مستوى الخطورة</label>
              <Select
                value={severityFilter}
                onValueChange={(value: AlertSeverity | 'all') => setSeverityFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="critical">حرجة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="low">منخفضة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">نوع التنبيه</label>
              <Select
                value={alertTypeFilter}
                onValueChange={(value: AlertType | 'all') => setAlertTypeFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="daily_loss_limit_breached">تجاوز حد الخسارة اليومية</SelectItem>
                  <SelectItem value="max_drawdown_exceeded">تجاوز الحد الأقصى للتراجع</SelectItem>
                  <SelectItem value="kill_switch_triggered">تفعيل Kill Switch</SelectItem>
                  <SelectItem value="rapid_loss_spike">ارتفاع سريع في الخسائر</SelectItem>
                  <SelectItem value="multiple_bot_failures">فشل متعدد للبوتات</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>التنبيهات ({alerts.length})</CardTitle>
          <CardDescription>
            جميع التنبيهات النشطة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && alerts.length === 0 ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              لا توجد تنبيهات
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors',
                    alert.severity === 'critical' && 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20',
                    alert.severity === 'high' && 'border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20',
                    alert.severity === 'medium' && 'border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/20'
                  )}
                  onClick={() => {
                    if (alert.user_id) {
                      navigate(`/admin/users/${alert.user_id}/risk`);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{getAlertTypeLabel(alert.alert_type)}</h4>
                          <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        {alert.user_email && (
                          <p className="text-xs text-muted-foreground mt-1">
                            المستخدم: {alert.user_email}
                          </p>
                        )}
                        {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(alert.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {new Date(alert.triggered_at).toLocaleString('ar')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

