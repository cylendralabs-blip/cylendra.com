
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, X, Edit } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useActiveTrades } from '@/hooks/useActiveTrades';
import { useRealTimePrices } from '@/hooks/useRealTimePrices';

interface SmartTrade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'conditional';
  amount: number;
  price: number;
  currentPrice: number;
  takeProfitPrice?: number;
  stopLossPrice?: number;
  trailingStop: boolean;
  status: 'active' | 'partial' | 'filled';
  pnl: number;
  createdAt: Date;
}

const ActiveSmartTrades = () => {
  const isMobile = useIsMobile();
  const { data: activeTrades = [], isLoading } = useActiveTrades();
  const { getPrice } = useRealTimePrices();
  
  // تحويل بيانات قاعدة البيانات إلى SmartTrade format
  const smartTrades: SmartTrade[] = activeTrades
    .filter(trade => {
      const sourceMode = (trade as any).source_mode;
      return sourceMode === 'manual_smart_trade' || !sourceMode; // فقط Smart Trades
    })
    .map(trade => {
      const currentPriceData = getPrice(trade.symbol);
      const currentPrice = currentPriceData?.price || trade.entry_price || 0;
      const entryPrice = trade.entry_price || 0;
      const tradeAny = trade as any;
      
      // حساب PnL
      const pnl = currentPrice > 0 && entryPrice > 0
        ? ((currentPrice - entryPrice) / entryPrice) * (trade.total_invested || 0)
        : 0;
      
      // تحديد نوع الطلب
      const orderType = tradeAny.order_type || trade.trade_type || 'limit';
      
      return {
        id: trade.id,
        symbol: trade.symbol,
        side: trade.side?.toLowerCase() === 'sell' ? 'sell' : 'buy',
        type: orderType?.toLowerCase() === 'market' ? 'market' : 
              orderType?.toLowerCase() === 'conditional' ? 'conditional' : 'limit',
        amount: trade.total_invested || 0,
        price: entryPrice,
        currentPrice: currentPrice,
        takeProfitPrice: trade.take_profit_price || undefined,
        stopLossPrice: trade.stop_loss_price || undefined,
        trailingStop: false, // TODO: Get from trade data if available
        status: trade.status?.toLowerCase() === 'partial' ? 'partial' :
                trade.status?.toLowerCase() === 'filled' ? 'filled' : 'active',
        pnl: pnl,
        createdAt: new Date(trade.created_at || Date.now())
      };
    });

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-blue-500 text-white',
      partial: 'bg-yellow-500 text-white',
      filled: 'bg-green-500 text-white'
    };
    
    const labels = {
      active: 'نشط',
      partial: 'جزئي',
      filled: 'مكتمل'
    };

    return (
      <Badge className={`${styles[status as keyof typeof styles]} ${isMobile ? 'text-[8px] px-1 py-0' : ''}`}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      <CardHeader className={isMobile ? 'pb-1 px-2 pt-2' : ''}>
        <div className="flex items-center justify-between">
          <CardTitle className={isMobile ? 'text-sm' : ''}>الصفقات الذكية النشطة</CardTitle>
          <Badge variant="outline" className={`text-blue-600 ${isMobile ? 'text-[8px] px-1 py-0' : ''}`}>
            {smartTrades.length} صفقة نشطة
          </Badge>
        </div>
      </CardHeader>
      <CardContent className={isMobile ? 'px-2 pb-2' : ''}>
        {smartTrades.length === 0 ? (
          <div className="text-center py-8">
            <p className={`text-gray-500 ${isMobile ? 'text-sm' : ''}`}>لا توجد صفقات ذكية نشطة حالياً</p>
            <p className={`text-gray-400 mt-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>ابدأ صفقة ذكية جديدة من النموذج أعلاه</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {isMobile ? (
              // عرض مبسط للموبايل
              <div className="space-y-2">
                {smartTrades.map((trade) => (
                  <div key={trade.id} className="border rounded-lg p-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <span className="font-medium text-xs">{trade.symbol}</span>
                        {trade.side === 'buy' ? (
                          <TrendingUp className="w-3 h-3 text-green-500" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        )}
                      </div>
                      {getStatusBadge(trade.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-[8px]">
                      <div>
                        <span className="text-gray-500">المبلغ: </span>
                        <span>${trade.amount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">السعر: </span>
                        <span>${trade.price.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">الربح/الخسارة: </span>
                        <span className={`font-medium ${
                          trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">الوقت: </span>
                        <span>{formatTime(trade.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-1 space-x-reverse">
                      <Button variant="outline" size="sm" className="h-6 px-2">
                        <Edit className="w-2 h-2" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 h-6 px-2">
                        <X className="w-2 h-2" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // عرض الجدول للكمبيوتر
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الرمز</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>سعر الدخول</TableHead>
                    <TableHead>السعر الحالي</TableHead>
                    <TableHead>جني الأرباح</TableHead>
                    <TableHead>وقف الخسائر</TableHead>
                    <TableHead>الربح/الخسارة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الوقت</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {smartTrades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span className="font-medium">{trade.symbol}</span>
                          {trade.side === 'buy' ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {trade.type === 'market' ? 'سوق' : 
                           trade.type === 'limit' ? 'محدود' : 'مشروط'}
                        </Badge>
                      </TableCell>
                      <TableCell>${trade.amount.toLocaleString()}</TableCell>
                      <TableCell>${trade.price.toFixed(2)}</TableCell>
                      <TableCell>${trade.currentPrice.toFixed(2)}</TableCell>
                      <TableCell>
                        {trade.takeProfitPrice ? (
                          <span className="text-green-600">
                            ${trade.takeProfitPrice.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {trade.stopLossPrice ? (
                          <div className="flex items-center space-x-1 space-x-reverse">
                            <span className="text-red-600">
                              ${trade.stopLossPrice.toFixed(2)}
                            </span>
                            {trade.trailingStop && (
                              <Badge variant="outline" className="text-xs">
                                متحرك
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(trade.status)}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatTime(trade.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1 space-x-reverse">
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600">
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </CardContent>
    </>
  );
};

export default ActiveSmartTrades;
