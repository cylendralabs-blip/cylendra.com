
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { BotSettingsForm } from '@/types/botSettings';

interface PortfolioInfoProps {
  availableBalance: number;
  botSettings: BotSettingsForm | null;
  marketType: 'spot' | 'futures';
  orderType: 'market' | 'limit';
}

const PortfolioInfo = ({ availableBalance, botSettings, marketType, orderType }: PortfolioInfoProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          معلومات المحفظة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">الرصيد المتاح (USDT):</span>
            <span className="font-medium text-green-600">${availableBalance.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">نسبة المخاطرة:</span>
            <span className="font-medium">{botSettings?.risk_percentage || 0}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">نوع السوق:</span>
            <span className="font-medium">{marketType === 'spot' ? 'عادي' : 'مستقبليات'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">نوع الدخول:</span>
            <span className="font-medium">{orderType === 'market' ? 'سوق' : 'محدود'}</span>
          </div>
          {marketType === 'futures' && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">الرافعة المالية:</span>
              <span className="font-medium">{botSettings?.leverage || 1}x</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioInfo;
