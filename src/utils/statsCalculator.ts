
interface RealTimeStats {
  totalProfit: number;
  profitPercentage: number;
  activeTradesCount: number;
  winRate: number;
  currentRiskPercentage: number;
  strategyType: string;
}

export const calculateRealTimeStats = (
  performanceData: any,
  activeTrades: any[],
  settingsData: any
): RealTimeStats => {
  const totalProfit = performanceData?.net_profit || 0;
  const totalCapital = settingsData?.total_capital || 1000;
  const profitPercentage = totalCapital > 0 ? (totalProfit / totalCapital) * 100 : 0;

  return {
    totalProfit,
    profitPercentage,
    activeTradesCount: activeTrades?.length || 0,
    winRate: performanceData?.win_rate || 0,
    currentRiskPercentage: Number(settingsData?.risk_percentage) || 2.0,
    strategyType: settingsData?.strategy_type || 'basic_dca'
  };
};
