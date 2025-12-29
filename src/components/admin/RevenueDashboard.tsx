/**
 * Revenue Dashboard Component
 * 
 * Phase Admin C: Revenue metrics and charts
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, TrendingUp, TrendingDown, Download } from 'lucide-react';
import { getRevenueMetrics, getDailyRevenueMetrics, RevenueMetrics } from '@/services/admin/RevenueAnalyticsService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { exportRevenueMetricsToCSV } from '@/services/admin/ExportService';
import { Button } from '@/components/ui/button';

export default function RevenueDashboard() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricsResult, chartResult] = await Promise.all([
        getRevenueMetrics(),
        getDailyRevenueMetrics(
          new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last 12 months
          new Date()
        ),
      ]);

      if (metricsResult.error) {
        toast({
          title: '❌ خطأ',
          description: metricsResult.error,
          variant: 'destructive',
        });
      } else {
        setMetrics(metricsResult.metrics);
      }

      if (chartResult.metrics) {
        setChartData(
          chartResult.metrics.map(m => ({
            date: new Date(m.date).toLocaleDateString('ar'),
            mrr: Number(m.mrr),
            arr: Number(m.arr),
          }))
        );
      }
    } catch (error) {
      console.error('Error loading revenue data:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحميل بيانات الإيرادات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !metrics) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          لا توجد بيانات إيرادات متاحة
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">تحليلات الإيرادات</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => metrics && exportRevenueMetricsToCSV(metrics)}
          disabled={!metrics}
        >
          <Download className="w-4 h-4 mr-2" />
          تصدير CSV
        </Button>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.mrr)}</div>
            <p className="text-xs text-muted-foreground mt-1">Monthly Recurring Revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              ARR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.arr)}</div>
            <p className="text-xs text-muted-foreground mt-1">Annual Recurring Revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ARPU
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.arpu)}</div>
            <p className="text-xs text-muted-foreground mt-1">Average Revenue Per User</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              LTV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.ltv)}</div>
            <p className="text-xs text-muted-foreground mt-1">Customer Lifetime Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>MRR Trend (12 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="mrr" stroke="#8884d8" name="MRR" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by Plan</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(metrics.revenueByPlan).length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(metrics.revenueByPlan).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(metrics.revenueByPlan).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  لا توجد بيانات للإيرادات حسب الخطة
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>الإيرادات الجديدة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.newRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الإيرادات المفقودة (Churned)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(metrics.churnedRevenue)}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

