import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedTradingSignal } from '@/types/signals';
import SignalEligibilityBadge from './SignalEligibilityBadge';

const FALLBACK_LIMIT = 25;

type EnhancedSignalRow = Pick<
  EnhancedTradingSignal,
  | 'id'
  | 'symbol'
  | 'timeframe'
  | 'signal_type'
  | 'confidence_score'
  | 'entry_price'
  | 'take_profit_price'
  | 'stop_loss_price'
  | 'status'
  | 'created_at'
>;

const ENHANCED_SIGNAL_COLUMNS: (keyof EnhancedSignalRow)[] = [
  'id',
  'symbol',
  'timeframe',
  'signal_type',
  'confidence_score',
  'entry_price',
  'take_profit_price',
  'stop_loss_price',
  'status',
  'created_at',
];

const EnhancedSignalsTable = () => {
  const { user } = useAuth();

  const {
    data,
    error,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['enhanced-trading-signals', user?.id],
    queryFn: async (): Promise<EnhancedSignalRow[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('enhanced_trading_signals' as any)
        .select(ENHANCED_SIGNAL_COLUMNS.join(','))
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(FALLBACK_LIMIT);

      if (error) {
        // If table doesn't exist, return empty array instead of throwing
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          console.warn('enhanced_trading_signals table does not exist yet');
          return [];
        }
        throw error;
      }

      return (data as unknown as EnhancedSignalRow[]) ?? [];
    },
    enabled: !!user,
  });

  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        total: 0,
        active: 0,
        triggered: 0,
        avgConfidence: 0,
      };
    }

    const total = data.length;
    const active = data.filter((item) => item.status === 'ACTIVE').length;
    const triggered = data.filter((item) => item.status === 'TRIGGERED').length;
    const avgConfidence =
      data.reduce((sum, item) => sum + (item.confidence_score || 0), 0) /
      total;

    return {
      total,
      active,
      triggered,
      avgConfidence: Math.round(avgConfidence),
    };
  }, [data]);

  const tableMissing =
    error &&
    (typeof error.message === 'string' &&
      (error.message.toLowerCase().includes('enhanced_trading_signals') ||
       error.message.toLowerCase().includes('does not exist') ||
       error.message.toLowerCase().includes('relation') ||
       (error as any)?.code === '42P01'));

  const renderStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: 'bg-emerald-500',
      TRIGGERED: 'bg-blue-500',
      EXPIRED: 'bg-yellow-500',
      CANCELLED: 'bg-gray-500',
    };

    return (
      <Badge className={`${map[status] || 'bg-slate-500'} text-white`}>
        {status}
      </Badge>
    );
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Trading Signals</CardTitle>
          <CardDescription>
            قم بتسجيل الدخول لعرض إشاراتك المتقدمة
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>إشارات التداول المتقدمة</CardTitle>
          <CardDescription>
            تحليلات متقدمة لمتابعة جودة الإشارات الداخلية والذكية
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="text-xs"
        >
          {isRefetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {tableMissing && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              لم يتم العثور على جدول
              <strong className="mx-1">enhanced_trading_signals</strong>
              في قاعدة البيانات. يرجى تنفيذ ملف
              <code className="mx-1">APPLY_ENHANCED_SIGNALS_TABLE.sql</code>
              داخل لوحة تحكم Supabase ثم أعد التحميل.
            </AlertDescription>
          </Alert>
        )}

        {!tableMissing && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatBlock label="إجمالي الإشارات" value={stats.total} />
            <StatBlock label="النشطة حالياً" value={stats.active} />
            <StatBlock label="الإشارات التي تم تفعيلها" value={stats.triggered} />
            <StatBlock
              label="متوسط الثقة"
              value={`${stats.avgConfidence.toFixed(0)}%`}
            />
          </div>
        )}

        {isLoading && !tableMissing && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            جاري تحميل الإشارات المتقدمة...
          </div>
        )}

        {!isLoading && !tableMissing && (data?.length ?? 0) === 0 && (
          <Alert>
            <AlertDescription>
              لا توجد بيانات حتى الآن. بعد تفعيل محرك الإشارات أو إضافة إشارات
              تجريبية ستظهر هنا للإطلاع عليها.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !tableMissing && (data?.length ?? 0) > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الرمز</TableHead>
                  <TableHead>الإطار الزمني</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الثقة</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>Auto</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((signal) => (
                  <TableRow key={signal.id}>
                    <TableCell className="font-semibold">
                      {signal.symbol}
                    </TableCell>
                    <TableCell>{signal.timeframe}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{signal.signal_type}</Badge>
                    </TableCell>
                    <TableCell>{signal.confidence_score}%</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span>دخول: ${signal.entry_price}</span>
                        {signal.take_profit_price && (
                          <span>هدف: ${signal.take_profit_price}</span>
                        )}
                        {signal.stop_loss_price && (
                          <span>وقف: ${signal.stop_loss_price}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{renderStatusBadge(signal.status)}</TableCell>
                    <TableCell>
                      <SignalEligibilityBadge
                        signal={{
                          signal_type: signal.signal_type,
                          confidence_score: signal.confidence_score || 0,
                          source: (signal as any).source,
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(signal.created_at), 'dd MMM yyyy - HH:mm', {
                        locale: ar,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const StatBlock = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-md border border-border bg-muted/40 px-4 py-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-2xl font-semibold mt-1">{value}</p>
  </div>
);

export default EnhancedSignalsTable;
