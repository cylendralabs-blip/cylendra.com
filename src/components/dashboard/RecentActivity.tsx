import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTradingHistory } from '@/hooks/useTradingHistory';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { formatNumber } from '@/utils/tradingFormat';

const RecentActivity = () => {
  const { trades = [], isLoading } = useTradingHistory('all', 'all');
  
  const recentTrades = trades
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, 10);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            النشاط الأخير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          النشاط الأخير
        </CardTitle>
        <CardDescription>آخر 10 عمليات تداول</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {recentTrades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد عمليات تداول حديثة
            </div>
          ) : (
            <div className="space-y-3">
              {recentTrades.map((trade) => {
                const isProfit = (trade.realized_pnl || 0) > 0;
                const isClosed = trade.status === 'CLOSED';
                
                return (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${trade.side === 'BUY' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        {trade.side === 'BUY' ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{trade.symbol}</div>
                        <div className="text-xs text-muted-foreground">
                          {trade.created_at && formatDistanceToNow(new Date(trade.created_at), {
                            addSuffix: true,
                            locale: ar
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`font-medium ${isClosed ? (isProfit ? 'text-green-500' : 'text-red-500') : 'text-foreground'}`}>
                        {isClosed && (trade.realized_pnl || 0) !== 0 && (
                          <span>{isProfit ? '+' : ''}${formatNumber(trade.realized_pnl || 0)}</span>
                        )}
                        {!isClosed && <span>${formatNumber(trade.unrealized_pnl || 0)}</span>}
                      </div>
                      <Badge variant={isClosed ? 'secondary' : 'default'} className="text-xs">
                        {trade.status === 'ACTIVE' ? 'نشط' : 'مغلق'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
