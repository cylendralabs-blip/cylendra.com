/**
 * Admin Security Settings Component
 * 
 * Phase Admin F: Admin security settings (2FA, login alerts, etc.)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Shield, Key, Bell, Clock } from 'lucide-react';
import { getAdminSecuritySettings, enable2FA, disable2FA } from '@/services/admin/AdminSecurityService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { QRCodeSVG } from 'qrcode.react';
import { TOTP, Secret } from 'otpauth';

export default function AdminSecuritySettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [twoFactorQR, setTwoFactorQR] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');

  const loadSettings = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { settings: settingsData } = await getAdminSecuritySettings(user.id);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [user?.id]);

  const handleEnable2FA = async () => {
    if (!user?.id || !user?.email) return;

    try {
      // Generate a secure random secret using otpauth Secret class (same as useTwoFactorAuth)
      const secret = new Secret({ size: 20 });
      const base32Secret = secret.base32;
      
      setTwoFactorSecret(base32Secret);
      
      // Create TOTP instance
      const totp = new TOTP({
        issuer: 'Orbitra AI',
        label: user.email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: base32Secret,
      });
      
      // Generate QR code URL
      const qrUrl = totp.toString();
      setTwoFactorQR(qrUrl);
      
      console.log('2FA Setup:', {
        secret: base32Secret.substring(0, 10) + '...',
        qrUrl: qrUrl.substring(0, 50) + '...',
      });
    } catch (error) {
      console.error('Error generating 2FA:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في إنشاء 2FA',
        variant: 'destructive',
      });
    }
  };

  const handleVerify2FA = async () => {
    if (!user?.id || !twoFactorSecret || !user?.email) return;

    try {
      if (verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
        toast({
          title: '❌ خطأ',
          description: 'رمز التحقق يجب أن يكون 6 أرقام',
          variant: 'destructive',
        });
        return;
      }

      // Validate TOTP code
      const totp = new TOTP({
        issuer: 'Orbitra AI',
        label: user.email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: twoFactorSecret,
      });

      // Generate current token and previous token (to handle time drift)
      const currentToken = totp.generate();
      const previousToken = totp.generate({ timestamp: Date.now() - 30000 }); // 30 seconds ago
      const nextToken = totp.generate({ timestamp: Date.now() + 30000 }); // 30 seconds ahead
      
      console.log('TOTP Validation:', {
        provided: verificationCode,
        current: currentToken,
        previous: previousToken,
        next: nextToken,
        secret: twoFactorSecret.substring(0, 10) + '...',
      });
      
      // Check if provided code matches current, previous, or next token
      const isValid = verificationCode === currentToken || 
                     verificationCode === previousToken || 
                     verificationCode === nextToken;
      
      if (!isValid) {
        toast({
          title: '❌ خطأ',
          description: `رمز التحقق غير صحيح. المتوقع: ${currentToken}`,
          variant: 'destructive',
        });
        return;
      }

      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () =>
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );

      const { success, error } = await enable2FA(user.id, twoFactorSecret, backupCodes);
      if (success) {
        toast({
          title: '✅ نجح',
          description: 'تم تفعيل 2FA بنجاح',
        });
        setTwoFactorSecret(null);
        setTwoFactorQR(null);
        setVerificationCode('');
        loadSettings();
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في تفعيل 2FA',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في التحقق من رمز 2FA',
        variant: 'destructive',
      });
    }
  };

  const handleDisable2FA = async () => {
    if (!user?.id) return;

    if (!confirm('هل أنت متأكد من تعطيل 2FA؟')) {
      return;
    }

    try {
      const { success, error } = await disable2FA(user.id);
      if (success) {
        toast({
          title: '✅ نجح',
          description: 'تم تعطيل 2FA',
        });
        loadSettings();
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في تعطيل 2FA',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error);
    }
  };

  if (loading && !settings) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 2FA Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Two-Factor Authentication (2FA)
          </CardTitle>
          <CardDescription>
            حماية حسابك بطبقة أمان إضافية
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings?.two_factor_enabled ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">2FA مفعّل</p>
                  <p className="text-sm text-muted-foreground">
                    حسابك محمي بـ Two-Factor Authentication
                  </p>
                </div>
                <Button variant="destructive" onClick={handleDisable2FA}>
                  تعطيل 2FA
                </Button>
              </div>
            </div>
          ) : twoFactorQR ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="mb-4">امسح QR Code باستخدام Google Authenticator:</p>
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  {twoFactorQR ? (
                    <QRCodeSVG
                      value={twoFactorQR}
                      size={200}
                      level="M"
                      includeMargin={true}
                    />
                  ) : (
                    <div className="w-[200px] h-[200px] bg-gray-100 flex items-center justify-center rounded">
                      <p className="text-xs text-muted-foreground">جارٍ التحميل...</p>
                    </div>
                  )}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  أو أدخل هذا المفتاح يدوياً: <code className="font-mono">{twoFactorSecret}</code>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="verification-code">رمز التحقق</Label>
                <Input
                  id="verification-code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                />
                <Button onClick={handleVerify2FA} className="w-full">
                  التحقق وتفعيل
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTwoFactorQR(null);
                    setTwoFactorSecret(null);
                  }}
                  className="w-full"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={handleEnable2FA} className="w-full">
              تفعيل 2FA
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Login Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            إشعارات تسجيل الدخول
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="login-alerts">إشعارات تسجيل الدخول</Label>
              <p className="text-sm text-muted-foreground">
                إرسال إشعار عند تسجيل الدخول من جهاز أو IP جديد
              </p>
            </div>
            <Switch
              id="login-alerts"
              checked={settings?.login_alerts_enabled ?? true}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Session Timeout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            إعدادات الجلسة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="session-timeout">مهلة انتهاء الجلسة (ساعات)</Label>
            <Input
              id="session-timeout"
              type="number"
              value={settings?.session_timeout_hours ?? 12}
              disabled
            />
            <p className="text-sm text-muted-foreground">
              الجلسة الحالية: {settings?.session_timeout_hours ?? 12} ساعة
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Last Login Info */}
      {settings?.last_login_at && (
        <Card>
          <CardHeader>
            <CardTitle>آخر تسجيل دخول</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">التاريخ:</span>{' '}
              {new Date(settings.last_login_at).toLocaleString('ar')}
            </div>
            {settings.last_login_ip && (
              <div>
                <span className="text-muted-foreground">IP:</span>{' '}
                <code className="font-mono">{settings.last_login_ip}</code>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

