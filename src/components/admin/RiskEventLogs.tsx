/**
 * Risk Event Logs Component
 * 
 * Phase Admin B: System-wide risk event logging and audit trail
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, RefreshCw, FileText, Search, AlertOctagon, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface RiskEventLog {
  id: string;
  user_id: string | null;
  user_email?: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string | null;
  metadata: any;
  created_at: string;
}

export default function RiskEventLogs() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<RiskEventLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      let query = (supabase as any)
        .from('risk_event_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (severityFilter !== 'all') {
        query = query.eq('severity', severityFilter);
      }
      if (eventTypeFilter !== 'all') {
        query = query.eq('event_type', eventTypeFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading risk event logs:', error);
        toast({
          title: '❌ خطأ',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      // Enrich with user emails
      const enrichedLogs = await Promise.all(
        ((data || []) as any[]).map(async (log: any) => {
          let userEmail: string | undefined;
          if (log.user_id) {
            try {
              const { data: profile } = await (supabase as any)
                .from('profiles')
                .select('email')
                .eq('id', log.user_id)
                .maybeSingle();
              userEmail = profile?.email;
            } catch (e) {
              // Ignore errors
            }
          }

          return {
            ...log,
            user_email: userEmail,
          };
        })
      );

      setLogs(enrichedLogs);
    } catch (error) {
      console.error('Error loading risk event logs:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحميل السجلات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [severityFilter, eventTypeFilter]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertOctagon className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.event_type.toLowerCase().includes(query) ||
        log.description?.toLowerCase().includes(query) ||
        log.user_email?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const uniqueEventTypes = Array.from(new Set(logs.map(log => log.event_type)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" />
            سجلات أحداث المخاطر
          </h2>
          <p className="text-muted-foreground">
            سجل شامل لجميع أحداث المخاطر في النظام
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadLogs}
          disabled={loading}
        >
          <RefreshCw className={cn('w-4 h-4 mr-1', loading && 'animate-spin')} />
          تحديث
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>الفلاتر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">مستوى الخطورة</label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
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
              <label className="text-sm font-medium">نوع الحدث</label>
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {uniqueEventTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">البحث</label>
              <div className="relative">
                <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>السجلات ({filteredLogs.length})</CardTitle>
          <CardDescription>
            آخر 100 حدث مخاطر
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && logs.length === 0 ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              لا توجد سجلات
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الوقت</TableHead>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>نوع الحدث</TableHead>
                    <TableHead>الخطورة</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>البيانات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(log.created_at).toLocaleString('ar')}
                        </span>
                      </TableCell>
                      <TableCell>
                        {log.user_email || log.user_id || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{log.event_type}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(log.severity)}
                          <Badge variant={getSeverityBadgeVariant(log.severity)}>
                            {log.severity}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{log.description || 'N/A'}</span>
                      </TableCell>
                      <TableCell>
                        {log.metadata && Object.keys(log.metadata).length > 0 ? (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground">
                              عرض البيانات
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-w-md">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-muted-foreground text-xs">لا توجد بيانات</span>
                        )}
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

