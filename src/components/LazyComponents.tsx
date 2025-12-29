
import { lazy } from 'react';
import PageSkeleton from '@/components/loading/PageSkeleton';
import { withSuspense } from '@/components/utils/withSuspense';

// Lazy loading للمكونات الثقيلة مع Suspense محسن
export const LazyTradingChart = lazy(() => import('./TradingChart'));
export const LazyPerformanceCharts = lazy(() => import('./performance/PerformanceCharts'));
export const LazySmartTradeInterface = lazy(() => import('./smart-trade/SmartTradeInterface'));
export const LazyStrategies = lazy(() => import('./strategies/DCAStrategies'));

// إضافة المكونات المفقودة مع تصدير صحيح وSuspense
export const LazyIndex = lazy(() => import('@/pages/Index'));
export const LazyAuth = lazy(() => import('@/pages/Auth'));
export const LazyBotSettings = lazy(() => import('@/pages/BotSettings'));
export const LazyExecuteTrade = lazy(() => import('@/pages/ExecuteTrade'));
export const LazyTradingHistory = lazy(() => import('@/pages/TradingHistory'));
export const LazyPerformance = lazy(() => import('@/pages/Performance'));
export const LazyPortfolio = lazy(() => import('@/pages/Portfolio'));
export const LazySmartTrade = lazy(() => import('@/pages/SmartTrade'));
export const LazyApiSettings = lazy(() => import('@/pages/ApiSettings'));
export const LazySettings = lazy(() => import('@/pages/Settings'));
export const LazyProfile = lazy(() => import('@/pages/Profile'));
export const LazyAdvancedAnalytics = lazy(() => import('@/pages/AdvancedAnalytics'));
export const LazySignals = lazy(() => import('@/pages/Signals'));

// مكونات Loading محسنة لكل نوع صفحة
export const ChartLoadingSkeleton = () => (
  <PageSkeleton type="dashboard" />
);

export const TableLoadingSkeleton = () => (
  <PageSkeleton type="table" />
);

export const FormLoadingSkeleton = () => (
  <PageSkeleton type="form" />
);

export const SettingsLoadingSkeleton = () => (
  <PageSkeleton type="settings" />
);

// مكونات محسنة مع Suspense
export const SuspenseIndex = withSuspense(LazyIndex, <PageSkeleton type="dashboard" />);
export const SuspenseSettings = withSuspense(LazySettings, <PageSkeleton type="settings" />);
export const SuspenseTradingHistory = withSuspense(LazyTradingHistory, <PageSkeleton type="table" />);
export const SuspenseBotSettings = withSuspense(LazyBotSettings, <PageSkeleton type="form" />);
export const SuspensePerformance = withSuspense(LazyPerformance, <PageSkeleton type="dashboard" />);
export const SuspensePortfolio = withSuspense(LazyPortfolio, <PageSkeleton type="dashboard" />);
export const SuspenseSmartTrade = withSuspense(LazySmartTrade, <PageSkeleton type="form" />);
export const SuspenseApiSettings = withSuspense(LazyApiSettings, <PageSkeleton type="settings" />);
export const SuspenseProfile = withSuspense(LazyProfile, <PageSkeleton type="form" />);
export const SuspenseAdvancedAnalytics = withSuspense(LazyAdvancedAnalytics, <PageSkeleton type="dashboard" />);
export const SuspenseSignals = withSuspense(LazySignals, <PageSkeleton type="table" />);
