import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UseFormReturn } from 'react-hook-form';
import { BotSettingsForm } from '@/types/botSettings';
import { useTranslation } from 'react-i18next';

interface LeverageSettingsProps {
  form: UseFormReturn<BotSettingsForm>;
  watchStrategyType: string;
  watchMarketType: string;
  watchLeverageStrategy: string;
}

const LeverageSettings = ({
  form,
  watchStrategyType,
  watchMarketType,
  watchLeverageStrategy
}: LeverageSettingsProps) => {
  const { t } = useTranslation('bot_settings');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('leverage.title')}</CardTitle>
        <CardDescription>{t('leverage.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {(watchStrategyType === 'dca_with_leverage_new' || watchStrategyType === 'dca_with_leverage_modify') && (
          <>
            <FormField
              control={form.control}
              name="leverage_strategy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('leverage.strategy')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('leverage.strategy_placeholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">{t('leverage.none')}</SelectItem>
                      <SelectItem value="manual">{t('leverage.manual')}</SelectItem>
                      <SelectItem value="auto">{t('leverage.auto')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('leverage.strategy_desc')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchLeverageStrategy !== 'none' && (
              <>
                <FormField
                  control={form.control}
                  name="leverage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('leverage.basic_leverage')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          min={1}
                          max={125}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('leverage.basic_leverage_desc')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="auto_leverage"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">{t('leverage.auto_leverage')}</FormLabel>
                        <FormDescription>
                          {t('leverage.auto_leverage_desc')}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_leverage_increase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('leverage.max_increase')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          min={1}
                          max={10}
                          step={0.1}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('leverage.max_increase_desc')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </>
        )}

        {watchMarketType === 'futures' && watchStrategyType === 'basic_dca' && (
          <FormField
            control={form.control}
            name="leverage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('leverage.leverage_label')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    min={1}
                    max={125}
                  />
                </FormControl>
                <FormDescription>
                  {t('leverage.leverage_desc')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {(watchStrategyType === 'basic_dca' || watchLeverageStrategy === 'none') && (
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">{t('leverage.safe_title')}</h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              {t('leverage.safe_desc')}
            </p>
          </div>
        )}

        {(watchStrategyType !== 'basic_dca' && watchLeverageStrategy !== 'none') && (
          <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
            <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">{t('leverage.warning_title')}</h4>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              {t('leverage.warning_desc')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeverageSettings;
