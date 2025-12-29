/**
 * Trade Reason Modal Component
 * 
 * Shows why a trade was executed - displays signal reason, indicators snapshot
 * 
 * Phase 10: UI/UX Improvement - Task 12
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, TrendingUp, TrendingDown } from 'lucide-react';

interface TradeReasonModalProps {
  tradeId: string;
  symbol: string;
  side: 'buy' | 'sell';
  reason: string;
  indicators?: {
    [key: string]: any;
  };
  confidence?: number;
  trigger?: React.ReactNode;
}

export const TradeReasonModal = ({
  tradeId,
  symbol,
  side,
  reason,
  indicators,
  confidence,
  trigger,
}: TradeReasonModalProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-2">
            <Info className="h-4 w-4" />
            Why this trade?
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Trade Execution Reason
            <Badge variant={side === 'buy' ? 'default' : 'secondary'}>
              {side.toUpperCase()}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {symbol} - Trade #{tradeId.slice(0, 8)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Main Reason */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Signal Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{reason}</p>
              {confidence !== undefined && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Confidence:</span>
                    <span className="font-medium">{confidence}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${confidence}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Indicators Snapshot */}
          {indicators && Object.keys(indicators).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Technical Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(indicators).map(([key, value]) => (
                    <div key={key} className="p-2 bg-muted/50 rounded">
                      <div className="text-xs text-muted-foreground mb-1">
                        {key.replace(/_/g, ' ').toUpperCase()}
                      </div>
                      <div className="text-sm font-medium">
                        {typeof value === 'number' ? value.toFixed(4) : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Signal Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Signal Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Direction:</span>
                  <Badge variant={side === 'buy' ? 'default' : 'secondary'}>
                    {side === 'buy' ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {side.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Symbol:</span>
                  <span className="font-medium">{symbol}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

