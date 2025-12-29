
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import TradingStats from '@/components/trading-history/TradingStats';
import TradesTable from '@/components/trading-history/TradesTable';
import DCAOrdersTable from '@/components/trading-history/DCAOrdersTable';
import StatusFilter from '@/components/trading-history/StatusFilter';
import PlatformFilter from '@/components/trading-history/PlatformFilter';
import RealDataActions from '@/components/trading-history/RealDataActions';
import { useTradingHistory } from '@/hooks/useTradingHistory';
import { useTradeActions } from '@/hooks/useTradeActions';
import { useRealTimePriceUpdates } from '@/hooks/useRealTimePriceUpdates';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';

const TradingHistory = () => {
  const { t } = useTranslation('trading_history');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const itemsPerPage = 10;
  const isMobile = useIsMobile();

  const { trades, dcaOrders, availablePlatforms, isLoading } = useTradingHistory(selectedStatus, selectedPlatform);
  const { handleSyncPlatform, isSyncing } = useTradeActions();
  const { livePrices, isUpdating, refetchPrices } = useRealTimePriceUpdates(trades || []);

  // Phase X: Filter auto trades
  const [activeTab, setActiveTab] = useState<string>('trades');

  // Phase X: Filter auto trades (handle if signal_source column doesn't exist)
  const filteredTrades = activeTab === 'auto'
    ? trades?.filter((t: any) => {
      // If signal_source exists, filter by it; otherwise return empty array
      return t.signal_source === 'auto';
    }) || []
    : trades || [];

  const paginatedTrades = filteredTrades.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) || [];

  const totalPages = Math.ceil((filteredTrades.length || 0) / itemsPerPage);

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-7xl mx-auto">
      {/* العنوان والإحصائيات */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {t('subtitle')}
            </p>
          </div>

          {availablePlatforms.length > 0 && (
            <div className={`${isMobile ? 'hidden' : 'block'}`}>
              <PlatformFilter
                selectedPlatform={selectedPlatform}
                onPlatformChange={setSelectedPlatform}
                onSyncPlatform={handleSyncPlatform}
                isSyncing={isSyncing}
                platforms={availablePlatforms}
              />
            </div>
          )}
        </div>

        {/* فلترة المنصات للموبايل */}
        {isMobile && availablePlatforms.length > 0 && (
          <div className="mb-4">
            <PlatformFilter
              selectedPlatform={selectedPlatform}
              onPlatformChange={setSelectedPlatform}
              onSyncPlatform={handleSyncPlatform}
              isSyncing={isSyncing}
              platforms={availablePlatforms}
            />
          </div>
        )}
      </div>

      {/* أدوات البيانات الحية */}
      <RealDataActions
        availablePlatforms={availablePlatforms}
        onRefreshPrices={refetchPrices}
        isUpdatingPrices={isUpdating}
        livePrices={livePrices}
      />

      <TradingStats trades={trades || []} selectedPlatform={selectedPlatform} />

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <CardTitle className="text-lg sm:text-xl">
              {t('trade_log')}
              {selectedPlatform !== 'all' && (
                <span className="text-sm font-normal text-muted-foreground mr-2">
                  - {selectedPlatform}
                </span>
              )}
            </CardTitle>
            <StatusFilter
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-3 sm:px-0">
              <TabsList className="grid w-full grid-cols-3 h-9 sm:h-10">
                <TabsTrigger value="trades" className="text-xs sm:text-sm">
                  {t('tabs.main_trades')}
                  {trades && <span className="mr-1">({trades.length})</span>}
                </TabsTrigger>
                <TabsTrigger value="auto" className="text-xs sm:text-sm">
                  {t('tabs.auto_trades')}
                  {trades && (
                    <span className="mr-1">
                      ({trades.filter((t: any) => t.signal_source === 'auto').length})
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="dca" className="text-xs sm:text-sm">
                  {t('tabs.dca_orders')}
                  {dcaOrders && <span className="mr-1">({dcaOrders.length})</span>}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="trades" className="mt-3 sm:mt-6">
              <TradesTable trades={paginatedTrades} isLoading={isLoading} />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 px-3 sm:px-0">
                  <Pagination>
                    <PaginationContent className="flex-wrap justify-center gap-1">
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={`h-8 px-2 text-xs sm:h-10 sm:px-4 sm:text-sm ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
                        />
                      </PaginationItem>

                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let page;
                        if (totalPages <= 5) {
                          page = i + 1;
                        } else if (currentPage <= 3) {
                          page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + i;
                        } else {
                          page = currentPage - 2 + i;
                        }

                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="h-8 w-8 text-xs sm:h-10 sm:w-10 sm:text-sm"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          className={`h-8 px-2 text-xs sm:h-10 sm:px-4 sm:text-sm ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </TabsContent>

            <TabsContent value="auto" className="mt-3 sm:mt-6">
              {filteredTrades.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('no_auto_trades')}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('auto_trades_info')}
                  </p>
                </div>
              ) : (
                <>
                  <TradesTable trades={paginatedTrades} isLoading={isLoading} />
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-4 px-3 sm:px-0">
                      <Pagination>
                        <PaginationContent className="flex-wrap justify-center gap-1">
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              className={`h-8 px-2 text-xs sm:h-10 sm:px-4 sm:text-sm ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
                            />
                          </PaginationItem>

                          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let page;
                            if (totalPages <= 5) {
                              page = i + 1;
                            } else if (currentPage <= 3) {
                              page = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              page = totalPages - 4 + i;
                            } else {
                              page = currentPage - 2 + i;
                            }

                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => setCurrentPage(page)}
                                  isActive={currentPage === page}
                                  className="h-8 w-8 text-xs sm:h-10 sm:w-10 sm:text-sm"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                              className={`h-8 px-2 text-xs sm:h-10 sm:px-4 sm:text-sm ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="dca" className="mt-3 sm:mt-6">
              <DCAOrdersTable dcaOrders={dcaOrders} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TradingHistory;
