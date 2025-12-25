
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  BarChart3,
  Settings,
  TrendingUp,
  Webhook,
  Zap,
  Signal
} from 'lucide-react';
import TradingViewSignalsTable from '@/components/tradingview/TradingViewSignalsTable';
import TradingViewSettings from '@/components/tradingview/TradingViewSettings';
import TestSignalButton from '@/components/tradingview/TestSignalButton';
import SignalExecutionModal from '@/components/signals/SignalExecutionModal';
import { useTradingViewSignals } from '@/hooks/useTradingViewSignals';
import { TradingViewSignal } from '@/types/tradingview';
import { TradingSignal } from '@/types/signals';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';

const TradingView = () => {
  const { t } = useTranslation('tradingview');
  const [selectedSignal, setSelectedSignal] = useState<TradingSignal | null>(null);
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
  const isMobile = useIsMobile();

  const {
    signals,
    settings,
    performance,
    isLoading,
    saveSettings,
    updateSignal,
    cleanupSignals,
    deleteSignal,
    isSavingSettings,
    isCleaningUp,
  } = useTradingViewSignals();

  const handleSignalExecution = (signal: TradingViewSignal) => {
    console.log('🎯 تنفيذ إشارة TradingView:', signal);

    // تحويل إشارة TradingView إلى إشارة عادية للتوافق مع نافذة التنفيذ
    const tradingSignal: TradingSignal = {
      id: signal.id,
      user_id: signal.user_id,
      symbol: signal.symbol,
      timeframe: signal.timeframe,
      signal_type: signal.signal_type,
      signal_strength: signal.signal_strength,
      confirmations: [],
      confidence_score: signal.confidence_score,
      entry_price: signal.entry_price,
      stop_loss_price: signal.stop_loss_price,
      take_profit_price: signal.take_profit_price,
      risk_reward_ratio: signal.risk_reward_ratio,
      technical_analysis: signal.technical_indicators,
      volume_analysis: {},
      pattern_analysis: {},
      ai_analysis: {},
      sentiment_analysis: signal.market_conditions,
      expires_at: signal.expires_at,
      triggered_at: signal.triggered_at,
      profit_loss_percentage: signal.profit_loss_percentage,
      created_at: signal.created_at,
      updated_at: signal.updated_at,
      live_price_timestamp: signal.created_at,
      price_validation: {},
      status: signal.status,
      result: signal.result,
      price_source: 'tradingview',
    };

    setSelectedSignal(tradingSignal);
    setIsExecutionModalOpen(true);
  };

  const handleExecuteTrade = (tradeData: any) => {
    console.log('🚀 تنفيذ صفقة TradingView:', tradeData);

    // تحديث حالة الإشارة إلى "تم التفعيل"
    if (selectedSignal) {
      updateSignal(selectedSignal.id, {
        status: 'TRIGGERED',
        triggered_at: new Date().toISOString(),
      });
    }

    setIsExecutionModalOpen(false);
  };

  return (
    <div className="container mx-auto p-3 md:p-6">
      {/* العنوان الرئيسي */}
      <div className="mb-6 md:mb-8">
        <h1 className={`font-bold mb-3 flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 text-foreground ${isMobile ? 'text-2xl' : 'text-4xl'
          }`}>
          <div className="flex items-center gap-2">
            <Signal className={`text-indigo-600 ${isMobile ? 'w-6 h-6' : 'w-10 h-10'}`} />
            <span>{t('title')}</span>
          </div>
          <span className={`bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1 md:px-4 md:py-2 rounded-lg shadow-lg ${isMobile ? 'text-sm self-start' : 'text-lg'
            }`}>
            {t('automated')}
          </span>
        </h1>
        <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-lg'}`}>
          {t('subtitle')}
        </p>
      </div>

      {/* معلومات النظام */}
      <Card className="mb-6 md:mb-8 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
        <CardHeader className={isMobile ? 'p-4' : ''}>
          <CardTitle className={`flex items-center gap-2 text-foreground ${isMobile ? 'text-lg' : ''}`}>
            <Activity className={`text-indigo-600 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
            <span>{t('system_status.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'p-4 pt-0' : ''}>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-muted-foreground">{t('system_status.status')}</span>
              <Badge variant={settings?.is_enabled ? "default" : "secondary"}>
                {settings?.is_enabled ? t('system_status.enabled') : t('system_status.disabled')}
              </Badge>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-muted-foreground">{t('system_status.total_signals')}</span>
              <span className="font-bold text-lg">{performance?.total_signals || 0}</span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-muted-foreground">{t('system_status.win_rate')}</span>
              <span className="font-bold text-lg text-green-600">
                {performance?.win_rate?.toFixed(1) || 0}%
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-muted-foreground">{t('system_status.total_pnl')}</span>
              <span className={`font-bold text-lg ${(performance?.total_pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                {performance?.total_pnl?.toFixed(2) || 0}%
              </span>
            </div>
          </div>

          {/* أزرار الاختبار والمساعدة */}
          <div className="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-800">
            <div className="flex flex-wrap gap-2">
              <TestSignalButton />
              <Card className="flex-1 p-3 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  <strong>{t('system_status.tip')}</strong> {t('system_status.test_tip')}
                </p>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* التبويبات الرئيسية */}
      <Tabs defaultValue="signals" className="space-y-4 md:space-y-6">
        <TabsList className={`w-full ${isMobile ? 'h-auto p-1 grid-cols-2 gap-1' : 'grid-cols-3 h-14'}`}>
          <TabsTrigger
            value="signals"
            className={`flex items-center gap-1 md:gap-2 ${isMobile ? 'text-xs px-2 py-3 flex-col h-auto' : 'text-base'
              }`}
          >
            <BarChart3 className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
            <span>{t('tabs.signals')}</span>
          </TabsTrigger>
          <TabsTrigger
            value="performance"
            className={`flex items-center gap-1 md:gap-2 ${isMobile ? 'text-xs px-2 py-3 flex-col h-auto' : 'text-base'
              }`}
          >
            <TrendingUp className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
            <span>{t('tabs.performance')}</span>
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className={`flex items-center gap-1 md:gap-2 ${isMobile ? 'text-xs px-2 py-3 flex-col h-auto col-span-2' : 'text-base'
              }`}
          >
            <Settings className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
            <span>{t('tabs.settings')}</span>
          </TabsTrigger>
        </TabsList>

        {/* تبويب الإشارات */}
        <TabsContent value="signals" className="space-y-4 md:space-y-6">
          <TradingViewSignalsTable
            signals={signals}
            onSignalExecution={handleSignalExecution}
            onDeleteSignal={deleteSignal}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* تبويب الأداء */}
        <TabsContent value="performance" className="space-y-4 md:space-y-6">
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* إحصائيات الأداء العامة */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('performance.general_stats')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('performance.total_signals')}:</span>
                  <span className="font-medium">{performance?.total_signals || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('performance.successful_signals')}:</span>
                  <span className="font-medium text-green-600">{performance?.successful_signals || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('performance.failed_signals')}:</span>
                  <span className="font-medium text-red-600">{performance?.failed_signals || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('performance.pending_signals')}:</span>
                  <span className="font-medium text-yellow-600">{performance?.pending_signals || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* الأداء المالي */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('performance.financial_performance')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('performance.win_rate')}:</span>
                  <span className="font-medium">{performance?.win_rate?.toFixed(1) || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('performance.avg_profit')}:</span>
                  <span className="font-medium text-green-600">{performance?.average_profit?.toFixed(2) || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('performance.avg_loss')}:</span>
                  <span className="font-medium text-red-600">{performance?.average_loss?.toFixed(2) || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('performance.total_pnl')}:</span>
                  <span className={`font-medium ${(performance?.total_pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {performance?.total_pnl?.toFixed(2) || 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* الأداء حسب التايم فريم */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('performance.by_timeframe')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {performance?.by_timeframe && Object.entries(performance.by_timeframe).map(([timeframe, count]) => (
                    <div key={timeframe} className="flex justify-between">
                      <span className="text-muted-foreground">{timeframe}:</span>
                      <span className="font-medium">{String(count)}</span>
                    </div>
                  ))}
                  {(!performance?.by_timeframe || Object.keys(performance.by_timeframe).length === 0) && (
                    <p className="text-muted-foreground text-sm">{t('performance.no_data')}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* الأداء حسب الاستراتيجية */}
          {performance?.by_strategy && Object.keys(performance.by_strategy).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('performance.by_strategy')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {Object.entries(performance.by_strategy).map(([strategy, count]) => (
                    <div key={strategy} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="font-medium">{strategy}</span>
                      <span className="text-muted-foreground">{t('performance.strategy_count', { count: Number(count) })}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* تبويب الإعدادات */}
        <TabsContent value="settings" className="space-y-4 md:space-y-6">
          <TradingViewSettings
            settings={settings}
            onSave={saveSettings}
            onCleanup={() => {
              // Use default cleanup: 30 days for all timeframes
              if (settings) {
                cleanupSignals({ days: 30 });
              }
            }}
            isSaving={isSavingSettings}
            isCleaningUp={isCleaningUp}
          />
        </TabsContent>
      </Tabs>

      {/* نافذة تنفيذ الصفقات */}
      <SignalExecutionModal
        signal={selectedSignal}
        open={isExecutionModalOpen && !!selectedSignal}
        onOpenChange={setIsExecutionModalOpen}
        onExecute={handleExecuteTrade}
      />
    </div>
  );
};

export default TradingView;
