/**
 * Support Metrics Dashboard
 * 
 * Phase Admin E: Support analytics and KPIs
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MessageSquare, Clock, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { getSupportMetrics, type SupportMetrics } from '@/services/support/SupportMetricsService';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

import { useTranslation } from 'react-i18next';

export default function SupportMetrics() {
  const { t } = useTranslation('support');
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<SupportMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const { metrics: metricsData, error } = await getSupportMetrics(30);

      if (error) {
        toast({
          title: `❌ ${t('metrics.errors.title')}`,
          description: error,
          variant: 'destructive',
        });
      } else {
        setMetrics(metricsData);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast({
        title: `❌ ${t('metrics.errors.title')}`,
        description: t('metrics.errors.failed_to_load'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
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
          {t('metrics.no_data_available')}
        </CardContent>
      </Card>
    );
  }

  const categoryData = Object.entries(metrics.ticketsByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  const priorityData = Object.entries(metrics.ticketsByPriority).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FFBB28'];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-primary" />
          {t('metrics.title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('metrics.subtitle')}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              {t('metrics.kpis.open_tickets')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.openTicketsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t('metrics.kpis.avg_response_time')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgResponseTimeHours.toFixed(1)} {t('metrics.kpis.hours')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {t('metrics.kpis.avg_resolution_time')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgResolutionTimeHours.toFixed(1)} {t('metrics.kpis.hours')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {t('metrics.kpis.sla_breaches')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.slaBreaches}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('metrics.charts.by_category')}</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                {t('metrics.charts.no_data')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('metrics.charts.by_priority')}</CardTitle>
          </CardHeader>
          <CardContent>
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {priorityData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                {t('metrics.charts.no_data')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('metrics.stats.reopened')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.ticketsReopened}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('metrics.stats.closed_today')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.ticketsClosedToday}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('metrics.stats.resolution_rate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.avgResolutionTimeHours > 0
                ? (24 / metrics.avgResolutionTimeHours).toFixed(1)
                : 0}{' '}
              {t('metrics.stats.per_day')}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

