/**
 * Active Sessions Manager Component
 * 
 * Phase Admin F: Manage admin active sessions
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, LogOut, AlertTriangle } from 'lucide-react';
import { getActiveSessions, revokeSession, revokeAllSessions } from '@/services/admin/AdminSecurityService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export default function ActiveSessionsManager() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSessions = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { sessions: sessionsData, error } = await getActiveSessions(user.id);
      if (error) {
        toast({
          title: '❌ خطأ',
          description: error,
          variant: 'destructive',
        });
      } else {
        setSessions(sessionsData);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحميل الجلسات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [user?.id]);

  const handleRevoke = async (sessionId: string) => {
    if (!user?.id) return;

    if (!confirm('هل أنت متأكد من إلغاء هذه الجلسة؟')) {
      return;
    }

    try {
      const { success, error } = await revokeSession(sessionId, user.id);
      if (success) {
        toast({
          title: '✅ نجح',
          description: 'تم إلغاء الجلسة',
        });
        loadSessions();
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في إلغاء الجلسة',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error revoking session:', error);
    }
  };

  const handleRevokeAll = async () => {
    if (!user?.id) return;

    if (!confirm('هل أنت متأكد من إلغاء جميع الجلسات الأخرى؟')) {
      return;
    }

    try {
      const currentSession = sessions[0]?.id; // Assume first is current
      const { success, error } = await revokeAllSessions(user.id, currentSession || '', user.id);
      if (success) {
        toast({
          title: '✅ نجح',
          description: 'تم إلغاء جميع الجلسات الأخرى',
        });
        loadSessions();
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في إلغاء الجلسات',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error revoking all sessions:', error);
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

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>الجلسات النشطة</CardTitle>
              <CardDescription>إدارة جلسات الأدمن النشطة</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRevokeAll}
                disabled={sessions.length <= 1}
              >
                <LogOut className="w-4 h-4 mr-2" />
                إلغاء جميع الجلسات الأخرى
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadSessions}
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
          ) : sessions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              لا توجد جلسات نشطة
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>User Agent</TableHead>
                  <TableHead>آخر نشاط</TableHead>
                  <TableHead>ينتهي في</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-mono text-sm">
                      {session.ip_address}
                    </TableCell>
                    <TableCell className="text-sm max-w-md truncate">
                      {session.user_agent || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(session.last_activity_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(session.expires_at)}
                    </TableCell>
                    <TableCell>
                      {isExpired(session.expires_at) ? (
                        <Badge variant="destructive">منتهية</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-100 dark:bg-green-900/20">
                          نشطة
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!isExpired(session.expires_at) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevoke(session.id)}
                          className="text-red-600"
                        >
                          <LogOut className="w-4 h-4" />
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

