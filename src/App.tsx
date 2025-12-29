import { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthProvider from "./contexts/AuthProvider";
import Layout from "./components/Layout";
import MarketingLayout from "./components/marketing/MarketingLayout";
import AdminLayout from "./components/admin/AdminLayout";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminLogin from "./pages/AdminLogin";
import DebugUser from "./pages/DebugUser";
import Profile from "./pages/Profile";
import ExecuteTrade from "./pages/ExecuteTrade";
import TradingHistory from "./pages/TradingHistory";
import AutoTradeHistory from "./pages/AutoTradeHistory";
import Strategies from "./pages/Strategies";
import StrategiesInfo from "./pages/StrategiesInfo";
import About from "./pages/About";
import Pricing from "./pages/Pricing";
import Subscription from "./pages/Subscription";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import AITechnology from "./pages/AITechnology";
import SupportedExchanges from "./pages/SupportedExchanges";
import Blog from "./pages/Blog";
import TradingAcademy from "./pages/TradingAcademy";
import Community from "./pages/Community";
import Roadmap from "./pages/Roadmap";
import BotSettings from "./pages/BotSettings";
import ApiSettings from "./pages/ApiSettings";
import Settings from "./pages/Settings";
import Signals from "./pages/Signals";
import TradingView from "./pages/TradingView";
import UltraSignalsLive from "./pages/UltraSignalsLive";
import UltraSignalsHistory from "./pages/UltraSignalsHistory";
import IndicatorSettings from "./pages/IndicatorSettings";
import IndicatorWeights from "./pages/IndicatorWeights";
import AILiveCenter from "./pages/AILiveCenter";
import SmartTrade from "./pages/SmartTrade";
import Portfolio from "./pages/Portfolio";
import Performance from "./pages/Performance";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import Admin from "./pages/Admin";
import UsersManagementPage from "./pages/UsersManagementPage";
import NotFound from "./pages/NotFound";
import { BacktestPage } from "./components/backtest/BacktestPage";
import BacktestLab from "./pages/BacktestLab";
import BacktestRun from "./pages/BacktestRun";
import BacktestResults from "./pages/BacktestResults";
import BacktestHistory from "./pages/BacktestHistory";
import { AffiliateDashboard } from "./components/affiliate/AffiliateDashboard";
import Onboarding from "./pages/Onboarding";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import { ErrorBoundary } from "./core/error/ErrorBoundary";
import { ThemeProvider } from "./components/providers/ThemeProvider";
// Phase X.12: Community Pages
import CommunitySignals from "./pages/CommunitySignals";
import TradersRanking from "./pages/TradersRanking";
import MySignals from "./pages/MySignals";
import InfluencersHub from "./pages/InfluencersHub";
// Phase X.13: Portfolio Insights
import PortfolioInsights from "./pages/PortfolioInsights";
// Phase X.14: System Control Center
import SystemControlCenter from "./pages/SystemControlCenter";
// Phase Admin B: User Risk Profile
import UserRiskProfile from "./pages/UserRiskProfile";
// Phase Admin B: Billing
import AdminBilling from "./pages/AdminBilling";
import AdminAutoTradingDebug from "./pages/AdminAutoTradingDebug";
// Phase Crypto Payments: Admin Payments
import AdminPayments from "./pages/AdminPayments";
// Phase Admin C: Business Analytics
import BusinessAnalytics from "./pages/BusinessAnalytics";
// Phase Admin D: User Support Dashboard
import UserSupportDashboard from "./pages/UserSupportDashboard";
import SupportOverview from "./pages/SupportOverview";
// Phase Admin E: Support Tickets
import SupportTickets from "./pages/SupportTickets";
import TicketDetails from "./pages/TicketDetails";
import AdminTickets from "./pages/AdminTickets";
import AdminTicketDetails from "./pages/AdminTicketDetails";
import SupportMetrics from "./pages/SupportMetrics";
// Phase Admin F: Security Dashboard
import SecurityDashboard from "./pages/SecurityDashboard";
// Phase X.17: Copy Trading
import CopyMarketplace from "./pages/CopyMarketplace";
import CopyStrategyDetails from "./pages/CopyStrategyDetails";
import MyCopying from "./pages/MyCopying";
import MyStrategies from "./pages/MyStrategies";
import CopyAnalytics from "./pages/CopyAnalytics";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <ThemeProvider defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center bg-gray-900 border-none">
                <div className="w-12 h-12 border-4 border-[hsl(var(--ai-cyan))] border-t-transparent rounded-full animate-spin"></div>
              </div>
            }>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<MarketingLayout />}>
                    <Route index element={<Landing />} />
                  </Route>

                  {/* Public Marketing Routes */}
                  <Route element={<MarketingLayout />}>
                    <Route path="/info/strategies" element={<StrategiesInfo />} />
                    <Route path="/info/pricing" element={<Pricing />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/info/about" element={<About />} />
                    <Route path="/info/faq" element={<FAQ />} />
                    <Route path="/info/contact" element={<Contact />} />
                    <Route path="/info/ai-technology" element={<AITechnology />} />
                    <Route path="/info/exchanges" element={<SupportedExchanges />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/academy" element={<TradingAcademy />} />
                    <Route path="/community" element={<Community />} />
                    <Route path="/roadmap" element={<Roadmap />} />
                  </Route>

                  {/* Auth Routes */}
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/debug-user" element={<DebugUser />} />

                  {/* Onboarding Route */}
                  <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

                  {/* Admin Routes - Completely Separate from User Dashboard */}
                  <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
                    <Route index element={<Admin />} />
                    <Route path="users" element={<UsersManagementPage />} />
                    <Route path="users/:userId/risk" element={<UserRiskProfile />} />
                    <Route path="users/:userId/support" element={<UserSupportDashboard />} />
                    <Route path="billing" element={<AdminBilling />} />
                    <Route path="payments" element={<AdminPayments />} />
                    <Route path="analytics" element={<BusinessAnalytics />} />
                    <Route path="tickets" element={<AdminTickets />} />
                    <Route path="tickets/:ticketId" element={<AdminTicketDetails />} />
                    <Route path="security" element={<SecurityDashboard />} />
                    <Route path="system-control" element={<SystemControlCenter />} />
                    <Route path="auto-trading-debug" element={<AdminAutoTradingDebug />} />
                    <Route path="support-overview" element={<SupportOverview />} />
                    <Route path="support-metrics" element={<SupportMetrics />} />
                    <Route path="activity" element={<Admin />} />
                  </Route>

                  {/* Dashboard Routes - User Only */}
                  <Route path="/dashboard" element={<Layout />}>
                    <Route index element={<ProtectedRoute><Index /></ProtectedRoute>} />
                    <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="execute-trade" element={<ProtectedRoute><ExecuteTrade /></ProtectedRoute>} />
                    <Route path="trading-history" element={<ProtectedRoute><TradingHistory /></ProtectedRoute>} />
                    <Route path="auto-trades/history" element={<ProtectedRoute><AutoTradeHistory /></ProtectedRoute>} />
                    <Route path="strategies" element={<ProtectedRoute><Strategies /></ProtectedRoute>} />
                    <Route path="bot-settings" element={<ProtectedRoute><BotSettings /></ProtectedRoute>} />
                    <Route path="api-settings" element={<ProtectedRoute><ApiSettings /></ProtectedRoute>} />
                    <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    <Route path="signals" element={<ProtectedRoute><Signals /></ProtectedRoute>} />
                    <Route path="ultra-signals-live" element={<ProtectedRoute><UltraSignalsLive /></ProtectedRoute>} />
                    <Route path="ultra-signals-history" element={<ProtectedRoute><UltraSignalsHistory /></ProtectedRoute>} />
                    <Route path="ai-live-center" element={<ProtectedRoute><AILiveCenter /></ProtectedRoute>} />
                    <Route path="indicator-settings" element={<ProtectedRoute><IndicatorSettings /></ProtectedRoute>} />
                    <Route path="indicator-weights" element={<ProtectedRoute><IndicatorWeights /></ProtectedRoute>} />
                    <Route path="tradingview" element={<ProtectedRoute><TradingView /></ProtectedRoute>} />
                    <Route path="smart-trade" element={<ProtectedRoute><SmartTrade /></ProtectedRoute>} />
                    <Route path="portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
                    <Route path="performance" element={<ProtectedRoute><Performance /></ProtectedRoute>} />
                    <Route path="backtest" element={<ProtectedRoute><BacktestLab /></ProtectedRoute>} />
                    <Route path="backtest/run/:runId" element={<ProtectedRoute><BacktestRun /></ProtectedRoute>} />
                    <Route path="backtest/results/:runId" element={<ProtectedRoute><BacktestResults /></ProtectedRoute>} />
                    <Route path="backtest/history" element={<ProtectedRoute><BacktestHistory /></ProtectedRoute>} />
                    {/* Legacy backtest route - keep for compatibility */}
                    <Route path="backtest-old" element={<ProtectedRoute><BacktestPage /></ProtectedRoute>} />
                    <Route path="advanced-analytics" element={<ProtectedRoute><AdvancedAnalytics /></ProtectedRoute>} />
                    <Route path="subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
                    <Route path="affiliate" element={<ProtectedRoute><AffiliateDashboard /></ProtectedRoute>} />
                    {/* Phase X.12: Community Routes */}
                    <Route path="community-signals" element={<ProtectedRoute><CommunitySignals /></ProtectedRoute>} />
                    <Route path="traders-ranking" element={<ProtectedRoute><TradersRanking /></ProtectedRoute>} />
                    <Route path="my-signals" element={<ProtectedRoute><MySignals /></ProtectedRoute>} />
                    <Route path="influencers" element={<ProtectedRoute><InfluencersHub /></ProtectedRoute>} />
                    {/* Phase X.13: Portfolio Insights */}
                    <Route path="portfolio-insights" element={<ProtectedRoute><PortfolioInsights /></ProtectedRoute>} />
                    {/* Phase X.17: Copy Trading */}
                    <Route path="copy-market" element={<ProtectedRoute><CopyMarketplace /></ProtectedRoute>} />
                    <Route path="copy-strategy/:id" element={<ProtectedRoute><CopyStrategyDetails /></ProtectedRoute>} />
                    <Route path="my-copying" element={<ProtectedRoute><MyCopying /></ProtectedRoute>} />
                    <Route path="my-strategies" element={<ProtectedRoute><MyStrategies /></ProtectedRoute>} />
                    <Route path="copy-analytics" element={<ProtectedRoute><CopyAnalytics /></ProtectedRoute>} />
                    {/* Phase Admin E: Support Tickets */}
                    <Route path="support/tickets" element={<ProtectedRoute><SupportTickets /></ProtectedRoute>} />
                    <Route path="support/tickets/:ticketId" element={<ProtectedRoute><TicketDetails /></ProtectedRoute>} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </Suspense>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
