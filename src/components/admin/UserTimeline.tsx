/**
 * User Timeline Component
 * 
 * Phase Admin D: Display user activity timeline
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Clock, User, Key, TrendingUp, AlertTriangle, Shield, Settings, Activity } from 'lucide-react';
import { getUserTimeline, type TimelineEvent } from '@/services/admin/UserTimelineService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface UserTimelineProps {
  userId: string;
}

const eventCategoryIcons: Record<string, any> = {
  authentication: User,
  api_connection: Key,
  trading_activity: TrendingUp,
  risk_event: AlertTriangle,
  admin_action: Shield,
  system_issue: Settings,
};

const eventCategoryColors: Record<string, string> = {
  authentication: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  api_connection: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
  trading_activity: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
  risk_event: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
  admin_action: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
  system_issue: 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300',
};

const severityColors: Record<string, string> = {
  info: 'border-blue-500',
  warning: 'border-yellow-500',
  error: 'border-red-500',
  critical: 'border-red-700',
};

export default function UserTimeline({ userId }: UserTimelineProps) {
  const { toast } = useToast();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [limit, setLimit] = useState(50);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      const { events: eventsData, error } = await getUserTimeline(userId, {
        limit,
        eventCategory: selectedCategory !== 'all' ? selectedCategory as any : undefined,
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
      console.error('Error loading timeline:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحميل Timeline',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [userId, selectedCategory, limit]);

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

  if (loading && events.length === 0) {
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
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>سجل نشاط المستخدم الكامل</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="تصنيف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="authentication">المصادقة</SelectItem>
                  <SelectItem value="api_connection">ربط API</SelectItem>
                  <SelectItem value="trading_activity">نشاط التداول</SelectItem>
                  <SelectItem value="risk_event">أحداث المخاطر</SelectItem>
                  <SelectItem value="admin_action">إجراءات الأدمن</SelectItem>
                  <SelectItem value="system_issue">مشاكل النظام</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={loadTimeline}
                disabled={loading}
              >
                <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
                تحديث
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              لا توجد أحداث في Timeline
            </div>
          ) : (
            <div className="relative">
              {/* Timeline */}
              <div className="space-y-4">
                {events.map((event, index) => {
                  const Icon = eventCategoryIcons[event.event_category] || Activity;
                  const categoryColor = eventCategoryColors[event.event_category] || 'bg-gray-100';
                  const severityColor = severityColors[event.severity || 'info'] || 'border-blue-500';

                  return (
                    <div
                      key={event.id}
                      className={cn(
                        'relative flex gap-4 pb-4',
                        index !== events.length - 1 && 'border-l-2 border-dashed border-gray-300 dark:border-gray-700 pl-6'
                      )}
                    >
                      {/* Icon */}
                      <div className={cn(
                        'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                        categoryColor
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className={cn(
                        'flex-1 border-l-4 rounded-lg p-4 bg-card',
                        severityColor
                      )}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{event.title}</h4>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className={cn('text-xs px-2 py-1 rounded', categoryColor)}>
                                {event.event_category}
                              </span>
                              {event.source && (
                                <span className="text-xs text-muted-foreground">
                                  Source: {event.source}
                                </span>
                              )}
                            </div>
                            {Object.keys(event.metadata).length > 0 && (
                              <details className="mt-2">
                                <summary className="text-xs text-muted-foreground cursor-pointer">
                                  عرض التفاصيل
                                </summary>
                                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                                  {JSON.stringify(event.metadata, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(event.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

