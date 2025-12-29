import {
  Home,
  LayoutDashboard,
  Settings,
  Users,
  Zap,
  Activity,
  BarChart3,
  History,
  PieChart,
  TrendingUp,
  LineChart,
  Target,
  Signal,
  TestTube,
  UserPlus,
  MessageSquare,
  Shield,
  BarChart,
  Ticket,
  Lock,
  Monitor,
  FileText,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

interface SidebarItemProps {
  title: string;
  url: string;
  icon: any;
}

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  
  // Phase Admin B: Check feature flags
  const { data: copyTradingEnabled = true } = useFeatureFlag('copy_trading');
  const { data: ultraSignalsEnabled = true } = useFeatureFlag('ultra_signals');
  const { data: backtestingEnabled = true } = useFeatureFlag('backtesting');
  const { data: affiliateEnabled = true } = useFeatureFlag('affiliate');
  const { data: aiAssistantEnabled = true } = useFeatureFlag('ai_assistant');
  const { data: advancedAnalyticsEnabled = true } = useFeatureFlag('advanced_analytics');

  const items = [
    {
      title: "الرئيسية",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "التداول الذكي",
      url: "/dashboard/smart-trade",
      icon: Zap,
    },
    {
      title: "تنفيذ صفقة",
      url: "/dashboard/execute-trade",
      icon: Target,
    },
    {
      title: "إشارات TradingView",
      url: "/dashboard/tradingview",
      icon: Signal,
    },
    {
      title: "الاستراتيجيات",
      url: "/dashboard/strategies",
      icon: BarChart3,
    },
    {
      title: "اختبار الاستراتيجيات",
      url: "/dashboard/backtest",
      icon: TestTube,
    },
    {
      title: "سجل التداول",
      url: "/dashboard/trading-history",
      icon: History,
    },
    {
      title: "المحفظة",
      url: "/dashboard/portfolio",
      icon: PieChart,
    },
    {
      title: "الأداء",
      url: "/dashboard/performance",
      icon: TrendingUp,
    },
    {
      title: "التحليلات المتقدمة",
      url: "/dashboard/advanced-analytics",
      icon: LineChart,
    },
    {
      title: "نظام الإحالة",
      url: "/dashboard/affiliate",
      icon: UserPlus,
    },
    {
      title: "تذاكر الدعم",
      url: "/dashboard/support/tickets",
      icon: MessageSquare,
    },
  ];

  const settingsItems = [
    {
      title: "إعدادات البوت",
      url: "/dashboard/bot-settings",
      icon: Settings,
    },
    {
      title: "إعدادات API",
      url: "/dashboard/api-settings",
      icon: Zap,
    },
    {
      title: "إعدادات الحساب",
      url: "/dashboard/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="space-y-4 py-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          الخيارات
        </h2>
        <div className="space-y-1">
          {items
            .filter((item) => {
              // Phase Admin B: Filter items based on feature flags
              if (item.url.includes('backtest') && !backtestingEnabled) return false;
              if (item.url.includes('advanced-analytics') && !advancedAnalyticsEnabled) return false;
              if (item.url.includes('affiliate') && !affiliateEnabled) return false;
              return true;
            })
            .map((item) => (
              <Button
                variant="ghost"
                className={cn(
                  "justify-start font-normal",
                  location.pathname === item.url
                    ? "bg-secondary text-foreground hover:bg-secondary"
                    : "hover:bg-accent hover:text-foreground"
                )}
                onClick={() => navigate(item.url)}
                key={item.url}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.title}</span>
              </Button>
            ))}
        </div>
      </div>
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          الإعدادات
        </h2>
        <div className="space-y-1">
          {settingsItems.map((item) => (
            <Button
              variant="ghost"
              className={cn(
                "justify-start font-normal",
                location.pathname === item.url
                  ? "bg-secondary text-foreground hover:bg-secondary"
                  : "hover:bg-accent hover:text-foreground"
              )}
              onClick={() => navigate(item.url)}
              key={item.url}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.title}</span>
            </Button>
          ))}
        </div>
      </div>
      {/* Admin Quick Link - Phase Admin F: Complete Separation */}
      {isAdmin && (
        <div className="px-3 py-2 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-purple-400 hover:bg-purple-500/20 hover:text-purple-300"
            onClick={() => navigate("/admin")}
          >
            <Shield className="mr-2 h-4 w-4" />
            <span>الانتقال إلى لوحة الإدارة</span>
          </Button>
        </div>
      )}
    </div>
  );
}
