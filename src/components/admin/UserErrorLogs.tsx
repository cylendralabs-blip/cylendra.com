/**
 * User Error Logs Component
 * 
 * Phase Admin D: Display user error logs
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { getUserErrorLogs, resolveError, type UserErrorLog } from '@/services/admin/UserErrorLogService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface UserErrorLogsProps {
  userId: string;
}

const severityColors: Record<string, string> = {
  low: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  medium: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
  high: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
  critical: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
};

export default function UserErrorLogs({ userId }: UserErrorLogsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [errors, setErrors] = useState<UserErrorLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [showResolved, setShowResolved] = useState(false);

  const loadErrors = async () => {
    setLoading(true);
    try {
      const { errors: errorsData, error } = await getUserErrorLogs(userId, {
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
        setErrors(errorsData);
      }
    } catch (error) {
      console.error('Error loading error logs:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحميل سجلات الأخطاء',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadErrors();
  }, [userId, selectedSeverity, showResolved]);

  const handleResolve = async (errorId: string) => {
    if (!user?.id) return;

    try {
      const { success, error } = await resolveError(errorId, user.id);
      if (success) {
        toast({
          title: '✅ نجح',
          description: 'تم حل الخطأ',
        });
        loadErrors();
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في حل الخطأ',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error resolving error:', error);
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

  if (loading && errors.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>سجلات الأخطاء</CardTitle>
              <CardDescription>جميع الأخطاء التي أثرت على المستخدم</CardDescription>
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
                onClick={loadErrors}
                disabled={loading}
              >
                <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
                تحديث
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {errors.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              لا توجد أخطاء مسجلة
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>المصدر</TableHead>
                  <TableHead>الشدة</TableHead>
                  <TableHead>الرسالة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errors.map((error) => (
                  <TableRow key={error.id}>
                    <TableCell className="text-sm">
                      {formatDate(error.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{error.error_type}</Badge>
                    </TableCell>
                    <TableCell>{error.source}</TableCell>
                    <TableCell>
                      <Badge className={cn(severityColors[error.severity])}>
                        {error.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {error.error_message}
                    </TableCell>
                    <TableCell>
                      {error.resolved ? (
                        <Badge variant="outline" className="bg-green-100 dark:bg-green-900/20">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          محلول
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-100 dark:bg-red-900/20">
                          <XCircle className="w-3 h-3 mr-1" />
                          غير محلول
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!error.resolved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResolve(error.id)}
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

