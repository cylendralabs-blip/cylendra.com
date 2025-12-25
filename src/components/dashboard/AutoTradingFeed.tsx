/**
 * Auto Trading Feed
 * 
 * Live feed component for auto-trading signals
 * Shows pending, filtered, executing, and executed signals
 * Phase 3: Auto-Trading Trigger
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  Clock, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

type ExecutionStatus = 'PENDING' | 'FILTERED' | 'EXECUTING' | 'EXECUTED' | 'FAILED' | 'IGNORED';

interface SignalEvent {
  id: string;
  symbol: string;
  signal_type: 'BUY' | 'SELL' | 'STRONG_BUY' | 'STRONG_SELL';
  entry_price: number;
  confidence_score: number;
  strategy_name: string;
  execution_status: ExecutionStatus;
  execution_reason?: string | null;
  executed_trade_id?: string | null;
  created_at: string;
  execution_started_at?: string | null;
  execution_completed_at?: string | null;
  type: 'new' | 'update' | 'executed';
}

export const AutoTradingFeed = () => {
  const { user } = useAuth();
  const [signalEvents, setSignalEvents] = useState<SignalEvent[]>([]);

  useEffect(() => {
    if (!user) return;

    // Initial load of recent signals
    const loadRecentSignals = async () => {
      // Use type assertion to avoid deep type inference issues
      // The tradingview_signals table exists but isn't in generated types yet
      const signalsResult = await (supabase
        .from('tradingview_signals' as any)
        .select('*')
        .eq('user_id', user.id)
        // Filter only internal engine signals (not TradingView webhook signals)
        .eq('webhook_data->>source', 'internal_engine')
        .order('created_at', { ascending: false })
        .limit(20) as any) as { data: any[] | null; error: any };

      if (signalsResult.error) {
        console.error('Error loading signals:', signalsResult.error);
        return;
      }

      const data = signalsResult.data;
      if (data) {
        setSignalEvents(data.map(signal => ({
          id: signal.id,
          symbol: signal.symbol,
          signal_type: signal.signal_type,
          entry_price: signal.entry_price,
          confidence_score: signal.confidence_score,
          strategy_name: signal.strategy_name,
          execution_status: signal.execution_status || 'PENDING',
          execution_reason: signal.execution_reason,
          executed_trade_id: signal.executed_trade_id,
          created_at: signal.created_at,
          execution_started_at: signal.execution_started_at,
          execution_completed_at: signal.execution_completed_at,
          type: 'new' as const
        })));
      }
    };

    loadRecentSignals();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('auto-trading-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tradingview_signals',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const signal = payload.new as any;
          const newEvent: SignalEvent = {
            id: signal.id,
            symbol: signal.symbol,
            signal_type: signal.signal_type,
            entry_price: signal.entry_price,
            confidence_score: signal.confidence_score,
            strategy_name: signal.strategy_name,
            execution_status: signal.execution_status || 'PENDING',
            execution_reason: signal.execution_reason,
            executed_trade_id: signal.executed_trade_id,
            created_at: signal.created_at,
            execution_started_at: signal.execution_started_at,
            execution_completed_at: signal.execution_completed_at,
            type: 'new'
          };
          setSignalEvents(prev => [newEvent, ...prev.slice(0, 19)]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tradingview_signals',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const old = payload.old as any;
          const updated = payload.new as any;
          
          const eventType = old.execution_status === 'EXECUTING' && 
                           updated.execution_status === 'EXECUTED' 
            ? 'executed' 
            : 'update';

          const updatedEvent: SignalEvent = {
            id: updated.id,
            symbol: updated.symbol,
            signal_type: updated.signal_type,
            entry_price: updated.entry_price,
            confidence_score: updated.confidence_score,
            strategy_name: updated.strategy_name,
            execution_status: updated.execution_status || 'PENDING',
            execution_reason: updated.execution_reason,
            executed_trade_id: updated.executed_trade_id,
            created_at: updated.created_at,
            execution_started_at: updated.execution_started_at,
            execution_completed_at: updated.execution_completed_at,
            type: eventType as any
          };

          setSignalEvents(prev => {
            const filtered = prev.filter(e => e.id !== updated.id);
            return [updatedEvent, ...filtered].slice(0, 20);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'FILTERED':
        return <Filter className="h-4 w-4 text-orange-500" />;
      case 'EXECUTING':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'EXECUTED':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'IGNORED':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: ExecutionStatus) => {
    const variants: Record<ExecutionStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'PENDING': 'outline',
      'FILTERED': 'secondary',
      'EXECUTING': 'default',
      'EXECUTED': 'default',
      'FAILED': 'destructive',
      'IGNORED': 'outline'
    };

    const colors: Record<ExecutionStatus, string> = {
      'PENDING': 'text-yellow-600',
      'FILTERED': 'text-orange-600',
      'EXECUTING': 'text-blue-600',
      'EXECUTED': 'text-green-600',
      'FAILED': 'text-red-600',
      'IGNORED': 'text-gray-600'
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status}
      </Badge>
    );
  };

  const getEventColor = (event: SignalEvent) => {
    if (event.execution_status === 'EXECUTED') {
      return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
    }
    if (event.execution_status === 'FAILED') {
      return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
    }
    if (event.execution_status === 'EXECUTING') {
      return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 animate-pulse';
    }
    if (event.execution_status === 'FILTERED') {
      return 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800';
    }
    if (event.execution_status === 'PENDING') {
      return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
    }
    return 'bg-muted border-border';
  };

  const getEventText = (event: SignalEvent) => {
    switch (event.execution_status) {
      case 'PENDING':
        return 'Pending execution';
      case 'FILTERED':
        return `Filtered: ${event.execution_reason || 'Unknown reason'}`;
      case 'EXECUTING':
        return 'Executing trade...';
      case 'EXECUTED':
        return event.executed_trade_id 
          ? `Trade executed (ID: ${event.executed_trade_id.slice(0, 8)}...)`
          : 'Trade executed';
      case 'FAILED':
        return `Failed: ${event.execution_reason || 'Unknown error'}`;
      case 'IGNORED':
        return `Ignored: ${event.execution_reason || 'Duplicate trade'}`;
      default:
        return 'Signal received';
    }
  };

  const isBuy = (signalType: string) => 
    signalType === 'BUY' || signalType === 'STRONG_BUY';

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Auto Trading Feed
          </CardTitle>
          <Badge variant="outline" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {signalEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No signals yet</p>
                <p className="text-xs mt-1">Signals will appear here when received</p>
              </div>
            ) : (
              signalEvents.map((event, index) => (
                <div
                  key={`${event.id}-${index}`}
                  className={`p-3 rounded-lg border transition-all duration-300 ${getEventColor(event)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">
                        {getStatusIcon(event.execution_status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-medium text-sm truncate">
                            {event.symbol}
                          </p>
                          <Badge 
                            variant={isBuy(event.signal_type) ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {event.signal_type}
                          </Badge>
                          {getStatusBadge(event.execution_status)}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {event.strategy_name} • ${event.entry_price.toFixed(2)} • {event.confidence_score}% confidence
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getEventText(event)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                        </p>
                        {event.execution_completed_at && (
                          <p className="text-xs text-muted-foreground">
                            Completed: {formatDistanceToNow(new Date(event.execution_completed_at), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

