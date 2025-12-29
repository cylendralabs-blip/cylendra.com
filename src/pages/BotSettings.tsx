
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form } from '@/components/ui/form';
import { Bot, DollarSign, Target, AlertTriangle, Settings, Save, Layers, Zap, Trash2, TrendingUp, Trophy, PlayCircle } from 'lucide-react';
import { useBotSettings } from '@/hooks/useBotSettings';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBotStatus } from '@/hooks/useBotControl';
import GeneralSettings from '@/components/bot-settings/GeneralSettings';
import StrategyInstanceSelector from '@/components/bot-settings/StrategyInstanceSelector';
import CapitalSettings from '@/components/bot-settings/CapitalSettings';
import RiskSettings from '@/components/bot-settings/RiskSettings';
import LeverageSettings from '@/components/bot-settings/LeverageSettings';
import TradingDirectionSettings from '@/components/bot-settings/TradingDirectionSettings';
import ProfitTakingSettings from '@/components/bot-settings/ProfitTakingSettings';
import DataCleanup from '@/components/bot-settings/DataCleanup';
import AutoTradingSettings from '@/components/bot-settings/AutoTradingSettings';
import { RiskPresets } from '@/components/bot-settings/RiskPresets';
import { TradeSizePreview } from '@/components/bot-settings/TradeSizePreview';
import { useTranslation } from 'react-i18next';

