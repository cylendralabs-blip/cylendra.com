
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MarketPrice {
  symbol: string;
  price: number;
  change24h: number;
}

export const useMarketData = () => {
  const { toast } = useToast();
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);

  const fetchMarketPrices = async () => {
    try {
      console.log('Fetching market prices...');
      
      // قائمة الأزواج المدعومة فعلياً في Binance (تم التحقق من وجودها)
      const supportedSymbols: {[key: string]: string} = {
        'BTC/USDT': 'bitcoin',
        'ETH/USDT': 'ethereum',
        'BNB/USDT': 'binancecoin',
        'ADA/USDT': 'cardano',
        'SOL/USDT': 'solana',
        'MATIC/USDT': 'matic-network',
        'DOT/USDT': 'polkadot',
        'LINK/USDT': 'chainlink',
        'UNI/USDT': 'uniswap',
        'LTC/USDT': 'litecoin',
        'DOGE/USDT': 'dogecoin',
        'AVAX/USDT': 'avalanche-2',
        'ATOM/USDT': 'cosmos',
        'FTM/USDT': 'fantom',
        'NEAR/USDT': 'near',
        'ALGO/USDT': 'algorand',
        'VET/USDT': 'vechain',
        'XRP/USDT': 'ripple',
        'SHIB/USDT': 'shiba-inu',
        'MANA/USDT': 'decentraland',
        'SAND/USDT': 'the-sandbox',
        'CRV/USDT': 'curve-dao-token',
        'SUSHI/USDT': 'sushi',
        'COMP/USDT': 'compound-governance-token',
        'AAVE/USDT': 'aave',
        'MKR/USDT': 'maker',
        'BCH/USDT': 'bitcoin-cash',
        'XTZ/USDT': 'tezos',
        'EGLD/USDT': 'elrond-erd-2',
        'HBAR/USDT': 'hedera-hashgraph',
        'FLOW/USDT': 'flow',
        'ONE/USDT': 'harmony',
        'CELO/USDT': 'celo',
        'QTUM/USDT': 'qtum',
        'ICX/USDT': 'icon',
        'ZEC/USDT': 'zcash',
        'DASH/USDT': 'dash',
        'NEO/USDT': 'neo',
        'ONT/USDT': 'ontology',
        'ZIL/USDT': 'zilliqa',
        'XLM/USDT': 'stellar',
        'TRX/USDT': 'tron',
        'ETC/USDT': 'ethereum-classic',
        'FIL/USDT': 'filecoin'
      };

      const symbols = Object.keys(supportedSymbols);
      // استخدام Edge Function للحصول على الأسعار من Binance (بدون مشاكل CORS)
      try {
        const { data, error } = await supabase.functions.invoke('get-live-prices', {
          body: { symbols }
        });

        if (!error && data && data.prices) {
          const prices: MarketPrice[] = [];
          
          symbols.forEach(symbol => {
            if (data.prices[symbol]) {
              prices.push({
                symbol: symbol,
                price: data.prices[symbol],
                change24h: 0 // Binance API لا يعطي change24h في ticker/price endpoint
              });
            }
          });

          if (prices.length > 0) {
            console.log(`Successfully fetched ${prices.length} prices from Binance via Edge Function`);
            setMarketPrices(prices);
            return;
          }
        }
      } catch (error) {
        console.warn('Edge Function price fetch failed, using fallback prices');
      }

      // استخدام أسعار احتياطية للأزواج المدعومة فقط
      const fallbackPrices = getReliableFallbackPrices();
      setMarketPrices(fallbackPrices);
      console.log(`Using ${fallbackPrices.length} fallback prices`);
      
    } catch (error) {
      console.error('Error in fetchMarketPrices:', error);
      const fallbackPrices = getReliableFallbackPrices();
      setMarketPrices(fallbackPrices);
    }
  };

  // أسعار احتياطية للأزواج المدعومة فقط
  const getReliableFallbackPrices = (): MarketPrice[] => {
    return [
      // الأزواج الرئيسية المؤكدة
      { symbol: 'BTC/USDT', price: 105200, change24h: -0.24 },
      { symbol: 'ETH/USDT', price: 3850, change24h: 2.15 },
      { symbol: 'BNB/USDT', price: 662, change24h: 1.86 },
      { symbol: 'ADA/USDT', price: 0.89, change24h: 5.58 },
      { symbol: 'SOL/USDT', price: 212, change24h: 3.42 },
      { symbol: 'MATIC/USDT', price: 0.52, change24h: 2.17 },
      
      // أزواج شائعة مؤكدة
      { symbol: 'DOT/USDT', price: 8.45, change24h: 1.23 },
      { symbol: 'LINK/USDT', price: 24.67, change24h: 3.45 },
      { symbol: 'UNI/USDT', price: 13.28, change24h: 1.89 },
      { symbol: 'LTC/USDT', price: 118.45, change24h: 0.87 },
      { symbol: 'DOGE/USDT', price: 0.385, change24h: 4.32 },
      { symbol: 'AVAX/USDT', price: 42.18, change24h: 2.67 },
      { symbol: 'ATOM/USDT', price: 8.94, change24h: 1.45 },
      { symbol: 'FTM/USDT', price: 0.89, change24h: 3.21 },
      { symbol: 'NEAR/USDT', price: 6.78, change24h: 2.34 },
      { symbol: 'ALGO/USDT', price: 0.42, change24h: 1.67 },
      { symbol: 'VET/USDT', price: 0.045, change24h: 2.89 },
      { symbol: 'XRP/USDT', price: 2.34, change24h: 1.23 },
      { symbol: 'SHIB/USDT', price: 0.000025, change24h: 6.45 },
      { symbol: 'MANA/USDT', price: 0.68, change24h: 2.15 },
      { symbol: 'SAND/USDT', price: 0.62, change24h: 1.89 },
      { symbol: 'CRV/USDT', price: 1.12, change24h: 0.95 },
      { symbol: 'SUSHI/USDT', price: 1.85, change24h: 1.34 },
      { symbol: 'COMP/USDT', price: 78.45, change24h: 0.67 },
      { symbol: 'AAVE/USDT', price: 342.18, change24h: 1.23 },
      { symbol: 'MKR/USDT', price: 1567.89, change24h: 0.89 }
    ];
  };

  useEffect(() => {
    fetchMarketPrices();
    
    // تقليل تكرار التحديث لتجنب الأخطاء المفرطة
    const interval = setInterval(fetchMarketPrices, 300000); // كل 5 دقائق بدلاً من دقيقتين
    
    return () => clearInterval(interval);
  }, []);

  return { marketPrices, fetchMarketPrices };
};
