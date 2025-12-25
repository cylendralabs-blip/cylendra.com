/**
 * Bot Settings Display Component for Backtest Lab
 * 
 * Displays all bot settings in a read-only format, matching the Bot Settings page
 * Used in Backtest Lab to show complete bot configuration
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Layers, 
  DollarSign, 
  AlertTriangle, 
  Trophy, 
  Zap, 
  TrendingUp, 
  PlayCircle,
  Bot,
  Target,
  BarChart3
} from 'lucide-react';
import type { BotSettingsForm } from '@/core/config';

interface BotSettingsDisplayProps {
  botSettings: BotSettingsForm | null;
}

export const BotSettingsDisplay = ({ botSettings }: BotSettingsDisplayProps) => {
  if (!botSettings) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center py-8">
            No bot settings found. Please configure your bot first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <CardTitle>الإعدادات العامة</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">اسم البوت</p>
              <p className="font-medium">{botSettings.bot_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المنصة الافتراضية</p>
              <p className="font-medium">{botSettings.default_platform || 'غير محدد'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مصدر الإشارات</p>
              <Badge variant="outline">{botSettings.signal_source || 'N/A'}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">حالة البوت</p>
              <Badge variant={botSettings.is_active ? "default" : "secondary"}>
                {botSettings.is_active ? 'نشط' : 'متوقف'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">نوع السوق</p>
              <Badge variant="outline">{botSettings.market_type || 'spot'}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">نوع الاستراتيجية</p>
              <Badge variant="outline">{botSettings.strategy_type || 'N/A'}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capital Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            <CardTitle>إعدادات رأس المال</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">رأس المال الإجمالي (USDT)</p>
              <p className="font-medium text-lg">{botSettings.total_capital?.toLocaleString() || '0'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">نسبة المخاطرة لكل صفقة</p>
              <p className="font-medium">{botSettings.risk_percentage || 0}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">نسبة الدخول الأولي</p>
              <p className="font-medium">{botSettings.initial_order_percentage || 0}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الحد الأقصى للصفقات النشطة</p>
              <p className="font-medium">{botSettings.max_active_trades || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <CardTitle>إدارة المخاطر</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">نسبة Stop Loss</p>
              <p className="font-medium">{botSettings.stop_loss_percentage || 0}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">نسبة Take Profit</p>
              <p className="font-medium">{botSettings.take_profit_percentage || 0}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">نسبة المخاطرة/العائد</p>
              <p className="font-medium">{botSettings.risk_reward_ratio || 0}:1</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">طريقة حساب Stop Loss</p>
              <p className="font-medium">{botSettings.stop_loss_calculation_method || 'initial_entry'}</p>
            </div>
            {botSettings.max_daily_loss_usd && (
              <div>
                <p className="text-sm text-muted-foreground">الحد الأقصى للخسارة اليومية (USD)</p>
                <p className="font-medium">${botSettings.max_daily_loss_usd.toLocaleString()}</p>
              </div>
            )}
            {botSettings.max_daily_loss_pct && (
              <div>
                <p className="text-sm text-muted-foreground">الحد الأقصى للخسارة اليومية (%)</p>
                <p className="font-medium">{botSettings.max_daily_loss_pct}%</p>
              </div>
            )}
            {botSettings.max_drawdown_pct && (
              <div>
                <p className="text-sm text-muted-foreground">الحد الأقصى للتراجع (%)</p>
                <p className="font-medium">{botSettings.max_drawdown_pct}%</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* DCA Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            <CardTitle>إعدادات DCA</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div>
            <p className="text-sm text-muted-foreground">عدد مستويات DCA</p>
            <p className="font-medium text-lg">
              {botSettings.dca_levels && botSettings.dca_levels > 0 
                ? `${botSettings.dca_levels} مستويات` 
                : 'معطل'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Profit Taking Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            <CardTitle>جني الأرباح</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">استراتيجية جني الأرباح</p>
              <Badge variant="outline">{botSettings.profit_taking_strategy || 'fixed'}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">نوع الأمر</p>
              <Badge variant="outline">{botSettings.order_type || 'market'}</Badge>
            </div>
            {botSettings.partial_tp_level_1 && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Partial TP Level 1</p>
                  <p className="font-medium">{botSettings.partial_tp_level_1}% ({botSettings.partial_tp_percentage_1}%)</p>
                </div>
                {botSettings.partial_tp_level_2 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Partial TP Level 2</p>
                    <p className="font-medium">{botSettings.partial_tp_level_2}% ({botSettings.partial_tp_percentage_2}%)</p>
                  </div>
                )}
                {botSettings.partial_tp_level_3 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Partial TP Level 3</p>
                    <p className="font-medium">{botSettings.partial_tp_level_3}% ({botSettings.partial_tp_percentage_3}%)</p>
                  </div>
                )}
                {botSettings.partial_tp_level_4 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Partial TP Level 4</p>
                    <p className="font-medium">{botSettings.partial_tp_level_4}% ({botSettings.partial_tp_percentage_4}%)</p>
                  </div>
                )}
              </>
            )}
            {botSettings.trailing_stop_distance && (
              <div>
                <p className="text-sm text-muted-foreground">Trailing Stop Distance</p>
                <p className="font-medium">{botSettings.trailing_stop_distance}%</p>
              </div>
            )}
            {botSettings.trailing_stop_activation && (
              <div>
                <p className="text-sm text-muted-foreground">Trailing Stop Activation</p>
                <p className="font-medium">{botSettings.trailing_stop_activation}%</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Leverage Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            <CardTitle>الرافعة المالية</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">الرافعة المالية</p>
              <p className="font-medium">{botSettings.leverage || 1}x</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">استراتيجية الرافعة</p>
              <Badge variant="outline">{botSettings.leverage_strategy || 'none'}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الرافعة التلقائية</p>
              <Badge variant={botSettings.auto_leverage ? "default" : "secondary"}>
                {botSettings.auto_leverage ? 'مفعّل' : 'معطل'}
              </Badge>
            </div>
            {botSettings.max_leverage_increase && (
              <div>
                <p className="text-sm text-muted-foreground">الحد الأقصى لزيادة الرافعة</p>
                <p className="font-medium">{botSettings.max_leverage_increase}x</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trading Direction Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            <CardTitle>اتجاه التداول</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">الاتجاه الافتراضي</p>
              <Badge variant="outline">{botSettings.default_trade_direction || 'both'}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">السماح بصفقات Long</p>
              <Badge variant={botSettings.allow_long_trades ? "default" : "secondary"}>
                {botSettings.allow_long_trades ? 'مسموح' : 'غير مسموح'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">السماح بصفقات Short</p>
              <Badge variant={botSettings.allow_short_trades ? "default" : "secondary"}>
                {botSettings.allow_short_trades ? 'مسموح' : 'غير مسموح'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto Trading Settings */}
      {botSettings.auto_trading_enabled && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5" />
              <CardTitle>التداول التلقائي</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">التداول التلقائي</p>
                <Badge variant={botSettings.auto_trading_enabled ? "default" : "secondary"}>
                  {botSettings.auto_trading_enabled ? 'مفعّل' : 'معطل'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">وضع التداول التلقائي</p>
                <Badge variant="outline">{botSettings.auto_trading_mode || 'off'}</Badge>
              </div>
              {botSettings.allowed_signal_sources && botSettings.allowed_signal_sources.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">مصادر الإشارات المسموحة</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {botSettings.allowed_signal_sources.map((source, idx) => (
                      <Badge key={idx} variant="outline">{source}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {botSettings.min_signal_confidence && (
                <div>
                  <p className="text-sm text-muted-foreground">الحد الأدنى لثقة الإشارة</p>
                  <p className="font-medium">{botSettings.min_signal_confidence}%</p>
                </div>
              )}
              {botSettings.allowed_directions && botSettings.allowed_directions.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">الاتجاهات المسموحة</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {botSettings.allowed_directions.map((dir, idx) => (
                      <Badge key={idx} variant="outline">{dir}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {botSettings.max_auto_trades_per_day && (
                <div>
                  <p className="text-sm text-muted-foreground">الحد الأقصى للصفقات التلقائية يومياً</p>
                  <p className="font-medium">{botSettings.max_auto_trades_per_day}</p>
                </div>
              )}
              {botSettings.max_concurrent_auto_positions && (
                <div>
                  <p className="text-sm text-muted-foreground">الحد الأقصى للمراكز التلقائية المتزامنة</p>
                  <p className="font-medium">{botSettings.max_concurrent_auto_positions}</p>
                </div>
              )}
            </div>
            {botSettings.auto_trading_notes && (
              <div>
                <p className="text-sm text-muted-foreground">ملاحظات</p>
                <p className="text-sm">{botSettings.auto_trading_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            <CardTitle>إعدادات متقدمة</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {botSettings.capital_protection_enabled !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">حماية رأس المال</p>
                <Badge variant={botSettings.capital_protection_enabled ? "default" : "secondary"}>
                  {botSettings.capital_protection_enabled ? 'مفعّل' : 'معطل'}
                </Badge>
              </div>
            )}
            {botSettings.capital_protection_profit && (
              <div>
                <p className="text-sm text-muted-foreground">ربح حماية رأس المال</p>
                <p className="font-medium">{botSettings.capital_protection_profit}%</p>
              </div>
            )}
            {botSettings.auto_reentry_enabled !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">إعادة الدخول التلقائي</p>
                <Badge variant={botSettings.auto_reentry_enabled ? "default" : "secondary"}>
                  {botSettings.auto_reentry_enabled ? 'مفعّل' : 'معطل'}
                </Badge>
              </div>
            )}
            {botSettings.dynamic_tp_enabled !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">Take Profit الديناميكي</p>
                <Badge variant={botSettings.dynamic_tp_enabled ? "default" : "secondary"}>
                  {botSettings.dynamic_tp_enabled ? 'مفعّل' : 'معطل'}
                </Badge>
              </div>
            )}
            {botSettings.min_profit_threshold && (
              <div>
                <p className="text-sm text-muted-foreground">الحد الأدنى للربح</p>
                <p className="font-medium">{botSettings.min_profit_threshold}%</p>
              </div>
            )}
            {botSettings.volatility_guard_enabled !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">حارس التقلبات</p>
                <Badge variant={botSettings.volatility_guard_enabled ? "default" : "secondary"}>
                  {botSettings.volatility_guard_enabled ? 'مفعّل' : 'معطل'}
                </Badge>
              </div>
            )}
            {botSettings.kill_switch_enabled !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">مفتاح الإيقاف الطارئ</p>
                <Badge variant={botSettings.kill_switch_enabled ? "default" : "secondary"}>
                  {botSettings.kill_switch_enabled ? 'مفعّل' : 'معطل'}
                </Badge>
              </div>
            )}
            {botSettings.sizing_mode && (
              <div>
                <p className="text-sm text-muted-foreground">وضع تحديد الحجم</p>
                <Badge variant="outline">{botSettings.sizing_mode}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

