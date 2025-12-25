/**
 * Auto Trading Settings Component
 * 
 * Phase X: Auto Trading UI from Signals
 * 
 * This component provides UI controls for configuring auto trading from signals
 */

import { UseFormReturn } from 'react-hook-form';
import { BotSettingsForm } from '@/core/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Zap,
  Target,
  BarChart3,
  Info,
  Settings
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface AutoTradingSettingsProps {
  form: UseFormReturn<BotSettingsForm>;
}

export default function AutoTradingSettings({ form }: AutoTradingSettingsProps) {
  const { t } = useTranslation('bot_settings');
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [pendingEnable, setPendingEnable] = useState(false);

  const autoTradingEnabled = form.watch('auto_trading_enabled');
  const autoTradingMode = form.watch('auto_trading_mode');
  const allowedSources = form.watch('allowed_signal_sources') || [];
  const allowedDirections = form.watch('allowed_directions') || ['long', 'short'];
  const minConfidence = form.watch('min_signal_confidence');
  const maxTradesPerDay = form.watch('max_auto_trades_per_day');
  const maxConcurrent = form.watch('max_concurrent_auto_positions');

  const signalSourceLabels: Record<'ai_ultra' | 'ai_realtime' | 'tradingview' | 'legacy', string> = {
    ai_ultra: t('auto_trading.sources.ai_ultra'),
    ai_realtime: t('auto_trading.sources.ai_realtime'),
    tradingview: t('auto_trading.sources.tradingview'),
    legacy: t('auto_trading.sources.legacy'),
  };

  const handleEnableToggle = (checked: boolean) => {
    if (checked && !autoTradingEnabled) {
      // Show warning when enabling for the first time
      setPendingEnable(true);
      setShowWarningDialog(true);
    } else {
      form.setValue('auto_trading_enabled', checked);
      if (!checked) {
        form.setValue('auto_trading_mode', 'off');
      }
    }
  };

  const handleConfirmEnable = () => {
    form.setValue('auto_trading_enabled', true);
    if (autoTradingMode === 'off') {
      form.setValue('auto_trading_mode', 'full_auto');
    }
    setShowWarningDialog(false);
    setPendingEnable(false);
  };

  const handleCancelEnable = () => {
    setShowWarningDialog(false);
    setPendingEnable(false);
  };

  const toggleSignalSource = (source: 'ai_ultra' | 'ai_realtime' | 'tradingview' | 'legacy') => {
    const current = allowedSources;
    if (current.includes(source)) {
      form.setValue('allowed_signal_sources', current.filter(s => s !== source));
    } else {
      form.setValue('allowed_signal_sources', [...current, source]);
    }
  };

  const toggleDirection = (direction: 'long' | 'short') => {
    const current = allowedDirections;
    if (current.includes(direction)) {
      const newDirections = current.filter(d => d !== direction);
      // Ensure at least one direction is selected
      if (newDirections.length === 0) {
        return;
      }
      form.setValue('allowed_directions', newDirections);
    } else {
      form.setValue('allowed_directions', [...current, direction]);
    }
  };

  const isDisabled = !autoTradingEnabled || autoTradingMode === 'off';

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            <CardTitle>{t('auto_trading.title')}</CardTitle>
          </div>
          <CardDescription>
            {t('auto_trading.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="auto-trading-enabled" className="text-base font-semibold">
                {t('auto_trading.enable')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('auto_trading.enable_desc')}
              </p>
            </div>
            <Switch
              id="auto-trading-enabled"
              checked={autoTradingEnabled}
              onCheckedChange={handleEnableToggle}
            />
          </div>

          {/* Warning Alert */}
          {autoTradingEnabled && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('auto_trading.active_alert_title')}</AlertTitle>
              <AlertDescription>
                {t('auto_trading.active_alert_desc')}
              </AlertDescription>
            </Alert>
          )}

          {/* Auto Trading Mode */}
          <div className="space-y-2">
            <Label htmlFor="auto-trading-mode">{t('auto_trading.mode_label')}</Label>
            <Select
              value={autoTradingMode}
              onValueChange={(value) => form.setValue('auto_trading_mode', value as 'off' | 'full_auto' | 'semi_auto')}
              disabled={isDisabled}
            >
              <SelectTrigger id="auto-trading-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">{t('auto_trading.modes.off')}</SelectItem>
                <SelectItem value="full_auto">{t('auto_trading.modes.full_auto')}</SelectItem>
                <SelectItem value="semi_auto">{t('auto_trading.modes.semi_auto')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t('auto_trading.mode_desc')}
            </p>
          </div>

          {/* Allowed Signal Sources */}
          <div className="space-y-3">
            <Label>{t('auto_trading.sources_label')}</Label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(signalSourceLabels) as Array<keyof typeof signalSourceLabels>).map((source) => (
                <div key={source} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id={`source-${source}`}
                    checked={allowedSources.includes(source)}
                    onCheckedChange={() => toggleSignalSource(source)}
                    disabled={isDisabled}
                  />
                  <Label
                    htmlFor={`source-${source}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {signalSourceLabels[source]}
                  </Label>
                </div>
              ))}
            </div>
            {allowedSources.length === 0 && !isDisabled && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {t('auto_trading.no_sources_warning')}
              </p>
            )}
          </div>

          {/* Allowed Directions */}
          <div className="space-y-3">
            <Label>{t('auto_trading.directions_label')}</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="direction-long"
                  checked={allowedDirections.includes('long')}
                  onCheckedChange={() => toggleDirection('long')}
                  disabled={isDisabled}
                />
                <Label htmlFor="direction-long" className="text-sm font-normal cursor-pointer">
                  {t('auto_trading.allow_long')}
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="direction-short"
                  checked={allowedDirections.includes('short')}
                  onCheckedChange={() => toggleDirection('short')}
                  disabled={isDisabled}
                />
                <Label htmlFor="direction-short" className="text-sm font-normal cursor-pointer">
                  {t('auto_trading.allow_short')}
                </Label>
              </div>
            </div>
          </div>

          {/* Risk Filters */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <Label className="text-base font-semibold">{t('auto_trading.risk_filters_title')}</Label>
            </div>

            {/* Min Signal Confidence */}
            <div className="space-y-2">
              <Label htmlFor="min-confidence">{t('auto_trading.min_confidence_label')}</Label>
              <Input
                id="min-confidence"
                type="number"
                min="0"
                max="100"
                value={minConfidence ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  form.setValue('min_signal_confidence', value === '' ? null : Number(value));
                }}
                disabled={isDisabled}
                placeholder={t('auto_trading.min_confidence_placeholder')}
              />
              <p className="text-xs text-muted-foreground">
                {t('auto_trading.min_confidence_desc')}
              </p>
            </div>

            {/* Max Auto Trades Per Day */}
            <div className="space-y-2">
              <Label htmlFor="max-trades-day">{t('auto_trading.max_trades_day_label')}</Label>
              <Input
                id="max-trades-day"
                type="number"
                min="0"
                value={maxTradesPerDay ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  form.setValue('max_auto_trades_per_day', value === '' ? null : Number(value));
                }}
                disabled={isDisabled}
                placeholder={t('auto_trading.max_trades_day_placeholder')}
              />
              <p className="text-xs text-muted-foreground">
                {t('auto_trading.max_trades_day_desc')}
              </p>
            </div>

            {/* Max Concurrent Positions */}
            <div className="space-y-2">
              <Label htmlFor="max-concurrent">{t('auto_trading.max_concurrent_label')}</Label>
              <Input
                id="max-concurrent"
                type="number"
                min="0"
                value={maxConcurrent ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  form.setValue('max_concurrent_auto_positions', value === '' ? null : Number(value));
                }}
                disabled={isDisabled}
                placeholder={t('auto_trading.max_concurrent_placeholder')}
              />
              <p className="text-xs text-muted-foreground">
                {t('auto_trading.max_concurrent_desc')}
              </p>
            </div>
          </div>

          {/* Info Box */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>{t('auto_trading.how_it_works_title')}</AlertTitle>
            <AlertDescription>
              {t('auto_trading.how_it_works_desc')}
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>{t('auto_trading.how_it_works_steps.step1')}</li>
                <li>{t('auto_trading.how_it_works_steps.step2')}</li>
                <li>{t('auto_trading.how_it_works_steps.step3')}</li>
                <li>{t('auto_trading.how_it_works_steps.step4')}</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Warning Dialog */}
      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {t('auto_trading.dialog.title')}
            </DialogTitle>
            <DialogDescription>
              {t('auto_trading.dialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('auto_trading.dialog.safety_title')}</AlertTitle>
              <AlertDescription className="text-sm">
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>{t('auto_trading.dialog.safety_steps.step1')}</li>
                  <li>{t('auto_trading.dialog.safety_steps.step2')}</li>
                  <li>{t('auto_trading.dialog.safety_steps.step3')}</li>
                  <li>{t('auto_trading.dialog.safety_steps.step4')}</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEnable}>
              {t('auto_trading.dialog.cancel')}
            </Button>
            <Button onClick={handleConfirmEnable}>
              {t('auto_trading.dialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

