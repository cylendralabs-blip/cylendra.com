
import { UseFormReturn } from 'react-hook-form';
import { BotSettingsForm } from '@/types/botSettings';
import StrategySelector from './profit-taking/StrategySelector';
import TrailingStopSettings from './profit-taking/TrailingStopSettings';
import PartialProfitSettings from './profit-taking/PartialProfitSettings';
import AdvancedSettings from './profit-taking/AdvancedSettings';

interface ProfitTakingSettingsProps {
  form: UseFormReturn<BotSettingsForm>;
}

const ProfitTakingSettings = ({ form }: ProfitTakingSettingsProps) => {
  const watchProfitStrategy = form.watch('profit_taking_strategy');

  return (
    <div className="space-y-6">
      <StrategySelector form={form} />

      {watchProfitStrategy === 'trailing' && (
        <TrailingStopSettings form={form} />
      )}

      {watchProfitStrategy === 'partial' && (
        <PartialProfitSettings form={form} />
      )}

      <AdvancedSettings form={form} />
    </div>
  );
};

export default ProfitTakingSettings;
