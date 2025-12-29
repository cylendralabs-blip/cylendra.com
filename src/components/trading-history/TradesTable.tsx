
import { memo, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Trade } from '@/types/trade';
import { formatNumber, formatDate } from '@/utils/tradingFormat';
import StatusBadge from './StatusBadge';
import SideBadge from './SideBadge';
import CloseTradeButton from './CloseTradeButton';
import { useTradeActions } from '@/hooks/useTradeActions';
import { useIsMobile } from '@/hooks/use-mobile';
import { useVirtualizer } from '@tanstack/react-virtual';

interface TradesTableProps {
  trades: Trade[];
  isLoading: boolean;
}

const TradesTableComponent = ({ trades, isLoading }: TradesTableProps) => {
  const isMobile = useIsMobile();
  const { handleCloseTrade, isClosing } = useTradeActions();
  
  // Always call hooks unconditionally (React Rules of Hooks)
  const desktopContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldVirtualize = !isMobile && trades.length > 50;
  
  // Always call useVirtualizer unconditionally - React requires hooks to be called in the same order
  // Use count: 0 when virtualization is not needed
  const rowVirtualizer = useVirtualizer({
    count: shouldVirtualize ? trades.length : 0,
    getScrollElement: () => desktopContainerRef.current,
    estimateSize: () => 60,
    overscan: 8,
  });
  
  // Calculate virtual rows only when virtualization is enabled
  const virtualRows = shouldVirtualize && trades.length > 0 ? rowVirtualizer.getVirtualItems() : [];
  const paddingTop = shouldVirtualize && virtualRows.length > 0 ? (virtualRows[0]?.start || 0) : 0;
  const paddingBottom =
    shouldVirtualize && virtualRows.length > 0
      ? rowVirtualizer.getTotalSize() - (virtualRows[virtualRows.length - 1]?.end || 0)
      : 0;
  const indexesToRender = shouldVirtualize && virtualRows.length > 0
    ? virtualRows.map((virtualRow) => virtualRow.index)
    : trades.map((_, index) => index);

  const getPlatformBadge = (platform: string | null) => {
    if (!platform) return null;
    
    const platformColors: Record<string, string> = {
      'binance': 'bg-yellow-500',
      'binance-futures': 'bg-orange-500',
      'bybit': 'bg-blue-500',
      'kucoin': 'bg-green-500',
      'okx': 'bg-purple-500'
    };

    const platformLabels: Record<string, string> = {
      'binance': 'بايننس',
      'binance-futures': 'بايننس فيوتشر',
      'bybit': 'بايبيت',
      'kucoin': 'كوكوين',
      'okx': 'أوككس'
    };

    return (
      <Badge 
        className={`${platformColors[platform] || 'bg-gray-500'} text-white text-xs`}
      >
        {platformLabels[platform] || platform}
      </Badge>
    );
  };

  const getSyncStatusBadge = (syncStatus: string | null) => {
    if (!syncStatus) return null;

    const statusConfig: Record<string, { color: string; label: string }> = {
      'synced': { color: 'bg-green-500', label: 'متزامن' },
      'pending': { color: 'bg-yellow-500', label: 'معلق' },
      'error': { color: 'bg-red-500', label: 'خطأ' },
      'pending_close': { color: 'bg-orange-500', label: 'إغلاق معلق' }
    };

    const config = statusConfig[syncStatus] || { color: 'bg-gray-500', label: syncStatus };

    return (
      <Badge className={`${config.color} text-white text-xs`}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-sm sm:text-base">جاري التحميل...</p>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm sm:text-base">لا توجد صفقات</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3 px-3">
        {trades.map((trade) => (
          <Card key={trade.id} className="trade-card">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="font-medium text-sm">{trade.symbol}</span>
                    <Badge variant={trade.trade_type === 'spot' ? 'secondary' : 'default'} className="text-xs">
                      {trade.trade_type === 'spot' ? 'سبوت' : 'فيوتشر'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <StatusBadge status={trade.status} />
                    <SideBadge side={trade.side} />
                  </div>
                </div>

                {/* Platform and Sync Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 space-x-reverse">
                    {getPlatformBadge(trade.platform)}
                    {getSyncStatusBadge(trade.sync_status)}
                  </div>
                  <CloseTradeButton
                    trade={trade}
                    onCloseTrade={handleCloseTrade}
                    isClosing={isClosing === trade.id}
                  />
                </div>

                {/* Price & Investment Info */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">سعر الدخول</span>
                    <p className="font-medium">${formatNumber(trade.entry_price)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">السعر الحالي</span>
                    <p className="font-medium">${formatNumber(trade.current_price)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">الاستثمار</span>
                    <p className="font-medium">${formatNumber(trade.total_invested)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">الكمية</span>
                    <p className="font-medium">{formatNumber(trade.quantity)}</p>
                  </div>
                </div>

                {/* Fees and Commission */}
                {(trade.fees || trade.commission) && (
                  <div className="grid grid-cols-2 gap-3 text-xs border-t pt-2">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">الرسوم</span>
                      <p className="font-medium">${formatNumber(trade.fees || 0)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">العمولة</span>
                      <p className="font-medium">${formatNumber(trade.commission || 0)}</p>
                    </div>
                  </div>
                )}

                {/* P&L */}
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">الربح/الخسارة</span>
                    <div className="text-xs text-right">
                      {trade.realized_pnl !== null && (
                        <div className={trade.realized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                          محقق: ${formatNumber(trade.realized_pnl)}
                        </div>
                      )}
                      {trade.unrealized_pnl !== null && (
                        <div className={trade.unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                          غير محقق: ${formatNumber(trade.unrealized_pnl)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                {(trade.leverage || trade.dca_level) && (
                  <div className="grid grid-cols-2 gap-3 text-xs border-t pt-2">
                    {trade.leverage && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">الرافعة</span>
                        <p className="font-medium">{trade.leverage}x</p>
                      </div>
                    )}
                    {trade.dca_level && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">مستوى DCA</span>
                        <p className="font-medium">{trade.dca_level}/{trade.max_dca_level}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Dates */}
                <div className="text-xs text-gray-500 dark:text-gray-400 border-t pt-2">
                  <div className="flex justify-between">
                    <span>فُتح: {formatDate(trade.opened_at)}</span>
                    {trade.closed_at && <span>أُغلق: {formatDate(trade.closed_at)}</span>}
                  </div>
                  {trade.last_sync_at && (
                    <div className="mt-1">
                      <span>آخر مزامنة: {formatDate(trade.last_sync_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={desktopContainerRef}
      className="overflow-x-auto max-h-[520px]"
    >
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs lg:text-sm">الرمز</TableHead>
            <TableHead className="text-xs lg:text-sm">المنصة</TableHead>
            <TableHead className="text-xs lg:text-sm">النوع</TableHead>
            <TableHead className="text-xs lg:text-sm">الحالة</TableHead>
            <TableHead className="text-xs lg:text-sm">المزامنة</TableHead>
            <TableHead className="text-xs lg:text-sm">الاتجاه</TableHead>
            <TableHead className="text-xs lg:text-sm">سعر الدخول</TableHead>
            <TableHead className="text-xs lg:text-sm">السعر الحالي</TableHead>
            <TableHead className="text-xs lg:text-sm">الكمية</TableHead>
            <TableHead className="text-xs lg:text-sm">الاستثمار</TableHead>
            <TableHead className="text-xs lg:text-sm">الرسوم</TableHead>
            <TableHead className="text-xs lg:text-sm">الرافعة</TableHead>
            <TableHead className="text-xs lg:text-sm">مستوى DCA</TableHead>
            <TableHead className="text-xs lg:text-sm">الربح/الخسارة</TableHead>
            <TableHead className="text-xs lg:text-sm">تاريخ الفتح</TableHead>
            <TableHead className="text-xs lg:text-sm">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shouldVirtualize && paddingTop > 0 && (
            <TableRow style={{ height: paddingTop }}>
              <TableCell colSpan={16} className="p-0 border-0" />
            </TableRow>
          )}
          {indexesToRender.map((tradeIndex) => {
            const trade = trades[tradeIndex];
            return (
            <TableRow
              key={trade.id}
              data-index={tradeIndex}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <TableCell className="font-medium text-xs lg:text-sm">{trade.symbol}</TableCell>
              <TableCell>{getPlatformBadge(trade.platform)}</TableCell>
              <TableCell>
                <Badge variant={trade.trade_type === 'spot' ? 'secondary' : 'default'} className="text-xs">
                  {trade.trade_type === 'spot' ? 'سبوت' : 'فيوتشر'}
                </Badge>
              </TableCell>
              <TableCell><StatusBadge status={trade.status} /></TableCell>
              <TableCell>{getSyncStatusBadge(trade.sync_status)}</TableCell>
              <TableCell><SideBadge side={trade.side} /></TableCell>
              <TableCell className="text-xs lg:text-sm">${formatNumber(trade.entry_price)}</TableCell>
              <TableCell className="text-xs lg:text-sm">${formatNumber(trade.current_price)}</TableCell>
              <TableCell className="text-xs lg:text-sm">{formatNumber(trade.quantity)}</TableCell>
              <TableCell className="text-xs lg:text-sm">${formatNumber(trade.total_invested)}</TableCell>
              <TableCell className="text-xs lg:text-sm">
                ${formatNumber((trade.fees || 0) + (trade.commission || 0))}
              </TableCell>
              <TableCell className="text-xs lg:text-sm">{trade.leverage ? `${trade.leverage}x` : '-'}</TableCell>
              <TableCell className="text-xs lg:text-sm">
                {trade.dca_level ? `${trade.dca_level}/${trade.max_dca_level}` : '-'}
              </TableCell>
              <TableCell>
                <div className="flex flex-col text-xs">
                  {trade.realized_pnl !== null && (
                    <span className={trade.realized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                      محقق: ${formatNumber(trade.realized_pnl)}
                    </span>
                  )}
                  {trade.unrealized_pnl !== null && (
                    <span className={trade.unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                      غير محقق: ${formatNumber(trade.unrealized_pnl)}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-xs lg:text-sm">{formatDate(trade.opened_at)}</TableCell>
              <TableCell>
                <CloseTradeButton
                  trade={trade}
                  onCloseTrade={handleCloseTrade}
                  isClosing={isClosing === trade.id}
                />
              </TableCell>
            </TableRow>
            );
          })}
          {shouldVirtualize && paddingBottom > 0 && (
            <TableRow style={{ height: paddingBottom }}>
              <TableCell colSpan={16} className="p-0 border-0" />
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

const TradesTable = memo(TradesTableComponent);
TradesTable.displayName = 'TradesTable';

export default TradesTable;
