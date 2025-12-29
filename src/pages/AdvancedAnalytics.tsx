
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AdvancedStatsPanel from '@/components/dashboard/AdvancedStatsPanel';
import InteractiveCharts from '@/components/charts/InteractiveCharts';
import SmartNotifications from '@/components/notifications/SmartNotifications';
import AdvancedRiskAnalysis from '@/components/risk/AdvancedRiskAnalysis';
import { 
  BarChart3, 
  Bell, 
  AlertTriangle, 
  TrendingUp,
  Download,
  Share,
  Brain
} from 'lucide-react';
import { IndicatorAnalyticsTab } from '@/components/advanced-analytics/indicators/IndicatorAnalyticsTab';
import { useUserPlan } from '@/hooks/useUserPlan';
import { canUseFeature } from '@/core/plans/planManager';
import { FeatureLock } from '@/components/plans/FeatureLock';
import { useAuth } from '@/hooks/useAuth';

const AdvancedAnalytics = () => {
  const { user } = useAuth();
  const { data: userPlan } = useUserPlan();
  const [activeTab, setActiveTab] = useState('stats');
  const [canAccessIndicators, setCanAccessIndicators] = useState<boolean | null>(null);

  // Phase X.10: Check feature access for indicators tab
  useEffect(() => {
    if (user?.id && activeTab === 'indicators') {
      canUseFeature(user.id, 'ai.advanced_indicators').then(setCanAccessIndicators);
    }
  }, [user?.id, activeTab]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            التحليلات المتقدمة
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            لوحة تحكم شاملة للإحصائيات والتحليلات المتقدمة
          </p>
        </div>
        
        <div className="flex items-center space-x-3 space-x-reverse">
          <Button variant="outline" size="sm">
            <Share className="w-4 h-4" />
            <span className="mr-1">مشاركة</span>
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4" />
            <span className="mr-1">تصدير</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="stats" className="flex items-center space-x-2 space-x-reverse">
            <TrendingUp className="w-4 h-4" />
            <span>الإحصائيات</span>
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center space-x-2 space-x-reverse">
            <BarChart3 className="w-4 h-4" />
            <span>الرسوم البيانية</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2 space-x-reverse">
            <Bell className="w-4 h-4" />
            <span>التنبيهات</span>
          </TabsTrigger>
          <TabsTrigger value="risk" className="flex items-center space-x-2 space-x-reverse">
            <AlertTriangle className="w-4 h-4" />
            <span>تحليل المخاطر</span>
          </TabsTrigger>
          <TabsTrigger value="indicators" className="flex items-center space-x-2 space-x-reverse">
            <Brain className="w-4 h-4" />
            <span>المؤشرات الذكية</span>
          </TabsTrigger>
        </TabsList>

        {/* Stats Tab */}
        <TabsContent value="stats">
          <AdvancedStatsPanel />
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts">
          <InteractiveCharts />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <SmartNotifications />
        </TabsContent>

        {/* Risk Analysis Tab */}
        <TabsContent value="risk">
          <AdvancedRiskAnalysis />
        </TabsContent>

        {/* Indicator Analytics Tab */}
        <TabsContent value="indicators">
          {canAccessIndicators === false ? (
            <FeatureLock
              featureName="المؤشرات الذكية"
              requiredPlan="BASIC"
              currentPlan={userPlan?.code}
              description="تحليل المؤشرات المتقدم متاح فقط في خطة BASIC أو أعلى. يرجى ترقية خطتك للاستفادة من هذه الميزة."
            />
          ) : canAccessIndicators === null ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Brain className="w-8 h-8 mx-auto mb-4 animate-pulse text-accent" />
                <p className="text-gray-600 dark:text-gray-400">جاري التحقق من الصلاحيات...</p>
              </div>
            </div>
          ) : (
            <IndicatorAnalyticsTab />
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2 space-x-reverse">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span>الأداء اليومي</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+2.8%</div>
            <p className="text-xs text-gray-500 mt-1">مقارنة بالأمس</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2 space-x-reverse">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span>التنبيهات النشطة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">3</div>
            <p className="text-xs text-gray-500 mt-1">تحتاج مراجعة</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2 space-x-reverse">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>الصفقات النشطة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">5</div>
            <p className="text-xs text-gray-500 mt-1">في التنفيذ</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
