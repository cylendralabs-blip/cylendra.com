/**
 * User Subscription Detail Modal
 * 
 * Phase Admin Billing: Display user subscription details and actions
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Loader2, CreditCard, Calendar, AlertCircle, X, RefreshCw, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  changeUserPlan,
  renewSubscription,
  extendSubscription,
  activateTrial,
  cancelSubscription,
  downgradeToFree,
  markPaymentReceived,
  type UserSubscription,
} from '@/services/admin/BillingService';
import { getUserPayments } from '@/services/payments/CryptoPaymentService';
import { format } from 'date-fns';
import type { PlanCode, PaymentMethod } from '@/core/plans/planTypes';

interface UserSubscriptionModalProps {
  subscription: UserSubscription;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserSubscriptionModal({
  subscription,
  isOpen,
  onClose,
}: UserSubscriptionModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // Change Plan State
  const [newPlanCode, setNewPlanCode] = useState<PlanCode>(subscription.plan_code);
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>(subscription.payment_method || 'manual');
  const [newExpiresAt, setNewExpiresAt] = useState<string>(
    subscription.expires_at ? format(new Date(subscription.expires_at), 'yyyy-MM-dd') : ''
  );

  // Renew State
  const [renewalMonths, setRenewalMonths] = useState<number>(1);
  const [renewalPaymentMethod, setRenewalPaymentMethod] = useState<PaymentMethod>('manual');

  // Extend State
  const [extendDays, setExtendDays] = useState<number>(7);

  // Trial State
  const [trialPlanCode, setTrialPlanCode] = useState<PlanCode>('BASIC');
  const [trialDays, setTrialDays] = useState<number>(7);

  // Mark Paid State
  const [markPaidMethod, setMarkPaidMethod] = useState<PaymentMethod>('manual');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [paymentGateway, setPaymentGateway] = useState<string>('');

  const handleChangePlan = async () => {
    setLoading(true);
    try {
      const { success, error } = await changeUserPlan(
        subscription.user_id,
        newPlanCode,
        newPaymentMethod,
        newExpiresAt || null
      );

      if (success) {
        toast({
          title: '✅ نجح',
          description: 'تم تغيير الخطة بنجاح',
        });
        onClose();
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في تغيير الخطة',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '❌ خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async () => {
    setLoading(true);
    try {
      const { success, error } = await renewSubscription(
        subscription.user_id,
        renewalMonths,
        renewalPaymentMethod
      );

      if (success) {
        toast({
          title: '✅ نجح',
          description: 'تم تجديد الاشتراك بنجاح',
        });
        onClose();
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في تجديد الاشتراك',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '❌ خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExtend = async () => {
    setLoading(true);
    try {
      const { success, error } = await extendSubscription(subscription.user_id, extendDays);

      if (success) {
        toast({
          title: '✅ نجح',
          description: `تم تمديد الاشتراك بـ ${extendDays} أيام بنجاح`,
        });
        onClose();
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في تمديد الاشتراك',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '❌ خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivateTrial = async () => {
    setLoading(true);
    try {
      const { success, error } = await activateTrial(
        subscription.user_id,
        trialPlanCode,
        trialDays
      );

      if (success) {
        toast({
          title: '✅ نجح',
          description: `تم تفعيل تجربة ${trialPlanCode} لمدة ${trialDays} أيام بنجاح`,
        });
        onClose();
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في تفعيل التجربة',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '❌ خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('هل أنت متأكد من إلغاء الاشتراك؟')) {
      return;
    }

    setLoading(true);
    try {
      const { success, error } = await cancelSubscription(subscription.user_id);

      if (success) {
        toast({
          title: '✅ نجح',
          description: 'تم إلغاء الاشتراك بنجاح',
        });
        onClose();
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في إلغاء الاشتراك',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '❌ خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDowngrade = async () => {
    if (!confirm('هل أنت متأكد من التخفيض إلى الخطة المجانية؟')) {
      return;
    }

    setLoading(true);
    try {
      const { success, error } = await downgradeToFree(subscription.user_id);

      if (success) {
        toast({
          title: '✅ نجح',
          description: 'تم التخفيض إلى الخطة المجانية بنجاح',
        });
        onClose();
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في التخفيض',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '❌ خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    setLoading(true);
    try {
      const { success, error } = await markPaymentReceived(
        subscription.user_id,
        markPaidMethod,
        paymentReference || undefined,
        transactionId || undefined,
        paymentGateway || undefined
      );

      if (success) {
        toast({
          title: '✅ نجح',
          description: 'تم تسجيل الدفع بنجاح',
        });
        onClose();
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في تسجيل الدفع',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '❌ خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load payments when payment history tab is opened
  useEffect(() => {
    if (activeTab === 'payments' && isOpen) {
      loadPayments();
    }
  }, [activeTab, isOpen]);

  const loadPayments = async () => {
    setPaymentsLoading(true);
    try {
      const { payments: userPayments, error } = await getUserPayments(subscription.user_id);
      if (error) {
        toast({
          title: '❌ خطأ',
          description: error,
          variant: 'destructive',
        });
      } else {
        setPayments(userPayments || []);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setPaymentsLoading(false);
    }
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

  const getPaymentMethodBadge = (paymentMethod: string) => {
    if (paymentMethod === 'beta_free') {
      return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">Beta Free</Badge>;
    }
    return <Badge variant="outline">{paymentMethod || 'N/A'}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>تفاصيل الاشتراك</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            {subscription.email}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">التفاصيل</TabsTrigger>
            <TabsTrigger value="actions">الإجراءات</TabsTrigger>
            <TabsTrigger value="payments">سجل الدفع</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>البريد الإلكتروني</Label>
                <p className="text-sm font-medium">{subscription.email}</p>
              </div>
              <div>
                <Label>معرف المستخدم</Label>
                <p className="text-sm font-mono text-xs">{subscription.user_id}</p>
              </div>
              <div>
                <Label>الخطة الحالية</Label>
                <p className="text-sm font-medium">{subscription.plan_name} ({subscription.plan_code})</p>
              </div>
              <div>
                <Label>الحالة</Label>
                <div className="mt-1">{getStatusBadge(subscription.status)}</div>
              </div>
              <div>
                <Label>تاريخ التفعيل</Label>
                <p className="text-sm">
                  {subscription.activated_at
                    ? format(new Date(subscription.activated_at), 'yyyy-MM-dd HH:mm')
                    : 'N/A'}
                </p>
              </div>
              <div>
                <Label>تاريخ الانتهاء</Label>
                <p className="text-sm">
                  {subscription.expires_at
                    ? format(new Date(subscription.expires_at), 'yyyy-MM-dd HH:mm')
                    : 'دائم'}
                </p>
              </div>
              <div>
                <Label>الأيام المتبقية</Label>
                <p className="text-sm font-medium">
                  {subscription.days_remaining !== null
                    ? subscription.days_remaining > 0
                      ? `${subscription.days_remaining} أيام`
                      : 'منتهي'
                    : 'دائم'}
                </p>
              </div>
              <div>
                <Label>طريقة الدفع</Label>
                <div className="mt-1">{getPaymentMethodBadge(subscription.payment_method || 'N/A')}</div>
              </div>
              {subscription.payment_reference && (
                <div>
                  <Label>مرجع الدفع</Label>
                  <p className="text-sm font-mono text-xs">{subscription.payment_reference}</p>
                </div>
              )}
              {subscription.transaction_id && (
                <div>
                  <Label>معرف المعاملة</Label>
                  <p className="text-sm font-mono text-xs">{subscription.transaction_id}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            {/* Change Plan */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                تغيير الخطة
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>الخطة الجديدة</Label>
                  <Select value={newPlanCode} onValueChange={(v) => setNewPlanCode(v as PlanCode)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FREE">FREE</SelectItem>
                      <SelectItem value="BASIC">BASIC</SelectItem>
                      <SelectItem value="PREMIUM">PREMIUM</SelectItem>
                      <SelectItem value="PRO">PRO</SelectItem>
                      <SelectItem value="VIP">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>طريقة الدفع</Label>
                  <Select value={newPaymentMethod} onValueChange={(v) => setNewPaymentMethod(v as PaymentMethod)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">يدوي</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>تاريخ الانتهاء (اختياري)</Label>
                  <Input
                    type="date"
                    value={newExpiresAt}
                    onChange={(e) => setNewExpiresAt(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleChangePlan} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                تغيير الخطة
              </Button>
            </div>

            {/* Renew Subscription */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                تجديد الاشتراك
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>فترة التجديد (بالأشهر)</Label>
                  <Select value={renewalMonths.toString()} onValueChange={(v) => setRenewalMonths(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">شهر واحد</SelectItem>
                      <SelectItem value="3">3 أشهر</SelectItem>
                      <SelectItem value="6">6 أشهر</SelectItem>
                      <SelectItem value="12">سنة واحدة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>طريقة الدفع</Label>
                  <Select value={renewalPaymentMethod} onValueChange={(v) => setRenewalPaymentMethod(v as PaymentMethod)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">يدوي</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleRenew} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                تجديد الاشتراك
              </Button>
            </div>

            {/* Extend Subscription */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                تمديد الاشتراك
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button
                  variant={extendDays === 7 ? 'default' : 'outline'}
                  onClick={() => setExtendDays(7)}
                >
                  +7 أيام
                </Button>
                <Button
                  variant={extendDays === 14 ? 'default' : 'outline'}
                  onClick={() => setExtendDays(14)}
                >
                  +14 يوم
                </Button>
                <Button
                  variant={extendDays === 30 ? 'default' : 'outline'}
                  onClick={() => setExtendDays(30)}
                >
                  +30 يوم
                </Button>
                <div>
                  <Label>مخصص</Label>
                  <Input
                    type="number"
                    value={extendDays}
                    onChange={(e) => setExtendDays(Number(e.target.value))}
                    min={1}
                  />
                </div>
              </div>
              <Button onClick={handleExtend} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                تمديد بـ {extendDays} أيام
              </Button>
            </div>

            {/* Activate Trial */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                تفعيل تجربة مجانية
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>خطة التجربة</Label>
                  <Select value={trialPlanCode} onValueChange={(v) => setTrialPlanCode(v as PlanCode)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BASIC">BASIC</SelectItem>
                      <SelectItem value="PREMIUM">PREMIUM</SelectItem>
                      <SelectItem value="PRO">PRO</SelectItem>
                      <SelectItem value="VIP">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>مدة التجربة (بالأيام)</Label>
                  <Select value={trialDays.toString()} onValueChange={(v) => setTrialDays(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 أيام</SelectItem>
                      <SelectItem value="14">14 يوم</SelectItem>
                      <SelectItem value="30">30 يوم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleActivateTrial} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                تفعيل تجربة {trialPlanCode} لمدة {trialDays} أيام
              </Button>
            </div>

            {/* Mark Payment Received */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                تسجيل الدفع
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>طريقة الدفع</Label>
                  <Select value={markPaidMethod} onValueChange={(v) => setMarkPaidMethod(v as PaymentMethod)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">يدوي</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>مرجع الدفع (اختياري)</Label>
                  <Input
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="رقم المرجع"
                  />
                </div>
                <div>
                  <Label>معرف المعاملة (اختياري)</Label>
                  <Input
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Transaction ID"
                  />
                </div>
                <div>
                  <Label>بوابة الدفع (اختياري)</Label>
                  <Input
                    value={paymentGateway}
                    onChange={(e) => setPaymentGateway(e.target.value)}
                    placeholder="stripe, crypto, etc."
                  />
                </div>
              </div>
              <Button onClick={handleMarkPaid} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                تسجيل الدفع
              </Button>
            </div>

            {/* Cancel & Downgrade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-red-400">إلغاء الاشتراك</h3>
                <p className="text-sm text-muted-foreground">
                  سيتم إلغاء الاشتراك ولكن سيتم الاحتفاظ بالخطة
                </p>
                <Button variant="destructive" onClick={handleCancel} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  إلغاء الاشتراك
                </Button>
              </div>
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-orange-400">التخفيض إلى FREE</h3>
                <p className="text-sm text-muted-foreground">
                  سيتم تغيير الخطة إلى FREE وإلغاء جميع الميزات المدفوعة
                </p>
                <Button variant="outline" onClick={handleDowngrade} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  التخفيض إلى FREE
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Coins className="w-5 h-5" />
                سجل المدفوعات
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={loadPayments}
                disabled={paymentsLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${paymentsLoading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
            </div>

            {paymentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد مدفوعات مسجلة
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-2 text-sm font-semibold">التاريخ</th>
                      <th className="text-right p-2 text-sm font-semibold">الخطة</th>
                      <th className="text-right p-2 text-sm font-semibold">المبلغ (USD)</th>
                      <th className="text-right p-2 text-sm font-semibold">العملة</th>
                      <th className="text-right p-2 text-sm font-semibold">الحالة</th>
                      <th className="text-right p-2 text-sm font-semibold">الطريقة</th>
                      <th className="text-right p-2 text-sm font-semibold">المزود</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 text-sm">
                          {format(new Date(payment.created_at), 'yyyy-MM-dd HH:mm')}
                        </td>
                        <td className="p-2 text-sm font-medium">{payment.plan_code}</td>
                        <td className="p-2 text-sm">${Number(payment.amount_usd).toFixed(2)}</td>
                        <td className="p-2 text-sm">{payment.currency}</td>
                        <td className="p-2 text-sm">
                          {getPaymentStatusBadge(payment.status)}
                        </td>
                        <td className="p-2 text-sm">{payment.payment_method}</td>
                        <td className="p-2 text-sm">{payment.provider}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

