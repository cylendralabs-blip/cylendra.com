/**
 * Ticket List Component
 * 
 * Phase Admin E: Display list of tickets
 */

import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { type Ticket } from '@/services/support/TicketService';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface TicketListProps {
  tickets: Ticket[];
  loading: boolean;
  onRefresh?: () => void;
}

export default function TicketList({ tickets, loading, onRefresh }: TicketListProps) {
  const navigate = useNavigate();

  const getStatusBadge = (status: Ticket['status']) => {
    const configs = {
      open: { label: 'مفتوح', variant: 'default' as const, icon: MessageSquare, className: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700' },
      pending: { label: 'قيد المعالجة', variant: 'secondary' as const, icon: Clock, className: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700' },
      resolved: { label: 'محلول', variant: 'outline' as const, icon: CheckCircle, className: 'bg-green-100 dark:bg-green-900/20 text-green-700' },
      closed: { label: 'مغلق', variant: 'outline' as const, icon: XCircle, className: 'bg-gray-100 dark:bg-gray-900/20 text-gray-700' },
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

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          لا توجد تذاكر
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم التذكرة</TableHead>
              <TableHead>الموضوع</TableHead>
              <TableHead>التصنيف</TableHead>
              <TableHead>الأولوية</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>تاريخ الإنشاء</TableHead>
              <TableHead>إجراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => {
              const statusConfig = getStatusBadge(ticket.status);
              const priorityConfig = getPriorityBadge(ticket.priority);
              const StatusIcon = statusConfig.icon;

              return (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono text-sm">
                    {ticket.ticket_number}
                  </TableCell>
                  <TableCell className="font-medium">
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
                    <Badge className={cn(statusConfig.className, 'flex items-center gap-1 w-fit')}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(ticket.created_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/dashboard/support/tickets/${ticket.id}`)}
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
      </CardContent>
    </Card>
  );
}

