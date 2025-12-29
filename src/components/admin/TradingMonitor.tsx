/**
 * Trading Monitor Component
 * 
 * Phase Admin B: Real-time trading monitor for admin panel
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, Search, Filter } from 'lucide-react';
import { getAllOpenPositions, getPositionStatistics, OpenPosition, TradingMonitorFilters } from '@/services/admin/TradingMonitorService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function TradingMonitor() {
  const { toast } = useToast();
  const [positions, setPositions] = useState<OpenPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(15); // seconds
  
  // Filters
  const [filters, setFilters] = useState<TradingMonitorFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Statistics
  const [stats, setStats] = useState({
    totalPositions: 0,
    totalExposure: 0,
    totalUnrealizedPnl: 0,
    positionsByExchange: {} as Record<string, number>,
    positionsByStatus: {} as Record<string, number>,
  });

  const loadPositions = async () => {
    setLoading(true);
    try {
      const appliedFilters: TradingMonitorFilters = { ...filters };
      
      // Apply search query
      if (searchQuery) {
        // Search by symbol or user email
        appliedFilters.symbol = searchQuery;
      }

      const [positionsResult, statsResult] = await Promise.all([
        getAllOpenPositions(appliedFilters),
        getPositionStatistics(),
      ]);

      if (positionsResult.error) {
        toast({
          title: '❌ خطأ',
          description: positionsResult.error,
          variant: 'destructive',
        });
      } else {
        setPositions(positionsResult.positions);
      }

      if (statsResult.error) {
        console.error('Error loading statistics:', statsResult.error);
      } else {
        setStats(statsResult);
      }
    } catch (error) {
      console.error('Error loading positions:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحميل الصفقات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPositions();
  }, [filters]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadPositions();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, filters]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return 'N/A';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">مراقب التداول</h2>
          <p className="text-muted-foreground">
            عرض جميع الصفقات المفتوحة عبر جميع المستخدمين
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPositions}
            disabled={loading}
          >
            <RefreshCw className={cn('w-4 h-4 mr-1', loading && 'animate-spin')} />
            تحديث
          </Button>
          <Badge variant={autoRefresh ? 'default' : 'secondary'}>
            {autoRefresh ? `تحديث تلقائي: ${refreshInterval}ث` : 'تحديث يدوي'}
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي الصفقات المفتوحة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPositions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي التعرض
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalExposure)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي PnL غير المحقق
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              'text-2xl font-bold',
              stats.totalUnrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {formatCurrency(stats.totalUnrealizedPnl)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              الصفقات حسب المنصة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              {Object.entries(stats.positionsByExchange).map(([exchange, count]) => (
                <div key={exchange} className="flex justify-between">
                  <span>{exchange}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            الفلاتر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">البحث</label>
              <div className="relative">
                <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="رمز أو بريد إلكتروني..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">المنصة</label>
              <Select
                value={filters.exchange || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, exchange: value === 'all' ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="binance">Binance</SelectItem>
                  <SelectItem value="okx">OKX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">PnL % (من)</label>
              <Input
                type="number"
                placeholder="-10"
                value={filters.minPnlPercent || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, minPnlPercent: e.target.value ? Number(e.target.value) : undefined }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">PnL % (إلى)</label>
              <Input
                type="number"
                placeholder="10"
                value={filters.maxPnlPercent || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, maxPnlPercent: e.target.value ? Number(e.target.value) : undefined }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>الصفقات المفتوحة ({positions.length})</CardTitle>
          <CardDescription>
            جميع الصفقات المفتوحة عبر النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && positions.length === 0 ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            </div>
          ) : positions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              لا توجد صفقات مفتوحة
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>الرمز</TableHead>
                    <TableHead>الجانب</TableHead>
                    <TableHead>المنصة</TableHead>
                    <TableHead>سعر الدخول</TableHead>
                    <TableHead>السعر الحالي</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>PnL</TableHead>
                    <TableHead>PnL %</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((position) => (
                    <TableRow key={position.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{position.user_email || position.user_id}</p>
                          {position.bot_name && (
                            <p className="text-xs text-muted-foreground">{position.bot_name}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">{position.symbol}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={position.side === 'buy' ? 'default' : 'secondary'}>
                          {position.side === 'buy' ? 'Long' : 'Short'}
                        </Badge>
                      </TableCell>
                      <TableCell>{position.platform || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(position.entry_price)}</TableCell>
                      <TableCell>
                        {position.current_price ? formatCurrency(position.current_price) : 'N/A'}
                      </TableCell>
                      <TableCell>{position.quantity.toFixed(4)}</TableCell>
                      <TableCell>
                        <div className={cn(
                          'flex items-center gap-1',
                          (position.unrealized_pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {(position.unrealized_pnl || 0) >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          <span className="font-medium">
                            {formatCurrency(position.unrealized_pnl || 0)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          'font-medium',
                          (position.unrealized_pnl_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {formatPercent(position.unrealized_pnl_percentage)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{position.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

