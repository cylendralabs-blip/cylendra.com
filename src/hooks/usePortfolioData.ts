import { useState, useEffect } from 'react';
import { BotSettingsForm } from '@/types/botSettings';

export const usePortfolioData = (platformId: string, marketType: 'spot' | 'futures') => {
  const [portfolioBalance, setPortfolioBalance] = useState({
    totalBalance: 11470.79,
    availableBalance: 8934.52,
    inOrders: 2536.27,
    totalUSDT: 11470.79
  });

  const getAvailableBalance = (botSettings: BotSettingsForm | null) => {
    if (!botSettings) return portfolioBalance.availableBalance;
    
    // إذا كان هناك رأس مال مخصص للمنصة، استخدمه
    // وإلا استخدم الرصيد المتاح
    return botSettings.total_capital || portfolioBalance.availableBalance;
  };

  return {
    portfolioBalance,
    getAvailableBalance
  };
};
