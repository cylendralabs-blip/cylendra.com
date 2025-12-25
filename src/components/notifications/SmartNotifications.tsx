
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Bell, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Target,
  Clock,
  Settings,
  X,
  Check,
  Volume2,
  VolumeX
} from 'lucide-react';
import { formatNumber } from '@/utils/tradingFormat';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface NotificationRule {
  id: string;
  type: 'profit' | 'loss' | 'risk' | 'trade' | 'market';
  title: string;
  description: string;
  threshold: number;
  enabled: boolean;
  icon: React.ComponentType<any>;
  color: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  action?: {
    label: string;
    onClick: () => void;
  };
}

const SmartNotifications = () => {
  const { data: notifications, isLoading } = useNotifications();
  const { toast } = useToast();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeNotifications, setActiveNotifications] = useState<Notification[]>([]);

  const [notificationRules, setNotificationRules] = useState<NotificationRule[]>([
    {
      id: 'profit-target',
      type: 'profit',
      title: 'هدف الربح',
      description: 'تنبيه عند تحقيق نسبة ربح معينة',
      threshold: 5,
      enabled: true,
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      id: 'loss-limit',
      type: 'loss',
      title: 'حد الخسارة',
      description: 'تنبيه عند تجاوز نسبة خسارة معينة',
      threshold: 3,
      enabled: true,
      icon: TrendingDown,
      color: 'text-red-600'
    },
    {
      id: 'risk-level',
      type: 'risk',
      title: 'مستوى المخاطر',
      description: 'تنبيه عند تجاوز مستوى المخاطر المحدد',
      threshold: 5,
      enabled: true,
      icon: AlertTriangle,
      color: 'text-orange-600'
    },
    {
      id: 'trade-complete',
      type: 'trade',
      title: 'اكتمال الصفقة',
      description: 'تنبيه عند إغلاق الصفقات',
      threshold: 0,
      enabled: true,
      icon: Target,
      color: 'text-blue-600'
    },
    {
      id: 'market-volatility',
      type: 'market',
      title: 'تقلبات السوق',
      description: 'تنبيه عند حدوث تقلبات عالية',
      threshold: 10,
      enabled: false,
      icon: DollarSign,
      color: 'text-purple-600'
    }
  ]);

  // Format date for display
  const formatNotificationDate = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
    return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`;
  };

  // Generate sample notifications
  useEffect(() => {
    const sampleNotifications: Notification[] = [
      {
        id: '1',
        type: 'profit',
        title: 'تحقيق هدف الربح',
        message: 'تم تحقيق ربح 5.2% في صفقة BTC/USDT',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        priority: 'high',
        action: {
          label: 'عرض الصفقة',
          onClick: () => toast({ title: 'عرض الصفقة', description: 'سيتم توجيهك لصفحة الصفقة' })
        }
      },
      {
        id: '2',
        type: 'risk',
        title: 'تحذير مستوى المخاطر',
        message: 'مستوى المخاطر وصل إلى 4.8% من رأس المال',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: false,
        priority: 'critical'
      },
      {
        id: '3',
        type: 'trade',
        title: 'إغلاق صفقة',
        message: 'تم إغلاق صفقة ETH/USDT بربح $125.50',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: true,
        priority: 'medium'
      },
      {
        id: '4',
        type: 'market',
        title: 'تقلبات السوق',
        message: 'تقلبات عالية في زوج BTC/USDT (+12.5%)',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        read: true,
        priority: 'low'
      }
    ];
    setActiveNotifications(sampleNotifications);
  }, [toast]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50 dark:bg-red-950';
      case 'high': return 'border-orange-500 bg-orange-50 dark:bg-orange-950';
      case 'medium': return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
      default: return 'border-gray-300 bg-gray-50 dark:bg-gray-800';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-blue-500',
      low: 'bg-gray-500'
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  const markAsRead = (id: string) => {
    setActiveNotifications(prev =>
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const dismissNotification = (id: string) => {
    setActiveNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const updateRule = (id: string, updates: Partial<NotificationRule>) => {
    setNotificationRules(prev =>
      prev.map(rule => 
        rule.id === id ? { ...rule, ...updates } : rule
      )
    );
  };

  const playNotificationSound = useCallback(() => {
    if (soundEnabled) {
      // Create a simple beep sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  }, [soundEnabled]);

  useEffect(() => {
    // Play sound for new unread notifications
    const unreadCount = activeNotifications.filter(n => !n.read).length;
    if (unreadCount > 0) {
      playNotificationSound();
    }
  }, [activeNotifications, playNotificationSound]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2 space-x-reverse">
            <Bell className="w-6 h-6" />
            <span>التنبيهات الذكية</span>
            {activeNotifications.filter(n => !n.read).length > 0 && (
              <Badge className="bg-red-500 text-white">
                {activeNotifications.filter(n => !n.read).length}
              </Badge>
            )}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            نظام إشعارات متقدم للأحداث المهمة
          </p>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center space-x-1 space-x-reverse"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="text-xs">الصوت</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center space-x-1 space-x-reverse"
          >
            <Settings className="w-4 h-4" />
            <span className="text-xs">الإعدادات</span>
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle>إعدادات التنبيهات</CardTitle>
            <CardDescription>تخصيص قواعد وشروط التنبيهات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {notificationRules.map((rule) => {
                const Icon = rule.icon;
                return (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Icon className={cn('w-5 h-5', rule.color)} />
                      <div>
                        <h4 className="font-medium">{rule.title}</h4>
                        <p className="text-sm text-gray-600">{rule.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 space-x-reverse">
                      {rule.type !== 'trade' && (
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Label htmlFor={`threshold-${rule.id}`} className="text-xs">العتبة:</Label>
                          <Input
                            id={`threshold-${rule.id}`}
                            type="number"
                            value={rule.threshold}
                            onChange={(e) => updateRule(rule.id, { threshold: Number(e.target.value) })}
                            className="w-20 h-8 text-xs"
                          />
                          <span className="text-xs text-gray-500">%</span>
                        </div>
                      )}
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(enabled) => updateRule(rule.id, { enabled })}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>الإشعارات النشطة</CardTitle>
          <CardDescription>آخر التنبيهات والإشعارات المهمة</CardDescription>
        </CardHeader>
        <CardContent>
          {activeNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">لا توجد إشعارات جديدة</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 border-l-4 rounded-lg transition-all duration-200',
                    getPriorityColor(notification.priority),
                    !notification.read && 'shadow-md'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 space-x-reverse mb-2">
                        <h4 className={cn(
                          'font-medium',
                          !notification.read && 'font-bold'
                        )}>
                          {notification.title}
                        </h4>
                        <Badge className={getPriorityBadge(notification.priority)}>
                          {notification.priority}
                        </Badge>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {formatNotificationDate(notification.timestamp)}
                        </span>
                        
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {notification.action && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={notification.action.onClick}
                              className="text-xs"
                            >
                              {notification.action.label}
                            </Button>
                          )}
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => dismissNotification(notification.id)}
                            className="text-xs"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartNotifications;
