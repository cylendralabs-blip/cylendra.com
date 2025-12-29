/**
 * Admin Auto Trading Debug View
 * Admin-only page for debugging auto trading behavior
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
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AutoTradeDetailsDrawer } from '@/components/auto-trades/AutoTradeDetailsDrawer';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock,
  Search,
  Filter,
  Calendar,
  User
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import type { AutoTrade } from '@/hooks/useAutoTrades';

const getStatusBadge = (status: AutoTrade['status']) => {
  switch (status) {
    case 'accepted':
      return <Badge className="bg-green-500 hover:bg-green-600">مقبول</Badge>;
    case 'rejected':
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">مرفوض</Badge>;
    case 'error':
      return <Badge className="bg-red-500 hover:bg-red-600">خطأ</Badge>;
    case 'pending':
      return <Badge className="bg-gray-500 hover:bg-gray-600">قيد الانتظار</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const AdminAutoTradingDebug = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<'accepted' | 'rejected' | 'error' | 'pending' | 'all'>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [searchPair, setSearchPair] = useState('');
  const [searchUserEmail, setSearchUserEmail] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedAutoTrade, setSelectedAutoTrade] = useState<AutoTrade | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const itemsPerPage = 20;

  // Fetch auto trades with admin access (no user filter)
  const { data: autoTrades = [], isLoading } = useQuery({
    queryKey: ['admin-auto-trades', selectedStatus, searchPair, selectedSource, searchUserEmail, dateFrom, dateTo],
    queryFn: async () => {
      let query = (supabase as any)
        .from('auto_trades')
        .select(`
          *,
          user:user_id (
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(500);

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      if (searchPair) {
        query = query.ilike('pair', `%${searchPair}%`);
      }

      if (selectedSource !== 'all') {
        query = query.eq('signal_source', selectedSource);
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom.toISOString());
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching auto trades:', error);
        return [];
      }

      // Filter by user email if provided
      let filtered = data || [];
      if (searchUserEmail) {
        filtered = filtered.filter((trade: any) => {
          const userEmail = trade.user?.email || '';
          return userEmail.toLowerCase().includes(searchUserEmail.toLowerCase());
        });
      }

      return filtered;
    },
    refetchInterval: 30000
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
    setSearchPair('');
    setSearchUserEmail('');
    setDateFrom(undefined);
    setDateTo(undefined);
    setCurrentPage(1);
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Auto Trading Debug View
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          عرض شامل لجميع قرارات التداول التلقائي لجميع المستخدمين (Admin Only)
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            الفلاتر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* User Email Search */}
            <div>
              <Label>البحث بالبريد الإلكتروني</Label>
              <div className="relative">
                <User className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="user@example.com"
                  value={searchUserEmail}
                  onChange={(e) => setSearchUserEmail(e.target.value)}
                  className="pr-8"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <Label>الحالة</Label>
              <Select value={selectedStatus} onValueChange={(v: any) => setSelectedStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="accepted">مقبول</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
                  <SelectItem value="error">خطأ</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Source Filter */}
            <div>
              <Label>مصدر الإشارة</Label>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="ai_ultra">AI Ultra</SelectItem>
                  <SelectItem value="ai_realtime">AI Realtime</SelectItem>
                  <SelectItem value="tradingview">TradingView</SelectItem>
                  <SelectItem value="legacy">Legacy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pair Search */}
            <div>
              <Label>البحث بالزوج</Label>
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
              <Label>من تاريخ</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateFrom ? dateFrom.toLocaleDateString('ar') : 'اختر التاريخ'}
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
              <Label>إلى تاريخ</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateTo ? dateTo.toLocaleDateString('ar') : 'اختر التاريخ'}
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
              مسح الفلاتر
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{autoTrades.length}</div>
            <p className="text-xs text-muted-foreground">إجمالي الصفقات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {autoTrades.filter(t => t.status === 'accepted').length}
            </div>
            <p className="text-xs text-muted-foreground">مقبول</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {autoTrades.filter(t => t.status === 'rejected').length}
            </div>
            <p className="text-xs text-muted-foreground">مرفوض</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {autoTrades.filter(t => t.status === 'error').length}
            </div>
            <p className="text-xs text-muted-foreground">خطأ</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>الصفقات التلقائية (جميع المستخدمين)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : paginatedTrades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد صفقات تلقائية
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الزوج</TableHead>
                      <TableHead>الاتجاه</TableHead>
                      <TableHead>المصدر</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>السبب</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTrades.map((trade: any) => (
                      <TableRow
                        key={trade.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(trade)}
                      >
                        <TableCell className="font-medium">
                          {trade.user?.email || trade.user_id}
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(trade.created_at), {
                            addSuffix: true,
                            locale: ar
                          })}
                        </TableCell>
                        <TableCell className="font-medium">{trade.pair}</TableCell>
                        <TableCell>
                          <Badge variant={trade.direction === 'long' ? 'default' : 'secondary'}>
                            {trade.direction === 'long' ? 'شراء' : 'بيع'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{trade.signal_source}</Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(trade.status)}
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

export default AdminAutoTradingDebug;

