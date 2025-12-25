import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { UseFormReturn } from 'react-hook-form';
import { BotSettingsForm } from '@/types/botSettings';
import { Shield, RotateCcw, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AdvancedSettingsProps {
  form: UseFormReturn<BotSettingsForm>;
}

const AdvancedSettings = ({ form }: AdvancedSettingsProps) => {
  const { t } = useTranslation('bot_settings');
  const watchCapitalProtection = form.watch('capital_protection_enabled');
  const watchAutoReentry = form.watch('auto_reentry_enabled');
  const watchDynamicTP = form.watch('dynamic_tp_enabled');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          {t('profit_taking.advanced.title')}
        </CardTitle>
        <CardDescription>{t('profit_taking.advanced.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* تأمين رأس المال */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <FormLabel>{t('profit_taking.advanced.capital_protection')}</FormLabel>
            <FormDescription>
              {t('profit_taking.advanced.capital_protection_desc')}
            </FormDescription>
          </div>
          <FormField
            control={form.control}
            name="capital_protection_enabled"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {watchCapitalProtection && (
          <FormField
            control={form.control}
            name="capital_protection_profit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('profit_taking.advanced.protection_profit')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    min={1}
                    max={20}
                    step={0.5}
                  />
                </FormControl>
                <FormDescription>
                  {t('profit_taking.advanced.protection_profit_desc')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Separator />

        {/* إعادة الدخول التلقائي */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <FormLabel className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              {t('profit_taking.advanced.auto_reentry')}
            </FormLabel>
            <FormDescription>
              {t('profit_taking.advanced.auto_reentry_desc')}
            </FormDescription>
          </div>
          <FormField
            control={form.control}
            name="auto_reentry_enabled"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* جني الأرباح الديناميكي */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <FormLabel className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              {t('profit_taking.advanced.dynamic_tp')}
            </FormLabel>
            <FormDescription>
              {t('profit_taking.advanced.dynamic_tp_desc')}
            </FormDescription>
          </div>
          <FormField
            control={form.control}
            name="dynamic_tp_enabled"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {(watchCapitalProtection || watchAutoReentry || watchDynamicTP) && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {t('profit_taking.advanced.active_badge')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedSettings;
