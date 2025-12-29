/**
 * Dashboard Page
 * 
 * Main dashboard with portfolio metrics, open positions, recent signals/trades, and alerts
 * 
 * Phase 10: UI/UX Improvement - Task 2
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import BotControls from '@/components/BotControls';
import { MetricsBar } from '@/components/dashboard/MetricsBar';
import { OpenPositionsSummary } from '@/components/dashboard/OpenPositionsSummary';
import { LiveTradingFeed } from '@/components/dashboard/LiveTradingFeed';
import PortfolioChart from '@/components/dashboard/PortfolioChart';
import { RealtimeStatusIndicator } from '@/components/dashboard/RealtimeStatusIndicator';
import { LivePriceTicker } from '@/components/dashboard/LivePriceTicker';
import { DashboardAdvancedSection } from '@/components/dashboard/DashboardAdvancedSection';
import { DashboardAlertsPreview } from '@/components/dashboard/DashboardAlertsPreview';
import { AiRiskInsightsCard } from '@/components/ai/AiRiskInsightsCard';
import { AiChatWidget } from '@/components/ai/AiChatWidget';
import { useRealtimeTradeUpdates } from '@/hooks/useRealtimeTradeUpdates';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

const Index = memo(() => {
  const { t } = useTranslation('dashboard');
  // Enable realtime updates
  useRealtimeTradeUpdates();

  // Phase Admin B: Check feature flags
  const { data: aiAssistantEnabled = true } = useFeatureFlag('ai_assistant');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('welcome')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RealtimeStatusIndicator />
        </div>
      </div>

      {/* Live Price Ticker */}
      <LivePriceTicker />

      {/* Top Metrics Bar */}
      <MetricsBar />

      {/* Bot Controls */}
      <BotControls />

      {/* Open Positions - Full Width */}
      <div className="w-full">
        <OpenPositionsSummary />
      </div>

      {/* Portfolio Chart & Live Trading Feed - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Chart */}
        <div className="w-full">
          <PortfolioChart />
        </div>

        {/* Live Trading Feed */}
        <div className="w-full">
          <LiveTradingFeed />
        </div>
      </div>

      {/* Bottom Row - Alerts, Advanced Section & AI Risk Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Alerts Preview */}
        <DashboardAlertsPreview />

        {/* Advanced Metrics */}
        <DashboardAdvancedSection />

        {/* AI Risk Insights */}
        <AiRiskInsightsCard />
      </div>

      {/* AI Chat Widget (Floating) - Phase Admin B: Only show if feature is enabled */}
      {aiAssistantEnabled && <AiChatWidget />}
    </div >
  );
});

Index.displayName = 'DashboardIndex';

export default Index;
