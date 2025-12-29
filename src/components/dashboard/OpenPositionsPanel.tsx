/**
 * Open Positions Panel
 * 
 * Real-time display of open trading positions with Position Manager data
 * Shows: avg entry, position qty, unrealized PnL, TP/SL, DCA progress, risk flags
 * 
 * Phase 6: Position Manager - UI Integration
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface Position {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  trade_type: 'spot' | 'futures';
  platform: string | null;
  entry_price: number;
  current_price: number | null;
  average_entry_price?: number | null;
  position_quantity?: number | null;
  quantity: number;
  leverage: number | null;
  stop_loss_price: number | null;
  take_profit_price: number | null;
  unrealized_pnl: number | null;
  realized_pnl: number | null;
  dca_level: number | null;
  max_dca_level: number | null;
  status: string | null;
  position_status?: string | null;
  risk_state?: any;
  highest_price?: number | null;
  lowest_price?: number | null;
  opened_at: string | null;
  updated_at: string | null;
}

export const OpenPositionsPanel = () => {
  const { user } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadOpenPositions = async () => {
      try {
        const { data, error } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'ACTIVE')
          .order('opened_at', { ascending: false });

        if (error) {
          console.error('Error loading positions:', error);
          return;
        }

        if (data) {
          setPositions(data as Position[]);
        }
      } catch (error) {
        console.error('Error loading positions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOpenPositions();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('open-positions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Position;
            if (updated.status === 'ACTIVE') {
              setPositions(prev => {
                const filtered = prev.filter(p => p.id !== updated.id);
                return [updated, ...filtered].slice(0, 50);
              });
            } else {
              setPositions(prev => prev.filter(p => p.id !== updated.id));
            }
          } else if (payload.eventType === 'INSERT') {
            const newPosition = payload.new as Position;
            if (newPosition.status === 'ACTIVE') {
              setPositions(prev => [newPosition, ...prev].slice(0, 50));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const calculatePnLPercentage = (position: Position) => {
    const entry = position.average_entry_price || position.entry_price;
    const current = position.current_price || position.entry_price;
    if (!entry || !current) return 0;
    
    const pnlPct = position.side === 'buy'
      ? ((current - entry) / entry) * 100
      : ((entry - current) / entry) * 100;
    
    return pnlPct;
  };

  const calculateTPProgress = (position: Position) => {
    if (!position.take_profit_price || !position.current_price || !position.entry_price) {
      return 0;
    }
    
    const entry = position.entry_price;
    const current = position.current_price;
    const tp = position.take_profit_price;
    
    if (position.side === 'buy') {
      const distance = tp - entry;
      const progress = current - entry;
      return distance > 0 ? Math.min(100, (progress / distance) * 100) : 0;
    } else {
      const distance = entry - tp;
      const progress = entry - current;
      return distance > 0 ? Math.min(100, (progress / distance) * 100) : 0;
    }
  };

  const calculateSLProgress = (position: Position) => {
    if (!position.stop_loss_price || !position.current_price || !position.entry_price) {
      return 0;
    }
    
    const entry = position.entry_price;
    const current = position.current_price;
    const sl = position.stop_loss_price;
    
    if (position.side === 'buy') {
      const distance = entry - sl;
      const progress = entry - current;
      return distance > 0 ? Math.min(100, (progress / distance) * 100) : 0;
    } else {
      const distance = sl - entry;
      const progress = current - entry;
      return distance > 0 ? Math.min(100, (progress / distance) * 100) : 0;
    }
  };

  const getPositionStatus = (position: Position) => {
    if (position.position_status) {
      return position.position_status;
    }
    return position.status || 'open';
  };

  const isPositionClosing = (position: Position) => {
    return getPositionStatus(position) === 'closing';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Open Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50 animate-pulse" />
            <p className="text-sm">Loading positions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Open Positions
          </CardTitle>
          <Badge variant="outline" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            {positions.length} {positions.length === 1 ? 'Position' : 'Positions'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-3">
            {positions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No open positions</p>
                <p className="text-xs mt-1">Active positions will appear here</p>
              </div>
            ) : (
              positions.map((position) => {
                const pnlPct = calculatePnLPercentage(position);
                const unrealizedPnl = position.unrealized_pnl || 0;
                const isProfit = unrealizedPnl >= 0;
                const tpProgress = calculateTPProgress(position);
                const slProgress = calculateSLProgress(position);
                const entryPrice = position.average_entry_price || position.entry_price;
                const positionQty = position.position_quantity || position.quantity;
                const isBuy = position.side === 'buy';
                const isClosing = isPositionClosing(position);

                return (
                  <div
                    key={position.id}
                    className={`p-4 rounded-lg border transition-all duration-300 ${
                      isClosing 
                        ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800' 
                        : isProfit
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-1">
                        <div className={`flex items-center gap-1 ${isBuy ? 'text-green-600' : 'text-red-600'}`}>
                          {isBuy ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span className="font-semibold text-sm">{position.symbol}</span>
                        </div>
                        {position.platform && (
                          <Badge variant="outline" className="text-xs">
                            {position.platform}
                          </Badge>
                        )}
                        {position.trade_type === 'futures' && position.leverage && (
                          <Badge variant="outline" className="text-xs">
                            {position.leverage}x
                          </Badge>
                        )}
                        {isClosing && (
                          <Badge variant="destructive" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Closing
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                          {isProfit ? '+' : ''}{pnlPct.toFixed(2)}%
                        </div>
                        <div className={`text-xs ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                          {isProfit ? '+' : ''}${unrealizedPnl.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Price Info */}
                    <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                      <div>
                        <span className="text-muted-foreground">Entry:</span>
                        <span className="ml-1 font-medium">${entryPrice.toFixed(4)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Current:</span>
                        <span className="ml-1 font-medium">
                          ${position.current_price?.toFixed(4) || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="ml-1 font-medium">{positionQty}</span>
                      </div>
                      {position.average_entry_price && position.average_entry_price !== position.entry_price && (
                        <div>
                          <span className="text-muted-foreground">Avg Entry:</span>
                          <span className="ml-1 font-medium">${position.average_entry_price.toFixed(4)}</span>
                        </div>
                      )}
                    </div>

                    {/* TP/SL Progress */}
                    {(position.take_profit_price || position.stop_loss_price) && (
                      <div className="space-y-2 mb-3">
                        {position.take_profit_price && (
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                TP: ${position.take_profit_price.toFixed(4)}
                              </span>
                              <span className="text-green-600">{tpProgress.toFixed(1)}%</span>
                            </div>
                            <Progress value={tpProgress} className="h-1.5" />
                          </div>
                        )}
                        {position.stop_loss_price && (
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                SL: ${position.stop_loss_price.toFixed(4)}
                              </span>
                              <span className="text-red-600">{slProgress.toFixed(1)}%</span>
                            </div>
                            <Progress value={slProgress} className="h-1.5" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* DCA Progress */}
                    {position.dca_level && position.max_dca_level && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">DCA Level</span>
                          <span className="font-medium">
                            {position.dca_level} / {position.max_dca_level}
                          </span>
                        </div>
                        <Progress 
                          value={(position.dca_level / position.max_dca_level) * 100} 
                          className="h-1.5" 
                        />
                      </div>
                    )}

                    {/* Risk State */}
                    {position.risk_state && (
                      <div className="mb-3 p-2 bg-muted/50 rounded text-xs">
                        {position.risk_state.trailing?.enabled && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <TrendingUp className="h-3 w-3" />
                            <span>Trailing Stop Active</span>
                          </div>
                        )}
                        {position.risk_state.breakEven?.activated && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Break-Even Active</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 pt-2 border-t">
                      <span>
                        {position.opened_at && formatDistanceToNow(new Date(position.opened_at), { addSuffix: true })}
                      </span>
                      {position.updated_at && (
                        <span>
                          Updated {formatDistanceToNow(new Date(position.updated_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

