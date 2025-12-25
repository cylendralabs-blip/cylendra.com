
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseTradingPairsProps {
  platformId: string;
  marketType: 'spot' | 'futures';
}

export const useTradingPairs = ({ platformId, marketType }: UseTradingPairsProps) => {
  const { toast } = useToast();
  const [pairs, setPairs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!platformId) {
      setPairs([]);
      return;
    }

    fetchTradingPairs();
  }, [platformId, marketType]);

  const fetchTradingPairs = async () => {
    setLoading(true);
    try {
      console.log('Fetching trading pairs for:', { platformId, marketType });
      
      const platformName = getPlatformName(platformId);
      console.log('Platform name resolved to:', platformName);
      
      const { data, error } = await supabase.functions.invoke('get-trading-pairs', {
        body: {
          platform: platformName,
          marketType
        }
      });

      if (error) {
        console.error('Error fetching trading pairs:', error);
        throw error;
      }

      console.log('Trading pairs response:', data);
      
      if (data && data.pairs && Array.isArray(data.pairs)) {
        // إزالة الفلترة المفرطة - نأخذ جميع الأزواج المتاحة
        setPairs(data.pairs);
        console.log(`Loaded ${data.pairs.length} trading pairs from ${platformName}`);
      } else {
        // في حالة عدم وجود بيانات، نستخدم أزواج افتراضية موسعة
        const expandedPairs = getExpandedDefaultPairs();
        setPairs(expandedPairs);
        
        toast({
          title: 'تم تحميل الأزواج الافتراضية',
          description: `تم تحميل ${expandedPairs.length} زوج`,
          variant: 'default',
        });
      }

    } catch (error) {
      console.error('Error in useTradingPairs:', error);
      
      // في حالة الخطأ، نستخدم أزواج افتراضية موسعة
      const expandedPairs = getExpandedDefaultPairs();
      setPairs(expandedPairs);
      
      toast({
        title: 'تم تحميل الأزواج الافتراضية',
        description: `تم تحميل ${expandedPairs.length} زوج، يرجى المحاولة مرة أخرى`,
        variant: 'default',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlatformName = (platformId: string): string => {
    if (platformId.includes('binance-futures') || platformId === '9a05d808-9171-469d-a5b2-57459b60af41') {
      return marketType === 'futures' ? 'binance-futures-testnet' : 'binance';
    }
    if (platformId.includes('binance') || platformId === '9eb2caa6-500c-491c-a443-10a6867071b3') {
      return 'binance';
    }
    if (platformId.includes('okx') || platformId === '2e9c6f31-594e-4772-b891-2be0866b8a5d') {
      return 'okx';
    }
    if (platformId.includes('bybit')) {
      return 'bybit';
    }
    if (platformId.includes('kucoin')) {
      return 'kucoin';
    }
    
    console.log('Unknown platform ID:', platformId, 'defaulting to binance');
    return 'binance';
  };

  // أزواج افتراضية موسعة
  const getExpandedDefaultPairs = (): string[] => {
    return [
      // الأزواج الرئيسية
      'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'XRP/USDT', 'ADA/USDT',
      'SOL/USDT', 'DOT/USDT', 'MATIC/USDT', 'LINK/USDT', 'UNI/USDT',
      'LTC/USDT', 'BCH/USDT', 'AVAX/USDT', 'ATOM/USDT', 'NEAR/USDT',
      
      // أزواج شائعة إضافية
      'ALGO/USDT', 'VET/USDT', 'MANA/USDT', 'SAND/USDT', 'SHIB/USDT',
      'DOGE/USDT', 'FTM/USDT', 'GALA/USDT', 'APE/USDT', 'GMT/USDT',
      'PEOPLE/USDT', 'LRC/USDT', 'ENS/USDT', 'ICP/USDT', 'THETA/USDT',
      
      // DeFi tokens
      'AAVE/USDT', 'COMP/USDT', 'MKR/USDT', 'SNX/USDT', 'YFI/USDT',
      '1INCH/USDT', 'CRV/USDT', 'SUSHI/USDT', 'BAL/USDT', 'REN/USDT',
      
      // أزواج إضافية
      'FIL/USDT', 'TRX/USDT', 'EOS/USDT', 'XLM/USDT', 'XTZ/USDT',
      'ZRX/USDT', 'KNC/USDT', 'BAND/USDT', 'RSR/USDT', 'OXT/USDT',
      
      // العملات الناشئة
      'AR/USDT', 'WAVES/USDT', 'ROSE/USDT', 'CHZ/USDT', 'ENJ/USDT',
      'AUDIO/USDT', 'MASK/USDT', 'ALPHA/USDT', 'TLM/USDT', 'SLP/USDT'
    ];
  };

  return {
    pairs,
    loading,
    refetch: fetchTradingPairs
  };
};
