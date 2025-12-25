/**
 * Support Overview Page
 * 
 * Phase Admin D: System-wide support views
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, XCircle, Bot, Bell, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getUnhealthyApiKeys, type ApiKeyHealth } from '@/services/admin/ApiHealthService';
import { supabase } from '@/integrations/supabase/client';

export default function SupportOverview() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [unhealthyApiKeys, setUnhealthyApiKeys] = useState<ApiKeyHealth[]>([]);
  const [failedTrades, setFailedTrades] = useState<any[]>([]);
  const [botFailures, setBotFailures] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load unhealthy API keys
      const { health } = await getUnhealthyApiKeys(50);
      setUnhealthyApiKeys(health);

      // Load failed trades (placeholder - would need actual failed trades table)
      // For now, we'll query from error logs
      const { data: errors } = await (supabase as any)
        .from('user_error_logs')
        .select('*, user_id')
        .eq('source', 'trade_execution')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(50);

      setFailedTrades(errors || []);

      // Load bot failures
      const { data: botErrors } = await (supabase as any)
        .from('user_error_logs')
        .select('*, user_id')
        .eq('source', 'bot')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(50);

      setBotFailures(botErrors || []);
    } catch (error) {
      console.error('Error loading support overview:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحميل البيانات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ar', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-8 h-8 text-primary" />
          نظرة عامة على الدعم
        </h1>
        <p className="text-muted-foreground mt-1">
          نظرة شاملة على المشاكل عبر جميع المستخدمين
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              API Keys غير صحية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unhealthyApiKeys.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              صفقات فاشلة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedTrades.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              فشل البوتات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{botFailures.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي المشاكل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {unhealthyApiKeys.length + failedTrades.length + botFailures.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unhealthy API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            API Keys غير صحية
          </CardTitle>
          <CardDescription>المستخدمين الذين لديهم API keys غير صالحة</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            </div>
          ) : unhealthyApiKeys.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              لا توجد API keys غير صحية
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>المنصة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>معدل الخطأ</TableHead>
                  <TableHead>آخر فحص</TableHead>
                  <TableHead>إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unhealthyApiKeys.map((health) => (
                  <TableRow key={health.id}>
                    <TableCell>{health.user_id}</TableCell>
                    <TableCell>{health.platform}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{health.status}</Badge>
                    </TableCell>
                    <TableCell>{health.error_rate_percentage.toFixed(2)}%</TableCell>
                    <TableCell>{formatDate(health.last_checked_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/dashboard/admin/users/${health.user_id}/support`)}
                      >
                        عرض
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Failed Trades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            صفقات فاشلة
          </CardTitle>
          <CardDescription>الصفقات التي فشلت في التنفيذ</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            </div>
          ) : failedTrades.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              لا توجد صفقات فاشلة
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>نوع الخطأ</TableHead>
                  <TableHead>الرسالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failedTrades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell>{trade.user_id}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{trade.error_type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate">{trade.error_message}</TableCell>
                    <TableCell>{formatDate(trade.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/dashboard/admin/users/${trade.user_id}/support`)}
                      >
                        عرض
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Bot Failures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-red-600" />
            فشل البوتات
          </CardTitle>
          <CardDescription>البوتات التي فشلت في التنفيذ</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            </div>
          ) : botFailures.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              لا توجد فشل في البوتات
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>نوع الخطأ</TableHead>
                  <TableHead>الرسالة</TableHead>
                  <TableHead>الشدة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {botFailures.map((failure) => (
                  <TableRow key={failure.id}>
                    <TableCell>{failure.user_id}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{failure.error_type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate">{failure.error_message}</TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          failure.severity === 'critical' && 'bg-red-100 dark:bg-red-900/20 text-red-700',
                          failure.severity === 'high' && 'bg-orange-100 dark:bg-orange-900/20 text-orange-700',
                          failure.severity === 'medium' && 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700',
                          'bg-gray-100 dark:bg-gray-900/20 text-gray-700'
                        )}
                      >
                        {failure.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(failure.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/dashboard/admin/users/${failure.user_id}/support`)}
                      >
                        عرض
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

