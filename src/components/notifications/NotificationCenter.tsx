/**
 * Notification Center Component
 * 
 * Displays alerts and notifications to users
 * 
 * Phase 8: Logging + Monitoring + Alerting System - Task 9
 */

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle2, XCircle, Bell, BellOff, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { markAlertAsRead, acknowledgeAlert, getUnreadAlerts } from '@/services/alertEngine';

interface Alert {
  id: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  type: string;
  title: string;
  body: string;
  context?: any;
  trade_id?: string;
  position_id?: string;
  signal_id?: string;
  is_read: boolean;
  acknowledged: boolean;
  created_at: string;
}

export const NotificationCenter = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAlerts = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Use type assertion to avoid deep type inference issues
      // The alerts table exists but isn't in generated types yet
      const alertsResult = await (supabase
        .from('alerts' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50) as any) as { data: any[] | null; error: any };

      if (alertsResult.error) {
        throw alertsResult.error;
      }

      const data = alertsResult.data;
      setAlerts(data || []);
      setUnreadCount((data || []).filter((a: any) => !a.is_read).length);
    } catch (err: any) {
      console.error('Error fetching alerts:', err);
      setError(err.message || 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetchAlerts();

    // Subscribe to new alerts
    const channel = supabase
      .channel('alerts-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchAlerts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAlerts();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user, fetchAlerts]);

  const handleMarkAsRead = async (alertId: string) => {
    if (!user) return;

    const success = await markAlertAsRead(alertId, user.id);
    if (success) {
      setAlerts(prev =>
        prev.map(alert =>
          alert.id === alertId
            ? { ...alert, is_read: true, read_at: new Date().toISOString() }
            : alert
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    if (!user) return;

    const success = await acknowledgeAlert(alertId, user.id);
    if (success) {
      setAlerts(prev =>
        prev.map(alert =>
          alert.id === alertId
            ? { ...alert, acknowledged: true, acknowledged_at: new Date().toISOString() }
            : alert
        )
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;

    const unreadAlerts = alerts.filter(a => !a.is_read);
    for (const alert of unreadAlerts) {
      await markAlertAsRead(alert.id, user.id);
    }
    fetchAlerts();
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warn':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-blue-500" />;
    }
  };

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'critical':
      case 'error':
        return 'destructive';
      case 'warn':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading && alerts.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-red-500">
            <p>Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
                Mark All Read
              </Button>
            )}
            <Button onClick={fetchAlerts} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BellOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
                <p className="text-xs mt-1">You're all caught up!</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border transition-all ${
                    !alert.is_read
                      ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                      : 'bg-card border-border opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getLevelIcon(alert.level)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getLevelBadgeVariant(alert.level)} className="text-xs">
                              {alert.level.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {alert.type.replace(/_/g, ' ')}
                            </Badge>
                            {!alert.is_read && (
                              <Badge variant="default" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-semibold text-sm mb-1">{alert.title}</h4>
                          <p className="text-sm text-muted-foreground">{alert.body}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      
                      {(alert.trade_id || alert.position_id || alert.signal_id) && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          {alert.trade_id && <span>Trade: {alert.trade_id.slice(0, 8)}...</span>}
                          {alert.position_id && <span>Position: {alert.position_id.slice(0, 8)}...</span>}
                          {alert.signal_id && <span>Signal: {alert.signal_id.slice(0, 8)}...</span>}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-3">
                        {!alert.is_read && (
                          <Button
                            onClick={() => handleMarkAsRead(alert.id)}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            Mark Read
                          </Button>
                        )}
                        {!alert.acknowledged && (
                          <Button
                            onClick={() => handleAcknowledge(alert.id)}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

