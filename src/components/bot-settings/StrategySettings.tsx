import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UseFormReturn } from 'react-hook-form';
import { BotSettingsForm } from '@/types/botSettings';
import { useTranslation } from 'react-i18next';

interface StrategySettingsProps {
  form: UseFormReturn<BotSettingsForm>;
}

const StrategySettings = ({ form }: StrategySettingsProps) => {
  const { t } = useTranslation('bot_settings');

  const getStrategyDescription = (strategyType: string) => {
    switch (strategyType) {
      case 'basic_dca':
        return t('strategy_details.types.basic_dca.description');
      case 'dca_with_leverage_new':
        return t('strategy_details.types.dca_leverage_new.description');
      case 'dca_with_leverage_modify':
        return t('strategy_details.types.dca_leverage_modify.description');
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('strategy_details.title')}</CardTitle>
        <CardDescription>{t('strategy_details.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="strategy_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('strategy_details.type_label')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('strategy_details.select_placeholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="basic_dca">{t('strategy_details.types.basic_dca.name')}</SelectItem>
                  <SelectItem value="dca_with_leverage_new">{t('strategy_details.types.dca_leverage_new.name')}</SelectItem>
                  <SelectItem value="dca_with_leverage_modify">{t('strategy_details.types.dca_leverage_modify.name')}</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {getStrategyDescription(field.value)}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">{t('strategy_details.explanation_title')}</h4>
          <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
            <p><strong>{t('strategy_details.types.basic_dca.name')}:</strong> {t('strategy_details.explanation.basic_dca')}</p>
            <p><strong>{t('strategy_details.types.dca_leverage_new.name')}:</strong> {t('strategy_details.explanation.dca_leverage_new')}</p>
            <p><strong>{t('strategy_details.types.dca_leverage_modify.name')}:</strong> {t('strategy_details.explanation.dca_leverage_modify')}</p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="dca_levels"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('strategy_details.dca_levels_label')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  min={1}
                  max={10}
                />
              </FormControl>
              <FormDescription>
                {t('strategy_details.dca_levels_desc')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="risk_reward_ratio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('strategy_details.rr_ratio_label')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  min={1}
                  max={5}
                  step={0.1}
                />
              </FormControl>
              <FormDescription>
                {t('strategy_details.rr_ratio_desc', { value: field.value })}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default StrategySettings;
