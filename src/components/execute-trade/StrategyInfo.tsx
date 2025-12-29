
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';
import { BotSettingsForm } from '@/types/botSettings';

interface StrategyInfoProps {
  botSettings: BotSettingsForm;
  orderType: 'market' | 'limit';
}

const StrategyInfo = ({ botSettings, orderType }: StrategyInfoProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="w-5 h-5 mr-2" />
          إعدادات الاستراتيجية المطبقة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">نوع الاستراتيجية:</span>
            <p className="font-medium">{botSettings.strategy_type}</p>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">نسبة المخاطرة:</span>
            <p className="font-medium">{botSettings.risk_percentage}%</p>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">مستويات DCA:</span>
            <p className="font-medium">{botSettings.dca_levels}</p>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">نوع الدخول:</span>
            <p className="font-medium">{orderType === 'market' ? 'سوق' : 'محدود'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StrategyInfo;
