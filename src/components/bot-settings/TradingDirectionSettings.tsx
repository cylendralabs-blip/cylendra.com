import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UseFormReturn } from 'react-hook-form';
import { BotSettingsForm } from '@/types/botSettings';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TradingDirectionSettingsProps {
  form: UseFormReturn<BotSettingsForm>;
}

const TradingDirectionSettings = ({ form }: TradingDirectionSettingsProps) => {
  const { t } = useTranslation('bot_settings');
  const watchMarketType = form.watch('market_type');
  const watchAllowShort = form.watch('allow_short_trades');
  const watchAllowLong = form.watch('allow_long_trades');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          {t('direction.title')}
        </CardTitle>
        <CardDescription>
          {t('direction.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {watchMarketType === 'futures' && (
          <>
            <FormField
              control={form.control}
              name="default_trade_direction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('direction.default')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('direction.default_placeholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="long">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          {t('direction.long_label')}
                        </div>
                      </SelectItem>
                      <SelectItem value="short">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="w-4 h-4 text-red-500" />
                          {t('direction.short_label')}
                        </div>
                      </SelectItem>
                      <SelectItem value="both">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-blue-500" />
                          {t('direction.both_label')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('direction.default_desc')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="allow_long_trades"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        {t('direction.allow_long')}
                      </FormLabel>
                      <FormDescription>
                        {t('direction.allow_long_desc')}
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
                name="allow_short_trades"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        {t('direction.allow_short')}
                      </FormLabel>
                      <FormDescription>
                        {t('direction.allow_short_desc')}
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
            </div>

            {!watchAllowLong && !watchAllowShort && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {t('direction.warning_one_required')}
                </p>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">{t('direction.info_title')}</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• {t('direction.info_long')}</li>
                <li>• {t('direction.info_short')}</li>
                <li>• {t('direction.info_futures_only')}</li>
                <li>• {t('direction.info_market_analysis')}</li>
              </ul>
            </div>
          </>
        )}

        {watchMarketType === 'spot' && (
          <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg border">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('direction.spot_info')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradingDirectionSettings;
