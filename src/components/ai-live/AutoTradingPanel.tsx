/**
 * Auto Trading Panel for AI Live Center
 * 
 * Phase X: Auto Trading UI from Signals
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  PlayCircle, 
  Settings, 
  Zap, 
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function AutoTradingPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: botSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['bot-settings-auto-trading', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await (supabase as any)
        .from('bot_settings')
        .select('auto_trading_enabled, auto_trading_mode, bot_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching auto trading settings:', error);
        return null;
      }

      return data;
    },
    enabled: !!user,
  });

  // Get today's auto trades count
  const { data: autoTradesToday } = useQuery({
    queryKey: ['auto-trades-today', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all trades today, then filter for auto trades
      // Note: signal_source column may not exist in trades table yet
      try {
        const { data: tradesToday, error } = await (supabase as any)
          .from('trades')
          .select('id, signal_source')
          .eq('user_id', user.id)
          .gte('created_at', today.toISOString());

        if (error) {
          // If signal_source column doesn't exist, return 0 for now
          if (error.code === '42703' || error.message?.includes('does not exist') || error.message?.includes('column') && error.message?.includes('signal_source')) {
            console.warn('signal_source column not found in trades table - auto trades tracking unavailable');
            return 0;
          }
          console.error('Error fetching auto trades:', error);
          return 0;
        }

        // Filter for auto trades (if signal_source exists)
        const autoTrades = tradesToday?.filter((t: any) => {
          return t.signal_source === 'auto';
        }) || [];

        return autoTrades.length || 0;
      } catch (err: any) {
        // Handle any unexpected errors
        if (err?.message?.includes('signal_source') || err?.code === '42703') {
          console.warn('signal_source column not available in trades table');
          return 0;
        }
        console.error('Unexpected error fetching auto trades:', err);
        return 0;
      }
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get last auto trade
  const { data: lastAutoTrade } = useQuery({
    queryKey: ['last-auto-trade', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Try to get trades with signal_source, but handle if column doesn't exist
      try {
        const { data, error } = await (supabase as any)
          .from('trades')
          .select('id, symbol, side, created_at, realized_pnl, unrealized_pnl, total_invested, status, signal_source')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          // If signal_source column doesn't exist, return null (can't track auto trades)
          if (error.code === '42703' || error.message?.includes('does not exist') || (error.message?.includes('column') && error.message?.includes('signal_source'))) {
            console.warn('signal_source column not found - auto trade tracking unavailable');
            return null;
          }
          console.error('Error fetching last auto trade:', error);
          return null;
        }

        // Filter for auto trades (if signal_source exists)
        const autoTrades = data?.filter((t: any) => {
          return t.signal_source === 'auto';
        }) || [];

        if (autoTrades.length === 0) return null;

        const trade = autoTrades[0];
        
        // Calculate profit_loss_percentage from realized_pnl or unrealized_pnl
        const pnl = trade.status === 'CLOSED' ? (trade.realized_pnl || 0) : (trade.unrealized_pnl || 0);
        const profitLossPercentage = trade.total_invested > 0 
          ? ((pnl || 0) / trade.total_invested) * 100 
          : 0;

        return {
          id: trade.id,
          symbol: trade.symbol,
          side: trade.side,
          created_at: trade.created_at,
          profit_loss_percentage: profitLossPercentage,
        };
      } catch (err: any) {
        // Handle any unexpected errors
        if (err?.message?.includes('signal_source') || err?.code === '42703') {
          console.warn('signal_source column not available');
          return null;
        }
        console.error('Unexpected error fetching last auto trade:', err);
        return null;
      }
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (settingsLoading || !user) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const autoTradingEnabled = botSettings?.auto_trading_enabled ?? false;
  const autoTradingMode = botSettings?.auto_trading_mode || 'off';
  const isActive = autoTradingEnabled && autoTradingMode !== 'off';
  const botName = botSettings?.bot_name || 'SmartTraderBot';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-accent" />
            <CardTitle className="text-lg">Auto Trading</CardTitle>
          </div>
          <Badge 
            variant={isActive ? "default" : "secondary"}
            className={isActive ? "bg-accent text-accent-foreground" : ""}
          >
            {isActive ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                ON
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3 mr-1" />
                OFF
              </>
            )}
          </Badge>
        </div>
        <CardDescription>
          {isActive 
            ? `Mode: ${autoTradingMode === 'full_auto' ? 'Full Auto' : 'Semi Auto'}`
            : 'Auto trading is currently disabled'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isActive && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active Bot:</span>
                <span className="font-medium">{botName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Today's Auto Trades:</span>
                <Badge variant="outline" className="font-medium">
                  {autoTradesToday || 0}
                </Badge>
              </div>
              {lastAutoTrade && (
                <div className="space-y-1 pt-2 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Last Auto Trade:</span>
                    <span>{format(new Date(lastAutoTrade.created_at), 'HH:mm', { locale: ar })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {lastAutoTrade.symbol} {lastAutoTrade.side}
                    </span>
                    {lastAutoTrade.profit_loss_percentage && (
                      <Badge 
                        variant={lastAutoTrade.profit_loss_percentage >= 0 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {lastAutoTrade.profit_loss_percentage >= 0 ? '+' : ''}
                        {lastAutoTrade.profit_loss_percentage.toFixed(2)}%
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Your bot is automatically executing trades based on signals.
              </AlertDescription>
            </Alert>
          </>
        )}

        {!isActive && (
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Enable auto trading to automatically execute trades from signals.
            </AlertDescription>
          </Alert>
        )}

        <Button
          variant={isActive ? "outline" : "default"}
          size="sm"
          className="w-full"
          onClick={() => navigate('/dashboard/bot-settings?tab=auto-trading')}
        >
          <Settings className="w-4 h-4 mr-2" />
          {isActive ? 'Manage Auto Trading' : 'Enable Auto Trading'}
        </Button>
      </CardContent>
    </Card>
  );
}

