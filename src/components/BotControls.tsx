
import { useTradingData } from '@/hooks/useTradingData';
import BotControlPanel from './bot-controls/BotControlPanel';
import PerformancePanel from './bot-controls/PerformancePanel';

const BotControls = () => {
  const { botSettings, activeTrades, performance } = useTradingData();

  const isRunning = botSettings?.is_active || false;
  const totalCapital = botSettings?.total_capital || 1000;
  const riskPercentage = botSettings?.risk_percentage || 2.1;

  // حساب رأس المال المستخدم
  const usedCapital = activeTrades?.reduce((sum, trade) => 
    sum + Number(trade.total_invested), 0) || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
      <BotControlPanel 
        isRunning={isRunning}
        riskPercentage={riskPercentage}
        botSettings={botSettings}
      />
      
      <PerformancePanel 
        usedCapital={usedCapital}
        totalCapital={totalCapital}
        activeTrades={activeTrades}
        performance={performance}
      />
    </div>
  );
};

export default BotControls;
