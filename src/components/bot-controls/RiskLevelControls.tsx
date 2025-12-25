import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface RiskLevelControlsProps {
  riskPercentage: number;
  onRiskChange: (level: number) => void;
}

const RiskLevelControls = ({ riskPercentage, onRiskChange }: RiskLevelControlsProps) => {
  const { t } = useTranslation('dashboard');

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{t('bot_control.risk_level')}</span>
      <div className="flex space-x-1 space-x-reverse">
        {[1, 2, 3, 4, 5].map((level) => (
          <Button
            key={level}
            variant={riskPercentage >= level ? "default" : "outline"}
            size="sm"
            onClick={() => onRiskChange(level)}
            className="w-6 h-6 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm"
          >
            {level}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default RiskLevelControls;
