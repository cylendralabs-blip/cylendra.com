/**
 * Trade Size Preview Component
 * 
 * Shows how trade sizing will work based on current bot settings
 * Provides visual preview before saving settings
 * 
 * Phase 10: UI/UX Improvement - Task 3
 */

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, DollarSign, TrendingUp, Target } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { BotSettingsForm } from '@/core/config';
import { calculatePositionSize } from '@/core/engines/sizingEngine';
import { useTranslation } from 'react-i18next';

interface TradeSizePreviewProps {
  form: UseFormReturn<BotSettingsForm>;
  availableBalance: number;
  currentPrice?: number;
  stopLossPrice?: number;
}

export const TradeSizePreview = ({
  form,
  availableBalance,
  currentPrice = 50000, // Default BTC price for demo
  stopLossPrice,
}: TradeSizePreviewProps) => {
  const { t } = useTranslation('bot_settings');
  const [riskPct, leverage, initialOrderPct, takeProfitPct, stopLossPct] = form.watch([
    'risk_percentage',
    'leverage',
    'initial_order_percentage',
    'take_profit_percentage',
    'stop_loss_percentage',
  ]);

  const calculatedStopLoss = stopLossPrice || (currentPrice * (1 - (stopLossPct || 2) / 100));
  const lossPercentage = currentPrice > 0
    ? Math.abs((currentPrice - calculatedStopLoss) / currentPrice) * 100
    : 2;

  const preview = useMemo(() => {
    if (!availableBalance || availableBalance <= 0) {
      return null;
    }

    try {
      const sizingResult = calculatePositionSize({
        availableBalance,
        riskPercentage: riskPct || 2,
        lossPercentage,
        leverage: leverage || 1,
        entryPrice: currentPrice,
        initialOrderPercentage: initialOrderPct || 100,
      });

      const initialOrderAmount = sizingResult.positionSize * ((initialOrderPct || 100) / 100);
      const dcaReservedAmount = sizingResult.positionSize - initialOrderAmount;
      const maxLossAmount = availableBalance * ((riskPct || 2) / 100);
      const takeProfitPrice = currentPrice * (1 + ((takeProfitPct || 3) / 100));

      return {
        totalPositionSize: sizingResult.positionSize,
        initialOrderAmount,
        dcaReservedAmount,
        maxLossAmount,
        takeProfitPrice,
        stopLossPrice: calculatedStopLoss,
        profitAtTP: (takeProfitPrice - currentPrice) * (initialOrderAmount / currentPrice),
        lossAtSL: (currentPrice - calculatedStopLoss) * (initialOrderAmount / currentPrice),
      };
    } catch (error) {
      console.error('Error calculating preview:', error);
      return null;
    }
  }, [availableBalance, riskPct, leverage, initialOrderPct, currentPrice, lossPercentage, calculatedStopLoss, takeProfitPct]);

  if (!preview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {t('preview.no_settings_title')}
          </CardTitle>
          <CardDescription>
            {t('preview.no_settings_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {t('preview.no_settings_desc')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          {t('preview.title')}
        </CardTitle>
        <CardDescription>
          {t('preview.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">{t('preview.initial_order')}</div>
            <div className="text-lg font-bold">
              ${preview.initialOrderAmount.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('preview.position_pct', { pct: initialOrderPct || 100 })}
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">{t('preview.total_position')}</div>
            <div className="text-lg font-bold">
              ${preview.totalPositionSize.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('preview.with_leverage', { leverage: leverage || 1 })}
            </div>
          </div>

          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-xs text-muted-foreground mb-1">{t('preview.max_profit')}</div>
            <div className="text-lg font-bold text-green-600">
              +${preview.profitAtTP.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('preview.tp_price', { price: preview.takeProfitPrice.toFixed(2) })}
            </div>
          </div>

          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-xs text-muted-foreground mb-1">{t('preview.max_loss')}</div>
            <div className="text-lg font-bold text-red-600">
              -${preview.lossAtSL.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('preview.sl_price', { price: preview.stopLossPrice.toFixed(2) })}
            </div>
          </div>
        </div>

        {/* Risk Metrics */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">{t('preview.risk_metrics')}</span>
            <Badge variant="outline">
              {t('preview.risk_label', { pct: riskPct || 2 })}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('preview.available_balance')}</span>
              <span className="font-medium">${availableBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('preview.max_loss_amount')}</span>
              <span className="font-medium text-red-600">${preview.maxLossAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('preview.dca_reserved')}</span>
              <span className="font-medium">${preview.dcaReservedAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('preview.rr_ratio')}</span>
              <span className="font-medium">
                {preview.lossAtSL > 0
                  ? (preview.profitAtTP / preview.lossAtSL).toFixed(2)
                  : 'N/A'
                }:1
              </span>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="pt-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded">
          <strong>{t('preview.note_title')}</strong> {t('preview.note_desc', { price: currentPrice.toLocaleString() })}
        </div>
      </CardContent>
    </Card>
  );
};

