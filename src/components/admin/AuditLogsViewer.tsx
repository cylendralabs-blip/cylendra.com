/**
 * Audit Logs Viewer Component
 * 
 * Phase Admin F: Display admin audit logs
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Search } from 'lucide-react';
import { getAuditLogs, type AdminAuditLog } from '@/services/admin/AuditLogService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AuditLogsViewer() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    actionType: 'all',
    adminId: '',
    startDate: '',
    endDate: '',
  });

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { logs: logsData, error } = await getAuditLogs({
        actionType: filters.actionType !== 'all' ? filters.actionType : undefined,
        adminId: filters.adminId || undefined,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        limit: 100,
      });

      if (error) {
        toast({
          title: '❌ خطأ',
          description: error,
          variant: 'destructive',
        });
      } else {
        setLogs(logsData);
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحميل سجلات التدقيق',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ar', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>الفلاتر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Admin ID"
              value={filters.adminId}
              onChange={(e) => setFilters({ ...filters, adminId: e.target.value })}
            />
            <Select value={filters.actionType} onValueChange={(value) => setFilters({ ...filters, actionType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="نوع الإجراء" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="risk_settings_change">تغيير إعدادات المخاطر</SelectItem>
                <SelectItem value="feature_flag_toggle">تغيير Feature Flag</SelectItem>
                <SelectItem value="kill_switch_activation">تفعيل Kill Switch</SelectItem>
                <SelectItem value="user_trading_toggle">تغيير حالة التداول</SelectItem>
                <SelectItem value="user_plan_change">تغيير خطة المستخدم</SelectItem>
                <SelectItem value="force_portfolio_sync">إجبار مزامنة Portfolio</SelectItem>
                <SelectItem value="bot_pause_resume">إيقاف/تشغيل البوت</SelectItem>
                <SelectItem value="admin_login">تسجيل دخول الأدمن</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="من تاريخ"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            <Input
              type="date"
              placeholder="إلى تاريخ"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={loadLogs}>
              <Search className="w-4 h-4 mr-2" />
              بحث
            </Button>
            <Button variant="outline" onClick={loadLogs} disabled={loading}>
              <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>سجلات التدقيق ({logs.length})</CardTitle>
          <CardDescription>سجل كامل لجميع الإجراءات الإدارية</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              لا توجد سجلات
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الأدمن</TableHead>
                  <TableHead>نوع الإجراء</TableHead>
                  <TableHead>الهدف</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>التفاصيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {formatDate(log.created_at)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.admin_id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {log.target_type && log.target_id ? (
                        <span className="text-sm">
                          {log.target_type}: {log.target_id.substring(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.ip_address || '-'}
                    </TableCell>
                    <TableCell>
                      {Object.keys(log.metadata).length > 0 && (
                        <details>
                          <summary className="text-xs text-muted-foreground cursor-pointer">
                            عرض التفاصيل
                          </summary>
                          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-w-md">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
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

