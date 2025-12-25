import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UseFormReturn } from 'react-hook-form';
import { BotSettingsForm } from '@/types/botSettings';
import { Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PartialProfitSettingsProps {
  form: UseFormReturn<BotSettingsForm>;
}

const PartialProfitSettings = ({ form }: PartialProfitSettingsProps) => {
  const { t } = useTranslation('bot_settings');

  const renderLevel = (number: number, levelName: string, percentageName: string, minProfit: number, maxProfit: number) => (
    <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
      <div className="col-span-2">
        <h4 className="font-medium text-sm mb-2">{t('profit_taking.partial.level', { number })}</h4>
      </div>
      <FormField
        control={form.control}
        name={levelName as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('profit_taking.partial.profit_pct')}</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
                min={minProfit}
                max={maxProfit}
                step={0.1}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={percentageName as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('profit_taking.partial.close_pct')}</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
                min={10}
                max={100}
                step={5}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          {t('profit_taking.partial.title')}
        </CardTitle>
        <CardDescription>{t('profit_taking.partial.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderLevel(1, 'partial_tp_level_1', 'partial_tp_percentage_1', 0.5, 20)}
        {renderLevel(2, 'partial_tp_level_2', 'partial_tp_percentage_2', 0.5, 30)}
        {renderLevel(3, 'partial_tp_level_3', 'partial_tp_percentage_3', 0.5, 50)}
        {renderLevel(4, 'partial_tp_level_4', 'partial_tp_percentage_4', 0.5, 100)}
      </CardContent>
    </Card>
  );
};

export default PartialProfitSettings;
