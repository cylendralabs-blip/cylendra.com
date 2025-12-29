/**
 * Security Events Viewer Component
 * 
 * Phase Admin F: Display security events
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, CheckCircle } from 'lucide-react';
import { getSecurityEvents, resolveSecurityEvent, type SecurityEvent } from '@/services/admin/SecurityEventService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export default function SecurityEventsViewer() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [showResolved, setShowResolved] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { events: eventsData, error } = await getSecurityEvents({
        severity: selectedSeverity !== 'all' ? selectedSeverity as any : undefined,
        resolved: showResolved ? undefined : false,
        limit: 100,
      });

      if (error) {
        toast({
          title: '❌ خطأ',
          description: error,
          variant: 'destructive',
        });
      } else {
        setEvents(eventsData);
      }
    } catch (error) {
      console.error('Error loading security events:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحميل الأحداث الأمنية',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [selectedSeverity, showResolved]);

  const handleResolve = async (eventId: string) => {
    if (!user?.id) return;

    try {
      const { success, error } = await resolveSecurityEvent(eventId, user.id);
      if (success) {
        toast({
          title: '✅ نجح',
          description: 'تم حل الحدث',
        });
        loadEvents();
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في حل الحدث',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error resolving event:', error);
    }
  };

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

  const severityColors: Record<string, string> = {
    low: 'bg-gray-100 dark:bg-gray-800 text-gray-700',
    medium: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700',
    high: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700',
    critical: 'bg-red-100 dark:bg-red-900/20 text-red-700',
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>الأحداث الأمنية</CardTitle>
              <CardDescription>مراقبة الأحداث الأمنية والأنشطة المشبوهة</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="الشدة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="low">منخفض</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="high">عالي</SelectItem>
                  <SelectItem value="critical">حرج</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResolved(!showResolved)}
              >
                {showResolved ? 'إخفاء المحلولة' : 'عرض المحلولة'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadEvents}
                disabled={loading}
              >
                <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
                تحديث
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            </div>
          ) : events.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              لا توجد أحداث أمنية
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>نوع الحدث</TableHead>
                  <TableHead>الشدة</TableHead>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="text-sm">
                      {formatDate(event.detected_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{event.event_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={severityColors[event.severity]}>
                        {event.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {event.user_id ? event.user_id.substring(0, 8) + '...' : event.admin_id ? event.admin_id.substring(0, 8) + '...' : '-'}
                    </TableCell>
                    <TableCell>
                      {event.resolved ? (
                        <Badge variant="outline" className="bg-green-100 dark:bg-green-900/20">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          محلول
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-100 dark:bg-red-900/20">
                          غير محلول
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!event.resolved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResolve(event.id)}
                        >
                          حل
                        </Button>
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

