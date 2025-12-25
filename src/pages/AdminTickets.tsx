/**
 * Admin Tickets Dashboard
 * 
 * Phase Admin E: Admin-side ticket management
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Eye, Filter, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAllTickets, type Ticket } from '@/services/support/TicketService';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import CannedResponsesManager from '@/components/admin/CannedResponsesManager';
import SupportMetrics from '@/pages/SupportMetrics';

export default function AdminTickets() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all' as string,
    category: 'all' as string,
    priority: 'all' as string,
    search: '',
  });

  const loadTickets = async () => {
    setLoading(true);
    try {
      const { tickets: ticketsData, error } = await getAllTickets({
        status: filters.status !== 'all' ? filters.status as any : undefined,
        category: filters.category !== 'all' ? filters.category as any : undefined,
        priority: filters.priority !== 'all' ? filters.priority as any : undefined,
        search: filters.search || undefined,
        limit: 100,
      });

      if (error) {
        toast({
          title: '❌ خطأ',
          description: error,
          variant: 'destructive',
        });
      } else {
        setTickets(ticketsData);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحميل التذاكر',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [filters.status, filters.category, filters.priority]);

  const handleSearch = () => {
    loadTickets();
  };

  const getStatusBadge = (status: Ticket['status']) => {
    const configs = {
      open: { label: 'مفتوح', className: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700' },
      pending: { label: 'قيد المعالجة', className: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700' },
      resolved: { label: 'محلول', className: 'bg-green-100 dark:bg-green-900/20 text-green-700' },
      closed: { label: 'مغلق', className: 'bg-gray-100 dark:bg-gray-900/20 text-gray-700' },
    };
    return configs[status];
  };

  const getPriorityBadge = (priority: Ticket['priority']) => {
    const configs = {
      low: { label: 'منخفض', className: 'bg-gray-100 dark:bg-gray-800 text-gray-700' },
      medium: { label: 'متوسط', className: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700' },
      high: { label: 'عالي', className: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700' },
      critical: { label: 'حرج', className: 'bg-red-100 dark:bg-red-900/20 text-red-700' },
    };
    return configs[priority];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ar', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const categoryLabels: Record<string, string> = {
    api_issue: 'مشكلة في API',
    trading_issue: 'مشكلة في التداول',
    signals: 'الإشارات',
    billing: 'الفوترة',
    technical: 'تقني',
    other: 'أخرى',
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">إدارة التذاكر</h1>
        <p className="text-muted-foreground mt-1">
          إدارة جميع تذاكر الدعم
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            الفلاتر والبحث
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex-1">
              <Input
                placeholder="بحث (رقم التذكرة، البريد، الموضوع)..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="open">مفتوح</SelectItem>
                <SelectItem value="pending">قيد المعالجة</SelectItem>
                <SelectItem value="resolved">محلول</SelectItem>
                <SelectItem value="closed">مغلق</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="التصنيف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
              <SelectTrigger>
                <SelectValue placeholder="الأولوية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="low">منخفض</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="high">عالي</SelectItem>
                <SelectItem value="critical">حرج</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              بحث
            </Button>
            <Button variant="outline" onClick={loadTickets}>
              <RefreshCw className="w-4 h-4 mr-2" />
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tickets">التذاكر</TabsTrigger>
          <TabsTrigger value="canned">الردود السريعة</TabsTrigger>
          <TabsTrigger value="metrics">المقاييس</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          {/* Tickets Table */}
          <Card>
            <CardHeader>
              <CardTitle>التذاكر ({tickets.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              لا توجد تذاكر
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم التذكرة</TableHead>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>الموضوع</TableHead>
                  <TableHead>التصنيف</TableHead>
                  <TableHead>الأولوية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>المسؤول</TableHead>
                  <TableHead>آخر تحديث</TableHead>
                  <TableHead>إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => {
                  const statusConfig = getStatusBadge(ticket.status);
                  const priorityConfig = getPriorityBadge(ticket.priority);

                  return (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-sm">
                        {ticket.ticket_number}
                      </TableCell>
                      <TableCell className="text-sm">
                        {ticket.user_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="font-medium max-w-md truncate">
                        {ticket.subject}
                      </TableCell>
                      <TableCell>
                        {categoryLabels[ticket.category] || ticket.category}
                      </TableCell>
                      <TableCell>
                        <Badge className={priorityConfig.className}>
                          {priorityConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig.className}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ticket.assigned_admin_id ? ticket.assigned_admin_id.substring(0, 8) + '...' : 'غير معيّن'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(ticket.updated_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          عرض
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="canned">
          <CannedResponsesManager />
        </TabsContent>

        <TabsContent value="metrics">
          <SupportMetrics />
        </TabsContent>
      </Tabs>
    </div>
  );
}

