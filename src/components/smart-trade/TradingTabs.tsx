
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import BuySellTab from './tabs/BuySellTab';
import SmartTradeTab from './tabs/SmartTradeTab';
import SmartCoverTab from './tabs/SmartCoverTab';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArrowUpRight, ArrowDownRight, ShoppingCart } from 'lucide-react';

interface TradingTabsProps {
  selectedSymbol: string;
  selectedPlatform: string;
  onTradeExecuted: () => void;
  onOrderLevelsUpdate?: (takeProfitPrice?: number, stopLossPrice?: number) => void;
}

const TradingTabs = ({ selectedSymbol, selectedPlatform, onTradeExecuted, onOrderLevelsUpdate }: TradingTabsProps) => {
  const [activeTab, setActiveTab] = useState('buy-sell');
  const isMobile = useIsMobile();

  return (
    <Card className="w-full trading-card">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-3 ${isMobile ? 'h-8 mx-1' : 'h-12'} bg-secondary/50 dark:bg-secondary/70`}>
          <TabsTrigger 
            value="buy-sell" 
            className={`${isMobile ? 'text-[10px] px-1 py-1 h-7' : 'text-sm'} font-medium transition-colors duration-150 ease-in-out data-[state=active]:bg-card data-[state=active]:shadow-sm`}
          >
            <div className="flex items-center space-x-1 space-x-reverse">
              <ShoppingCart className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} icon-interactive`} />
              <span>{isMobile ? 'شراء/بيع' : 'Buy/Sell'}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="smart-trade" 
            className={`${isMobile ? 'text-[10px] px-1 py-1 h-7' : 'text-sm'} font-medium text-primary-600 transition-all duration-200 ease-in-out data-[state=active]:bg-card data-[state=active]:shadow-md hover:scale-105 active:scale-95`}
          >
            <div className="flex items-center space-x-1 space-x-reverse">
              <ArrowUpRight className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} icon-interactive icon-glow`} />
              <span>{isMobile ? 'ذكي ↗' : 'Smart Trade'}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="smart-cover" 
            className={`${isMobile ? 'text-[10px] px-1 py-1 h-7' : 'text-sm'} font-medium text-pink-600 transition-all duration-200 ease-in-out data-[state=active]:bg-card data-[state=active]:shadow-md hover:scale-105 active:scale-95`}
          >
            <div className="flex items-center space-x-1 space-x-reverse">
              <ArrowDownRight className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} icon-interactive icon-glow`} />
              <span>{isMobile ? 'تغطية ↓' : 'Smart Cover'}</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buy-sell" className={`${isMobile ? 'mt-1 min-h-[350px] px-2' : 'mt-0 min-h-[500px]'} animate-fade-in-up`}>
          <BuySellTab 
            selectedSymbol={selectedSymbol}
            onTradeExecuted={onTradeExecuted}
          />
        </TabsContent>

        <TabsContent value="smart-trade" className={`${isMobile ? 'mt-1 min-h-[350px] px-2' : 'mt-0 min-h-[500px]'} animate-fade-in-up`}>
          <SmartTradeTab 
            selectedSymbol={selectedSymbol}
            selectedPlatform={selectedPlatform}
            onTradeExecuted={onTradeExecuted}
            onOrderLevelsUpdate={onOrderLevelsUpdate}
          />
        </TabsContent>

        <TabsContent value="smart-cover" className={`${isMobile ? 'mt-1 min-h-[350px] px-2' : 'mt-0 min-h-[500px]'} animate-fade-in-up`}>
          <SmartCoverTab 
            selectedSymbol={selectedSymbol}
            onTradeExecuted={onTradeExecuted}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default TradingTabs;
