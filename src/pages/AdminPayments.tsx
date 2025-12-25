/**
 * Admin Payments Dashboard
 * 
 * Phase Crypto Payments: Display all crypto payments for admins
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Coins, Search, Filter, RefreshCw, Eye, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import type { CryptoPayment } from '@/services/payments/CryptoPaymentService';

export default function AdminPayments() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');

  // Fetch all payments
  const { data: payments, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-payments', statusFilter, providerFilter],
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (providerFilter !== 'all') {
        query = query.eq('provider', providerFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as CryptoPayment[];
    },
  });

  const filteredPayments = payments?.filter((payment) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      payment.user_id.toLowerCase().includes(search) ||
      payment.plan_code.toLowerCase().includes(search) ||
      payment.currency.toLowerCase().includes(search) ||
      payment.provider_payment_id?.toLowerCase().includes(search) ||
      payment.payment_method.toLowerCase().includes(search)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'finished':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">مكتمل</Badge>;
      case 'confirming':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">قيد التأكيد</Badge>;
      case 'pending':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">قيد الانتظار</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">فشل</Badge>;
      case 'expired':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">منتهي</Badge>;
      case 'refunded':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">مسترد</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = {
    total: payments?.length || 0,
    finished: payments?.filter((p) => p.status === 'finished').length || 0,
    pending: payments?.filter((p) => p.status === 'pending' || p.status === 'confirming').length || 0,
    failed: payments?.filter((p) => p.status === 'failed').length || 0,
    totalAmount: payments?.reduce((sum, p) => sum + Number(p.amount_usd), 0) || 0,
  };

  const exportToCSV = () => {
    if (!filteredPayments || filteredPayments.length === 0) {
      toast({
        title: 'لا توجد بيانات للتصدير',
        variant: 'destructive',
      });
      return;
    }

    const headers = ['التاريخ', 'المستخدم', 'الخطة', 'المبلغ (USD)', 'العملة', 'الحالة', 'الطريقة', 'المزود', 'معرف الدفع'];
    const rows = filteredPayments.map((p) => [
      format(new Date(p.created_at), 'yyyy-MM-dd HH:mm'),
      p.user_id,
      p.plan_code,
      Number(p.amount_usd).toFixed(2),
      p.currency,
      p.status,
      p.payment_method,
      p.provider,
      p.provider_payment_id || 'N/A',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `payments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast({
      title: '✅ تم التصدير',
      description: 'تم تصدير البيانات بنجاح',
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Coins className="w-8 h-8" />
            إدارة المدفوعات
          </h1>
          <p className="text-muted-foreground mt-1">
            عرض وإدارة جميع المدفوعات بالعملات المشفرة
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button variant="outline" onClick={exportToCSV} disabled={!filteredPayments || filteredPayments.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            تصدير CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>إجمالي المدفوعات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>مكتملة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.finished}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>قيد الانتظار</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>فاشلة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>إجمالي المبلغ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>البحث والفلترة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="بحث (معرف المستخدم، الخطة، العملة...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="حالة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="confirming">قيد التأكيد</SelectItem>
                <SelectItem value="finished">مكتمل</SelectItem>
                <SelectItem value="failed">فشل</SelectItem>
                <SelectItem value="expired">منتهي</SelectItem>
                <SelectItem value="refunded">مسترد</SelectItem>
              </SelectContent>
            </Select>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger>
                <SelectValue placeholder="مزود الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المزودين</SelectItem>
                <SelectItem value="NOWPayments">NOWPayments</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المدفوعات</CardTitle>
          <CardDescription>
            {filteredPayments?.length || 0} من {payments?.length || 0} مدفوعات
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">
              خطأ في تحميل البيانات: {error instanceof Error ? error.message : 'خطأ غير معروف'}
            </div>
          ) : !filteredPayments || filteredPayments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد مدفوعات
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-3 text-sm font-semibold">التاريخ</th>
                    <th className="text-right p-3 text-sm font-semibold">المستخدم</th>
                    <th className="text-right p-3 text-sm font-semibold">الخطة</th>
                    <th className="text-right p-3 text-sm font-semibold">المبلغ (USD)</th>
                    <th className="text-right p-3 text-sm font-semibold">العملة</th>
                    <th className="text-right p-3 text-sm font-semibold">الحالة</th>
                    <th className="text-right p-3 text-sm font-semibold">الطريقة</th>
                    <th className="text-right p-3 text-sm font-semibold">المزود</th>
                    <th className="text-right p-3 text-sm font-semibold">معرف الدفع</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 text-sm">
                        {format(new Date(payment.created_at), 'yyyy-MM-dd HH:mm')}
                      </td>
                      <td className="p-3 text-sm font-mono text-xs">{payment.user_id.substring(0, 8)}...</td>
                      <td className="p-3 text-sm font-medium">{payment.plan_code}</td>
                      <td className="p-3 text-sm">${Number(payment.amount_usd).toFixed(2)}</td>
                      <td className="p-3 text-sm">{payment.currency}</td>
                      <td className="p-3 text-sm">{getStatusBadge(payment.status)}</td>
                      <td className="p-3 text-sm">{payment.payment_method}</td>
                      <td className="p-3 text-sm">{payment.provider}</td>
                      <td className="p-3 text-sm font-mono text-xs">
                        {payment.provider_payment_id ? (
                          <span className="text-muted-foreground">{payment.provider_payment_id.substring(0, 12)}...</span>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

