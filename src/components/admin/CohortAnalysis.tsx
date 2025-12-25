/**
 * Cohort Analysis Component
 * 
 * Phase Admin C: Monthly cohort retention and revenue analysis
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Users, Download } from 'lucide-react';
import { getCohortAnalysis, CohortData } from '@/services/admin/CohortAnalysisService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { exportCohortAnalysisToCSV } from '@/services/admin/ExportService';
import { Button } from '@/components/ui/button';

export default function CohortAnalysis() {
  const { toast } = useToast();
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCohorts = async () => {
    setLoading(true);
    try {
      const { cohorts: cohortsData, error } = await getCohortAnalysis();
      if (error) {
        toast({
          title: '❌ خطأ',
          description: error,
          variant: 'destructive',
        });
      } else {
        setCohorts(cohortsData);
      }
    } catch (error) {
      console.error('Error loading cohort data:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحميل بيانات الأفواج',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCohorts();
  }, []);

  if (loading && cohorts.length === 0) {
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

  const formatPercent = (num: number) => {
    return `${(num * 100).toFixed(1)}%`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get all month keys from all cohorts
  const allMonthKeys = new Set<string>();
  cohorts.forEach(cohort => {
    Object.keys(cohort.retentionByMonth).forEach(key => allMonthKeys.add(key));
  });
  const monthKeys = Array.from(allMonthKeys).sort();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                تحليل الأفواج (Cohort Analysis)
              </CardTitle>
              <CardDescription>
                معدل الاحتفاظ والإيرادات حسب شهر التسجيل
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => cohorts.length > 0 && exportCohortAnalysisToCSV(cohorts)}
              disabled={cohorts.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              تصدير CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {cohorts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              لا توجد بيانات أفواج متاحة
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>شهر التسجيل</TableHead>
                    <TableHead>إجمالي المستخدمين</TableHead>
                    {monthKeys.map(key => (
                      <TableHead key={key}>{key.replace('_', ' ')}</TableHead>
                    ))}
                    <TableHead>ARPU</TableHead>
                    <TableHead>معدل التحويل</TableHead>
                    <TableHead>معدل التسرب</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cohorts.map((cohort) => (
                    <TableRow key={cohort.cohortMonth}>
                      <TableCell className="font-medium">
                        {new Date(cohort.cohortMonth + '-01').toLocaleDateString('ar', { year: 'numeric', month: 'long' })}
                      </TableCell>
                      <TableCell>{formatNumber(cohort.totalUsers)}</TableCell>
                      {monthKeys.map(key => {
                        const retention = cohort.retentionByMonth[key] || 0;
                        return (
                          <TableCell
                            key={key}
                            className={cn(
                              retention >= 0.8 ? 'bg-green-50 dark:bg-green-950/20' :
                              retention >= 0.5 ? 'bg-yellow-50 dark:bg-yellow-950/20' :
                              'bg-red-50 dark:bg-red-950/20'
                            )}
                          >
                            {formatPercent(retention)}
                          </TableCell>
                        );
                      })}
                      <TableCell>{formatCurrency(cohort.arpu)}</TableCell>
                      <TableCell>{formatPercent(cohort.conversionRate / 100)}</TableCell>
                      <TableCell className="text-red-600">{formatPercent(cohort.churnRate / 100)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

