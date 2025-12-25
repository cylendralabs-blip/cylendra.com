/**
 * Auto Trade History Page
 * Full history of auto trades with filters and details drawer
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { useAutoTrades, type AutoTrade } from '@/hooks/useAutoTrades';
import { AutoTradeDetailsDrawer } from '@/components/auto-trades/AutoTradeDetailsDrawer';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Calendar
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

const getStatusBadge = (status: AutoTrade['status'], t: any) => {
  const statusText = t(`filters.status_values.${status}`, status);
  switch (status) {
    case 'accepted':
      return <Badge className="bg-green-500 hover:bg-green-600">{statusText}</Badge>;
    case 'rejected':
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">{statusText}</Badge>;
    case 'error':
      return <Badge className="bg-red-500 hover:bg-red-600">{statusText}</Badge>;
    case 'pending':
      return <Badge className="bg-gray-500 hover:bg-gray-600">{statusText}</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const getStatusIcon = (status: AutoTrade['status']) => {
  switch (status) {
    case 'accepted':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'rejected':
      return <XCircle className="h-4 w-4 text-yellow-500" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-gray-500" />;
    default:
      return null;
  }
};

const AutoTradeHistory = () => {
  const { t, i18n } = useTranslation('auto_trade');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<'accepted' | 'rejected' | 'error' | 'pending' | 'all'>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedDirection, setSelectedDirection] = useState<'long' | 'short' | 'all'>('all');
  const [searchPair, setSearchPair] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedAutoTrade, setSelectedAutoTrade] = useState<AutoTrade | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const itemsPerPage = 20;

  const { data: autoTrades = [], isLoading } = useAutoTrades({
    status: selectedStatus === 'all' ? undefined : selectedStatus,
    pair: searchPair || undefined,
    signalSource: selectedSource === 'all' ? undefined : selectedSource,
    direction: selectedDirection === 'all' ? undefined : selectedDirection,
    dateFrom: dateFrom?.toISOString(),
    dateTo: dateTo?.toISOString()
  });

  const paginatedTrades = autoTrades.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(autoTrades.length / itemsPerPage);

  const handleRowClick = (autoTrade: AutoTrade) => {
    setSelectedAutoTrade(autoTrade);
    setIsDrawerOpen(true);
  };

  const handleClearFilters = () => {
    setSelectedStatus('all');
    setSelectedSource('all');
    setSelectedDirection('all');
    setSearchPair('');
    setDateFrom(undefined);
    setDateTo(undefined);
    setCurrentPage(1);
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('title')}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          {t('subtitle')}
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('filters.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <Label>{t('filters.status')}</Label>
              <Select value={selectedStatus} onValueChange={(v: any) => setSelectedStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.all')}</SelectItem>
                  <SelectItem value="accepted">{t('filters.status_values.accepted')}</SelectItem>
                  <SelectItem value="rejected">{t('filters.status_values.rejected')}</SelectItem>
                  <SelectItem value="error">{t('filters.status_values.error')}</SelectItem>
                  <SelectItem value="pending">{t('filters.status_values.pending')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Source Filter */}
            <div>
              <Label>{t('filters.source')}</Label>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.all')}</SelectItem>
                  <SelectItem value="ai_ultra">AI Ultra</SelectItem>
                  <SelectItem value="ai_realtime">AI Realtime</SelectItem>
                  <SelectItem value="tradingview">TradingView</SelectItem>
                  <SelectItem value="legacy">Legacy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Direction Filter */}
            <div>
              <Label>{t('filters.direction')}</Label>
              <Select value={selectedDirection} onValueChange={(v: any) => setSelectedDirection(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.all')}</SelectItem>
                  <SelectItem value="long">{t('filters.direction_values.long')}</SelectItem>
                  <SelectItem value="short">{t('filters.direction_values.short')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pair Search */}
            <div>
              <Label>{t('filters.search_pair')}</Label>
              <div className="relative">
                <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="BTC/USDT"
                  value={searchPair}
                  onChange={(e) => setSearchPair(e.target.value)}
                  className="pr-8"
                />
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label>{t('filters.date_from')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateFrom ? dateFrom.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US') : t('filters.select_date')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>{t('filters.date_to')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateTo ? dateTo.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US') : t('filters.select_date')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4">
            <Button variant="outline" onClick={handleClearFilters}>
              {t('filters.clear_filters')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{autoTrades.length}</div>
            <p className="text-xs text-muted-foreground">{t('stats.total_trades')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {autoTrades.filter(t => t.status === 'accepted').length}
            </div>
            <p className="text-xs text-muted-foreground">{t('stats.accepted')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {autoTrades.filter(t => t.status === 'rejected').length}
            </div>
            <p className="text-xs text-muted-foreground">{t('stats.rejected')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {autoTrades.filter(t => t.status === 'error').length}
            </div>
            <p className="text-xs text-muted-foreground">{t('stats.error')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('table.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t('table.loading')}</div>
          ) : paginatedTrades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('table.no_trades')}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('table.date')}</TableHead>
                      <TableHead>{t('table.pair')}</TableHead>
                      <TableHead>{t('table.direction')}</TableHead>
                      <TableHead>{t('table.source')}</TableHead>
                      <TableHead>{t('table.status')}</TableHead>
                      <TableHead>{t('table.reason')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTrades.map((trade) => (
                      <TableRow
                        key={trade.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(trade)}
                      >
                        <TableCell>
                          {formatDistanceToNow(new Date(trade.created_at), {
                            addSuffix: true,
                            locale: i18n.language === 'ar' ? ar : enUS
                          })}
                        </TableCell>
                        <TableCell className="font-medium">{trade.pair}</TableCell>
                        <TableCell>
                          <Badge variant={trade.direction === 'long' ? 'default' : 'secondary'}>
                            {t(`filters.direction_values.${trade.direction}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{trade.signal_source}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(trade.status)}
                            {getStatusBadge(trade.status, t)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {trade.reason_code || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Drawer */}
      <AutoTradeDetailsDrawer
        autoTrade={selectedAutoTrade}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  );
};

export default AutoTradeHistory;

