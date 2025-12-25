import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Settings,
  TrendingUp,
  History,
  BarChart3,
  Layers,
  Briefcase,
  Zap,
  Key,
  User,
  ChevronLeft,
  LogOut,
  Menu,
  LineChart,
  Target,
  X,
  Signal,
  UserPlus,
  Activity,
  SlidersHorizontal,
  Scale,
  Radio,
  Crown,
  Users,
  Trophy,
  MessageSquare,
  Monitor,
  TestTube
} from 'lucide-react';

import { useTranslation } from 'react-i18next';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const { t } = useTranslation('sidebar');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: t('dashboard'), path: '/dashboard' },
    { icon: Activity, label: t('live_signals'), path: '/dashboard/ultra-signals-live' },
    { icon: History, label: t('signals_history'), path: '/dashboard/ultra-signals-history' },
    { icon: Radio, label: t('ai_live_center'), path: '/dashboard/ai-live-center' },
    { icon: SlidersHorizontal, label: t('indicator_settings'), path: '/dashboard/indicator-settings' },
    { icon: Scale, label: t('indicator_weights'), path: '/dashboard/indicator-weights' },
    { icon: Signal, label: t('tradingview_signals'), path: '/dashboard/tradingview' },
    { icon: Settings, label: t('bot_settings'), path: '/dashboard/bot-settings' },
    { icon: TrendingUp, label: t('execute_trade'), path: '/dashboard/execute-trade' },
    { icon: History, label: t('trading_history'), path: '/dashboard/trading-history' },
    { icon: Activity, label: t('auto_trades_history'), path: '/dashboard/auto-trades/history' },
    { icon: BarChart3, label: t('performance'), path: '/dashboard/performance' },
    { icon: Layers, label: t('strategies'), path: '/dashboard/strategies' },
    { icon: TestTube, label: t('backtest'), path: '/dashboard/backtest' },
    { icon: Briefcase, label: t('portfolio'), path: '/dashboard/portfolio' },
    { icon: BarChart3, label: t('portfolio_insights'), path: '/dashboard/portfolio-insights' },
    { icon: Zap, label: t('smart_trade'), path: '/dashboard/smart-trade' },
    { icon: Key, label: t('api_settings'), path: '/dashboard/api-settings' },
    { icon: LineChart, label: t('advanced_analytics'), path: '/dashboard/advanced-analytics' },
    { separator: true }, // Phase X.12: Community Section
    { icon: Users, label: t('community_signals'), path: '/dashboard/community-signals' },
    { icon: Trophy, label: t('traders_ranking'), path: '/dashboard/traders-ranking' },
    { icon: MessageSquare, label: t('my_signals'), path: '/dashboard/my-signals' },
    { icon: Crown, label: t('influencers'), path: '/dashboard/influencers' },
    { separator: true },
    { icon: TrendingUp, label: t('copy_trading'), path: '/dashboard/copy-market' },
    { icon: BarChart3, label: t('copy_analytics'), path: '/dashboard/copy-analytics' },
    { separator: true },
    { icon: UserPlus, label: t('affiliate'), path: '/dashboard/affiliate' },
    { icon: Crown, label: t('subscription'), path: '/dashboard/subscription' },
    { icon: User, label: t('profile'), path: '/dashboard/profile' },
    { icon: Settings, label: t('settings'), path: '/dashboard/settings' },
  ];

  return (
    <div className={`bg-card border-r border-border h-screen flex flex-col transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <img
              src="/logo/orbitra-ai-logo.svg"
              alt="Orbitra AI"
              className="h-10 w-auto"
            />
          )}
          {isCollapsed && (
            <img
              src="/logo/favicon.svg"
              alt="Orbitra AI"
              className="h-8 w-8 mx-auto"
            />
          )}
          <div className="flex items-center gap-2">
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 md:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {menuItems.map((item, index) => {
            if ((item as any).separator) {
              return <Separator key={`separator-${index}`} className="my-2" />;
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                  } ${isCollapsed ? 'justify-center' : ''}`
                }
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Footer */}
      <div className="p-4">
        <Button
          variant="outline"
          onClick={handleSignOut}
          className={`w-full flex items-center gap-2 ${isCollapsed ? 'px-2' : ''}`}
          title={isCollapsed ? t('sign_out') : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>{t('sign_out')}</span>}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
