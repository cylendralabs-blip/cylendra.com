/**
 * Risk Settings Editor Component
 * 
 * Phase Admin B: System-wide risk threshold management
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Sliders } from 'lucide-react';
import { getRiskSettings, updateRiskSettings, RiskSettings } from '@/services/admin/RiskSettingsService';
import { useToast } from '@/hooks/use-toast';

export default function RiskSettingsEditor() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<RiskSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { settings: settingsData, error } = await getRiskSettings();
      if (error) {
        toast({
          title: '❌ خطأ',
          description: error,
          variant: 'destructive',
        });
      } else {
        setSettings(settingsData);
      }
    } catch (error) {
      console.error('Error loading risk settings:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحميل الإعدادات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { success, error } = await updateRiskSettings(settings);
      if (success) {
        toast({
          title: '✅ نجح',
          description: 'تم حفظ إعدادات المخاطر بنجاح',
        });
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في حفظ الإعدادات',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving risk settings:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في حفظ الإعدادات',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sliders className="w-6 h-6" />
          إعدادات المخاطر
        </h2>
        <p className="text-muted-foreground">
          إدارة حدود المخاطر على مستوى النظام
        </p>
      </div>

      {/* Global Risk Limits */}
      <Card>
        <CardHeader>
          <CardTitle>حدود المخاطر العامة</CardTitle>
          <CardDescription>
            الإعدادات التي تنطبق على جميع المستخدمين
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dailyLossLimit">حد الخسارة اليومية (%)</Label>
              <Input
                id="dailyLossLimit"
                type="number"
                value={settings.globalDailyLossLimit}
                onChange={(e) => setSettings(prev => prev ? { ...prev, globalDailyLossLimit: Number(e.target.value) } : null)}
                placeholder="-10"
              />
              <p className="text-xs text-muted-foreground">
                الحد الأقصى للخسارة اليومية المسموح بها (قيمة سالبة)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxDrawdown">الحد الأقصى للتراجع (%)</Label>
              <Input
                id="maxDrawdown"
                type="number"
                value={settings.globalMaxDrawdown}
                onChange={(e) => setSettings(prev => prev ? { ...prev, globalMaxDrawdown: Number(e.target.value) } : null)}
                placeholder="-25"
              />
              <p className="text-xs text-muted-foreground">
                الحد الأقصى للتراجع المسموح به (قيمة سالبة)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLeverage">الحد الأقصى للرافعة المالية</Label>
              <Input
                id="maxLeverage"
                type="number"
                value={settings.maxLeverageAllowed}
                onChange={(e) => setSettings(prev => prev ? { ...prev, maxLeverageAllowed: Number(e.target.value) } : null)}
                placeholder="10"
              />
              <p className="text-xs text-muted-foreground">
                الحد الأقصى للرافعة المالية المسموح بها
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxBots">الحد الأقصى للبوتات لكل مستخدم</Label>
              <Input
                id="maxBots"
                type="number"
                value={settings.maxBotsPerUser}
                onChange={(e) => setSettings(prev => prev ? { ...prev, maxBotsPerUser: Number(e.target.value) } : null)}
                placeholder="5"
              />
              <p className="text-xs text-muted-foreground">
                الحد الأقصى لعدد البوتات التي يمكن للمستخدم تشغيلها
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Bot Safety Settings */}
      <Card>
        <CardHeader>
          <CardTitle>إعدادات الأمان الافتراضية للبوتات</CardTitle>
          <CardDescription>
            الإعدادات الافتراضية للبوتات الجديدة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxActiveTrades">الحد الأقصى للصفقات النشطة</Label>
              <Input
                id="maxActiveTrades"
                type="number"
                value={settings.defaultBotSafetySettings.maxActiveTrades}
                onChange={(e) => setSettings(prev => prev ? {
                  ...prev,
                  defaultBotSafetySettings: {
                    ...prev.defaultBotSafetySettings,
                    maxActiveTrades: Number(e.target.value),
                  },
                } : null)}
                placeholder="5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="riskPercentage">نسبة المخاطرة (%)</Label>
              <Input
                id="riskPercentage"
                type="number"
                step="0.1"
                value={settings.defaultBotSafetySettings.riskPercentage}
                onChange={(e) => setSettings(prev => prev ? {
                  ...prev,
                  defaultBotSafetySettings: {
                    ...prev.defaultBotSafetySettings,
                    riskPercentage: Number(e.target.value),
                  },
                } : null)}
                placeholder="2.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stopLossPercentage">نسبة Stop Loss (%)</Label>
              <Input
                id="stopLossPercentage"
                type="number"
                step="0.1"
                value={settings.defaultBotSafetySettings.stopLossPercentage}
                onChange={(e) => setSettings(prev => prev ? {
                  ...prev,
                  defaultBotSafetySettings: {
                    ...prev.defaultBotSafetySettings,
                    stopLossPercentage: Number(e.target.value),
                  },
                } : null)}
                placeholder="5.0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              حفظ الإعدادات
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

