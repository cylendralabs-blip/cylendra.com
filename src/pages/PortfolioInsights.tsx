/**
 * Portfolio Insights Page
 * 
 * Phase X.13 - AI Portfolio Insights + Smart Risk Advisor
 * Phase X.17 - Multi-Exchange Portfolio Insights & Scope Selector
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, AlertTriangle, Target, BarChart3, RefreshCw, Lightbulb, Globe } from 'lucide-react';
import { usePortfolioSnapshot, usePortfolioRiskScore, usePortfolioRecommendations, usePortfolioForecasts, useSyncPortfolio, useAnalyzeRisk, useGenerateForecast, type PortfolioScope } from '@/hooks/usePortfolio';
import { useUserApiKeys, getPlatformDisplayName } from '@/hooks/useUserApiKeys';
import { useAuth } from '@/hooks/useAuth';
import { useUserPlan } from '@/hooks/useUserPlan';
import { useToast } from '@/hooks/use-toast';
import { FeatureLock } from '@/components/plans/FeatureLock';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function PortfolioInsights() {
  const { user } = useAuth();
  const { data: userPlan } = useUserPlan();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  
  // Phase X.17: Scope selector state
  const [selectedScope, setSelectedScope] = useState<PortfolioScope>({ type: 'GLOBAL' });
  
  // Fetch available API keys for scope selector
  const { data: apiKeys = [], isLoading: apiKeysLoading } = useUserApiKeys();

  // Phase X.17: Use hooks with scope
  const { data: snapshot, isLoading: snapshotLoading, refetch: refetchSnapshot } = usePortfolioSnapshot(selectedScope);
  const { data: riskScore, isLoading: riskLoading } = usePortfolioRiskScore(selectedScope, snapshot?.id);
  const { data: recommendations = [], isLoading: recLoading } = usePortfolioRecommendations(selectedScope, snapshot?.id);
  const { data: forecast, isLoading: forecastLoading } = usePortfolioForecasts(selectedScope, selectedPeriod);

  const syncMutation = useSyncPortfolio();
  const analyzeMutation = useAnalyzeRisk();
  const forecastMutation = useGenerateForecast();
  
  // Get selected exchange platform for sync
  const selectedExchangePlatform = selectedScope.type === 'EXCHANGE' 
    ? apiKeys.find(k => k.id === selectedScope.apiKeyId)?.platform
    : undefined;

  // Check access
  const hasBasicAccess = userPlan?.features?.access?.heatmap !== false;
  const hasForecastAccess = userPlan?.code === 'PREMIUM' || userPlan?.code === 'PRO' || userPlan?.code === 'VIP';
  const hasFullAccess = userPlan?.code === 'PRO' || userPlan?.code === 'VIP';

  if (!hasBasicAccess && user) {
    return (
      <FeatureLock
        featureName="تحليل المحفظة"
        requiredPlan="FREE"
        currentPlan={userPlan?.code}
        description="تحليل المحفظة متاح لجميع المستخدمين."
      />
    );
  }

  const handleSync = async () => {
    try {
      if (selectedScope.type === 'EXCHANGE' && selectedScope.apiKeyId) {
        // Phase X.17: Sync specific exchange with api_key_id
        const selectedApiKey = apiKeys.find(k => k.id === selectedScope.apiKeyId);
        if (!selectedApiKey) {
          toast({
            title: 'خطأ',
            description: 'لم يتم العثور على مفتاح API المحدد',
            variant: 'destructive',
          });
          return;
        }
        
        await syncMutation.mutateAsync({
          exchange: selectedApiKey.platform,
          apiKeyId: selectedScope.apiKeyId,
        });
        
        // Force refetch after sync
        setTimeout(() => {
          refetchSnapshot();
        }, 1000);
        
        toast({
          title: 'تمت المزامنة بنجاح',
          description: `تم مزامنة محفظة ${getPlatformDisplayName(selectedApiKey.platform, selectedApiKey.testnet)} بنجاح`,
        });
      } else {
        // Sync all active exchanges (loop through all API keys)
        // For now, we'll sync the first active exchange or show a message
        if (apiKeys.length > 0) {
          // Sync the first exchange as a fallback
          await syncMutation.mutateAsync({
            exchange: apiKeys[0].platform,
            apiKeyId: apiKeys[0].id,
          });
          
          // Force refetch after sync
          setTimeout(() => {
            refetchSnapshot();
          }, 1000);
          
          toast({
            title: 'تمت المزامنة بنجاح',
            description: `تم مزامنة محفظة ${getPlatformDisplayName(apiKeys[0].platform, apiKeys[0].testnet)} بنجاح`,
          });
        } else {
          toast({
            title: 'خطأ',
            description: 'لا توجد منصات مفعلة للمزامنة. يرجى إضافة مفتاح API أولاً.',
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      console.error('Error syncing portfolio:', error);
      // Show user-friendly error message
      const errorMessage = error.message || 'حدث خطأ أثناء مزامنة المحفظة';
      
      // Check for rate limit error
      if (errorMessage.includes('429') || errorMessage.includes('Rate limit')) {
        toast({
          title: 'تم تجاوز الحد المسموح',
          description: 'يرجى الانتظار قليلاً قبل المحاولة مرة أخرى',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'خطأ في المزامنة',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  };

  const handleAnalyze = async () => {
    try {
      await analyzeMutation.mutateAsync(snapshot?.id);
    } catch (error) {
      console.error('Error analyzing risk:', error);
    }
  };

  const handleGenerateForecast = async () => {
    try {
      await forecastMutation.mutateAsync({ snapshotId: snapshot?.id, period: selectedPeriod });
    } catch (error) {
      console.error('Error generating forecast:', error);
    }
  };

  // Prepare chart data
  const exposureData = snapshot?.exposure
    ? Object.entries(snapshot.exposure as Record<string, number>)
        .filter(([_, value]) => value > 0.01)
        .map(([name, value]) => ({
          name,
          value: Math.round(value * 100 * 10) / 10,
        }))
    : [];

  const riskLevelColors = {
    LOW: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
    MEDIUM: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    HIGH: 'bg-orange-500/15 text-orange-500 border-orange-500/30',
    CRITICAL: 'bg-red-500/15 text-red-500 border-red-500/30',
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            تحليل المحفظة الذكي
          </h1>
          <p className="text-muted-foreground mt-1">
            تحليل شامل للمحفظة وتقييم المخاطر والتوقعات
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                جاري المزامنة...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                مزامنة المحفظة
              </>
            )}
          </Button>
          {snapshot && (
            <Button
              variant="outline"
              onClick={handleAnalyze}
              disabled={analyzeMutation.isPending}
            >
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  تحليل المخاطر
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Phase X.17: Scope Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            نطاق التحليل
          </CardTitle>
          <CardDescription>
            اختر نطاق التحليل: جميع المنصات أو منصة محددة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select
              value={selectedScope.type === 'GLOBAL' ? 'GLOBAL' : selectedScope.apiKeyId}
              onValueChange={(value) => {
                if (value === 'GLOBAL') {
                  setSelectedScope({ type: 'GLOBAL' });
                } else {
                  setSelectedScope({ type: 'EXCHANGE', apiKeyId: value });
                }
              }}
              disabled={apiKeysLoading}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="اختر نطاق التحليل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GLOBAL">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>جميع المنصات (Global)</span>
                  </div>
                </SelectItem>
                {apiKeys.map((apiKey) => (
                  <SelectItem key={apiKey.id} value={apiKey.id}>
                    <div className="flex items-center gap-2">
                      <span>{getPlatformDisplayName(apiKey.platform, apiKey.testnet)}</span>
                      {apiKey.testnet && (
                        <Badge variant="secondary" className="text-xs">Testnet</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedScope.type === 'EXCHANGE' && selectedExchangePlatform && (
              <Badge variant="outline" className="text-sm">
                {getPlatformDisplayName(selectedExchangePlatform, apiKeys.find(k => k.id === selectedScope.apiKeyId)?.testnet || false)}
              </Badge>
            )}
            {selectedScope.type === 'GLOBAL' && (
              <Badge variant="outline" className="text-sm">
                <Globe className="w-3 h-3 mr-1" />
                جميع المنصات
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Overview */}
      {snapshotLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          </CardContent>
        </Card>
      ) : !snapshot ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {selectedScope.type === 'GLOBAL' 
                ? 'لا توجد بيانات محفظة لجميع المنصات. يرجى مزامنة المحفظة أولاً.'
                : `لا توجد بيانات محفظة لـ ${getPlatformDisplayName(selectedExchangePlatform || '', apiKeys.find(k => k.id === selectedScope.apiKeyId)?.testnet || false)}. يرجى مزامنة المحفظة أولاً.`
              }
            </p>
            <Button onClick={handleSync}>
              <RefreshCw className="w-4 h-4 mr-2" />
              مزامنة المحفظة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الرصيد</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${snapshot.total_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">الربح/الخسارة غير المحققة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn(
                  'text-2xl font-bold',
                  snapshot.unrealized_pnl >= 0 ? 'text-emerald-500' : 'text-red-500'
                )}>
                  {snapshot.unrealized_pnl >= 0 ? '+' : ''}
                  ${snapshot.unrealized_pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">نسبة التعرض</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{snapshot.total_exposure.toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">الرافعة المالية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{snapshot.leverage_used.toFixed(1)}x</div>
              </CardContent>
            </Card>
          </div>

          {/* Risk Score Panel */}
          {riskLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              </CardContent>
            </Card>
          ) : riskScore ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  تقييم المخاطر
                </CardTitle>
                <CardDescription>تحليل مستوى المخاطر الحالي للمحفظة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">مستوى المخاطر:</span>
                  <Badge className={cn(riskLevelColors[riskScore.risk_level])}>
                    {riskScore.risk_level}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">النتيجة الإجمالية:</span>
                  <span className="font-bold">{riskScore.overall_score}/100</span>
                </div>
                {riskScore.ai_comment && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{riskScore.ai_comment}</p>
                  </div>
                )}
                {riskScore.risk_factors && riskScore.risk_factors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">عوامل المخاطر:</p>
                    {riskScore.risk_factors.map((factor, idx) => (
                      <div key={idx} className="text-sm text-muted-foreground">
                        • {factor.description}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">لا يوجد تحليل مخاطر متاح</p>
                <Button onClick={handleAnalyze}>تحليل المخاطر</Button>
              </CardContent>
            </Card>
          )}

          {/* Forecast Panel */}
          {hasForecastAccess ? (
            forecastLoading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                </CardContent>
              </Card>
            ) : forecast ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      التوقعات
                    </CardTitle>
                    <div className="flex gap-2">
                      {(['7d', '30d', '90d'] as const).map((period) => (
                        <Button
                          key={period}
                          variant={selectedPeriod === period ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedPeriod(period)}
                        >
                          {period}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <CardDescription>توقعات أداء المحفظة</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">النمو المتوقع</p>
                      <p className="text-2xl font-bold">
                        {forecast.expected_growth && forecast.expected_growth > 0 ? '+' : ''}
                        {forecast.expected_growth?.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">النمو المعدل للمخاطر</p>
                      <p className="text-2xl font-bold">
                        {forecast.risk_adjusted_growth && forecast.risk_adjusted_growth > 0 ? '+' : ''}
                        {forecast.risk_adjusted_growth?.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  {forecast.best_asset && (
                    <div>
                      <p className="text-sm text-muted-foreground">أفضل أصل متوقع</p>
                      <p className="font-semibold">{forecast.best_asset}</p>
                    </div>
                  )}
                  {forecast.momentum_direction && (
                    <Badge variant="outline">
                      {forecast.momentum_direction === 'BULLISH' ? '📈 صاعد' :
                       forecast.momentum_direction === 'BEARISH' ? '📉 هابط' : '➖ محايد'}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">لا توجد توقعات متاحة</p>
                  <Button onClick={handleGenerateForecast}>إنشاء توقعات</Button>
                </CardContent>
              </Card>
            )
          ) : (
            <FeatureLock
              featureName="توقعات المحفظة"
              requiredPlan="PREMIUM"
              currentPlan={userPlan?.code}
              description="توقعات أداء المحفظة متاحة للباقات المدفوعة."
            />
          )}

          {/* Recommendations */}
          {hasFullAccess ? (
            recLoading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                </CardContent>
              </Card>
            ) : recommendations.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    التوصيات
                  </CardTitle>
                  <CardDescription>توصيات AI لتحسين المحفظة</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{rec.title}</h4>
                        <Badge variant={rec.priority === 'URGENT' ? 'destructive' : 'outline'}>
                          {rec.priority}
                        </Badge>
                      </div>
                      {rec.description && (
                        <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                      )}
                      {rec.details?.reason && (
                        <p className="text-sm">{rec.details.reason}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null
          ) : (
            <FeatureLock
              featureName="توصيات AI"
              requiredPlan="PRO"
              currentPlan={userPlan?.code}
              description="توصيات AI المتقدمة متاحة للباقات الاحترافية."
            />
          )}

          {/* Exposure Chart */}
          {exposureData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>توزيع المحفظة</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={exposureData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {exposureData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

