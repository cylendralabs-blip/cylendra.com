import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { BotSettingsForm } from '@/types/botSettings';
import { useTranslation } from 'react-i18next';

interface CapitalFormFieldsProps {
  form: UseFormReturn<BotSettingsForm>;
}

const CapitalFormFields = ({ form }: CapitalFormFieldsProps) => {
  const { t } = useTranslation('bot_settings');

  return (
    <>
      <FormField
        control={form.control}
        name="risk_percentage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('capital.form.risk_percentage')}</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
                placeholder={t('capital.form.placeholders.risk')}
                min="0.1"
                max="10"
                step="0.1"
              />
            </FormControl>
            <FormDescription>
              {t('capital.form.risk_desc')}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="initial_order_percentage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('capital.form.initial_percentage')}</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
                placeholder={t('capital.form.placeholders.initial')}
                min="10"
                max="100"
                step="1"
              />
            </FormControl>
            <FormDescription>
              {t('capital.form.initial_desc')}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="max_active_trades"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('capital.form.max_trades')}</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
                placeholder={t('capital.form.placeholders.max')}
                min="1"
                max="20"
              />
            </FormControl>
            <FormDescription>
              {t('capital.form.max_trades_desc')}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default CapitalFormFields;
