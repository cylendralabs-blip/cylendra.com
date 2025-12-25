/**
 * Payment Method Selector Component
 * 
 * Phase Crypto Payments: Select payment method (Stripe or Crypto)
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Coins, Check, X, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createCryptoPayment } from '@/services/payments/CryptoPaymentService';
import { activateBetaPlan } from '@/services/billing/BetaBillingService';
import { isBetaFreeMode } from '@/services/billing/BillingConfigService';
import type { PlanCode } from '@/core/plans/planTypes';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

interface PaymentMethodSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  planCode: PlanCode;
  planName: string;
  amount: number;
}

type PaymentMethod = 'stripe' | 'crypto';

export default function PaymentMethodSelector({
  isOpen,
  onClose,
  planCode,
  planName,
  amount,
}: PaymentMethodSelectorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [stripeAvailable, setStripeAvailable] = useState(false);
  const [cryptoAvailable, setCryptoAvailable] = useState(false);
  const [betaMode, setBetaMode] = useState(false);

  // Check payment method availability
  useEffect(() => {
    const checkAvailability = async () => {
      if (!isOpen || !user) return;

      // Check billing mode
      const isBeta = await isBetaFreeMode();
      setBetaMode(isBeta);

      if (isBeta) {
        // In beta mode, show beta activation option
        setStripeAvailable(false);
        setCryptoAvailable(false);
        return;
      }

      // Check Stripe availability (placeholder - implement actual check)
      // For now, we'll assume Stripe is not configured yet
      setStripeAvailable(false);
      
      // Check Crypto availability by trying to create a test payment
      // If it fails with "not configured", crypto is not available
      try {
        const { error } = await createCryptoPayment({
          userId: user.id,
          planCode,
          currency: 'USDTTRC20',
        });
        // If error is about configuration, crypto is not available
        const isConfigError = error?.includes('API key not configured') || 
                             error?.includes('NOWPAYMENTS_NOT_CONFIGURED');
        setCryptoAvailable(!isConfigError && !error);
      } catch {
        setCryptoAvailable(false);
      }
    };
    
    checkAvailability();
  }, [isOpen, user, planCode]);

  const handleBetaActivation = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { success, data, error } = await activateBetaPlan(planCode);

      if (success && data) {
        toast({
          title: '✅ تم التفعيل بنجاح',
          description: `تم تفعيل ${planName} مجاناً في وضع Beta. ستنتهي صلاحيتك بعد 60 يوم.`,
        });
        
        // Invalidate user plan query to refresh
        queryClient.invalidateQueries({ queryKey: ['user-plan'] });
        
        onClose();
        // Optionally navigate to subscription page
        navigate('/dashboard/subscription');
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في تفعيل الخطة',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error activating beta plan:', error);
      toast({
        title: '❌ خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod || !user) return;

    setLoading(true);
    try {
      if (selectedMethod === 'crypto') {
        const { payment, payment_url, error } = await createCryptoPayment({
          userId: user.id,
          planCode,
          currency: 'USDTTRC20',
        });

        if (error || !payment_url) {
          const isConfigError = error?.includes('API key not configured') || 
                               error?.includes('NOWPAYMENTS_NOT_CONFIGURED');
          
          if (isConfigError) {
            toast({
              title: '⚠️ غير متاح حالياً',
              description: 'خدمة الدفع بالعملات المشفرة قيد الإعداد. سيتم تفعيلها قريباً.',
              variant: 'default',
            });
          } else {
            toast({
              title: '❌ خطأ',
              description: error || 'فشل في إنشاء الدفع',
              variant: 'destructive',
            });
          }
          setLoading(false);
          return;
        }

        // Redirect to payment URL
        window.location.href = payment_url;
      } else if (selectedMethod === 'stripe') {
        // TODO: Implement Stripe payment flow
        toast({
          title: 'قريباً',
          description: 'الدفع بالبطاقة سيكون متاحاً قريباً',
          variant: 'default',
        });
        setLoading(false);
        // For now, redirect to subscription page
        // navigate('/dashboard/subscription');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: '❌ خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>اختر طريقة الدفع</DialogTitle>
          <DialogDescription>
            {planName} - ${amount}/شهر
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Stripe Payment Option */}
          <Card 
            className={`cursor-pointer transition-all ${
              selectedMethod === 'stripe' 
                ? 'ring-2 ring-primary border-primary' 
                : 'hover:border-primary/50'
            } ${!stripeAvailable ? 'opacity-50' : ''}`}
            onClick={() => stripeAvailable && setSelectedMethod('stripe')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    selectedMethod === 'stripe' ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">الدفع بالبطاقة</CardTitle>
                    <CardDescription>
                      Visa, Mastercard, American Express
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!stripeAvailable && (
                    <Badge variant="outline" className="text-xs">
                      قريباً
                    </Badge>
                  )}
                  {selectedMethod === 'stripe' && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            {selectedMethod === 'stripe' && (
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  الدفع الآمن عبر Stripe. معالجة فورية وآمنة.
                </p>
              </CardContent>
            )}
          </Card>

          {/* Crypto Payment Option */}
          <Card 
            className={`cursor-pointer transition-all ${
              selectedMethod === 'crypto' 
                ? 'ring-2 ring-primary border-primary' 
                : 'hover:border-primary/50'
            } ${!cryptoAvailable ? 'opacity-50' : ''}`}
            onClick={() => cryptoAvailable && setSelectedMethod('crypto')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    selectedMethod === 'crypto' ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    <Coins className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">الدفع بالعملات المشفرة</CardTitle>
                    <CardDescription>
                      USDT, USDC, BTC, ETH وأكثر عبر NOWPayments
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!cryptoAvailable && (
                    <Badge variant="outline" className="text-xs">
                      قيد الإعداد
                    </Badge>
                  )}
                  {selectedMethod === 'crypto' && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            {selectedMethod === 'crypto' && (
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  الدفع بالعملات المشفرة عبر NOWPayments. معالجة سريعة وآمنة.
                </p>
              </CardContent>
            )}
          </Card>

          {/* No methods available (only if not in beta mode) */}
          {!betaMode && !stripeAvailable && !cryptoAvailable && (
            <div className="text-center py-8 text-muted-foreground">
              <p>طرق الدفع قيد الإعداد حالياً</p>
              <p className="text-xs mt-2">سيتم تفعيلها قريباً</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            إلغاء
          </Button>
          {betaMode ? (
            <Button 
              onClick={handleBetaActivation} 
              disabled={loading}
              className="bg-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري التفعيل...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  تفعيل مجاناً (Beta)
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handlePayment} 
              disabled={!selectedMethod || loading || (!stripeAvailable && !cryptoAvailable)}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري المعالجة...
                </>
              ) : (
                'متابعة الدفع'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

