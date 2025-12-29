/**
 * User Funnel Analytics Component
 * 
 * Phase Admin C: User journey through funnel stages
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Target, TrendingDown, Download } from 'lucide-react';
import { getFunnelStages, FunnelStage } from '@/services/admin/UserFunnelService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { exportFunnelStagesToCSV } from '@/services/admin/ExportService';
import { Button } from '@/components/ui/button';

export default function UserFunnelAnalytics() {
  const { toast } = useToast();
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [loading, setLoading] = useState(false);

  const loadStages = async () => {
    setLoading(true);
    try {
      const { stages: stagesData, error } = await getFunnelStages();
      if (error) {
        toast({
          title: '❌ خطأ',
          description: error,
          variant: 'destructive',
        });
      } else {
        setStages(stagesData);
      }
    } catch (error) {
      console.error('Error loading funnel data:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحميل بيانات المسار',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStages();
  }, []);

  if (loading && stages.length === 0) {
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

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      'Registered': 'التسجيل',
      'API Connected': 'ربط API',
      'First Feature Used': 'أول استخدام لميزة',
      'First Trade': 'أول صفقة',
      'Converted to Paid': 'التحويل إلى مدفوع',
    };
    return labels[stage] || stage;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                مسار المستخدم (User Funnel)
              </CardTitle>
              <CardDescription>
                تحليل رحلة المستخدم من التسجيل إلى التحويل
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => stages.length > 0 && exportFunnelStagesToCSV(stages)}
              disabled={stages.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              تصدير CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stages.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              لا توجد بيانات متاحة
            </div>
          ) : (
            <div className="space-y-4">
              {stages.map((stage, index) => {
                const width = stage.percentage;
                return (
                  <div key={stage.stage} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{getStageLabel(stage.stage)}</span>
                        {index > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" />
                            {stage.dropOffRate.toFixed(1)}% انخفاض
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatNumber(stage.count)}</div>
                        <div className="text-xs text-muted-foreground">{stage.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all duration-500',
                          index === 0 ? 'bg-primary' :
                          index === 1 ? 'bg-blue-500' :
                          index === 2 ? 'bg-green-500' :
                          index === 3 ? 'bg-yellow-500' :
                          'bg-purple-500'
                        )}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

