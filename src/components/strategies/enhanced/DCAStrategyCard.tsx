
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, Zap, Play, Pause, Copy } from 'lucide-react';
import { DCAStrategy } from '@/types/strategies';
import DCASettingsDialog from './DCASettingsDialog';
import DCABacktestDialog from './DCABacktestDialog';

interface DCAStrategyCardProps {
  strategy: DCAStrategy;
  onClone: () => void;
  onUpdateStrategy: (updatedStrategy: DCAStrategy) => void;
  onToggleActive: (strategyId: string, isActive: boolean) => void;
}

const DCAStrategyCard = ({ strategy, onClone, onUpdateStrategy, onToggleActive }: DCAStrategyCardProps) => {
  const getStrategyIcon = (type: string) => {
    switch (type) {
      case 'dca_basic': return Target;
      case 'dca_advanced': return TrendingUp;
      case 'dca_smart': return Zap;
      default: return Target;
    }
  };

  const getStrategyColor = (type: string) => {
    switch (type) {
      case 'dca_basic': return 'blue';
      case 'dca_advanced': return 'green';
      case 'dca_smart': return 'purple';
      default: return 'blue';
    }
  };

  const Icon = getStrategyIcon(strategy.type);
  const color = getStrategyColor(strategy.type);

  const handleToggleActive = () => {
    onToggleActive(strategy.id, !strategy.isActive);
  };

  return (
    <Card className={`border-l-4 border-l-${color}-500`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon className={`w-5 h-5 text-${color}-600`} />
            {strategy.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={strategy.isActive ? 'default' : 'secondary'}>
              {strategy.isActive ? 'نشط' : 'متوقف'}
            </Badge>
            <Badge variant="outline" className={`text-${color}-600`}>
              {strategy.type.replace('dca_', '').replace('_', ' ')}
            </Badge>
          </div>
        </div>
        <CardDescription>{strategy.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">المستويات</p>
            <p className="font-bold">{strategy.settings.numberOfLevels}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">جني الأرباح</p>
            <p className="font-bold text-green-600">
              +{strategy.settings.takeProfitPercentage}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">وقف الخسائر</p>
            <p className="font-bold text-red-600">
              -{strategy.settings.stopLossPercentage}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">الاستثمار الأقصى</p>
            <p className="font-bold">${strategy.settings.maxInvestment}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant={strategy.isActive ? 'destructive' : 'default'}
            size="sm"
            className="flex-1"
            onClick={handleToggleActive}
          >
            {strategy.isActive ? (
              <>
                <Pause className="w-4 h-4 mr-1" />
                إيقاف
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" />
                تشغيل
              </>
            )}
          </Button>
          
          <DCASettingsDialog 
            strategy={strategy}
            onUpdateStrategy={onUpdateStrategy}
          />
          
          <DCABacktestDialog strategyId={strategy.id} />
          
          <Button variant="outline" size="sm" onClick={onClone}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DCAStrategyCard;
