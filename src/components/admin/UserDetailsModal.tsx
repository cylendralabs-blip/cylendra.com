
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminService } from '@/services/admin/AdminService';
import { AdminUser } from '@/types/admin';
import { 
  User, Activity, Settings, DollarSign, TrendingUp, Shield, Calendar, 
  MapPin, Wallet, Bot, BarChart3, Key, Bell, Lock, Monitor 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserDetailsModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: () => void;
}

const UserDetailsModal = ({ userId, isOpen, onClose, onUserUpdate }: UserDetailsModalProps) => {
  const [userDetails, setUserDetails] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId && isOpen) {
      loadUserDetails();
    }
  }, [userId, isOpen]);

  const loadUserDetails = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const details = await AdminService.getUserDetails(userId);
      setUserDetails(details);
      console.log('Loaded comprehensive user details:', details);
    } catch (error) {
      console.error('Error loading user details:', error);
      toast({
        title: 'خطأ في تحميل البيانات',
        description: 'فشل في تحميل تفاصيل المستخدم',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'moderator': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'user': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (!userDetails && !loading) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            تفاصيل المستخدم - {userDetails?.full_name}
          </DialogTitle>
          <DialogDescription>
            معلومات شاملة عن المستخدم وأنشطته ومنصاته التداولية
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : userDetails ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
              <TabsTrigger value="trading">التداول</TabsTrigger>
              <TabsTrigger value="strategies">الاستراتيجيات</TabsTrigger>
              <TabsTrigger value="platforms">المنصات</TabsTrigger>
              <TabsTrigger value="activity">النشاط</TabsTrigger>
              <TabsTrigger value="security">الأمان</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* معلومات أساسية */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      المعلومات الشخصية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">الاسم الكامل</label>
                      <p className="text-lg">{userDetails.full_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">البريد الإلكتروني</label>
                      <p>{userDetails.email}</p>
                    </div>
                    {userDetails.username && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">اسم المستخدم</label>
                        <p>{userDetails.username}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">معرف المستخدم</label>
                      <p className="text-xs text-gray-600 break-all">{userDetails.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">تاريخ التسجيل</label>
                      <p className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(userDetails.created_at).toLocaleDateString('ar')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">آخر تسجيل دخول</label>
                      <p className="flex items-center gap-1">
                        <Activity className="w-4 h-4" />
                        {userDetails.last_sign_in_at 
                          ? new Date(userDetails.last_sign_in_at).toLocaleDateString('ar')
                          : 'لم يسجل دخول بعد'
                        }
                      </p>
                    </div>
                    {userDetails.login_count && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">عدد مرات تسجيل الدخول</label>
                        <p>{userDetails.login_count}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* الأدوار والحالة */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      الأدوار والحالة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">الأدوار</label>
                      <div className="flex gap-2 flex-wrap mt-1">
                        {userDetails.roles.map((role) => (
                          <Badge key={role} className={getRoleBadgeColor(role)}>
                            {role}
                          </Badge>
                        ))}
                        {userDetails.roles.length === 0 && (
                          <Badge variant="secondary">مستخدم عادي</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">حالة الحساب</label>
                      <div className="mt-1">
                        <Badge variant={userDetails.is_active ? 'default' : 'secondary'}>
                          {userDetails.is_active ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">حالة البوت</label>
                      <div className="mt-1">
                        <Badge variant={userDetails.bot_active ? 'default' : 'secondary'}>
                          <Bot className="w-3 h-3 mr-1" />
                          {userDetails.bot_active ? 'نشط' : 'معطل'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* إحصائيات شاملة */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">{userDetails.total_trades}</p>
                        <p className="text-sm text-gray-500">إجمالي الصفقات</p>
                        {userDetails.active_trades !== undefined && (
                          <p className="text-xs text-blue-600">{userDetails.active_trades} نشطة</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Settings className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold">{userDetails.total_strategies}</p>
                        <p className="text-sm text-gray-500">الاستراتيجيات</p>
                        {userDetails.active_strategies !== undefined && (
                          <p className="text-xs text-green-600">{userDetails.active_strategies} نشطة</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-8 h-8 text-yellow-500" />
                      <div>
                        <p className="text-2xl font-bold">{formatCurrency(userDetails.account_balance)}</p>
                        <p className="text-sm text-gray-500">قيمة المحفظة</p>
                        {userDetails.total_profit !== undefined && (
                          <p className={`text-xs ${userDetails.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ربح: {formatCurrency(userDetails.total_profit)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-8 h-8 text-purple-500" />
                      <div>
                        <p className="text-2xl font-bold">{userDetails.connected_platforms?.length || 0}</p>
                        <p className="text-sm text-gray-500">المنصات المتصلة</p>
                        {userDetails.api_keys_count !== undefined && (
                          <p className="text-xs text-purple-600">{userDetails.api_keys_count} مفاتيح API</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* إعدادات البوت */}
              {userDetails.bot_settings && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      إعدادات البوت
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">رأس المال الإجمالي</label>
                      <p className="text-lg font-semibold">{formatCurrency(userDetails.bot_settings.total_capital)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">نسبة المخاطر</label>
                      <p className="text-lg font-semibold">{formatPercentage(userDetails.bot_settings.risk_percentage)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">المنصة الافتراضية</label>
                      <p className="text-lg font-semibold">{userDetails.bot_settings.default_platform || 'غير محدد'}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="trading">
              <div className="space-y-4">
                {/* إحصائيات التداول */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">{userDetails.total_trades}</p>
                      <p className="text-sm text-gray-500">إجمالي الصفقات</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{userDetails.winning_trades || 0}</p>
                      <p className="text-sm text-gray-500">صفقات رابحة</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-orange-600">{formatPercentage(userDetails.win_rate || 0)}</p>
                      <p className="text-sm text-gray-500">نسبة النجاح</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className={`text-2xl font-bold ${(userDetails.total_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(userDetails.total_profit || 0)}
                      </p>
                      <p className="text-sm text-gray-500">إجمالي الربح</p>
                    </CardContent>
                  </Card>
                </div>

                {/* الصفقات الحديثة */}
                {userDetails.recent_trades && userDetails.recent_trades.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>الصفقات الحديثة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>الرمز</TableHead>
                            <TableHead>النوع</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>سعر الدخول</TableHead>
                            <TableHead>الكمية</TableHead>
                            <TableHead>الربح/الخسارة</TableHead>
                            <TableHead>المنصة</TableHead>
                            <TableHead>التاريخ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userDetails.recent_trades.map((trade) => (
                            <TableRow key={trade.id}>
                              <TableCell className="font-medium">{trade.symbol}</TableCell>
                              <TableCell>
                                <Badge variant={trade.side === 'BUY' ? 'default' : 'secondary'}>
                                  {trade.side}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={trade.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                  {trade.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatCurrency(trade.entry_price)}</TableCell>
                              <TableCell>{trade.quantity}</TableCell>
                              <TableCell className={trade.realized_pnl ? (trade.realized_pnl >= 0 ? 'text-green-600' : 'text-red-600') : ''}>
                                {trade.realized_pnl ? formatCurrency(trade.realized_pnl) : 'جاري'}
                              </TableCell>
                              <TableCell>{trade.platform}</TableCell>
                              <TableCell>{new Date(trade.created_at).toLocaleDateString('ar')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="strategies">
              <div className="space-y-4">
                {/* ملخص الاستراتيجيات */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">{userDetails.total_strategies}</p>
                      <p className="text-sm text-gray-500">إجمالي الاستراتيجيات</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{userDetails.active_strategies || 0}</p>
                      <p className="text-sm text-gray-500">استراتيجيات نشطة</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-purple-600">{userDetails.strategy_types?.length || 0}</p>
                      <p className="text-sm text-gray-500">أنواع الاستراتيجيات</p>
                    </CardContent>
                  </Card>
                </div>

                {/* أنواع الاستراتيجيات */}
                {userDetails.strategy_types && userDetails.strategy_types.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>أنواع الاستراتيجيات المستخدمة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {userDetails.strategy_types.map((type) => (
                          <Badge key={type} variant="outline">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* الاستراتيجيات الحديثة */}
                {userDetails.recent_strategies && userDetails.recent_strategies.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>الاستراتيجيات الحديثة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>الاسم</TableHead>
                            <TableHead>النوع</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>الوصف</TableHead>
                            <TableHead>تاريخ الإنشاء</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userDetails.recent_strategies.map((strategy) => (
                            <TableRow key={strategy.id}>
                              <TableCell className="font-medium">{strategy.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{strategy.type}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={strategy.is_active ? 'default' : 'secondary'}>
                                  {strategy.is_active ? 'نشط' : 'معطل'}
                                </Badge>
                              </TableCell>
                              <TableCell>{strategy.description || 'لا يوجد وصف'}</TableCell>
                              <TableCell>{new Date(strategy.created_at).toLocaleDateString('ar')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="platforms">
              <div className="space-y-4">
                {/* المنصات المتصلة */}
                {userDetails.connected_platforms && userDetails.connected_platforms.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        المنصات المتصلة
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {userDetails.connected_platforms.map((platform) => (
                          <Badge key={platform} variant="default" className="text-sm">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* مفاتيح API */}
                {userDetails.api_keys && userDetails.api_keys.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        مفاتيح API
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>المنصة</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>النوع</TableHead>
                            <TableHead>تاريخ الإضافة</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userDetails.api_keys.map((apiKey, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{apiKey.platform}</TableCell>
                              <TableCell>
                                <Badge variant={apiKey.is_active ? 'default' : 'secondary'}>
                                  {apiKey.is_active ? 'نشط' : 'معطل'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={apiKey.testnet ? 'outline' : 'default'}>
                                  {apiKey.testnet ? 'تجريبي' : 'حقيقي'}
                                </Badge>
                              </TableCell>
                              <TableCell>{new Date(apiKey.created_at).toLocaleDateString('ar')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {/* أرصدة المحافظ */}
                {userDetails.portfolio_balances && userDetails.portfolio_balances.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        أرصدة المحافظ
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>العملة</TableHead>
                            <TableHead>الرصيد</TableHead>
                            <TableHead>القيمة بالدولار</TableHead>
                            <TableHead>المنصة</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userDetails.portfolio_balances.map((balance, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{balance.symbol}</TableCell>
                              <TableCell>{balance.total_balance.toFixed(8)}</TableCell>
                              <TableCell>{balance.usd_value ? formatCurrency(balance.usd_value) : 'غير محدد'}</TableCell>
                              <TableCell>{balance.platform || 'غير محدد'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <div className="space-y-4">
                {/* الإشعارات الحديثة */}
                {userDetails.recent_notifications && userDetails.recent_notifications.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        الإشعارات الحديثة
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>النوع</TableHead>
                            <TableHead>العنوان</TableHead>
                            <TableHead>الرسالة</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>التاريخ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userDetails.recent_notifications.map((notification) => (
                            <TableRow key={notification.id}>
                              <TableCell>
                                <Badge variant="outline">{notification.type}</Badge>
                              </TableCell>
                              <TableCell className="font-medium">{notification.title}</TableCell>
                              <TableCell className="max-w-xs truncate">{notification.message}</TableCell>
                              <TableCell>
                                <Badge variant={notification.is_read ? 'secondary' : 'default'}>
                                  {notification.is_read ? 'مقروء' : 'غير مقروء'}
                                </Badge>
                              </TableCell>
                              <TableCell>{new Date(notification.created_at).toLocaleDateString('ar')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {/* أوامر DCA الحديثة */}
                {userDetails.recent_dca_orders && userDetails.recent_dca_orders.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>أوامر DCA الحديثة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>المستوى</TableHead>
                            <TableHead>السعر المستهدف</TableHead>
                            <TableHead>الكمية</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>التاريخ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userDetails.recent_dca_orders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">المستوى {order.dca_level}</TableCell>
                              <TableCell>{formatCurrency(order.target_price)}</TableCell>
                              <TableCell>{order.quantity}</TableCell>
                              <TableCell>
                                <Badge variant={order.status === 'EXECUTED' ? 'default' : 'secondary'}>
                                  {order.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{new Date(order.created_at).toLocaleDateString('ar')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="security">
              <div className="space-y-4">
                {/* سجل الأمان */}
                {userDetails.recent_security_logs && userDetails.recent_security_logs.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        سجل الأمان الحديث
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>النشاط</TableHead>
                            <TableHead>عنوان IP</TableHead>
                            <TableHead>المتصفح</TableHead>
                            <TableHead>النتيجة</TableHead>
                            <TableHead>التاريخ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userDetails.recent_security_logs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="font-medium">{log.action}</TableCell>
                              <TableCell>{log.ip_address || 'غير محدد'}</TableCell>
                              <TableCell className="max-w-xs truncate">{log.user_agent || 'غير محدد'}</TableCell>
                              <TableCell>
                                <Badge variant={log.success ? 'default' : 'destructive'}>
                                  {log.success ? 'نجح' : 'فشل'}
                                </Badge>
                              </TableCell>
                              <TableCell>{new Date(log.created_at).toLocaleDateString('ar')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">لم يتم العثور على بيانات المستخدم</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsModal;
