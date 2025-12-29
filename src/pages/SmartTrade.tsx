
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SmartTradeInterface from '@/components/smart-trade/SmartTradeInterface';
import { useToast } from '@/hooks/use-toast';

const SmartTrade = () => {
  const { toast } = useToast();
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');

  useEffect(() => {
    toast({
      title: "مرحباً بك في التداول الذكي",
      description: "نظام تداول متقدم مع إدارة مخاطر ذكية",
    });
  }, [toast]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            التداول الذكي
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            نظام تداول متقدم مع إدارة المخاطر وأوامر ذكية
          </p>
        </div>
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm opacity-90">متاح مجاناً</p>
              <p className="font-bold">Smart Trade</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <SmartTradeInterface 
        selectedSymbol={selectedSymbol}
        onSymbolChange={setSelectedSymbol}
      />
    </div>
  );
};

export default SmartTrade;
