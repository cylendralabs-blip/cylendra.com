/**
 * Dashboard Alerts Preview
 * 
 * Shows last 2 alerts from NotificationCenter
 * 
 * Phase 10: UI/UX Improvement - Task 2
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Bell, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';

interface Alert {
  id: string;
  user_id: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  type: string;
  title: string;
  body: string;
  context?: any;
  is_read: boolean;
  acknowledged: boolean;
  created_at: string;
}

export const DashboardAlertsPreview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAlerts = async () => {
      try {
        // Use type assertion to avoid deep type inference issues
        // The alerts table exists but isn't in generated types yet
        const alertsResult = await (supabase
          .from('alerts' as any)
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(2) as any) as { data: Alert[] | null; error: any };

        if (alertsResult.error) {
          console.error('Error fetching alerts:', alertsResult.error);
          return;
        }

        if (alertsResult.data) {
          setAlerts(alertsResult.data);
        }
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();

    // Subscribe to new alerts
    const channel = supabase
      .channel('dashboard-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getSeverityVariant = (level: string) => {
    switch (level) {
      case 'error':
      case 'critical':
        return 'destructive';
      case 'warn':
        return 'default';
      case 'info':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <DashboardSectionHeader
            icon={<Bell className="h-5 w-5" />}
            title="Recent Alerts"
          />
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <DashboardSectionHeader
            icon={<Bell className="h-5 w-5" />}
            title="Recent Alerts"
          />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-4">
            No alerts at the moment
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <DashboardSectionHeader
          icon={<Bell className="h-5 w-5" />}
          title="Recent Alerts"
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigate('/dashboard/advanced-analytics');
              }}
              className="gap-2"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Button>
          }
        />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`
                p-3 rounded-lg border
                ${alert.is_read ? 'bg-muted/50' : 'bg-background'}
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getSeverityVariant(alert.level)} className="text-xs">
                      {alert.level}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.body}</p>
                </div>
                {!alert.is_read && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

