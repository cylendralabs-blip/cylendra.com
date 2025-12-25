import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UseFormReturn } from 'react-hook-form';
import { BotSettingsForm } from '@/types/botSettings';
import { Target, TrendingUp, Shield, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StrategySelectorProps {
  form: UseFormReturn<BotSettingsForm>;
}

const StrategySelector = ({ form }: StrategySelectorProps) => {
  const { t } = useTranslation('bot_settings');
  const watchProfitStrategy = form.watch('profit_taking_strategy');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-accent" />
          {t('profit_taking.title')}
        </CardTitle>
        <CardDescription>{t('profit_taking.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="profit_taking_strategy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('profit_taking.strategy_type')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('profit_taking.strategy_placeholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="fixed">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      {t('profit_taking.strategies.fixed.name')}
                    </div>
                  </SelectItem>
                  <SelectItem value="trailing">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      {t('profit_taking.strategies.trailing.name')}
                    </div>
                  </SelectItem>
                  <SelectItem value="partial">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      {t('profit_taking.strategies.partial.name')}
                    </div>
                  </SelectItem>
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      {t('profit_taking.strategies.custom.name')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {t(`profit_taking.strategies.${watchProfitStrategy}.description`)}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <Badge variant="outline" className="mb-2">
            {t(`profit_taking.strategies.${watchProfitStrategy}.short_desc`)}
          </Badge>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {t(`profit_taking.strategies.${watchProfitStrategy}.badge`)}
          </p>
        </div>

        <FormField
          control={form.control}
          name="min_profit_threshold"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('profit_taking.min_profit')}</FormLabel>
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
                {t('profit_taking.min_profit_desc')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default StrategySelector;