const BotSettings = () => {
  const { t } = useTranslation('bot_settings');
  const { form, loading, loadingData, onSubmit } = useBotSettings();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [defaultTab, setDefaultTab] = useState<string>('general');
  const [isFormReady, setIsFormReady] = useState(false);

  // Phase X: Handle tab from query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setDefaultTab(tabParam);
      // Remove the query parameter after setting the tab
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Wait for form to be populated with data before showing it
  useEffect(() => {
    if (!loadingData) {
      // Give form time to reset with data
      const timer = setTimeout(() => {
        const defaultPlatform = form.getValues('default_platform');
        const totalCapital = form.getValues('total_capital');
        // Only mark as ready if we have actual data (not just defaults)
        // Check if form has been populated (either has default_platform or total_capital is not default)
        if (defaultPlatform || totalCapital !== 1000) {
          setIsFormReady(true);
        } else {
          // If no data yet, wait a bit more
          setTimeout(() => setIsFormReady(true), 500);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsFormReady(false);
    }
  }, [loadingData, form]);

  const watchIsActive = form.watch('is_active');
  const watchMarketType = form.watch('market_type');
  const watchStrategyType = form.watch('strategy_type');
  const watchLeverageStrategy = form.watch('leverage_strategy');
  const totalCapital = form.watch('total_capital') || 1000;

  // Phase 3: Get actual bot status from backend
  const { data: statusData } = useBotStatus();
  const botStatus: 'STOPPED' | 'RUNNING' | 'PAUSED' | 'ERROR' = statusData?.status || 'STOPPED';

  if (loadingData || !isFormReady) {
    return (
      <main className="p-4 lg:p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Bot className="w-8 h-8 mx-auto mb-4 animate-spin text-accent" />
            <p className="text-gray-600 dark:text-gray-400">
              {loadingData ? t('loading') : t('preparing')}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 lg:p-6 max-w-6xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Bot className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
              <p className="text-gray-600 dark:text-gray-400">{t('subtitle')}</p>
            </div>
          </div>
          <Badge variant={watchIsActive ? "default" : "secondary"} className="px-3 py-1">
            {watchIsActive ? t('status.active') : t('status.stopped')}
          </Badge>
        </div>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // Always allow submission, even if form has validation errors
              // The backend will handle validation
              form.handleSubmit(onSubmit, (errors) => {
                console.warn('Form validation errors (submitting anyway):', errors);
                // Submit anyway - backend validation is more important
                onSubmit(form.getValues());
              })(e);
            }}
            className="space-y-6"
          >
            <Tabs value={defaultTab} onValueChange={setDefaultTab} className="w-full">
              {isMobile ? (
                <TabsList className="grid w-full grid-cols-2 h-auto gap-1 p-1 bg-muted">
                  <TabsTrigger value="general" className="flex flex-col items-center gap-1 py-2 px-2 text-xs">
                    <Settings className="w-4 h-4" />
                    <span>{t('tabs.general')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="strategy" className="flex flex-col items-center gap-1 py-2 px-2 text-xs">
                    <Layers className="w-4 h-4" />
                    <span>{t('tabs.strategy')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="capital" className="flex flex-col items-center gap-1 py-2 px-2 text-xs">
                    <DollarSign className="w-4 h-4" />
                    <span>{t('tabs.capital')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="risk" className="flex flex-col items-center gap-1 py-2 px-2 text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{t('tabs.risk')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="profit" className="flex flex-col items-center gap-1 py-2 px-2 text-xs">
                    <Trophy className="w-4 h-4" />
                    <span>{t('tabs.profit')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="leverage" className="flex flex-col items-center gap-1 py-2 px-2 text-xs">
                    <Zap className="w-4 h-4" />
                    <span>{t('tabs.leverage')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="direction" className="flex flex-col items-center gap-1 py-2 px-2 text-xs">
                    <TrendingUp className="w-4 h-4" />
                    <span>{t('tabs.direction')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="cleanup" className="flex flex-col items-center gap-1 py-2 px-2 text-xs">
                    <Trash2 className="w-4 h-4" />
                    <span>{t('tabs.cleanup')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="auto-trading" className="flex flex-col items-center gap-1 py-2 px-2 text-xs">
                    <PlayCircle className="w-4 h-4" />
                    <span>{t('tabs.auto_trading')}</span>
                  </TabsTrigger>
                </TabsList>
              ) : (
                <TabsList className="grid w-full grid-cols-9">
                  <TabsTrigger value="general" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    {t('tabs.general')}
                  </TabsTrigger>
                  <TabsTrigger value="strategy" className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    {t('tabs.strategy')}
                  </TabsTrigger>
                  <TabsTrigger value="capital" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    {t('tabs.capital')}
                  </TabsTrigger>
                  <TabsTrigger value="risk" className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {t('tabs.risk')}
                  </TabsTrigger>
                  <TabsTrigger value="profit" className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    {t('tabs.profit')}
                  </TabsTrigger>
                  <TabsTrigger value="leverage" className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    {t('tabs.leverage')}
                  </TabsTrigger>
                  <TabsTrigger value="direction" className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    {t('tabs.direction')}
                  </TabsTrigger>
                  <TabsTrigger value="cleanup" className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    {t('tabs.cleanup')}
                  </TabsTrigger>
                  <TabsTrigger value="auto-trading" className="flex items-center gap-2">
                    <PlayCircle className="w-4 h-4" />
                    {t('tabs.auto_trading')}
                  </TabsTrigger>
                </TabsList>
              )}

              <TabsContent value="general">
                <GeneralSettings form={form} />
              </TabsContent>

              <TabsContent value="strategy">
                <StrategyInstanceSelector form={form} botStatus={botStatus} />
              </TabsContent>

              <TabsContent value="capital">
                <CapitalSettings form={form} />
              </TabsContent>

              <TabsContent value="risk" className="space-y-6">
                <RiskPresets
                  form={form}
                  onApply={(preset) => {
                    // Show toast or feedback
                    console.log('Applied preset:', preset);
                  }}
                />
                <RiskSettings form={form} />
              </TabsContent>

              <TabsContent value="profit">
                <ProfitTakingSettings form={form} />
              </TabsContent>

              <TabsContent value="leverage">
                <LeverageSettings
                  form={form}
                  watchStrategyType={watchStrategyType}
                  watchMarketType={watchMarketType}
                  watchLeverageStrategy={watchLeverageStrategy}
                />
              </TabsContent>

              <TabsContent value="direction">
                <TradingDirectionSettings form={form} />
              </TabsContent>

              <TabsContent value="cleanup">
                <DataCleanup />
              </TabsContent>

              <TabsContent value="auto-trading">
                <AutoTradingSettings form={form} />
              </TabsContent>
            </Tabs>

            {/* Preview & Save Section */}
            <div className="space-y-4 pt-6 border-t">
              {/* Trade Size Preview */}
              <TradeSizePreview
                form={form}
                availableBalance={totalCapital}
              />

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Bot className="w-4 h-4 mr-2 animate-spin" />
                      {t('actions.saving')}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {t('actions.save')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
};

export default BotSettings;
