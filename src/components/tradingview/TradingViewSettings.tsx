import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Webhook,
  Clock,
  Shield,
  Target,
  Trash2,
  Plus,
  X
} from 'lucide-react';
import { TradingViewSettings as SettingsType } from '@/types/tradingview';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';

interface TradingViewSettingsProps {
  settings: SettingsType | null;
  onSave: (settings: Partial<SettingsType>) => void;
  onCleanup: () => void;
  isSaving?: boolean;
  isCleaningUp?: boolean;
}

const TradingViewSettings = ({
  settings,
  onSave,
  onCleanup,
  isSaving = false,
  isCleaningUp = false
}: TradingViewSettingsProps) => {
  const { t } = useTranslation('tradingview');
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState<Partial<SettingsType>>({
    is_enabled: true,
    webhook_secret: '',
    auto_cleanup_enabled: true,
    cleanup_days_1m: 7,
    cleanup_days_5m: 14,
    cleanup_days_15m: 30,
    cleanup_days_1h: 60,
    cleanup_days_4h: 90,
    cleanup_days_1d: 180,
    auto_trade_enabled: false,
    min_confidence_score: 70,
    allowed_symbols: ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'],
    allowed_strategies: [],
    max_daily_signals: 50,
  });

  const [newSymbol, setNewSymbol] = useState('');
  const [newStrategy, setNewStrategy] = useState('');

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSave = () => {
    onSave(formData);
  };

  const addSymbol = () => {
    if (newSymbol.trim() && !formData.allowed_symbols?.includes(newSymbol.trim())) {
      setFormData(prev => ({
        ...prev,
        allowed_symbols: [...(prev.allowed_symbols || []), newSymbol.trim()]
      }));
      setNewSymbol('');
    }
  };

  const removeSymbol = (symbol: string) => {
    setFormData(prev => ({
      ...prev,
      allowed_symbols: prev.allowed_symbols?.filter(s => s !== symbol) || []
    }));
  };

  const addStrategy = () => {
    if (newStrategy.trim() && !formData.allowed_strategies?.includes(newStrategy.trim())) {
      setFormData(prev => ({
        ...prev,
        allowed_strategies: [...(prev.allowed_strategies || []), newStrategy.trim()]
      }));
      setNewStrategy('');
    }
  };

  const removeStrategy = (strategy: string) => {
    setFormData(prev => ({
      ...prev,
      allowed_strategies: prev.allowed_strategies?.filter(s => s !== strategy) || []
    }));
  };

  return (
    <div className={`space-y-6 ${isMobile ? 'px-2' : ''}`}>
      {/* الإعدادات العامة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>{t('settings.general.title')}</span>
          </CardTitle>
          <CardDescription>
            {t('settings.general.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enabled">{t('settings.general.enable')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.general.enable_desc')}
              </p>
            </div>
            <Switch
              id="enabled"
              checked={formData.is_enabled}
              onCheckedChange={(checked) =>
                setFormData(prev => ({ ...prev, is_enabled: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook-secret">{t('settings.general.webhook_secret')}</Label>
            <Input
              id="webhook-secret"
              type="password"
              value={formData.webhook_secret || ''}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, webhook_secret: e.target.value }))
              }
              placeholder={t('settings.general.webhook_secret_placeholder')}
            />
            <p className="text-xs text-muted-foreground">
              {t('settings.general.webhook_secret_desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-confidence">{t('settings.general.min_confidence')}</Label>
              <Input
                id="min-confidence"
                type="number"
                min="0"
                max="100"
                value={formData.min_confidence_score || 70}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    min_confidence_score: Number(e.target.value)
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-signals">{t('settings.general.max_signals')}</Label>
              <Input
                id="max-signals"
                type="number"
                min="1"
                max="1000"
                value={formData.max_daily_signals || 50}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    max_daily_signals: Number(e.target.value)
                  }))
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-trade">{t('settings.general.auto_trade')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.general.auto_trade_desc')}
              </p>
            </div>
            <Switch
              id="auto-trade"
              checked={formData.auto_trade_enabled}
              onCheckedChange={(checked) =>
                setFormData(prev => ({ ...prev, auto_trade_enabled: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* إدارة الرموز المسموحة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Target className="w-5 h-5 text-green-600" />
            <span>{t('settings.symbols.title')}</span>
          </CardTitle>
          <CardDescription>
            {t('settings.symbols.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2 space-x-reverse">
            <Input
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              placeholder={t('settings.symbols.placeholder')}
              onKeyPress={(e) => e.key === 'Enter' && addSymbol()}
            />
            <Button onClick={addSymbol} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.allowed_symbols?.map((symbol, index) => (
              <Badge key={index} variant="outline" className="flex items-center space-x-1 space-x-reverse">
                <span>{symbol}</span>
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-500"
                  onClick={() => removeSymbol(symbol)}
                />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* إدارة الاستراتيجيات المسموحة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Shield className="w-5 h-5 text-purple-600" />
            <span>{t('settings.strategies.title')}</span>
          </CardTitle>
          <CardDescription>
            {t('settings.strategies.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2 space-x-reverse">
            <Input
              value={newStrategy}
              onChange={(e) => setNewStrategy(e.target.value)}
              placeholder={t('settings.strategies.placeholder')}
              onKeyPress={(e) => e.key === 'Enter' && addStrategy()}
            />
            <Button onClick={addStrategy} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.allowed_strategies?.map((strategy, index) => (
              <Badge key={index} variant="outline" className="flex items-center space-x-1 space-x-reverse">
                <span>{strategy}</span>
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-500"
                  onClick={() => removeStrategy(strategy)}
                />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* إعدادات التنظيف التلقائي */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Clock className="w-5 h-5 text-orange-600" />
            <span>{t('settings.cleanup.title')}</span>
          </CardTitle>
          <CardDescription>
            {t('settings.cleanup.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-cleanup">{t('settings.cleanup.enable')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.cleanup.enable_desc')}
              </p>
            </div>
            <Switch
              id="auto-cleanup"
              checked={formData.auto_cleanup_enabled}
              onCheckedChange={(checked) =>
                setFormData(prev => ({ ...prev, auto_cleanup_enabled: checked }))
              }
            />
          </div>

          {formData.auto_cleanup_enabled && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cleanup-1m">{t('settings.cleanup.1m')}</Label>
                <Input
                  id="cleanup-1m"
                  type="number"
                  min="1"
                  value={formData.cleanup_days_1m || 7}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      cleanup_days_1m: Number(e.target.value)
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cleanup-5m">{t('settings.cleanup.5m')}</Label>
                <Input
                  id="cleanup-5m"
                  type="number"
                  min="1"
                  value={formData.cleanup_days_5m || 14}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      cleanup_days_5m: Number(e.target.value)
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cleanup-15m">{t('settings.cleanup.15m')}</Label>
                <Input
                  id="cleanup-15m"
                  type="number"
                  min="1"
                  value={formData.cleanup_days_15m || 30}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      cleanup_days_15m: Number(e.target.value)
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cleanup-1h">{t('settings.cleanup.1h')}</Label>
                <Input
                  id="cleanup-1h"
                  type="number"
                  min="1"
                  value={formData.cleanup_days_1h || 60}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      cleanup_days_1h: Number(e.target.value)
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cleanup-4h">{t('settings.cleanup.4h')}</Label>
                <Input
                  id="cleanup-4h"
                  type="number"
                  min="1"
                  value={formData.cleanup_days_4h || 90}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      cleanup_days_4h: Number(e.target.value)
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cleanup-1d">{t('settings.cleanup.1d')}</Label>
                <Input
                  id="cleanup-1d"
                  type="number"
                  min="1"
                  value={formData.cleanup_days_1d || 180}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      cleanup_days_1d: Number(e.target.value)
                    }))
                  }
                />
              </div>
            </div>
          )}

          <Button
            variant="outline"
            onClick={onCleanup}
            disabled={isCleaningUp}
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isCleaningUp ? t('settings.cleanup.cleaning') : t('settings.cleanup.button')}
          </Button>
        </CardContent>
      </Card>

      {/* معلومات الـ Webhook */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Webhook className="w-5 h-5 text-indigo-600" />
            <span>{t('settings.webhook_info.title')}</span>
          </CardTitle>
          <CardDescription>
            {t('settings.webhook_info.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
            <code className="text-sm break-all">
              https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/tradingview-webhook
            </code>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t('settings.webhook_info.footer')}
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* أزرار الحفظ */}
      <div className="flex justify-end space-x-2 space-x-reverse">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? t('settings.saving') : t('settings.save')}
        </Button>
      </div>
    </div>
  );
};

export default TradingViewSettings;
