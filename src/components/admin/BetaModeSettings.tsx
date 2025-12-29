/**
 * Beta Mode Settings Component
 * 
 * Admin-Controlled Beta Mode Configuration
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, AlertTriangle, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getBetaModeConfig, updateBetaModeConfig } from '@/services/admin/SystemSettingsService';
import { format } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function BetaModeSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(false);
  const [durationDays, setDurationDays] = useState(60);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch current beta mode config
  const { data: config, isLoading } = useQuery({
    queryKey: ['beta-mode-config'],
    queryFn: async () => {
      const { config, error } = await getBetaModeConfig();
      if (error) {
        toast({
          title: '❌ خطأ',
          description: error,
          variant: 'destructive',
        });
        return null;
      }
      return config;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  useEffect(() => {
    if (config) {
      setEnabled(config.enabled);
      setDurationDays(config.durationDays);
      setEndDate(config.endDate);
    }
  }, [config]);

  // Calculate end date when enabled or duration changes
  useEffect(() => {
    if (enabled && durationDays > 0) {
      const endDateObj = new Date();
      endDateObj.setDate(endDateObj.getDate() + durationDays);
      setEndDate(endDateObj.toISOString());
    } else {
      setEndDate(null);
    }
  }, [enabled, durationDays]);

  const handleSave = async () => {
    // Validate duration
    if (durationDays < 1 || durationDays > 365) {
      toast({
        title: '❌ خطأ',
        description: 'المدة يجب أن تكون بين 1 و 365 يوم',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { success, error } = await updateBetaModeConfig(enabled, durationDays);

      if (success) {
        toast({
          title: '✅ تم الحفظ',
          description: 'تم تحديث إعدادات Beta Mode بنجاح',
        });
        
        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: ['beta-mode-config'] });
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في حفظ الإعدادات',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving beta mode config:', error);
      toast({
        title: '❌ خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Calculate days until beta ends
  const daysUntilEnd = endDate
    ? Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>إعدادات Beta Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <CardTitle>إعدادات Beta Mode</CardTitle>
        </div>
        <CardDescription>
          تفعيل أو تعطيل وضع Beta المجاني وتحديد مدة الاشتراكات
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="beta-enabled" className="text-base font-semibold">
              تفعيل Beta Mode (الباقات المجانية)
            </Label>
            <p className="text-sm text-muted-foreground">
              عند التفعيل، يمكن للمستخدمين تجربة أي باقة مجاناً بدون دفع
            </p>
          </div>
          <Switch
            id="beta-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
            disabled={saving}
          />
        </div>

        {/* Duration Input */}
        {enabled && (
          <div className="space-y-2">
            <Label htmlFor="beta-duration">مدة الاشتراك (بالأيام)</Label>
            <Input
              id="beta-duration"
              type="number"
              min="1"
              max="365"
              value={durationDays}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value >= 1 && value <= 365) {
                  setDurationDays(value);
                }
              }}
              disabled={saving}
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              المدة يجب أن تكون بين 1 و 365 يوم
            </p>
          </div>
        )}

        {/* Calculated End Date */}
        {enabled && endDate && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-semibold">تاريخ انتهاء Beta Mode</Label>
            </div>
            <p className="text-lg font-bold">
              {format(new Date(endDate), 'yyyy-MM-dd HH:mm')}
            </p>
            {daysUntilEnd !== null && daysUntilEnd > 0 && (
              <p className="text-sm text-muted-foreground">
                متبقي {daysUntilEnd} يوم
              </p>
            )}
          </div>
        )}

        {/* Warning if less than 7 days */}
        {enabled && daysUntilEnd !== null && daysUntilEnd > 0 && daysUntilEnd <= 7 && (
          <Alert className="bg-yellow-500/10 border-yellow-500/50">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <AlertDescription className="text-yellow-400">
              <strong>تحذير:</strong> Beta Mode سينتهي خلال {daysUntilEnd} يوم. 
              يرجى الاستعداد للانتقال إلى نظام الدفع الحقيقي.
            </AlertDescription>
          </Alert>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={saving || (enabled && (durationDays < 1 || durationDays > 365))}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              'حفظ الإعدادات'
            )}
          </Button>
        </div>

        {/* Current Status */}
        <div className="pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold mb-2">الحالة الحالية:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Beta Mode: {enabled ? '✅ مفعّل' : '❌ معطّل'}</li>
              {enabled && (
                <>
                  <li>مدة الاشتراك: {durationDays} يوم</li>
                  {endDate && (
                    <li>تاريخ الانتهاء: {format(new Date(endDate), 'yyyy-MM-dd')}</li>
                  )}
                </>
              )}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

