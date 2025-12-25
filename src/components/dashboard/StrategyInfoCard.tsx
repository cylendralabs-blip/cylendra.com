
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers, Zap } from 'lucide-react';
import { BotSettingsForm } from '@/types/botSettings';

interface StrategyInfoCardProps {
  botSettings: BotSettingsForm | null;
  strategyType: string;
}

const StrategyInfoCard = ({ botSettings, strategyType }: StrategyInfoCardProps) => {
  const getStrategyName = (strategyType: string) => {
    switch (strategyType) {
      case 'basic_dca':
        return 'DCA أساسية';
      case 'dca_with_leverage_new':
        return 'DCA + رافعة (جديد)';
      case 'dca_with_leverage_modify':
        return 'DCA + رافعة (تعديل)';
      default:
        return 'غير محدد';
    }
  };

  const getStrategyRisk = (strategyType: string) => {
    switch (strategyType) {
      case 'basic_dca':
        return 'منخفض';
      case 'dca_with_leverage_new':
        return 'متوسط-عالي';
      case 'dca_with_leverage_modify':
        return 'عالي';
      default:
        return 'غير محدد';
    }
  };

  const getStrategyColor = (strategyType: string) => {
    switch (strategyType) {
      case 'basic_dca':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'dca_with_leverage_new':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'dca_with_leverage_modify':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!botSettings) return null;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 sm:pb-3 lg:pb-4 p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col space-y-2 sm:space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2 space-x-reverse min-w-0 flex-1">
              <div className="p-1.5 sm:p-2 bg-accent/10 rounded-lg flex-shrink-0">
                <Layers className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm sm:text-base lg:text-lg leading-tight">الاستراتيجية النشطة</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-0.5">معلومات الاستراتيجية المُفعلة حالياً</CardDescription>
              </div>
            </div>
            <Badge className={`${getStrategyColor(strategyType)} text-xs sm:text-sm flex-shrink-0 ml-2`}>
              {getStrategyName(strategyType)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 p-3 sm:p-4 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          <div className="text-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">مستوى المخاطرة</p>
            <p className="font-semibold text-sm sm:text-base lg:text-lg">{getStrategyRisk(strategyType)}</p>
          </div>
          <div className="text-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">نسبة Risk:Reward</p>
            <p className="font-semibold text-sm sm:text-base lg:text-lg">1:{botSettings?.risk_reward_ratio || 2.0}</p>
          </div>
          <div className="text-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-center space-x-1 space-x-reverse mb-1">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">رافعة تلقائية</p>
            </div>
            <p className="font-semibold text-sm sm:text-base lg:text-lg">{botSettings?.auto_leverage ? 'مُفعلة' : 'معطلة'}</p>
          </div>
          <div className="text-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">مصدر الإشارات</p>
            <p className="font-semibold text-sm sm:text-base lg:text-lg">
              {botSettings?.signal_source === 'ai' ? 'AI Ultra Signals' :
               botSettings?.signal_source === 'tradingview' ? 'TradingView' :
               botSettings?.signal_source === 'legacy' ? 'Legacy Engine' : 'AI Ultra Signals'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StrategyInfoCard;
