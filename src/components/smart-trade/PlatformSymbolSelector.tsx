
import { useState, useEffect } from 'react';
import { useTradingPairs } from '@/hooks/useTradingPairs';
import { usePlatformCapital } from '@/hooks/usePlatformCapital';
import { useRealTimePrices } from '@/hooks/useRealTimePrices';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserApiKeys } from '@/hooks/useUserApiKeys';
import MobilePlatformSelector from './platform-selector/MobilePlatformSelector';
import DesktopPlatformSelector from './platform-selector/DesktopPlatformSelector';

interface ApiKey {
  id: string;
  platform: string;
  is_active: boolean;
  testnet: boolean;
}

interface PlatformSymbolSelectorProps {
  selectedPlatform: string;
  selectedSymbol: string;
  onPlatformChange: (platformId: string) => void;
  onSymbolChange: (symbol: string) => void;
}

const PlatformSymbolSelector = ({
  selectedPlatform,
  selectedSymbol,
  onPlatformChange,
  onSymbolChange,
}: PlatformSymbolSelectorProps) => {
  const isMobile = useIsMobile();
  const [marketType, setMarketType] = useState<'spot' | 'futures'>('spot');
  const [availableApiKeys, setAvailableApiKeys] = useState<ApiKey[]>([]);
  
  const { pairs, loading: pairsLoading, refetch: refetchPairs } = useTradingPairs({
    platformId: selectedPlatform,
    marketType
  });
  
  const { selectedPlatformInfo } = usePlatformCapital(selectedPlatform);
  const { getAllPrices } = useRealTimePrices();
  const pricesObject = getAllPrices();

  // تحويل كائن الأسعار إلى مصفوفة متوافقة مع TradingPairSelect
  const marketPrices = Object.values(pricesObject).map(priceData => ({
    symbol: priceData.symbol,
    price: priceData.price,
    change24h: priceData.change24h
  }));

  // جلب المنصات المتصلة من قاعدة البيانات
  const { data: apiKeys = [] } = useUserApiKeys();
  
  useEffect(() => {
    if (apiKeys.length > 0) {
      const formattedApiKeys: ApiKey[] = apiKeys.map(key => ({
        id: key.id,
        platform: key.platform,
        is_active: key.is_active,
        testnet: key.testnet || false
      }));
      setAvailableApiKeys(formattedApiKeys);
    }
  }, [apiKeys]);

  const getPlatformDisplayName = (platform: string, testnet: boolean) => {
    const platformNames: {[key: string]: string} = {
      'binance': 'Binance',
      'binance-futures-testnet': 'Binance Futures',
      'okx': 'OKX',
      'bybit': 'Bybit',
      'kucoin': 'KuCoin'
    };
    
    return platformNames[platform] || platform.toUpperCase() + (testnet ? ' (تجريبي)' : '');
  };

  const handlePlatformChange = (platformId: string) => {
    onPlatformChange(platformId);
    if (pairs.length > 0) {
      onSymbolChange(pairs[0]);
    }
  };

  const commonProps = {
    selectedPlatform,
    selectedSymbol,
    marketType,
    availableApiKeys,
    pairs,
    marketPrices,
    pairsLoading,
    selectedPlatformInfo,
    onPlatformChange: handlePlatformChange,
    onSymbolChange,
    onMarketTypeChange: setMarketType,
    onRefreshPairs: refetchPairs,
    getPlatformDisplayName
  };

  if (isMobile) {
    return <MobilePlatformSelector {...commonProps} />;
  }

  return <DesktopPlatformSelector {...commonProps} />;
};

export default PlatformSymbolSelector;
