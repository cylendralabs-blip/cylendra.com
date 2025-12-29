
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { RefreshCw, TrendingUp, Users, Activity, Database } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';

const SystemStats = () => {
  const { systemStats, calculateStats } = useAdmin();

  const chartData = systemStats.slice(0, 7).reverse().map(stat => ({
    date: new Date(stat.date).toLocaleDateString('ar'),
    users: (stat as any).total_users || stat.active_users,
    trades: stat.total_trades,
    strategies: (stat as any).total_strategies || 0,
    signups: (stat as any).new_signups || 0
  }));

  const latestStats = systemStats[0];

  return (
    <div className="space-y-6">
      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            إحصائيات النظام
          </CardTitle>
          <CardDescription>
            مراقبة أداء النظام والنمو
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={calculateStats} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            تحديث الإحصائيات
          </Button>
        </CardContent>
      </Card>

      {/* Current Stats Cards */}
      {latestStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">المستخدمين النشطين</p>
                  <p className="text-3xl font-bold text-blue-600">{latestStats.active_users}</p>
                  <p className="text-sm text-green-600">
                    {(latestStats as any).new_signups ? `+${(latestStats as any).new_signups} اليوم` : 'نشط'}
                  </p>
                </div>
                <Users className="w-10 h-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">المستخدمين النشطين</p>
                  <p className="text-3xl font-bold text-green-600">{latestStats.active_users}</p>
                  <p className="text-sm text-gray-600">
                    آخر 30 يوم
                  </p>
                </div>
                <Activity className="w-10 h-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الصفقات</p>
                  <p className="text-3xl font-bold text-purple-600">{latestStats.total_trades}</p>
                  <p className="text-sm text-gray-600">
                    جميع الصفقات
                  </p>
                </div>
                <Database className="w-10 h-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">حجم التداول</p>
                  <p className="text-3xl font-bold text-orange-600">${(latestStats.total_volume_usd || 0).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">
                    إجمالي الحجم
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>نمو المستخدمين</CardTitle>
            <CardDescription>إجمالي المستخدمين والمسجلين الجدد</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="إجمالي المستخدمين"
                />
                <Line 
                  type="monotone" 
                  dataKey="signups" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="مسجلين جدد"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>نشاط النظام</CardTitle>
            <CardDescription>الصفقات والاستراتيجيات</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="trades" 
                  fill="#8b5cf6" 
                  name="الصفقات"
                />
                <Bar 
                  dataKey="strategies" 
                  fill="#f59e0b" 
                  name="الاستراتيجيات"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle>الإحصائيات التاريخية</CardTitle>
          <CardDescription>إحصائيات آخر 30 يوم</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-2">التاريخ</th>
                  <th className="text-right py-2">المستخدمين</th>
                  <th className="text-right py-2">النشطين</th>
                  <th className="text-right py-2">مسجلين جدد</th>
                  <th className="text-right py-2">الصفقات</th>
                  <th className="text-right py-2">الاستراتيجيات</th>
                </tr>
              </thead>
              <tbody>
                {systemStats.slice(0, 10).map((stat) => (
                  <tr key={stat.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-2">{new Date(stat.date).toLocaleDateString('ar')}</td>
                    <td className="py-2">{(stat as any).total_users || stat.active_users}</td>
                    <td className="py-2">{stat.active_users}</td>
                    <td className="py-2">{(stat as any).new_signups || '-'}</td>
                    <td className="py-2">{stat.total_trades}</td>
                    <td className="py-2">{(stat as any).total_strategies || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemStats;
