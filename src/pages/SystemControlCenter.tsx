/**
 * System Control Center Page
 * 
 * Phase X.14 - Unified AI System Dashboard + Control Center
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Activity, AlertTriangle, CheckCircle, XCircle, RefreshCw, Settings, Shield, History, BarChart3, Search, Users, TrendingUp, Power, Flag, Monitor, AlertCircle, Bot, Sliders, FileText } from 'lucide-react';
import { useSystemHealth, useSystemStatuses, useSystemSettings, useUpdateSystemSetting, useSystemLogs, useRecoveryEvents, useTriggerRecovery, useSystemStatistics } from '@/hooks/useSystemControl';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { getRecentActivity, AdminActivityLog } from '@/services/admin/AdminActivityService';
import { getStatsForLastDays, getTodayStats, getSystemOverview, SystemStats as SystemStatsData } from '@/services/admin/SystemStatsService';
import { getAllFeatureFlags, toggleFeatureFlag, FeatureFlag } from '@/services/admin/FeatureFlagsService';
import { getGlobalKillSwitch, setGlobalKillSwitch as updateGlobalKillSwitch } from '@/services/admin/SystemSettingsService';
import { useToast } from '@/hooks/use-toast';
// Phase Admin B: Import new components
import TradingMonitor from '@/components/admin/TradingMonitor';
import RiskDashboard from '@/components/admin/RiskDashboard';
import BotSupervision from '@/components/admin/BotSupervision';
import RiskSettingsEditor from '@/components/admin/RiskSettingsEditor';
import RiskEventLogs from '@/components/admin/RiskEventLogs';

const statusColors = {
  OK: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  WARNING: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  ERROR: 'bg-red-500/15 text-red-500 border-red-500/30',
};

const statusIcons = {
  OK: CheckCircle,
  WARNING: AlertTriangle,
  ERROR: XCircle,
};

export default function SystemControlCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logLevel, setLogLevel] = useState<string>('ALL');
  const [logSource, setLogSource] = useState<string>('ALL');
  const [logSearch, setLogSearch] = useState('');
  
  // Phase 18: Admin Activity and System Stats
  const [adminActivities, setAdminActivities] = useState<AdminActivityLog[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStatsData[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [activityFilter, setActivityFilter] = useState<'24h' | '7d' | '30d' | 'all'>('all');
  
  // Phase Admin A: Feature Flags and Global Kill Switch
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [loadingFlags, setLoadingFlags] = useState(false);
  const [globalKillSwitch, setGlobalKillSwitch] = useState(false);
  const [loadingKillSwitch, setLoadingKillSwitch] = useState(false);
  
  // Phase Admin A: System Overview
  const [systemOverview, setSystemOverview] = useState<{
    todayStats: SystemStatsData | null;
    last7Days: SystemStatsData[];
    last30Days: SystemStatsData[];
  } | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  const { data: health, isLoading: healthLoading } = useSystemHealth();
  const { data: statuses = [], isLoading: statusesLoading } = useSystemStatuses();
  const { data: settings = {}, isLoading: settingsLoading } = useSystemSettings();
  const { data: logs = [], isLoading: logsLoading } = useSystemLogs(200, logLevel !== 'ALL' ? logLevel : undefined);
  const { data: recoveryEvents = [], isLoading: recoveryLoading } = useRecoveryEvents();
  const { data: statistics, isLoading: statsLoading } = useSystemStatistics(24);

  // Phase 18: Load Admin Activities with filters
  useEffect(() => {
    const loadAdminActivities = async () => {
      setLoadingActivities(true);
      try {
        const filters: { hours?: number; days?: number } = {};
        if (activityFilter === '24h') {
          filters.hours = 24;
        } else if (activityFilter === '7d') {
          filters.days = 7;
        } else if (activityFilter === '30d') {
          filters.days = 30;
        }
        
        const { logs } = await getRecentActivity(50, filters);
        setAdminActivities(logs);
      } catch (error) {
        console.error('Error loading admin activities:', error);
      } finally {
        setLoadingActivities(false);
      }
    };
    loadAdminActivities();
    const interval = setInterval(loadAdminActivities, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [activityFilter]);
  
  // Phase Admin A: Load Feature Flags
  useEffect(() => {
    const loadFeatureFlags = async () => {
      setLoadingFlags(true);
      try {
        const { flags } = await getAllFeatureFlags();
        setFeatureFlags(flags);
      } catch (error) {
        console.error('Error loading feature flags:', error);
      } finally {
        setLoadingFlags(false);
      }
    };
    loadFeatureFlags();
  }, []);
  
  // Phase Admin A: Load Global Kill Switch
  useEffect(() => {
    const loadKillSwitch = async () => {
      setLoadingKillSwitch(true);
      try {
        const enabled = await getGlobalKillSwitch();
        setGlobalKillSwitch(enabled);
      } catch (error) {
        console.error('Error loading global kill switch:', error);
      } finally {
        setLoadingKillSwitch(false);
      }
    };
    loadKillSwitch();
  }, []);
  
  // Phase Admin A: Load System Overview
  useEffect(() => {
    const loadSystemOverview = async () => {
      setLoadingOverview(true);
      try {
        const overview = await getSystemOverview();
        setSystemOverview(overview);
      } catch (error) {
        console.error('Error loading system overview:', error);
      } finally {
        setLoadingOverview(false);
      }
    };
    loadSystemOverview();
    const interval = setInterval(loadSystemOverview, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Phase 18: Load System Stats
  useEffect(() => {
    const loadSystemStats = async () => {
      setLoadingStats(true);
      try {
        const { stats } = await getStatsForLastDays(30);
        setSystemStats(stats);
      } catch (error) {
        console.error('Error loading system stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };
    loadSystemStats();
    const interval = setInterval(loadSystemStats, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const updateSettingMutation = useUpdateSystemSetting();
  const triggerRecoveryMutation = useTriggerRecovery();

  const handleToggleSafetyMode = async (enabled: boolean) => {
    await updateSettingMutation.mutateAsync({
      key: 'ai_safety_mode',
      value: { enabled },
    });
  };

  const handleRecovery = async (serviceName: string, action: 'restart' | 'cleanup' | 'reset' | 'reconnect' | 'rebuild_cache') => {
    await triggerRecoveryMutation.mutateAsync({ service_name: serviceName, action });
  };
  
  // Phase Admin A: Handle Global Kill Switch
  const handleToggleKillSwitch = async (enabled: boolean) => {
    if (enabled) {
      // Show confirmation dialog
      if (!confirm('⚠️ تحذير: تفعيل Global Kill Switch سيوقف جميع عمليات التداول فوراً. هل أنت متأكد؟')) {
        return;
      }
    }
    
    setLoadingKillSwitch(true);
    try {
      const { success, error } = await updateGlobalKillSwitch(enabled);
      if (success) {
        setGlobalKillSwitch(enabled);
        toast({
          title: enabled ? '✅ تم تفعيل Global Kill Switch' : '✅ تم إلغاء تفعيل Global Kill Switch',
          description: enabled 
            ? 'جميع عمليات التداول متوقفة الآن'
            : 'تم استئناف عمليات التداول',
          variant: enabled ? 'destructive' : 'default',
        });
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في تحديث Global Kill Switch',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error toggling kill switch:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحديث Global Kill Switch',
        variant: 'destructive',
      });
    } finally {
      setLoadingKillSwitch(false);
    }
  };
  
  // Phase Admin A: Handle Feature Flag Toggle
  const handleToggleFeature = async (featureKey: string, enabled: boolean) => {
    setLoadingFlags(true);
    try {
      const { success, error } = await toggleFeatureFlag(featureKey, enabled);
      if (success) {
        setFeatureFlags(prev => prev.map(flag => 
          flag.feature_key === featureKey ? { ...flag, is_enabled: enabled } : flag
        ));
        toast({
          title: enabled ? '✅ تم تفعيل الميزة' : '✅ تم تعطيل الميزة',
          description: `تم ${enabled ? 'تفعيل' : 'تعطيل'} ${featureKey} بنجاح`,
        });
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في تحديث الميزة',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error toggling feature flag:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحديث الميزة',
        variant: 'destructive',
      });
    } finally {
      setLoadingFlags(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (logSource !== 'ALL' && log.source !== logSource) return false;
    if (logSearch && !log.message.toLowerCase().includes(logSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Activity className="w-8 h-8 text-primary" />
          مركز التحكم في النظام
        </h1>
        <p className="text-muted-foreground mt-1">
          مراقبة وإدارة جميع خدمات النظام
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-4 lg:grid-cols-13">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="logs">سجلات النظام</TabsTrigger>
          <TabsTrigger value="safety">الأمان والإعدادات</TabsTrigger>
          <TabsTrigger value="recovery">لوحة الاستعادة</TabsTrigger>
          <TabsTrigger value="statistics">إحصائيات النظام</TabsTrigger>
          <TabsTrigger value="admin-activity">نشاط الإدارة</TabsTrigger>
          <TabsTrigger value="system-stats">إحصائيات يومية</TabsTrigger>
          <TabsTrigger value="features">الميزات</TabsTrigger>
          <TabsTrigger value="trading-monitor">مراقب التداول</TabsTrigger>
          <TabsTrigger value="risk-dashboard">لوحة المخاطر</TabsTrigger>
          <TabsTrigger value="bot-supervision">إشراف البوتات</TabsTrigger>
          <TabsTrigger value="risk-settings">إعدادات المخاطر</TabsTrigger>
          <TabsTrigger value="risk-logs">سجلات المخاطر</TabsTrigger>
        </TabsList>

        {/* Tab 1: System Overview - Phase Admin A */}
        <TabsContent value="overview" className="space-y-4">
          {loadingOverview || healthLoading || statusesLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* System Stats Summary Cards */}
              {systemOverview && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        المستخدمون النشطون (اليوم)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {systemOverview.todayStats?.active_users || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        آخر 7 أيام: {systemOverview.last7Days.reduce((sum, s) => sum + s.active_users, 0)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        الصفقات (اليوم)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {systemOverview.todayStats?.total_trades || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        آخر 7 أيام: {systemOverview.last7Days.reduce((sum, s) => sum + s.total_trades, 0)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        الحجم (USD) - اليوم
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${Number(systemOverview.todayStats?.total_volume_usd || 0).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        آخر 7 أيام: ${systemOverview.last7Days.reduce((sum, s) => sum + Number(s.total_volume_usd), 0).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        الوظائف الفاشلة (اليوم)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-500">
                        {systemOverview.todayStats?.failed_jobs || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        آخر 7 أيام: {systemOverview.last7Days.reduce((sum, s) => sum + s.failed_jobs, 0)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {/* Service Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statuses.map((status) => {
                  const StatusIcon = statusIcons[status.status];
                  return (
                    <Card key={status.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">{status.service_name}</CardTitle>
                          <StatusIcon className={cn('w-5 h-5', status.status === 'OK' ? 'text-emerald-500' : status.status === 'WARNING' ? 'text-amber-500' : 'text-red-500')} />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Badge className={cn(statusColors[status.status])}>
                          {status.status}
                        </Badge>
                        {status.last_success && (
                          <p className="text-xs text-muted-foreground">
                            آخر نجاح: {new Date(status.last_success).toLocaleString('ar')}
                          </p>
                        )}
                        {status.error_message && (
                          <p className="text-xs text-red-500">{status.error_message}</p>
                        )}
                        {status.status !== 'OK' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRecovery(status.service_name, 'restart')}
                            disabled={triggerRecoveryMutation.isPending}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            استعادة
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Live Logs Console */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>سجلات النظام المباشرة</CardTitle>
              <CardDescription>آخر 200 سجل من جميع الخدمات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>المستوى</Label>
                  <Select value={logLevel} onValueChange={setLogLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">الكل</SelectItem>
                      <SelectItem value="INFO">INFO</SelectItem>
                      <SelectItem value="WARN">WARN</SelectItem>
                      <SelectItem value="ERROR">ERROR</SelectItem>
                      <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>المصدر</Label>
                  <Input
                    placeholder="اسم الخدمة..."
                    value={logSource === 'ALL' ? '' : logSource}
                    onChange={(e) => setLogSource(e.target.value || 'ALL')}
                  />
                </div>
                <div>
                  <Label>بحث</Label>
                  <div className="relative">
                    <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث في الرسائل..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="pr-8"
                    />
                  </div>
                </div>
              </div>

              {/* Logs List */}
              <div className="border rounded-lg max-h-[600px] overflow-y-auto">
                {logsLoading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    لا توجد سجلات
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className={cn(
                          'p-3 text-sm',
                          log.level === 'ERROR' || log.level === 'CRITICAL' ? 'bg-red-500/10' :
                          log.level === 'WARN' ? 'bg-amber-500/10' : ''
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {log.level}
                              </Badge>
                              <span className="font-medium">{log.source}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(log.created_at).toLocaleString('ar')}
                              </span>
                            </div>
                            <p className="text-muted-foreground">{log.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Safety & Settings - Phase Admin A */}
        <TabsContent value="safety" className="space-y-4">
          {/* Global Kill Switch - Phase Admin A */}
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Power className="w-5 h-5" />
                Global Kill Switch
              </CardTitle>
              <CardDescription>
                إيقاف جميع عمليات التداول فوراً في حالة الطوارئ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                <div>
                  <Label className="text-base font-semibold">
                    {globalKillSwitch ? '⚠️ Kill Switch مفعّل' : '✅ Kill Switch معطّل'}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {globalKillSwitch 
                      ? 'جميع عمليات التداول متوقفة حالياً'
                      : 'جميع عمليات التداول تعمل بشكل طبيعي'}
                  </p>
                </div>
                <Switch
                  checked={globalKillSwitch}
                  onCheckedChange={handleToggleKillSwitch}
                  disabled={loadingKillSwitch}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>
              {globalKillSwitch && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    ⚠️ <strong>تحذير:</strong> عند تفعيل Kill Switch، لن يتم تنفيذ أي صفقات جديدة حتى يتم إلغاء التفعيل.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                وضع الأمان AI
              </CardTitle>
              <CardDescription>تقليل المخاطر تلقائياً في الظروف الخطرة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>تفعيل وضع الأمان</Label>
                  <p className="text-sm text-muted-foreground">
                    يقلل الرافعة تلقائياً ويفلتر الإشارات عالية المخاطر
                  </p>
                </div>
                <Switch
                  checked={settings.ai_safety_mode?.enabled || false}
                  onCheckedChange={handleToggleSafetyMode}
                  disabled={updateSettingMutation.isPending}
                />
              </div>

              {settings.ai_safety_mode?.enabled && (
                <div className="space-y-4 p-4 bg-muted rounded-lg">
                  <div>
                    <Label>الحد الأقصى للرافعة (وضع الأمان)</Label>
                    <Input
                      type="number"
                      value={settings.max_leverage_safety?.value || 2}
                      onChange={(e) => updateSettingMutation.mutate({
                        key: 'max_leverage_safety',
                        value: { value: Number(e.target.value) },
                      })}
                    />
                  </div>
                  <div>
                    <Label>عتبة المخاطر (0-1)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={settings.risk_threshold_safety?.value || 0.6}
                      onChange={(e) => updateSettingMutation.mutate({
                        key: 'risk_threshold_safety',
                        value: { value: Number(e.target.value) },
                      })}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                الإعدادات العامة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>تفعيل البث المباشر</Label>
                <Switch
                  checked={settings.streams_enabled?.enabled !== false}
                  onCheckedChange={(enabled) => updateSettingMutation.mutate({
                    key: 'streams_enabled',
                    value: { enabled },
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>الاستعادة التلقائية</Label>
                <Switch
                  checked={settings.auto_recovery_enabled?.enabled !== false}
                  onCheckedChange={(enabled) => updateSettingMutation.mutate({
                    key: 'auto_recovery_enabled',
                    value: { enabled },
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>تنبيهات Telegram</Label>
                <Switch
                  checked={settings.telegram_alerts_enabled?.enabled !== false}
                  onCheckedChange={(enabled) => updateSettingMutation.mutate({
                    key: 'telegram_alerts_enabled',
                    value: { enabled },
                  })}
                />
              </div>
              <div>
                <Label>حساسية AI العامة (0-1)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={settings.ai_global_sensitivity?.value || 0.7}
                  onChange={(e) => updateSettingMutation.mutate({
                    key: 'ai_global_sensitivity',
                    value: { value: Number(e.target.value) },
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Recovery Dashboard */}
        <TabsContent value="recovery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                سجل عمليات الاستعادة
              </CardTitle>
              <CardDescription>تاريخ عمليات إصلاح الخدمات</CardDescription>
            </CardHeader>
            <CardContent>
              {recoveryLoading ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                </div>
              ) : recoveryEvents.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  لا توجد عمليات استعادة
                </div>
              ) : (
                <div className="space-y-3">
                  {recoveryEvents.map((event) => (
                    <div key={event.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{event.service_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {event.action} - {event.triggered_by}
                          </p>
                        </div>
                        <Badge
                          className={
                            event.status === 'SUCCESS' ? statusColors.OK :
                            event.status === 'FAILED' ? statusColors.ERROR :
                            'bg-gray-500/15 text-gray-500 border-gray-500/30'
                          }
                        >
                          {event.status}
                        </Badge>
                      </div>
                      {event.error_before && (
                        <p className="text-sm text-red-500 mb-2">قبل: {event.error_before}</p>
                      )}
                      {event.recovery_time_ms && (
                        <p className="text-xs text-muted-foreground">
                          وقت الاستعادة: {event.recovery_time_ms}ms
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(event.created_at).toLocaleString('ar')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: System Statistics */}
        <TabsContent value="statistics" className="space-y-4">
          {statsLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              </CardContent>
            </Card>
          ) : statistics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي السجلات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.total_logs}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">أخطاء</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">{statistics.error_logs}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">تحذيرات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-500">{statistics.warning_logs}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">حرجة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{statistics.critical_logs}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">عمليات الاستعادة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.recovery_events}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">استعادة ناجحة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-500">{statistics.successful_recoveries}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">خدمات OK</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-500">{statistics.services_ok}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">خدمات خطأ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">{statistics.services_error}</div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>

        {/* Tab 6: Admin Activity Logs - Phase Admin A */}
        <TabsContent value="admin-activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                سجل نشاط الإدارة
              </CardTitle>
              <CardDescription>سجل جميع العمليات الإدارية الحساسة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters - Phase Admin A */}
              <div className="flex items-center gap-2 flex-wrap">
                <Label>الفترة:</Label>
                <Select value={activityFilter} onValueChange={(value: '24h' | '7d' | '30d' | 'all') => setActivityFilter(value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">آخر 24 ساعة</SelectItem>
                    <SelectItem value="7d">آخر 7 أيام</SelectItem>
                    <SelectItem value="30d">آخر 30 يوم</SelectItem>
                    <SelectItem value="all">الكل</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLoadingActivities(true);
                    const loadActivities = async () => {
                      try {
                        const filters: { hours?: number; days?: number } = {};
                        if (activityFilter === '24h') filters.hours = 24;
                        else if (activityFilter === '7d') filters.days = 7;
                        else if (activityFilter === '30d') filters.days = 30;
                        const { logs } = await getRecentActivity(50, filters);
                        setAdminActivities(logs);
                      } catch (error) {
                        console.error('Error loading admin activities:', error);
                      } finally {
                        setLoadingActivities(false);
                      }
                    };
                    loadActivities();
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  تحديث
                </Button>
              </div>
              
              {loadingActivities ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                </div>
              ) : adminActivities.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  لا توجد أنشطة إدارية
                </div>
              ) : (
                <div className="space-y-3">
                  {adminActivities.map((activity) => (
                    <div key={activity.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold">{activity.action}</h4>
                          {activity.target_type && activity.target_id && (
                            <p className="text-sm text-muted-foreground">
                              {activity.target_type}: {activity.target_id}
                            </p>
                          )}
                          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {JSON.stringify(activity.metadata, null, 2)}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {new Date(activity.created_at).toLocaleString('ar')}
                        </Badge>
                      </div>
                      {activity.ip_address && (
                        <p className="text-xs text-muted-foreground">
                          IP: {activity.ip_address}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab 8: Feature Flags - Phase Admin A */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="w-5 h-5" />
                إدارة الميزات
              </CardTitle>
              <CardDescription>تفعيل أو تعطيل الميزات الرئيسية من لوحة الأدمن</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingFlags ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                </div>
              ) : featureFlags.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  لا توجد ميزات متاحة
                </div>
              ) : (
                <div className="space-y-4">
                  {featureFlags.map((flag) => (
                    <div key={flag.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{flag.feature_name}</h4>
                          {flag.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {flag.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Key: <code className="bg-muted px-1 rounded">{flag.feature_key}</code>
                          </p>
                        </div>
                        <Switch
                          checked={flag.is_enabled}
                          onCheckedChange={(enabled) => handleToggleFeature(flag.feature_key, enabled)}
                          disabled={loadingFlags}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 7: System Stats (Daily) - Phase 18 */}
        <TabsContent value="system-stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                إحصائيات النظام اليومية
              </CardTitle>
              <CardDescription>إحصائيات النظام لآخر 30 يوم</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                </div>
              ) : systemStats.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  لا توجد إحصائيات متاحة
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          إجمالي المستخدمين النشطين
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {systemStats.reduce((sum, stat) => sum + stat.active_users, 0)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          إجمالي الصفقات
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {systemStats.reduce((sum, stat) => sum + stat.total_trades, 0)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          إجمالي الحجم (USD)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          ${systemStats.reduce((sum, stat) => sum + Number(stat.total_volume_usd), 0).toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          الوظائف الفاشلة
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-500">
                          {systemStats.reduce((sum, stat) => sum + stat.failed_jobs, 0)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Stats Table */}
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="p-3 text-right text-sm font-medium">التاريخ</th>
                          <th className="p-3 text-right text-sm font-medium">المستخدمون النشطون</th>
                          <th className="p-3 text-right text-sm font-medium">الصفقات</th>
                          <th className="p-3 text-right text-sm font-medium">الحجم (USD)</th>
                          <th className="p-3 text-right text-sm font-medium">متوسط التأخير (ms)</th>
                          <th className="p-3 text-right text-sm font-medium">الوظائف الفاشلة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {systemStats.map((stat) => (
                          <tr key={stat.id} className="border-b">
                            <td className="p-3 text-sm">{new Date(stat.date).toLocaleDateString('ar')}</td>
                            <td className="p-3 text-sm">{stat.active_users}</td>
                            <td className="p-3 text-sm">{stat.total_trades}</td>
                            <td className="p-3 text-sm">${Number(stat.total_volume_usd).toLocaleString()}</td>
                            <td className="p-3 text-sm">{stat.avg_latency_ms || 'N/A'}</td>
                            <td className="p-3 text-sm text-red-500">{stat.failed_jobs}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 9: Trading Monitor - Phase Admin B */}
        <TabsContent value="trading-monitor" className="space-y-4">
          <TradingMonitor />
        </TabsContent>

        {/* Tab 10: Risk Dashboard - Phase Admin B */}
        <TabsContent value="risk-dashboard" className="space-y-4">
          <RiskDashboard />
        </TabsContent>

        {/* Tab 11: Bot Supervision - Phase Admin B */}
        <TabsContent value="bot-supervision" className="space-y-4">
          <BotSupervision />
        </TabsContent>

        {/* Tab 12: Risk Settings - Phase Admin B */}
        <TabsContent value="risk-settings" className="space-y-4">
          <RiskSettingsEditor />
        </TabsContent>

        {/* Tab 13: Risk Event Logs - Phase Admin B */}
        <TabsContent value="risk-logs" className="space-y-4">
          <RiskEventLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
}

