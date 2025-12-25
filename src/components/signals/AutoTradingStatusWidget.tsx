/**
 * Auto Trading Status Widget
 * 
 * Phase X: Auto Trading UI from Signals
 * 
 * Displays current auto trading status and quick link to settings
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
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const signalSourceLabels: Record<string, string> = {
  ai_ultra: 'AI Ultra',
  ai_realtime: 'AI Realtime',
  tradingview: 'TradingView',
  legacy: 'Legacy',
};

export default function AutoTradingStatusWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: botSettings, isLoading } = useQuery({
    queryKey: ['bot-settings-auto-trading', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await (supabase as any)
        .from('bot_settings')
        .select('auto_trading_enabled, auto_trading_mode, allowed_signal_sources, allowed_directions')
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

  if (!user || isLoading) {
    return null;
  }

  const autoTradingEnabled = botSettings?.auto_trading_enabled ?? false;
  const autoTradingMode = botSettings?.auto_trading_mode || 'off';
  const allowedSources = botSettings?.allowed_signal_sources || [];
  const allowedDirections = botSettings?.allowed_directions || [];

  const isActive = autoTradingEnabled && autoTradingMode !== 'off';

  const sourcesSummary = allowedSources.length > 0
    ? allowedSources.map((s: string) => signalSourceLabels[s] || s).join(', ')
    : 'None selected';

  const directionsSummary = allowedDirections.length > 0
    ? allowedDirections.map((d: string) => d.toUpperCase()).join(', ')
    : 'None selected';

  return (
    <Card className="border-accent/20 bg-gradient-to-r from-accent/5 to-accent/10">
      <CardHeader className={isMobile ? 'p-4 pb-3' : 'pb-3'}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlayCircle className={`text-accent ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
            <CardTitle className={isMobile ? 'text-base' : 'text-lg'}>
              Auto Trading Status
            </CardTitle>
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
        <CardDescription className={isMobile ? 'text-xs mt-1' : 'mt-1'}>
          {isActive 
            ? `Mode: ${autoTradingMode === 'full_auto' ? 'Full Auto' : 'Semi Auto'}`
            : 'Auto trading is currently disabled'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className={isMobile ? 'p-4 pt-0' : 'pt-0'}>
        {isActive ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Sources:</span>
                <p className="font-medium text-foreground">{sourcesSummary || 'All'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Directions:</span>
                <p className="font-medium text-foreground">{directionsSummary || 'All'}</p>
              </div>
            </div>
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Your bot will automatically execute trades based on signals matching your filters.
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              className="w-full"
              onClick={() => navigate('/dashboard/bot-settings?tab=auto-trading')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configure Auto Trading
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Enable auto trading to automatically execute trades from signals.
              </AlertDescription>
            </Alert>
            <Button
              variant="default"
              size={isMobile ? "sm" : "default"}
              className="w-full"
              onClick={() => navigate('/dashboard/bot-settings?tab=auto-trading')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Enable Auto Trading
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

