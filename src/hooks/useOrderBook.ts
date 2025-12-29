
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

interface OrderBookData {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

export const useOrderBook = (symbol: string, platformId: string) => {
  const { toast } = useToast();
  const [orderBook, setOrderBook] = useState<OrderBookData>({
    bids: [],
    asks: []
  });
  const [loading, setLoading] = useState(false);

  const fetchOrderBook = async () => {
    if (!symbol || !platformId) return;

    setLoading(true);
    try {
      console.log('Fetching order book for:', { symbol, platformId });
      
      // محاكاة البيانات الحقيقية - يمكن استبدالها بـ API حقيقي
      const generateOrderBook = (basePrice: number): OrderBookData => {
        const bids: OrderBookEntry[] = [];
        const asks: OrderBookEntry[] = [];
        
        // توليد أوامر البيع (أسعار أعلى)
        for (let i = 1; i <= 10; i++) {
          const price = basePrice + (basePrice * 0.0001 * i);
          const quantity = Math.random() * 5 + 0.1;
          asks.push({
            price: Number(price.toFixed(2)),
            quantity: Number(quantity.toFixed(4)),
            total: Number((price * quantity).toFixed(2))
          });
        }
        
        // توليد أوامر الشراء (أسعار أقل)
        for (let i = 1; i <= 10; i++) {
          const price = basePrice - (basePrice * 0.0001 * i);
          const quantity = Math.random() * 5 + 0.1;
          bids.push({
            price: Number(price.toFixed(2)),
            quantity: Number(quantity.toFixed(4)),
            total: Number((price * quantity).toFixed(2))
          });
        }
        
        return { bids, asks };
      };

      // استخدام سعر افتراضي بناءً على الرمز
      const basePrices: {[key: string]: number} = {
        'BTC/USDT': 105081,
        'ETH/USDT': 2493.28,
        'BNB/USDT': 647.83,
        'ADA/USDT': 0.67,
        'SOL/USDT': 151.89,
        'MATIC/USDT': 0.22
      };
      
      const basePrice = basePrices[symbol] || 1000;
      const data = generateOrderBook(basePrice);
      
      setOrderBook(data);
      console.log('Order book data:', data);
      
    } catch (error) {
      console.error('Error fetching order book:', error);
      toast({
        title: 'خطأ في جلب دفتر الأوامر',
        description: 'فشل في جلب بيانات دفتر الأوامر',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderBook();
    
    // تحديث كل 5 ثوانٍ
    const interval = setInterval(fetchOrderBook, 5000);
    
    return () => clearInterval(interval);
  }, [symbol, platformId]);

  return { orderBook, loading, refetch: fetchOrderBook };
};
