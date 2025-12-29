/**
 * Bot Supervision Component
 * 
 * Phase Admin B: Bot management and intervention tools
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, RefreshCw, Play, Pause, Square, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { getAllBots, pauseBot, resumeBot, disableAllUserBots, BotInfo } from '@/services/admin/BotSupervisionService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function BotSupervision() {
  const { toast } = useToast();
  const [bots, setBots] = useState<BotInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadBots = async () => {
    setLoading(true);
    try {
      const { bots: botsData, error } = await getAllBots();
      if (error) {
        toast({
          title: '❌ خطأ',
          description: error,
          variant: 'destructive',
        });
      } else {
        setBots(botsData);
      }
    } catch (error) {
      console.error('Error loading bots:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحميل البوتات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBots();
    const interval = setInterval(loadBots, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handlePauseBot = async (botId: string) => {
    setActionLoading(botId);
    try {
      const { success, error } = await pauseBot(botId);
      if (success) {
        toast({
          title: '✅ نجح',
          description: 'تم إيقاف البوت بنجاح',
        });
        loadBots();
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في إيقاف البوت',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error pausing bot:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في إيقاف البوت',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeBot = async (botId: string) => {
    setActionLoading(botId);
    try {
      const { success, error } = await resumeBot(botId);
      if (success) {
        toast({
          title: '✅ نجح',
          description: 'تم استئناف البوت بنجاح',
        });
        loadBots();
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في استئناف البوت',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error resuming bot:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في استئناف البوت',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisableAllUserBots = async (userId: string) => {
    setActionLoading(`user-${userId}`);
    try {
      const { success, error } = await disableAllUserBots(userId);
      if (success) {
        toast({
          title: '✅ نجح',
          description: 'تم إيقاف جميع بوتات المستخدم بنجاح',
        });
        loadBots();
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في إيقاف البوتات',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error disabling user bots:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في إيقاف البوتات',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'stopped':
        return <Square className="w-4 h-4 text-gray-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
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

  const runningBots = bots.filter(b => b.status === 'running');
  const pausedBots = bots.filter(b => b.status === 'paused');
  const stoppedBots = bots.filter(b => b.status === 'stopped');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إشراف البوتات</h2>
          <p className="text-muted-foreground">
            إدارة ومراقبة جميع البوتات عبر النظام
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadBots}
          disabled={loading}
        >
          <RefreshCw className={cn('w-4 h-4 mr-1', loading && 'animate-spin')} />
          تحديث
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              البوتات النشطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{runningBots.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              البوتات المتوقفة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pausedBots.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              البوتات المعطلة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stoppedBots.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bots Table */}
      <Card>
        <CardHeader>
          <CardTitle>جميع البوتات ({bots.length})</CardTitle>
          <CardDescription>
            قائمة بجميع البوتات في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && bots.length === 0 ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            </div>
          ) : bots.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              لا توجد بوتات
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>اسم البوت</TableHead>
                    <TableHead>نوع الاستراتيجية</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>رأس المال</TableHead>
                    <TableHead>الصفقات النشطة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bots.map((bot) => (
                    <TableRow key={bot.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{bot.user_email || bot.user_id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{bot.bot_name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{bot.strategy_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(bot.status)}
                          <Badge variant={bot.status === 'running' ? 'default' : 'secondary'}>
                            {bot.status === 'running' ? 'نشط' : bot.status === 'paused' ? 'متوقف' : 'معطل'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(bot.total_capital)}</TableCell>
                      <TableCell>{bot.current_trades_count}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {bot.status === 'running' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePauseBot(bot.id)}
                              disabled={actionLoading === bot.id}
                            >
                              {actionLoading === bot.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Pause className="w-4 h-4" />
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResumeBot(bot.id)}
                              disabled={actionLoading === bot.id}
                            >
                              {actionLoading === bot.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisableAllUserBots(bot.user_id)}
                            disabled={actionLoading === `user-${bot.user_id}`}
                          >
                            {actionLoading === `user-${bot.user_id}` ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

