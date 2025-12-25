/**
 * Auto Trade Badge for Live Signals
 * Shows auto trading status for each signal
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { ParsedLiveSignal } from '@/core/ai-live';
import { AutoTradeDetailsDrawer } from '@/components/auto-trades/AutoTradeDetailsDrawer';
import { useState } from 'react';
import type { AutoTrade } from '@/hooks/useAutoTrades';

interface AutoTradeBadgeProps {
  signal: ParsedLiveSignal;
}

export const AutoTradeBadge = ({ signal }: AutoTradeBadgeProps) => {
  const { user } = useAuth();
  const [selectedAutoTrade, setSelectedAutoTrade] = useState<AutoTrade | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Check if auto trading is enabled
  const { data: botSettings } = useQuery({
    queryKey: ['bot-settings-auto-trading-check', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await (supabase as any)
        .from('bot_settings')
        .select('auto_trading_enabled, auto_trading_mode')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user
  });

  // Find auto trade for this signal
  const { data: autoTrade } = useQuery({
    queryKey: ['auto-trade-for-signal', signal.id, user?.id],
    queryFn: async () => {
      if (!user || !signal.id) return null;
      
      const { data } = await (supabase as any)
        .from('auto_trades')
        .select('*')
        .eq('user_id', user.id)
        .eq('signal_id', signal.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return data as AutoTrade | null;
    },
    enabled: !!user && !!signal.id
  });

  if (!botSettings?.auto_trading_enabled || botSettings?.auto_trading_mode === 'off') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="opacity-50">
              <Clock className="h-3 w-3 ml-1" />
              Auto OFF
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>التداول التلقائي معطل</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (!autoTrade) {
    return null; // No auto trade record yet
  }

  const handleBadgeClick = () => {
    setSelectedAutoTrade(autoTrade);
    setIsDrawerOpen(true);
  };

  const getBadgeContent = () => {
    switch (autoTrade.status) {
      case 'accepted':
        return (
          <Badge 
            className="bg-green-500 hover:bg-green-600 cursor-pointer"
            onClick={handleBadgeClick}
          >
            <CheckCircle2 className="h-3 w-3 ml-1" />
            Auto Trade Sent
          </Badge>
        );
      case 'rejected':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge 
                  className="bg-yellow-500 hover:bg-yellow-600 cursor-pointer"
                  onClick={handleBadgeClick}
                >
                  <XCircle className="h-3 w-3 ml-1" />
                  Rejected
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{autoTrade.reason_code || 'تم رفض الإشارة'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case 'error':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge 
                  className="bg-red-500 hover:bg-red-600 cursor-pointer"
                  onClick={handleBadgeClick}
                >
                  <AlertCircle className="h-3 w-3 ml-1" />
                  Error
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{autoTrade.reason_code || 'حدث خطأ'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case 'pending':
        return (
          <Badge 
            variant="outline"
            className="cursor-pointer"
            onClick={handleBadgeClick}
          >
            <Clock className="h-3 w-3 ml-1" />
            Pending
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {getBadgeContent()}
      <AutoTradeDetailsDrawer
        autoTrade={selectedAutoTrade}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </>
  );
};

