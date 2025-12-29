/**
 * Feature Usage Analytics Component
 * 
 * Phase Admin C: Feature usage statistics and trends
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Zap, TrendingUp, Download } from 'lucide-react';
import { getFeatureUsageStats, FeatureUsageStats } from '@/services/admin/FeatureUsageService';
import { useToast } from '@/hooks/use-toast';
import { exportFeatureUsageToCSV } from '@/services/admin/ExportService';
import { Button } from '@/components/ui/button';

export default function FeatureUsageAnalytics() {
  const { toast } = useToast();
  const [stats, setStats] = useState<FeatureUsageStats[]>([]);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const { stats: statsData, error } = await getFeatureUsageStats(30);
      if (error) {
        toast({
          title: '❌ خطأ',
          description: error,
          variant: 'destructive',
        });
      } else {
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading feature usage:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحميل إحصائيات الاستخدام',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading && stats.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                إحصائيات استخدام الميزات (آخر 30 يوم)
              </CardTitle>
              <CardDescription>
                ترتيب الميزات حسب الاستخدام
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => stats.length > 0 && exportFeatureUsageToCSV(stats)}
              disabled={stats.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              تصدير CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stats.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              لا توجد بيانات استخدام متاحة
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الميزة</TableHead>
                  <TableHead>إجمالي الاستخدام</TableHead>
                  <TableHead>المستخدمين الفريدين</TableHead>
                  <TableHead>آخر استخدام</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((stat) => (
                  <TableRow key={stat.featureKey}>
                    <TableCell className="font-medium">{stat.featureKey}</TableCell>
                    <TableCell>{formatNumber(stat.totalUsage)}</TableCell>
                    <TableCell>{formatNumber(stat.uniqueUsers)}</TableCell>
                    <TableCell>
                      {stat.lastUsedAt
                        ? new Date(stat.lastUsedAt).toLocaleDateString('ar')
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

