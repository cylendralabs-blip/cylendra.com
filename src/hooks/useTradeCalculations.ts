
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { BotSettingsForm } from '@/types/botSettings';

interface TradeCalculation {
  maxLossAmount: number;
  totalTradeAmount: number;
  initialOrderAmount: number;
  dcaReservedAmount: number;
  leveragedAmount: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  dcaLevels: Array<{
    level: number;
    percentage: number;
    amount: number;
    targetPrice: number;
    cumulativeAmount: number;
    averageEntry: number;
  }>;
}

export const useTradeCalculations = (
  selectedPair: string,
  currentPrice: number,
  lossPctFromEntry: number,
  botSettings: BotSettingsForm | null,
  marketType: 'spot' | 'futures',
  orderType: 'market' | 'limit',
  limitPrice: number,
  availableBalance: number
) => {
  const { toast } = useToast();
  const [tradeCalculation, setTradeCalculation] = useState<TradeCalculation | null>(null);

  const calculateTradeAmounts = () => {
    console.log('Calculating trade amounts...');
    if (!botSettings || !currentPrice || !lossPctFromEntry) {
      console.log('Missing required data for calculation:', { botSettings: !!botSettings, currentPrice, lossPctFromEntry });
      return;
    }

    console.log('Available balance for calculation:', availableBalance);
    
    if (availableBalance === 0) {
      toast({
        title: 'تنبيه',
        description: 'لا يوجد رصيد متاح للتداول',
        variant: 'destructive',
      });
      return;
    }

    const maxLossAmount = (availableBalance * botSettings.risk_percentage) / 100;
    
    // استخدام السعر المناسب حسب نوع الدخول
    const entryPrice = orderType === 'limit' && limitPrice > 0 ? limitPrice : currentPrice;
    const stopLossPrice = entryPrice * (1 - lossPctFromEntry / 100);
    const priceDifference = entryPrice - stopLossPrice;
    const priceDropPercentage = priceDifference / entryPrice;
    
    const totalTradeAmount = maxLossAmount / priceDropPercentage;
    const leveragedAmount = totalTradeAmount * (marketType === 'futures' ? (botSettings.leverage || 1) : 1);
    
    const initialOrderAmount = (totalTradeAmount * botSettings.initial_order_percentage) / 100;
    const dcaReservedAmount = totalTradeAmount - initialOrderAmount;
    
    const takeProfitPrice = entryPrice * (1 + (botSettings.take_profit_percentage || 3) / 100);
    
    // حساب مستويات DCA
    const dcaLevels = [];
    const dcaAmount = dcaReservedAmount / botSettings.dca_levels;
    let cumulativeInvestment = initialOrderAmount;
    let cumulativeQuantity = initialOrderAmount / entryPrice;
    
    for (let i = 1; i <= botSettings.dca_levels; i++) {
      const dropPercentage = (i * 2);
      const targetPrice = entryPrice * (1 - dropPercentage / 100);
      
      cumulativeInvestment += dcaAmount;
      cumulativeQuantity += dcaAmount / targetPrice;
      
      const averageEntry = cumulativeInvestment / cumulativeQuantity;
      
      dcaLevels.push({
        level: i,
        percentage: dropPercentage,
        amount: dcaAmount,
        targetPrice,
        cumulativeAmount: cumulativeInvestment,
        averageEntry
      });
    }

    const calculation = {
      maxLossAmount,
      totalTradeAmount,
      initialOrderAmount,
      dcaReservedAmount,
      leveragedAmount,
      stopLossPrice,
      takeProfitPrice,
      dcaLevels
    };

    console.log('Trade calculation result:', calculation);
    setTradeCalculation(calculation);
  };

  useEffect(() => {
    if (selectedPair && currentPrice > 0 && lossPctFromEntry > 0 && botSettings && availableBalance > 0) {
      calculateTradeAmounts();
    }
  }, [selectedPair, currentPrice, lossPctFromEntry, botSettings, marketType, orderType, limitPrice, availableBalance]);

  return { tradeCalculation, calculateTradeAmounts };
};
