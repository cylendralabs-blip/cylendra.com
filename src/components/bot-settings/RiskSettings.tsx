import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { UseFormReturn } from 'react-hook-form';
import { BotSettingsForm } from '@/types/botSettings';
import { AlertTriangle, Calculator } from 'lucide-react';
import { FieldTooltip } from '@/components/common/FieldTooltip';
import { useTranslation } from 'react-i18next';

interface RiskSettingsProps {
  form: UseFormReturn<BotSettingsForm>;
}

const RiskSettings = ({ form }: RiskSettingsProps) => {
  const { t } = useTranslation('bot_settings');
  const watchStopLossMethod = form.watch('stop_loss_calculation_method');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          {t('risk.title')}
        </CardTitle>
        <CardDescription>{t('risk.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="risk_percentage"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormLabel>{t('risk.risk_percentage')}</FormLabel>
                <FieldTooltip content={t('risk.risk_tooltip')} />
              </div>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  min={0.1}
                  max={10}
                  step={0.1}
                />
              </FormControl>
              <FormDescription>
                {t('risk.risk_desc')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <FormField
          control={form.control}
          name="stop_loss_calculation_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                {t('risk.sl_method')}
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('risk.sl_method_placeholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="initial_entry">
                    {t('risk.initial_entry')}
                  </SelectItem>
                  <SelectItem value="average_position">
                    {t('risk.average_position')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {watchStopLossMethod === 'initial_entry'
                  ? t('risk.sl_method_desc_fixed')
                  : t('risk.sl_method_desc_dynamic')
                }
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="stop_loss_percentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('risk.sl_percentage')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  min={0.5}
                  max={20}
                  step={0.1}
                />
              </FormControl>
              <FormDescription>
                {watchStopLossMethod === 'initial_entry'
                  ? t('risk.sl_desc_fixed')
                  : t('risk.sl_desc_dynamic')
                }
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            {watchStopLossMethod === 'initial_entry' ? t('risk.fixed_method') : t('risk.dynamic_method')}
          </h4>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            {watchStopLossMethod === 'initial_entry'
              ? t('risk.fixed_example')
              : t('risk.dynamic_example')
            }
          </p>
        </div>

        <FormField
          control={form.control}
          name="risk_reward_ratio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('risk.rr_ratio')}</FormLabel>
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
                {t('risk.rr_desc', { value: field.value })}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default RiskSettings;
