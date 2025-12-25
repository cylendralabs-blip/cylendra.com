/**
 * Admin Billing Dashboard
 * 
 * Phase Admin Billing: Full Subscription & Payment Control Layer
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CreditCard, Search, Filter, RefreshCw, Eye, AlertTriangle } from 'lucide-react';
import { getAllUserSubscriptions, getBillingAnalytics, type UserSubscription, type BillingAnalytics } from '@/services/admin/BillingService';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import UserSubscriptionModal from '@/components/admin/UserSubscriptionModal';
import BillingAnalyticsSummary from '@/components/admin/BillingAnalyticsSummary';
import { format } from 'date-fns';

export default function AdminBilling() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserSubscription | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch subscriptions
  const { data: subscriptionsData, isLoading: loadingSubscriptions, refetch: refetchSubscriptions } = useQuery({
    queryKey: ['admin-billing-subscriptions'],
    queryFn: async () => {
      const { subscriptions, error } = await getAllUserSubscriptions();
      if (error) {
        toast({
          title: '❌ خطأ',
          description: error,
          variant: 'destructive',
        });
        throw new Error(error);
      }
      return subscriptions;
    },
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    staleTime: 10 * 1000, // Consider data stale after 10 seconds
  });

  // Fetch analytics
  const { data: analytics, isLoading: loadingAnalytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ['admin-billing-analytics'],
    queryFn: async () => {
      const { analytics: analyticsData, error } = await getBillingAnalytics();
      if (error) {
        console.error('Error fetching analytics:', error);
        return null;
      }
      return analyticsData;
    },
    refetchInterval: 60 * 1000, // Auto-refresh every minute
    staleTime: 30 * 1000,
  });

  // Filter subscriptions
  const filteredSubscriptions = (subscriptionsData || []).filter((sub: UserSubscription) => {
    const matchesSearch = sub.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = planFilter === 'all' || sub.plan_code === planFilter;
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const handleViewDetails = (subscription: UserSubscription) => {
    setSelectedUser(subscription);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    // Refetch data after modal closes
    refetchSubscriptions();
    refetchAnalytics();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">نشط</Badge>;
      case 'trial':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">تجريبي</Badge>;
      case 'expired':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">منتهي</Badge>;
      case 'canceled':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">ملغي</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (planCode: string) => {
    const colors: Record<string, string> = {
      FREE: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
      BASIC: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      PREMIUM: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      PRO: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
      VIP: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    };
    return (
      <Badge className={colors[planCode] || 'bg-gray-500/20 text-gray-400 border-gray-500/50'}>
        {planCode}
      </Badge>
    );
  };

  const getDaysRemainingBadge = (daysRemaining: number | null, status: string) => {
    if (status !== 'active' && status !== 'trial') {
      return null;
    }

    if (daysRemaining === null) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">دائم</Badge>;
    }

    if (daysRemaining < 0) {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">منتهي</Badge>;
    }

    if (daysRemaining <= 5) {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {daysRemaining} أيام
        </Badge>
      );
    }

    return <Badge variant="outline">{daysRemaining} أيام</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="w-8 h-8 text-primary" />
            إدارة الاشتراكات والدفع
          </h1>
          <p className="text-muted-foreground mt-1">
            عرض وإدارة جميع اشتراكات المستخدمين
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            refetchSubscriptions();
            refetchAnalytics();
          }}
          disabled={loadingSubscriptions || loadingAnalytics}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loadingSubscriptions || loadingAnalytics ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Analytics Summary */}
      {analytics && <BillingAnalyticsSummary analytics={analytics} />}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>البحث والتصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="البحث بالبريد الإلكتروني..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="الخطة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الخطط</SelectItem>
                <SelectItem value="FREE">FREE</SelectItem>
                <SelectItem value="BASIC">BASIC</SelectItem>
                <SelectItem value="PREMIUM">PREMIUM</SelectItem>
                <SelectItem value="PRO">PRO</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="trial">تجريبي</SelectItem>
                <SelectItem value="expired">منتهي</SelectItem>
                <SelectItem value="canceled">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>جميع الاشتراكات ({filteredSubscriptions.length})</CardTitle>
          <CardDescription>
            قائمة بجميع المستخدمين واشتراكاتهم
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSubscriptions ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              <p className="text-muted-foreground mt-2">جاري تحميل الاشتراكات...</p>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">لا توجد اشتراكات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>الخطة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ التفعيل</TableHead>
                    <TableHead>تاريخ الانتهاء</TableHead>
                    <TableHead>الأيام المتبقية</TableHead>
                    <TableHead>طريقة الدفع</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.user_id}>
                      <TableCell className="font-medium">{subscription.email}</TableCell>
                      <TableCell>{getPlanBadge(subscription.plan_code)}</TableCell>
                      <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                      <TableCell>
                        {subscription.activated_at
                          ? format(new Date(subscription.activated_at), 'yyyy-MM-dd')
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {subscription.expires_at
                          ? format(new Date(subscription.expires_at), 'yyyy-MM-dd')
                          : 'دائم'}
                      </TableCell>
                      <TableCell>
                        {getDaysRemainingBadge(subscription.days_remaining, subscription.status)}
                      </TableCell>
                      <TableCell>
                        {(subscription.payment_method as string) === 'beta_free' ? (
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                            Beta Free
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            {subscription.payment_method || 'N/A'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(subscription)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          التفاصيل
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Subscription Modal */}
      {selectedUser && (
        <UserSubscriptionModal
          subscription={selectedUser}
          isOpen={isModalOpen}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

