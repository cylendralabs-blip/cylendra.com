/**
 * Crypto Payment Button Component
 * 
 * Phase Crypto Payments: Button to initiate crypto payment
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createCryptoPayment } from '@/services/payments/CryptoPaymentService';
import type { PlanCode } from '@/core/plans/planTypes';
import { useAuth } from '@/hooks/useAuth';

interface CryptoPaymentButtonProps {
  planCode: PlanCode;
  amount: number;
  currency?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export default function CryptoPaymentButton({
  planCode,
  amount,
  currency = 'USDTTRC20',
  variant = 'default',
  size = 'default',
  className,
}: CryptoPaymentButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleCryptoPayment = async () => {
    if (!user) {
      toast({
        title: 'يجب تسجيل الدخول',
        description: 'يرجى تسجيل الدخول أولاً',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { payment, payment_url, error } = await createCryptoPayment({
        userId: user.id,
        planCode,
        currency,
      });

      if (error || !payment_url) {
        // Check if error is about missing API key
        const isConfigError = error?.includes('API key not configured') || 
                             error?.includes('NOWPayments API key') ||
                             error?.includes('NOWPAYMENTS_NOT_CONFIGURED');
        
        if (isConfigError) {
          // Don't show error toast, just disable the button silently
          // The feature is not yet configured
          console.log('Crypto payments not yet configured');
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
    } catch (error) {
      console.error('Error creating crypto payment:', error);
      toast({
        title: '❌ خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleCryptoPayment}
      disabled={loading || !user}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          جاري التحميل...
        </>
      ) : (
        <>
          <Coins className="w-4 h-4 mr-2" />
          الدفع بالعملات المشفرة
        </>
      )}
    </Button>
  );
}

