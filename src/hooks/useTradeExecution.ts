
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BotSettingsForm } from '@/types/botSettings';
import { withRetry } from '@/utils/retry';
import { awardLPForVolume, updateAffiliateWeight } from '@/services/affiliate/integration';
import { logFeatureUsage } from '@/services/admin/FeatureUsageService';
import { updateUserFunnelStage } from '@/services/admin/UserFunnelService';

interface TradeCalculation {
  maxLossAmount: number;
  totalTradeAmount: number;
  initialOrderAmount: number;
  dcaReservedAmount: number;
  leveragedAmount: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  dcaLevels: Array<{
    level: number;
    percentage: number;
    amount: number;
    targetPrice: number;
    cumulativeAmount: number;
    averageEntry: number;
  }>;
}

export const useTradeExecution = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const executeTrade = async (
    tradeCalculation: TradeCalculation,
    selectedPlatform: string,
    selectedPair: string,
    marketType: 'spot' | 'futures',
    orderType: 'market' | 'limit',
    tradeDirection: 'long' | 'short',
    currentPrice: number,
    limitPrice: number,
    botSettings: BotSettingsForm,
    autoExecute: boolean,
    availableBalance: number,
    sourceMode: 'auto_bot' | 'manual_execute' | 'manual_smart_trade' | 'signal_execution' = 'manual_execute',
    managedByBot?: boolean,
    managementProfileId?: string
  ) => {
    console.log('Starting trade execution...');
    
    if (!tradeCalculation || !selectedPlatform || !selectedPair) {
      console.log('Missing required data:', { tradeCalculation: !!tradeCalculation, selectedPlatform, selectedPair });
      toast({
        title: 'خطأ',
        description: 'يرجى إكمال جميع البيانات المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    if (availableBalance < tradeCalculation.totalTradeAmount) {
      toast({
        title: 'خطأ',
        description: 'الرصيد المتاح غير كافي لتنفيذ الصفقة',
        variant: 'destructive',
      });
      return;
    }

    if (orderType === 'limit' && limitPrice <= 0) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال سعر محدود صحيح',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const entryPrice = orderType === 'limit' ? limitPrice : currentPrice;
      
      const executeTradeCall = async () => {
        console.log('Calling execute-trade function with data:', {
          platform: selectedPlatform,
          symbol: selectedPair,
          marketType,
          orderType,
          tradeDirection,
          entryPrice,
          stopLossPrice: tradeCalculation.stopLossPrice,
          takeProfitPrice: tradeCalculation.takeProfitPrice,
          initialAmount: tradeCalculation.initialOrderAmount,
          dcaLevels: tradeCalculation.dcaLevels,
          leverage: marketType === 'futures' ? (botSettings?.leverage || 1) : 1,
          strategy: botSettings?.strategy_type,
          autoExecute
        });

        const { data, error } = await supabase.functions.invoke('execute-trade', {
          body: {
            platform: selectedPlatform,
            symbol: selectedPair,
            marketType,
            orderType,
            tradeDirection,
            entryPrice,
            stopLossPrice: tradeCalculation.stopLossPrice,
            takeProfitPrice: tradeCalculation.takeProfitPrice,
            initialAmount: tradeCalculation.initialOrderAmount,
            dcaLevels: tradeCalculation.dcaLevels,
            leverage: marketType === 'futures' ? (botSettings?.leverage || 1) : 1,
            strategy: botSettings?.strategy_type,
            autoExecute,
            sourceMode, // Phase 1.5: Tag trade source (auto_bot, manual_execute, manual_smart_trade, signal_execution)
            managedByBot: managedByBot || false, // Phase 3.1: Whether bot should manage this trade
            managementProfileId: managementProfileId || undefined // Phase 3.1: Bot management profile ID
          }
        });

        if (error) {
          throw error;
        }

        // Phase Admin C: Log feature usage and update funnel
        if (user?.id) {
          try {
            await Promise.all([
              logFeatureUsage(user.id, 'trade_execution'),
              updateUserFunnelStage(user.id, 'first_trade'),
            ]);
          } catch (e) {
            // Don't fail trade execution if logging fails
            console.error('Error logging feature usage:', e);
          }
        }

        return data;
      };

      const data = await withRetry(
        executeTradeCall,
        {
          maxAttempts: 3,
          baseDelayMs: 1000,
          shouldRetry: (error) => {
            const status =
              (error?.status as number | undefined) ??
              (error?.statusCode as number | undefined);
            if (status && [408, 425, 429, 500, 502, 503, 504].includes(status)) {
              return true;
            }
            const message = (error?.message || '').toString().toLowerCase();
            return message.includes('network') || message.includes('fetch');
          },
        }
      );

      console.log('Execute trade function response:', data);

      // Award LP for trading volume if trade was successful
      if (data?.success && tradeCalculation.initialOrderAmount) {
        try {
          // Get user's affiliate ID if exists
          const { data: affiliateUser } = await supabase
            .from('affiliate_users' as any)
            .select('affiliate_id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single() as { data: { affiliate_id: string } | null; error: any };
          
          const affiliateData = affiliateUser as { affiliate_id: string } | null;
          
          if (affiliateData?.affiliate_id) {
            // Award LP based on trade volume (in USD)
            await awardLPForVolume(
              user.id,
              tradeCalculation.initialOrderAmount,
              affiliateData.affiliate_id
            );
            
            // Update affiliate weight
            await updateAffiliateWeight(affiliateData.affiliate_id);
          }
        } catch (lpError) {
          console.warn('Error awarding LP for trading volume:', lpError);
          // Don't fail the trade execution if LP award fails
        }
      }

      toast({
        title: 'تم تنفيذ الصفقة',
        description: data?.message || `تم بدء الصفقة بنجاح باستخدام ${orderType === 'market' ? 'أمر السوق' : 'الأمر المحدود'}`,
      });

      return true;
    } catch (error) {
      console.error('Error executing trade:', error);
      toast({
        title: 'خطأ في تنفيذ الصفقة',
        description: error.message || 'فشل في تنفيذ الصفقة، يرجى المحاولة مرة أخرى',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { executeTrade, loading };
};
