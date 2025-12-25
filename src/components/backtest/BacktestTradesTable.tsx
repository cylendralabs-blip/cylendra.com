/**
 * Backtest Trades Table Component
 * 
 * Displays table of backtest trades
 * 
 * Phase 9: Backtesting Engine - Task 10
 */

import { memo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BacktestTrade } from '@/core/models/BacktestTrade';
import { Badge } from '@/components/ui/badge';
import { useVirtualizer } from '@tanstack/react-virtual';

interface BacktestTradesTableProps {
  trades: BacktestTrade[];
}

const BacktestTradesTableComponent = ({ trades }: BacktestTradesTableProps) => {
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: trades.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48,
    overscan: 8,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? rowVirtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backtest Trades ({trades.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={tableContainerRef}
          className="max-h-[420px] overflow-auto"
        >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Side</TableHead>
              <TableHead>Entry Price</TableHead>
              <TableHead>Exit Price</TableHead>
              <TableHead>PnL (USD)</TableHead>
              <TableHead>PnL (%)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Exit Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paddingTop > 0 && (
              <TableRow style={{ height: paddingTop }}>
                <TableCell colSpan={8} className="p-0 border-0" />
              </TableRow>
            )}
            {virtualItems.map((virtualRow) => {
              const trade = trades[virtualRow.index];
              return (
              <TableRow key={trade.id} data-index={virtualRow.index}>
                <TableCell>{trade.symbol}</TableCell>
                <TableCell>
                  <Badge variant={trade.side === 'buy' ? 'default' : 'secondary'}>
                    {trade.side.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>${trade.entryPrice.toFixed(2)}</TableCell>
                <TableCell>{trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : '-'}</TableCell>
                <TableCell className={trade.pnlUsd >= 0 ? 'text-green-500' : 'text-red-500'}>
                  ${trade.pnlUsd.toFixed(2)}
                </TableCell>
                <TableCell className={trade.pnlPct >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {trade.pnlPct.toFixed(2)}%
                </TableCell>
                <TableCell>
                  <Badge variant={trade.status === 'closed' ? 'default' : 'secondary'}>
                    {trade.status}
                  </Badge>
                </TableCell>
                <TableCell>{trade.exitReason || '-'}</TableCell>
              </TableRow>
            )})}
            {paddingBottom > 0 && (
              <TableRow style={{ height: paddingBottom }}>
                <TableCell colSpan={8} className="p-0 border-0" />
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export const BacktestTradesTable = memo(BacktestTradesTableComponent);
BacktestTradesTable.displayName = 'BacktestTradesTable';

