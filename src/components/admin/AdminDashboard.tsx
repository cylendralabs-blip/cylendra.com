
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Users, Activity, BarChart3, Settings, Shield, Database, TrendingUp, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import UsersManagement from './UsersManagement';
import SystemStats from './SystemStats';
import ActivityLogs from './ActivityLogs';
import AdminSettings from './AdminSettings';

const AdminDashboard = () => {
  const { isAdmin, loading, users, systemStats, activities } = useAdmin();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-600 mb-2">غير مصرح</h2>
            <p className="text-gray-600 dark:text-gray-400">
              ليس لديك صلاحيات للوصول إلى لوحة الإدارة
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const todayStats = systemStats[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            لوحة الإدارة
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            إدارة شاملة للنظام والمستخدمين
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المستخدمين</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {users.length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">المستخدمين النشطين</p>
                  <p className="text-2xl font-bold text-green-600">
                    {todayStats?.active_users || 0}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الصفقات</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {todayStats?.total_trades || 0}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">الاستراتيجيات</p>
                  <p className="text-2xl font-bold text-orange-600">
                    -
                  </p>
                </div>
                <Database className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">إجراءات سريعة</h3>
                  <p className="text-sm text-muted-foreground">الوصول السريع للأدوات الرئيسية</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/admin/analytics')}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    تحليلات الأعمال
                  </button>
                  <button
                    onClick={() => navigate('/admin/support-overview')}
                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 flex items-center gap-2"
                  >
                    <Activity className="w-4 h-4" />
                    نظرة عامة على الدعم
                  </button>
                  <button
                    onClick={() => navigate('/admin/tickets')}
                    className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    إدارة التذاكر
                  </button>
                  <button
                    onClick={() => navigate('/admin/security')}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    الأمان والصلاحيات
                  </button>
                  <button
                    onClick={() => navigate('/admin/system-control')}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    مركز التحكم
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              إدارة المستخدمين
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              الإحصائيات
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              سجل النشاطات
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              إعدادات النظام
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>

          <TabsContent value="stats">
            <SystemStats />
          </TabsContent>

          <TabsContent value="activity">
            <ActivityLogs />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
