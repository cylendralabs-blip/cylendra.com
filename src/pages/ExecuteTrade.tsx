import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { fetchBotSettings } from '@/utils/dataFetchers';
import { BotSettingsForm } from '@/types/botSettings';
import { useTradeExecution } from '@/hooks/useTradeExecution';
import { useMarketData } from '@/hooks/useMarketData';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import { useTradeCalculations } from '@/hooks/useTradeCalculations';
import TradeSettingsForm from '@/components/execute-trade/TradeSettingsForm';
import PortfolioInfo from '@/components/execute-trade/PortfolioInfo';
import TradeCalculations from '@/components/execute-trade/TradeCalculations';
import StrategyInfo from '@/components/execute-trade/StrategyInfo';
import ExecuteTradeButton from '@/components/execute-trade/ExecuteTradeButton';

interface ApiKey {
  id: string;
  platform: string;
  is_active: boolean;
  testnet: boolean;
}

const ExecuteTrade = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [botSettings, setBotSettings] = useState<BotSettingsForm | null>(null);
  
  // Form states
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedPair, setSelectedPair] = useState('');
  const [marketType, setMarketType] = useState<'spot' | 'futures'>('spot');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [tradeDirection, setTradeDirection] = useState<'long' | 'short'>('long');
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [limitPrice, setLimitPrice] = useState<number>(0);
  const [lossPctFromEntry, setLossPctFromEntry] = useState<number>(5);
  const [autoExecute, setAutoExecute] = useState(true);

  // Custom hooks
  const { marketPrices } = useMarketData();
  const { portfolioBalance, getAvailableBalance } = usePortfolioData(selectedPlatform, marketType);
  const availableBalance = getAvailableBalance(botSettings);
  const { tradeCalculation } = useTradeCalculations(
    selectedPair,
    currentPrice,
    lossPctFromEntry,
    botSettings,
    marketType,
    orderType,
    limitPrice,
    availableBalance
  );
  const { executeTrade, loading } = useTradeExecution();

  useEffect(() => {
    if (user) {
      fetchApiKeys();
      fetchBotSettingsData();
    }
  }, [user]);

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, platform, is_active, testnet')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب مفاتيح API',
        variant: 'destructive',
      });
    }
  };

  const fetchBotSettingsData = async () => {
    try {
      const settings = await fetchBotSettings(user?.id!);
      if (settings) {
        setBotSettings(settings);
        
        if (settings.default_platform && apiKeys.length === 0) {
          setSelectedPlatform(settings.default_platform);
        }
        
        setMarketType(settings.market_type);
        setOrderType(settings.order_type);

        if (settings.default_trade_direction === 'long' || settings.default_trade_direction === 'short') {
          setTradeDirection(settings.default_trade_direction);
        } else if (settings.default_trade_direction === 'both') {
          setTradeDirection('long');
        }
      }
    } catch (error) {
      console.error('Error fetching bot settings:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب إعدادات البوت',
        variant: 'destructive',
      });
    }
  };

  const handlePairSelect = (pair: string) => {
    console.log('Selecting pair:', pair);
    setSelectedPair(pair);
    
    // البحث عن السعر في البيانات المجلبة
    const marketPrice = marketPrices.find(p => p.symbol === pair);
    console.log('Found market price for', pair, ':', marketPrice);
    
    if (marketPrice) {
      console.log('Setting current price to:', marketPrice.price);
      setCurrentPrice(marketPrice.price);
      setLimitPrice(marketPrice.price);
    } else {
      console.log('No market price found for pair:', pair);
      toast({
        title: 'تنبيه',
        description: 'لم يتم العثور على سعر السوق، يرجى إدخال السعر يدوياً',
        variant: 'default',
      });
    }
  };

  // إعادة تعيين الزوج المختار عند تغيير نوع السوق أو المنصة
  const handleMarketTypeChange = (value: string) => {
    setMarketType(value as 'spot' | 'futures');
    setSelectedPair(''); // إعادة تعيين الزوج المختار
    setCurrentPrice(0);
    setLimitPrice(0);
  };

  const handlePlatformChange = (value: string) => {
    setSelectedPlatform(value);
    setSelectedPair(''); // إعادة تعيين الزوج المختار
    setCurrentPrice(0);
    setLimitPrice(0);
  };

  const handleExecuteTrade = async () => {
    if (!tradeCalculation) return;
    
    const success = await executeTrade(
      tradeCalculation,
      selectedPlatform,
      selectedPair,
      marketType,
      orderType,
      tradeDirection,
      currentPrice,
      limitPrice,
      botSettings!,
      autoExecute,
      availableBalance
    );

    if (success) {
      setSelectedPair('');
      setCurrentPrice(0);
      setLimitPrice(0);
      setLossPctFromEntry(5);
    }
  };

  // Auto-select default platform when apiKeys are loaded
  useEffect(() => {
    if (apiKeys.length > 0 && botSettings?.default_platform && !selectedPlatform) {
      const defaultPlatform = apiKeys.find(key => key.id === botSettings.default_platform);
      if (defaultPlatform) {
        console.log('Auto-selecting default platform:', defaultPlatform.id);
        setSelectedPlatform(defaultPlatform.id);
      }
    }
  }, [apiKeys, botSettings?.default_platform, selectedPlatform]);

  return (
    <main className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Play className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">تنفيذ صفقة جديدة</h1>
            <p className="text-gray-600 dark:text-gray-400">تنفيذ صفقة باستخدام إعدادات البوت الافتراضية</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Trade Settings */}
          <div className="xl:col-span-1 space-y-6">
            <TradeSettingsForm
              apiKeys={apiKeys}
              marketPrices={marketPrices}
              selectedPlatform={selectedPlatform}
              selectedPair={selectedPair}
              marketType={marketType}
              orderType={orderType}
              tradeDirection={tradeDirection}
              currentPrice={currentPrice}
              limitPrice={limitPrice}
              lossPctFromEntry={lossPctFromEntry}
              autoExecute={autoExecute}
              onPlatformChange={handlePlatformChange}
              onPairChange={handlePairSelect}
              onMarketTypeChange={handleMarketTypeChange}
              onOrderTypeChange={(value: string) => setOrderType(value as 'market' | 'limit')}
              onTradeDirectionChange={(value: string) => setTradeDirection(value as 'long' | 'short')}
              onCurrentPriceChange={setCurrentPrice}
              onLimitPriceChange={setLimitPrice}
              onLossPercentageChange={setLossPctFromEntry}
              onAutoExecuteChange={setAutoExecute}
            />

            <PortfolioInfo
              availableBalance={availableBalance}
              botSettings={botSettings}
              marketType={marketType}
              orderType={orderType}
            />
          </div>

          {/* Trade Calculations */}
          <div className="xl:col-span-2 space-y-6">
            {tradeCalculation && (
              <TradeCalculations
                tradeCalculation={tradeCalculation}
                orderType={orderType}
                currentPrice={currentPrice}
                limitPrice={limitPrice}
              />
            )}

            {/* Strategy Info */}
            {botSettings && (
              <StrategyInfo
                botSettings={botSettings}
                orderType={orderType}
              />
            )}

            <ExecuteTradeButton
              tradeCalculation={tradeCalculation}
              availableBalance={availableBalance}
              loading={loading}
              selectedPlatform={selectedPlatform}
              selectedPair={selectedPair}
              orderType={orderType}
              limitPrice={limitPrice}
              autoExecute={autoExecute}
              onExecute={handleExecuteTrade}
            />
          </div>
        </div>
      </div>
    </main>
  );
};

export default ExecuteTrade;
