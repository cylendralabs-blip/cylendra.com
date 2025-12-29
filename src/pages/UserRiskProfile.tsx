/**
 * User Risk Profile Page
 * 
 * Phase Admin B: Detailed risk overview for individual users
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, TrendingDown, TrendingUp, AlertTriangle, Bot, DollarSign, BarChart3 } from 'lucide-react';
import { getUserRiskProfile, getUserRiskTimeline, getUserBotOverview, UserRiskProfile, RiskTimelinePoint, BotOverview } from '@/services/admin/UserRiskProfileService';
import { disableAllUserBots } from '@/services/admin/BotSupervisionService';
import { UserManagementService } from '@/services/admin/UserManagementService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function UserRiskProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<UserRiskProfile | null>(null);
  const [timeline, setTimeline] = useState<RiskTimelinePoint[]>([]);
  const [bots, setBots] = useState<BotOverview[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const [profileResult, timelineResult, botsResult] = await Promise.all([
        getUserRiskProfile(userId),
        getUserRiskTimeline(userId, 30),
        getUserBotOverview(userId),
      ]);

      if (profileResult.profile) {
        setProfile(profileResult.profile);
      }
      if (timelineResult.timeline) {
        setTimeline(timelineResult.timeline);
      }
      if (botsResult.bots) {
        setBots(botsResult.bots);
      }
    } catch (error) {
      console.error('Error loading user risk profile:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحميل بيانات المستخدم',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleDisableAllBots = async () => {
    if (!userId) return;

    setActionLoading(true);
    try {
      const { success, error } = await disableAllUserBots(userId);
      if (success) {
        toast({
          title: '✅ نجح',
          description: 'تم إيقاف جميع بوتات المستخدم',
        });
        loadData();
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في إيقاف البوتات',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error disabling bots:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في إيقاف البوتات',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisableTrading = async () => {
    if (!userId) return;

    setActionLoading(true);
    try {
      const { success, error } = await UserManagementService.toggleUserTradingStatus(userId, false);
      if (success) {
        toast({
          title: '✅ نجح',
          description: 'تم تعطيل التداول للمستخدم',
        });
        loadData();
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في تعطيل التداول',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error disabling trading:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تعطيل التداول',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading && !profile) {
    return (
      <div className="container mx-auto p-6">
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">المستخدم غير موجود</p>
            <Button onClick={() => navigate(-1)} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              العودة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare chart data
  const chartData = timeline.map(point => ({
    date: new Date(point.timestamp).toLocaleDateString('ar'),
    equity: Number(point.equity),
    drawdown: Number(point.drawdownPercent),
    dailyLoss: Number(point.dailyLossPercent),
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">ملف المخاطر للمستخدم</h1>
            <p className="text-muted-foreground">{profile.userEmail || profile.userId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleDisableAllBots}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Bot className="w-4 h-4 mr-2" />
            )}
            إيقاف جميع البوتات
          </Button>
          <Button
            variant="destructive"
            onClick={handleDisableTrading}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <AlertTriangle className="w-4 h-4 mr-2" />
            )}
            تعطيل التداول
          </Button>
        </div>
      </div>

      {/* Live Risk Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              رأس المال الحالي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(profile.currentEquity)}</div>
          </CardContent>
        </Card>
        <Card className={cn(
          profile.currentDailyLossPercent < 0 && 'border-red-200 dark:border-red-900'
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              الخسارة اليومية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              'text-2xl font-bold',
              profile.currentDailyLossPercent < 0 ? 'text-red-600' : 'text-green-600'
            )}>
              {formatCurrency(profile.currentDailyLoss)} ({formatPercent(profile.currentDailyLossPercent)})
            </div>
          </CardContent>
        </Card>
        <Card className={cn(
          profile.currentDrawdownPercent < -10 && 'border-orange-200 dark:border-orange-900'
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              التراجع الحالي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              'text-2xl font-bold',
              profile.currentDrawdownPercent < -10 ? 'text-orange-600' : 'text-gray-600'
            )}>
              {formatCurrency(profile.currentDrawdown)} ({formatPercent(profile.currentDrawdownPercent)})
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              التعرض الإجمالي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(profile.totalExposure)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {profile.activePositionsCount} صفقة نشطة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Graphs */}
      {timeline.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>تطور رأس المال</CardTitle>
              <CardDescription>آخر 30 يوم</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="equity" stroke="#8884d8" name="رأس المال" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>التراجع والخسارة اليومية</CardTitle>
              <CardDescription>آخر 30 يوم</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="drawdown" stroke="#ff7300" name="التراجع %" />
                  <Line type="monotone" dataKey="dailyLoss" stroke="#82ca9d" name="الخسارة اليومية %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Bots Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            البوتات النشطة ({bots.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bots.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              لا توجد بوتات نشطة
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bots.map((bot) => (
                <Card key={bot.botId} className={cn(
                  bot.status === 'running' && 'border-green-200 dark:border-green-900',
                  bot.status === 'failed' && 'border-red-200 dark:border-red-900'
                )}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{bot.botName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">الحالة</span>
                      <Badge variant={bot.status === 'running' ? 'default' : 'secondary'}>
                        {bot.status === 'running' ? 'نشط' : bot.status === 'paused' ? 'متوقف' : 'معطل'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">نوع الاستراتيجية</span>
                      <span className="text-xs font-medium">{bot.strategyType}</span>
                    </div>
                    {bot.lastError && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded text-xs text-red-600">
                        {bot.lastError}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

