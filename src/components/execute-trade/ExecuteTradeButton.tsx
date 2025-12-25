
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, AlertTriangle, CheckCircle } from 'lucide-react';

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

interface ExecuteTradeButtonProps {
  tradeCalculation: TradeCalculation | null;
  availableBalance: number;
  loading: boolean;
  selectedPlatform: string;
  selectedPair: string;
  orderType: 'market' | 'limit';
  limitPrice: number;
  autoExecute: boolean;
  onExecute: () => void;
}

const ExecuteTradeButton = ({
  tradeCalculation,
  availableBalance,
  loading,
  selectedPlatform,
  selectedPair,
  orderType,
  limitPrice,
  autoExecute,
  onExecute,
}: ExecuteTradeButtonProps) => {
  const canExecute = tradeCalculation && 
    availableBalance > 0 && 
    selectedPlatform && 
    selectedPair && 
    availableBalance >= tradeCalculation.totalTradeAmount && 
    (orderType === 'market' || limitPrice > 0);

  return (
    <>
      {/* حالة التنفيذ */}
      <Card className={autoExecute ? "border-green-200 bg-green-50 dark:bg-green-950/20" : "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20"}>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3 space-x-reverse">
            {autoExecute ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            )}
            <div className="text-sm">
              {autoExecute ? (
                <div className="text-green-800 dark:text-green-200">
                  <p className="font-medium mb-1">✅ التنفيذ التلقائي مُفعل</p>
                  <p>سيتم تنفيذ الصفقة مباشرة على منصة التداول عند الضغط على الزر.</p>
                </div>
              ) : (
                <div className="text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">⚠️ التنفيذ التلقائي معطل</p>
                  <p>سيتم حفظ الصفقة فقط دون تنفيذها على المنصة. فعل التنفيذ التلقائي لتنفيذ الصفقة مباشرة.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* زر تنفيذ الصفقة */}
      {tradeCalculation && availableBalance > 0 && (
        <div className="flex justify-center">
          <Button 
            onClick={onExecute}
            disabled={loading || !canExecute}
            size="lg"
            className={`w-full max-w-md ${autoExecute ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? (
              <>
                <Play className="w-4 h-4 mr-2 animate-spin" />
                جاري تنفيذ الصفقة...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                {autoExecute ? `تنفيذ ${orderType === 'market' ? 'أمر السوق' : 'الأمر المحدود'} مباشرة` : 'حفظ إعدادات الصفقة'}
              </>
            )}
          </Button>
        </div>
      )}

      {/* تحذير */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3 space-x-reverse">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">تنبيه مهم:</p>
              <p>سيتم تنفيذ الصفقة وفقاً لإعدادات البوت المحفوظة باستخدام {orderType === 'market' ? 'أمر السوق' : 'الأمر المحدود'}. تأكد من مراجعة حسابات المخاطر قبل التنفيذ.</p>
              {orderType === 'limit' && (
                <p className="mt-2 text-blue-600 font-medium">الأمر المحدود سيتم تنفيذه فقط عند الوصول للسعر المحدد.</p>
              )}
              {availableBalance === 0 && (
                <p className="mt-2 text-red-600 font-medium">لا يوجد رصيد كافي لتنفيذ الصفقة.</p>
              )}
              {tradeCalculation && availableBalance < tradeCalculation.totalTradeAmount && (
                <p className="mt-2 text-red-600 font-medium">الرصيد المتاح أقل من المبلغ المطلوب للصفقة.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ExecuteTradeButton;
