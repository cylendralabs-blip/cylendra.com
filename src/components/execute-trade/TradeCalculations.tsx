
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calculator, BarChart3 } from 'lucide-react';

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

interface TradeCalculationsProps {
  tradeCalculation: TradeCalculation;
  orderType: 'market' | 'limit';
  currentPrice: number;
  limitPrice: number;
}

const TradeCalculations = ({ tradeCalculation, orderType, currentPrice, limitPrice }: TradeCalculationsProps) => {
  const entryPrice = orderType === 'limit' && limitPrice > 0 ? limitPrice : currentPrice;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            حسابات الصفقة
          </CardTitle>
          <CardDescription>
            حسابات تلقائية لإدارة المخاطر - 
            {orderType === 'limit' && limitPrice > 0 
              ? ` السعر المستهدف: $${limitPrice.toFixed(4)}`
              : ` السعر الحالي: $${currentPrice.toFixed(4)}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400 block">الحد الأقصى للخسارة</span>
              <p className="font-bold text-red-600">${tradeCalculation.maxLossAmount.toFixed(2)}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400 block">مبلغ الصفقة الكلي</span>
              <p className="font-bold text-blue-600">${tradeCalculation.totalTradeAmount.toFixed(2)}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400 block">الدخول الأولي</span>
              <p className="font-bold text-green-600">${tradeCalculation.initialOrderAmount.toFixed(2)}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400 block">محجوز لـ DCA</span>
              <p className="font-bold text-purple-600">${tradeCalculation.dcaReservedAmount.toFixed(2)}</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">وقف الخسارة:</span>
              <Badge variant="destructive">${tradeCalculation.stopLossPrice.toFixed(4)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">جني الأرباح:</span>
              <Badge variant="default">${tradeCalculation.takeProfitPrice.toFixed(4)}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* مستويات DCA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            مستويات DCA التفصيلية
          </CardTitle>
          <CardDescription>الأسعار والمبالغ لكل مستوى</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* العناوين */}
            <div className="grid grid-cols-6 gap-3 text-xs font-medium text-gray-600 dark:text-gray-400 border-b pb-2">
              <span>المستوى</span>
              <span>انخفاض السعر</span>
              <span>سعر الدخول</span>
              <span>المبلغ</span>
              <span>المبلغ التراكمي</span>
              <span>متوسط الدخول</span>
            </div>
            
            {/* الدخول الأولي */}
            <div className="grid grid-cols-6 gap-3 text-sm bg-green-50 dark:bg-green-950/20 p-2 rounded">
              <span className="font-medium">أولي</span>
              <span>0%</span>
              <span>${entryPrice.toFixed(4)}</span>
              <span>${tradeCalculation.initialOrderAmount.toFixed(2)}</span>
              <span>${tradeCalculation.initialOrderAmount.toFixed(2)}</span>
              <span>${entryPrice.toFixed(4)}</span>
            </div>

            {/* مستويات DCA */}
            {tradeCalculation.dcaLevels.map((level) => (
              <div key={level.level} className="grid grid-cols-6 gap-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/20 p-2 rounded">
                <span className="font-medium">DCA {level.level}</span>
                <span className="text-red-600">-{level.percentage}%</span>
                <span>${level.targetPrice.toFixed(4)}</span>
                <span>${level.amount.toFixed(2)}</span>
                <span>${level.cumulativeAmount.toFixed(2)}</span>
                <span>${level.averageEntry.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default TradeCalculations;
