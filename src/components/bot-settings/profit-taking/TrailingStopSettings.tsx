import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UseFormReturn } from 'react-hook-form';
import { BotSettingsForm } from '@/types/botSettings';
import { TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TrailingStopSettingsProps {
  form: UseFormReturn<BotSettingsForm>;
}

const TrailingStopSettings = ({ form }: TrailingStopSettingsProps) => {
  const { t } = useTranslation('bot_settings');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          {t('profit_taking.trailing.title')}
        </CardTitle>
        <CardDescription>{t('profit_taking.trailing.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="trailing_stop_activation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('profit_taking.trailing.activation')}</FormLabel>
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
                {t('profit_taking.trailing.activation_desc')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="trailing_stop_distance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('profit_taking.trailing.distance')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  min={0.5}
                  max={10}
                  step={0.1}
                />
              </FormControl>
              <FormDescription>
                {t('profit_taking.trailing.distance_desc')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default TrailingStopSettings;
