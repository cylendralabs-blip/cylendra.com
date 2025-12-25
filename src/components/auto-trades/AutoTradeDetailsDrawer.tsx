/**
 * Auto Trade Details Drawer
 * Shows full details and timeline logs for an auto trade
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAutoTradeLogs, type AutoTrade, type AutoTradeLog } from '@/hooks/useAutoTrades';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

interface AutoTradeDetailsDrawerProps {
  autoTrade: AutoTrade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusBadge = (status: AutoTrade['status']) => {
  switch (status) {
    case 'accepted':
      return <Badge className="bg-green-500 hover:bg-green-600">مقبول</Badge>;
    case 'rejected':
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">مرفوض</Badge>;
    case 'error':
      return <Badge className="bg-red-500 hover:bg-red-600">خطأ</Badge>;
    case 'pending':
      return <Badge className="bg-gray-500 hover:bg-gray-600">قيد الانتظار</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const getStatusIcon = (status: AutoTrade['status']) => {
  switch (status) {
    case 'accepted':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'rejected':
      return <XCircle className="h-4 w-4 text-yellow-500" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-gray-500" />;
    default:
      return null;
  }
};

const getStepLabel = (step: string) => {
  const labels: Record<string, string> = {
    signal_received: 'استلام الإشارة',
    filters_applied: 'تطبيق الفلاتر',
    limits_checked: 'فحص الحدود',
    accepted: 'مقبول للتنفيذ',
    rejected: 'مرفوض',
    execute_called: 'استدعاء التنفيذ',
    exchange_response: 'رد المنصة',
    error: 'خطأ'
  };
  return labels[step] || step;
};

export const AutoTradeDetailsDrawer = ({
  autoTrade,
  open,
  onOpenChange
}: AutoTradeDetailsDrawerProps) => {
  const { data: logs = [], isLoading: logsLoading } = useAutoTradeLogs(autoTrade?.id || null);
  const navigate = useNavigate();

  if (!autoTrade) return null;

  const handleViewTrade = () => {
    if (autoTrade.position_id) {
      navigate(`/dashboard/trading-history?trade=${autoTrade.position_id}`);
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {getStatusIcon(autoTrade.status)}
            تفاصيل الصفقة التلقائية
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">معلومات الصفقة</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">الزوج</p>
                <p className="font-medium">{autoTrade.pair}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الاتجاه</p>
                <Badge variant={autoTrade.direction === 'long' ? 'default' : 'secondary'}>
                  {autoTrade.direction === 'long' ? 'شراء' : 'بيع'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الحالة</p>
                {getStatusBadge(autoTrade.status)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">مصدر الإشارة</p>
                <Badge variant="outline">{autoTrade.signal_source}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
                <p className="text-sm">
                  {formatDistanceToNow(new Date(autoTrade.created_at), {
                    addSuffix: true,
                    locale: ar
                  })}
                </p>
              </div>
              {autoTrade.executed_at && (
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ التنفيذ</p>
                  <p className="text-sm">
                    {formatDistanceToNow(new Date(autoTrade.executed_at), {
                      addSuffix: true,
                      locale: ar
                    })}
                  </p>
                </div>
              )}
            </div>

            {autoTrade.reason_code && (
              <div>
                <p className="text-sm text-muted-foreground">سبب الرفض/الخطأ</p>
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  {autoTrade.reason_code}
                </p>
              </div>
            )}

            {autoTrade.position_id && (
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewTrade}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 ml-2" />
                  عرض الصفقة في سجل التداول
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Metadata */}
          {autoTrade.metadata && Object.keys(autoTrade.metadata).length > 0 && (
            <>
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <h3 className="text-lg font-semibold">معلومات إضافية</h3>
                  <ChevronRight className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(autoTrade.metadata, null, 2)}
                    </pre>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              <Separator />
            </>
          )}

          {/* Timeline Logs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">سجل الأحداث</h3>
            {logsLoading ? (
              <p className="text-sm text-muted-foreground">جاري تحميل السجلات...</p>
            ) : logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد سجلات متاحة</p>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {logs.map((log: AutoTradeLog, index: number) => (
                    <div key={log.id} className="relative pl-8">
                      {index < logs.length - 1 && (
                        <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-border" />
                      )}
                      <div className="flex items-start gap-3">
                        <div className="mt-1.5">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {getStepLabel(log.step)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(log.created_at), {
                                addSuffix: true,
                                locale: ar
                              })}
                            </span>
                          </div>
                          <p className="text-sm">{log.message}</p>
                          {log.data && Object.keys(log.data).length > 0 && (
                            <Collapsible>
                              <CollapsibleTrigger className="text-xs text-muted-foreground hover:text-foreground">
                                عرض التفاصيل
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="mt-2 p-2 bg-muted rounded text-xs">
                                  <pre className="overflow-x-auto">
                                    {JSON.stringify(log.data, null, 2)}
                                  </pre>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

