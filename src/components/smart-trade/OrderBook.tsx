
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRealTimePrices } from '@/hooks/useRealTimePrices';
import { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface OrderBookProps {
  symbol: string;
  platformId?: string;
  layout?: 'vertical' | 'horizontal';
}

const OrderBook = ({ symbol, platformId, layout = 'vertical' }: OrderBookProps) => {
  const { subscribeToSymbol, getPrice } = useRealTimePrices();
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const isMobile = useIsMobile();

  // الاشتراك في الأسعار المباشرة
  useEffect(() => {
    console.log('OrderBook: Subscribing to price updates for:', symbol);
    const unsubscribe = subscribeToSymbol(symbol, (priceData) => {
      console.log('OrderBook: Price update received:', priceData);
      setCurrentPrice(priceData.price);
      setPriceChange(priceData.change24h);
    });

    // جلب السعر الحالي إذا كان متوفراً
    const existingPrice = getPrice(symbol);
    if (existingPrice) {
      console.log('OrderBook: Existing price found:', existingPrice);
      setCurrentPrice(existingPrice.price);
      setPriceChange(existingPrice.change24h);
    }

    return unsubscribe;
  }, [symbol, subscribeToSymbol, getPrice]);

  // Order book data - سيتم جلبها من API في المستقبل
  // حالياً نعرض رسالة أن البيانات غير متاحة
  const orderBook = {
    asks: [] as Array<{ price: number; amount: number; total: number }>,
    bids: [] as Array<{ price: number; amount: number; total: number }>
  };
  
  // TODO: جلب Order Book الحقيقي من Exchange API
  // يمكن استخدام: getBybitOrderBook, Binance API, أو Edge Function

  // عرض مبسط جداً للموبايل
  return (
    <div className="h-full flex flex-col">
      <CardHeader className={`${isMobile ? 'pb-1 px-2 pt-2' : 'pb-3 px-4'} flex-shrink-0`}>
        <CardTitle className={`${isMobile ? 'text-xs' : 'text-lg'} font-bold text-gray-900 dark:text-white text-center`}>
          دفتر الأوامر - {symbol}
        </CardTitle>
      </CardHeader>
      
      <CardContent className={`flex-1 p-0 ${isMobile ? 'px-2' : 'px-4'} overflow-hidden flex flex-col`}>
        <div className="space-y-1 h-full flex flex-col">
          
          {/* رأس الجدول */}
          <div className={`grid grid-cols-3 gap-1 ${isMobile ? 'text-[8px]' : 'text-xs'} text-gray-500 dark:text-gray-400 font-medium border-b pb-1 flex-shrink-0`}>
            <span className="text-right">السعر</span>
            <span className="text-center">الكمية</span>
            <span className="text-left">المجموع</span>
          </div>

          {/* أوامر البيع (Asks) */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-0.5">
              {orderBook.asks.length === 0 ? (
                <div className={`text-center ${isMobile ? 'text-[8px] py-2' : 'text-xs py-4'} text-gray-400`}>
                  لا توجد بيانات متاحة
                </div>
              ) : (
                orderBook.asks.slice(0, isMobile ? 3 : 6).map((ask, index) => (
                  <div key={`ask-${index}`} className={`grid grid-cols-3 gap-1 ${isMobile ? 'text-[8px] py-0.5' : 'text-xs py-1.5'} hover:bg-red-50 dark:hover:bg-red-900/10 px-1 rounded transition-colors cursor-pointer`}>
                    <span className="text-red-500 font-medium text-right">
                      {ask.price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300 text-center">
                      {ask.amount.toFixed(1)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-left">
                      {ask.total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* السعر الحالي */}
          <div className={`text-center ${isMobile ? 'py-1' : 'py-3'} border-y border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-md flex-shrink-0`}>
            <div className={`${isMobile ? 'text-xs' : 'text-lg'} font-bold text-green-500`}>
              ${currentPrice > 0 ? currentPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '109,384'}
            </div>
            <div className={`${isMobile ? 'text-[8px]' : 'text-sm'} text-green-500 mt-0.5`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}% ↗
            </div>
          </div>

          {/* أوامر الشراء (Bids) */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-0.5">
              {orderBook.bids.length === 0 ? (
                <div className={`text-center ${isMobile ? 'text-[8px] py-2' : 'text-xs py-4'} text-gray-400`}>
                  لا توجد بيانات متاحة
                </div>
              ) : (
                orderBook.bids.slice(0, isMobile ? 3 : 6).map((bid, index) => (
                  <div key={`bid-${index}`} className={`grid grid-cols-3 gap-1 ${isMobile ? 'text-[8px] py-0.5' : 'text-xs py-1.5'} hover:bg-green-50 dark:hover:bg-green-900/10 px-1 rounded transition-colors cursor-pointer`}>
                    <span className="text-green-500 font-medium text-right">
                      {bid.price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300 text-center">
                      {bid.amount.toFixed(1)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-left">
                      {bid.total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  );
};

export default OrderBook;
