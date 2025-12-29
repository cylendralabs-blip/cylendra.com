/**
 * Risk Presets Component
 * 
 * Provides quick preset buttons for risk levels (Low, Medium, High)
 * Allows users to quickly apply risk configurations
 * 
 * Phase 10: UI/UX Improvement - Task 3
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { BotSettingsForm } from '@/core/config';
import { RISK_PRESETS, RiskPreset } from './riskPresets.config';
import { useTranslation } from 'react-i18next';

interface RiskPresetsProps {
  form: UseFormReturn<BotSettingsForm>;
  onApply: (preset: 'low' | 'medium' | 'high') => void;
}

export const RiskPresets = ({ form, onApply }: RiskPresetsProps) => {
  const { t } = useTranslation('bot_settings');

  const handleApplyPreset = (preset: RiskPreset) => {
    // Apply preset values to form
    form.setValue('risk_percentage', preset.riskPercentage);
    form.setValue('leverage', preset.leverage);
    form.setValue('take_profit_percentage', preset.takeProfitPct);
    form.setValue('stop_loss_percentage', preset.stopLossPct);
    form.setValue('initial_order_percentage', preset.initialOrderPercentage);
    form.setValue('dca_levels', preset.dcaLevels);
    form.setValue('max_daily_loss_usd', preset.dailyLossLimit);
    form.setValue('max_daily_loss_pct', preset.dailyLossLimit);
    form.setValue('max_drawdown_pct', preset.maxDrawdown);

    // Trigger form validation
    form.trigger();

    // Call parent handler
    onApply(preset.id);
  };

  const currentRiskPct = form.watch('risk_percentage') || 2;
  const currentLeverage = form.watch('leverage') || 1;

  // Detect current preset based on risk percentage
  const detectCurrentPreset = (): 'low' | 'medium' | 'high' | null => {
    if (currentRiskPct <= 1.5) return 'low';
    if (currentRiskPct <= 2.5) return 'medium';
    if (currentRiskPct >= 3) return 'high';
    return null;
  };

  const currentPreset = detectCurrentPreset();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {t('risk_presets.title')}
        </CardTitle>
        <CardDescription>
          {t('risk_presets.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.values(RISK_PRESETS).map((preset) => {
            const Icon = preset.icon;
            const isActive = currentPreset === preset.id;

            return (
              <Card
                key={preset.id}
                className={`cursor-pointer transition-all hover:shadow-md ${isActive ? 'ring-2 ring-primary border-primary' : ''
                  }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${preset.color}`} />
                      <CardTitle className="text-lg">{t(`risk_presets.presets.${preset.id}.name`)}</CardTitle>
                    </div>
                    {isActive && (
                      <Badge variant="default">{t('risk_presets.active')}</Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    {t(`risk_presets.presets.${preset.id}.description`)}
                  </p>

                  <div className="space-y-2 mb-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('risk_presets.risk')}</span>
                      <span className="font-medium">{preset.riskPercentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('risk_presets.leverage')}</span>
                      <span className="font-medium">{preset.leverage}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('risk_presets.tp')}</span>
                      <span className="font-medium">{preset.takeProfitPct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('risk_presets.sl')}</span>
                      <span className="font-medium">{preset.stopLossPct}%</span>
                    </div>
                  </div>

                  <Button
                    variant={isActive ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => handleApplyPreset(preset)}
                  >
                    {isActive ? t('risk_presets.applied') : t('risk_presets.apply')}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

