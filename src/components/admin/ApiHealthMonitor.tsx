/**
 * API Health Monitor Component
 * 
 * Phase Admin D: Display API key health status
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Clock, Key } from 'lucide-react';
import { getUserApiHealth, type ApiKeyHealth } from '@/services/admin/ApiHealthService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ApiHealthMonitorProps {
  userId: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  valid: {
    label: 'صالح',
    color: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    icon: CheckCircle,
  },
  invalid: {
    label: 'غير صالح',
    color: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
    icon: XCircle,
  },
  expired: {
    label: 'منتهي',
    color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
    icon: AlertTriangle,
  },
  permission_error: {
    label: 'خطأ في الصلاحيات',
    color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
    icon: AlertTriangle,
  },
  rate_limited: {
    label: 'محدود',
    color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    icon: Clock,
  },
};

export default function ApiHealthMonitor({ userId }: ApiHealthMonitorProps) {
  const { toast } = useToast();
  const [health, setHealth] = useState<ApiKeyHealth[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const { health: healthData, error } = await getUserApiHealth(userId);

      if (error) {
        toast({
          title: '❌ خطأ',
          description: error,
          variant: 'destructive',
        });
      } else {
        setHealth(healthData);
      }
    } catch (error) {
      console.error('Error loading API health:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحميل حالة API',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, [userId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('ar', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && health.length === 0) {
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
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                صحة API Keys
              </CardTitle>
              <CardDescription>حالة API keys للمستخدم</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadHealth}
              disabled={loading}
            >
              <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
              تحديث
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {health.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              لا توجد API keys مسجلة
            </div>
          ) : (
            <div className="space-y-4">
              {health.map((item) => {
                const config = statusConfig[item.status] || statusConfig.invalid;
                const Icon = config.icon;

                return (
                  <Card key={item.id} className={cn('border-l-4', item.status === 'valid' ? 'border-green-500' : 'border-red-500')}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5" />
                          <CardTitle>{item.platform}</CardTitle>
                        </div>
                        <Badge className={config.color}>
                          {config.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">آخر طلب ناجح:</span>
                          <p className="font-medium">{formatDate(item.last_successful_request_at)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">معدل الخطأ:</span>
                          <p className="font-medium">{item.error_rate_percentage.toFixed(2)}%</p>
                        </div>
                        {item.last_successful_endpoint && (
                          <div>
                            <span className="text-muted-foreground">آخر endpoint:</span>
                            <p className="font-medium">{item.last_successful_endpoint}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">آخر فحص:</span>
                          <p className="font-medium">{formatDate(item.last_checked_at)}</p>
                        </div>
                      </div>

                      {item.last_10_errors && item.last_10_errors.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold mb-2">آخر 10 أخطاء:</h4>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {item.last_10_errors.map((error: any, index: number) => (
                              <div key={index} className="text-xs bg-muted p-2 rounded">
                                <p className="font-medium">{error.error}</p>
                                <p className="text-muted-foreground">{error.endpoint} - {formatDate(error.timestamp)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {Object.keys(item.security_flags).length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold mb-2">Security Flags:</h4>
                          <div className="space-y-1">
                            {Object.entries(item.security_flags).map(([key, value]) => (
                              <div key={key} className="text-xs">
                                <span className="font-medium">{key}:</span> {String(value)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

