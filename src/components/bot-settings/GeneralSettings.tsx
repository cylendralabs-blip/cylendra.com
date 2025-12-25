import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UseFormReturn } from 'react-hook-form';
import { BotSettingsForm } from '@/types/botSettings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import * as React from 'react';
import { useUserPlan } from '@/hooks/useUserPlan';
import { canUseFeature } from '@/core/plans/planManager';
import { FeatureLock } from '@/components/plans/FeatureLock';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface GeneralSettingsProps {
  form: UseFormReturn<BotSettingsForm>;
}

interface ApiKey {
  id: string;
  platform: string;
  is_active: boolean;
  testnet: boolean;
}

const GeneralSettings = ({ form }: GeneralSettingsProps) => {
  const { t } = useTranslation('bot_settings');
  const { user } = useAuth();
  const { data: userPlan } = useUserPlan();
  const watchDefaultPlatform = form.watch('default_platform');
  const watchIsActive = form.watch('is_active');
  const watchMarketType = form.watch('market_type');
  const watchSignalSource = form.watch('signal_source');

  // Phase X.10: Check feature access
  const [canUseBots, setCanUseBots] = React.useState<boolean | null>(null);
  const [canUseFutures, setCanUseFutures] = React.useState<boolean | null>(null);
  const [canUseRealtimeAi, setCanUseRealtimeAi] = React.useState<boolean | null>(null);

  useEffect(() => {
    if (user?.id && userPlan) {
      canUseFeature(user.id, 'bots.enabled').then(setCanUseBots);
      canUseFeature(user.id, 'bots.futures').then(setCanUseFutures);
      canUseFeature(user.id, 'ai.live_center').then(setCanUseRealtimeAi);
    }
  }, [user?.id, userPlan]);

  // Disable bot activation if not allowed
  useEffect(() => {
    if (canUseBots === false && watchIsActive) {
      form.setValue('is_active', false);
    }
  }, [canUseBots, watchIsActive, form]);

  const { data: apiKeys = [] } = useQuery({
    queryKey: ['api-keys', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, platform, is_active, testnet')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      return data as ApiKey[];
    },
    enabled: !!user,
  });

  // Ensure the form value is set correctly when apiKeys are loaded
  useEffect(() => {
    if (apiKeys.length > 0 && !watchDefaultPlatform) {
      // If no platform is selected but there are available platforms, don't auto-select
      console.log('API keys loaded:', apiKeys);
      console.log('Current default_platform value:', watchDefaultPlatform);
    }

    // Log when default_platform changes
    console.log('default_platform changed:', watchDefaultPlatform);
  }, [apiKeys, watchDefaultPlatform]);

  const getPlatformDisplayName = (platform: string, testnet: boolean) => {
    const platformNames: { [key: string]: string } = {
      'binance': t('general.platforms.binance_live'),
      'binance-demo': t('general.platforms.binance_demo'),
      'binance-spot-testnet': t('general.platforms.binance_spot_testnet'),
      'binance-futures-testnet': t('general.platforms.binance_futures_testnet'),
      'okx': t('general.platforms.okx'),
      'okx-demo': t('general.platforms.okx_demo'),
      'bybit': t('general.platforms.bybit_live'),
      'bybit-testnet': t('general.platforms.bybit_testnet'),
      'kucoin': t('general.platforms.kucoin')
    };

    return platformNames[platform] || platform.toUpperCase() + (testnet ? ` ${t('general.platforms.demo_suffix')}` : '');
  };

  // Find the selected platform info for display
  const selectedPlatformInfo = apiKeys.find(key => key.id === watchDefaultPlatform);

  // التحقق من أن المنصة المختارة هي Binance Demo Trading
  const isBinanceDemo = selectedPlatformInfo?.platform === 'binance-demo' ||
    selectedPlatformInfo?.platform === 'binance-futures-testnet';

  // Phase X.10: Show feature lock if bots are not enabled
  if (canUseBots === false) {
    return (
      <FeatureLock
        featureName={t('general.feature_locked.title')}
        requiredPlan="BASIC"
        currentPlan={userPlan?.code}
        description={t('general.feature_locked.description')}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('general.title')}</CardTitle>
        <CardDescription>{t('general.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="bot_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('general.bot_name')}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t('general.bot_name_placeholder')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="default_platform"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('general.default_platform')}</FormLabel>
              <Select
                onValueChange={(value) => {
                  console.log('Platform selected:', value);
                  // Ensure value is saved as string, not empty string if cleared
                  field.onChange(value === 'no-keys' ? '' : value);
                  // Trigger form validation
                  form.trigger('default_platform');
                }}
                value={field.value || ''}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('general.select_platform')}>
                      {selectedPlatformInfo ?
                        getPlatformDisplayName(selectedPlatformInfo.platform, selectedPlatformInfo.testnet) :
                        t('general.select_platform')
                      }
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {apiKeys.length === 0 ? (
                    <SelectItem value="no-keys" disabled>
                      {t('general.no_api_keys')}
                    </SelectItem>
                  ) : (
                    apiKeys.map((key) => (
                      <SelectItem key={key.id} value={key.id}>
                        {getPlatformDisplayName(key.platform, key.testnet)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                {t('general.platform_description')}
              </FormDescription>
              {selectedPlatformInfo && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                  {t('general.selected_platform')} {getPlatformDisplayName(selectedPlatformInfo.platform, selectedPlatformInfo.testnet)}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="signal_source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('general.signal_source')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('general.select_source')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ai">🔥 AI Ultra Signals</SelectItem>
                  <SelectItem
                    value="realtime_ai"
                    disabled={canUseRealtimeAi === false}
                  >
                    ⚡ AI Real-Time Stream
                    {canUseRealtimeAi === false && ' (يتطلب PREMIUM)'}
                  </SelectItem>
                  <SelectItem value="tradingview">📡 TradingView Webhooks</SelectItem>
                  <SelectItem value="legacy">⚙️ Legacy Local Engine</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {t('general.source_description')}
              </FormDescription>
              {canUseRealtimeAi === false && (watchSignalSource as string) === 'realtime_ai' && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t('general.realtime_ai_required')}
                  </AlertDescription>
                </Alert>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">{t('general.bot_activation')}</FormLabel>
                <FormDescription>
                  {t('general.bot_activation_desc')}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={!canUseBots}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="market_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('general.market_type')}</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={canUseFutures === false && field.value === 'futures'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('general.select_market')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="spot">
                    {t('general.spot')}
                  </SelectItem>
                  <SelectItem
                    value="futures"
                    disabled={canUseFutures === false}
                  >
                    {t('general.futures')}
                    {canUseFutures === false && ' (يتطلب PREMIUM)'}
                  </SelectItem>
                </SelectContent>
              </Select>
              {isBinanceDemo && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Binance Demo Trading (demo.binance.com) يدعم Spot و Futures.
                  </AlertDescription>
                </Alert>
              )}
              {canUseFutures === false && !isBinanceDemo && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t('general.futures_required')}
                  </AlertDescription>
                </Alert>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="order_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('general.entry_type')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('general.select_entry')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="market">{t('general.market_order')}</SelectItem>
                  <SelectItem value="limit">{t('general.limit_order')}</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {t('general.entry_description')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default GeneralSettings;
