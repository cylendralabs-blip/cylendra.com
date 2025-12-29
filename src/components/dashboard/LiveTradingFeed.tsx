import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUpIcon, ArrowDownIcon, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTranslation } from 'react-i18next';
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';

interface TradeEvent {
  id: string;
  symbol: string;
  side: string;
  entry_price: number;
  quantity: number;
  status: string;
  platform: string | null;
  position_status?: string | null;
  unrealized_pnl?: number | null;
  current_price?: number | null;
  stop_loss_price?: number | null;
  take_profit_price?: number | null;
  created_at: string;
  updated_at?: string | null;
  type: 'new' | 'update' | 'close' | 'position_update';
}

export const LiveTradingFeed = () => {
  const { t } = useTranslation('dashboard');
  const { user } = useAuth();
  const [tradeEvents, setTradeEvents] = useState<TradeEvent[]>([]);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const shouldVirtualize = tradeEvents.length > 25;
  const rowVirtualizer = useVirtualizer({
    count: tradeEvents.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => 110,
    overscan: 6
  });
  const virtualItems = shouldVirtualize ? rowVirtualizer.getVirtualItems() : [];

  useEffect(() => {
    if (!user) return;

    // Initial load of recent trades
    const loadRecentTrades = async () => {
      const { data } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setTradeEvents(data.map(trade => ({
          ...trade,
          type: 'new' as const
        })));
      }
    };

    loadRecentTrades();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('live-trading-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trades',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newEvent: TradeEvent = {
            ...payload.new as any,
            type: 'new'
          };
          setTradeEvents(prev => [newEvent, ...prev.slice(0, 19)]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trades',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const old = payload.old as any;
          const updated = payload.new as any;

          // Determine event type
          let eventType: 'update' | 'close' | 'position_update' = 'update';

          if (old.status === 'ACTIVE' && updated.status === 'CLOSED') {
            eventType = 'close';
          } else if (
            old.unrealized_pnl !== updated.unrealized_pnl ||
            old.current_price !== updated.current_price ||
            old.position_status !== updated.position_status
          ) {
            eventType = 'position_update';
          }

          const updatedEvent: TradeEvent = {
            ...updated,
            type: eventType
          };

          setTradeEvents(prev => [updatedEvent, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getEventIcon = (event: TradeEvent) => {
    if (event.type === 'close') {
      return event.side === 'BUY' ? (
        <ArrowUpIcon className="h-4 w-4 text-green-500" />
      ) : (
        <ArrowDownIcon className="h-4 w-4 text-red-500" />
      );
    }
    return <Activity className="h-4 w-4 text-primary" />;
  };

  const getEventColor = (event: TradeEvent) => {
    if (event.type === 'new') return 'bg-primary/10 border-primary/20 animate-in fade-in slide-in-from-top-2';
    if (event.type === 'close') return 'bg-muted border-border';
    return 'bg-accent/10 border-accent/20';
  };

  const getEventText = (event: TradeEvent) => {
    if (event.type === 'new') return t('trading_feed.new_trade');
    if (event.type === 'close') return t('trading_feed.trade_closed');
    if (event.type === 'position_update') {
      if (event.position_status === 'closing') return t('trading_feed.position_closing');
      return t('trading_feed.position_updated');
    }
    return t('trading_feed.trade_updated');
  };

  const renderEventCard = (event: TradeEvent, key?: string) => (
    <div
      key={key || event.id}
      className={`p-3 rounded-lg border transition-all duration-300 ${getEventColor(event)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-0.5">
            {getEventIcon(event)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-sm truncate">
                {event.symbol}
              </p>
              <Badge
                variant={event.side === 'BUY' ? 'default' : 'destructive'}
                className="text-xs"
              >
                {event.side}
              </Badge>
              {event.platform && (
                <Badge variant="outline" className="text-xs">
                  {event.platform}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {getEventText(event)} • ${event.entry_price.toFixed(2)} • {event.quantity} {t('trading_feed.units')}
              {event.unrealized_pnl !== null && event.unrealized_pnl !== undefined && (
                <span className={`ml-2 font-medium ${event.unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {event.unrealized_pnl >= 0 ? '+' : ''}${event.unrealized_pnl.toFixed(2)}
                </span>
              )}
            </p>
            {event.current_price && (
              <p className="text-xs text-muted-foreground mt-1">
                Current: ${event.current_price.toFixed(4)}
                {event.stop_loss_price && (
                  <span className="ml-2">SL: ${event.stop_loss_price.toFixed(4)}</span>
                )}
                {event.take_profit_price && (
                  <span className="ml-2">TP: ${event.take_profit_price.toFixed(4)}</span>
                )}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const virtualizedContent = useMemo(() => {
    if (!shouldVirtualize) return null;

    return (
      <div
        className="relative"
        style={{ height: rowVirtualizer.getTotalSize() }}
      >
        {virtualItems.map((virtualRow) => {
          const event = tradeEvents[virtualRow.index];
          return (
            <div
              key={`${event.id}-${virtualRow.index}`}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className="absolute left-0 w-full"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              {renderEventCard(event)}
            </div>
          );
        })}
      </div>
    );
  }, [rowVirtualizer, shouldVirtualize, tradeEvents, virtualItems]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <DashboardSectionHeader
          icon={<Activity className="h-4 w-4" />}
          title={t('trading_feed.title')}
          actions={
            <Badge variant="outline" className="gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              {t('trading_feed.live')}
            </Badge>
          }
        />
      </CardHeader>
      <CardContent>
        <ScrollArea viewportRef={viewportRef} className="h-[400px] max-h-[500px] pr-4">
          {tradeEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('trading_feed.no_activity')}</p>
            </div>
          ) : shouldVirtualize ? (
            virtualizedContent
          ) : (
            <div className="space-y-3">
              {tradeEvents.map((event, index) => renderEventCard(event, `${event.id}-${index}`))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
