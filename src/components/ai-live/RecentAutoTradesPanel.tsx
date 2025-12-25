/**
 * Recent Auto Trades Panel
 * Shows last 20 auto trades in a collapsible panel
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAutoTrades, type AutoTrade } from '@/hooks/useAutoTrades';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  ChevronDown, 
  ChevronUp,
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock
} from 'lucide-react';
import { useState } from 'react';
import { AutoTradeDetailsDrawer } from '@/components/auto-trades/AutoTradeDetailsDrawer';

const getStatusIcon = (status: AutoTrade['status']) => {
  switch (status) {
    case 'accepted':
      return <CheckCircle2 className="h-3 w-3 text-green-500" />;
    case 'rejected':
      return <XCircle className="h-3 w-3 text-yellow-500" />;
    case 'error':
      return <AlertCircle className="h-3 w-3 text-red-500" />;
    case 'pending':
      return <Clock className="h-3 w-3 text-gray-500" />;
    default:
      return null;
  }
};

const getStatusBadge = (status: AutoTrade['status']) => {
  switch (status) {
    case 'accepted':
      return <Badge className="bg-green-500 hover:bg-green-600 text-xs">مقبول</Badge>;
    case 'rejected':
      return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-xs">مرفوض</Badge>;
    case 'error':
      return <Badge className="bg-red-500 hover:bg-red-600 text-xs">خطأ</Badge>;
    case 'pending':
      return <Badge className="bg-gray-500 hover:bg-gray-600 text-xs">قيد الانتظار</Badge>;
    default:
      return <Badge className="text-xs">{status}</Badge>;
  }
};

export const RecentAutoTradesPanel = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedAutoTrade, setSelectedAutoTrade] = useState<AutoTrade | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: autoTrades = [], isLoading } = useAutoTrades({
    limit: 20
  });

  const handleTradeClick = (trade: AutoTrade) => {
    setSelectedAutoTrade(trade);
    setIsDrawerOpen(true);
  };

  return (
    <>
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">الصفقات التلقائية الأخيرة</CardTitle>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  جاري التحميل...
                </div>
              ) : autoTrades.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  لا توجد صفقات تلقائية
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {autoTrades.map((trade) => (
                      <div
                        key={trade.id}
                        className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleTradeClick(trade)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(trade.status)}
                            <span className="font-medium text-sm">{trade.pair}</span>
                            <Badge 
                              variant={trade.direction === 'long' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {trade.direction === 'long' ? 'شراء' : 'بيع'}
                            </Badge>
                          </div>
                          {getStatusBadge(trade.status)}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{trade.signal_source}</span>
                          <span>
                            {formatDistanceToNow(new Date(trade.created_at), {
                              addSuffix: true,
                              locale: ar
                            })}
                          </span>
                        </div>
                        {trade.reason_code && (
                          <div className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                            {trade.reason_code}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <AutoTradeDetailsDrawer
        autoTrade={selectedAutoTrade}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </>
  );
};

