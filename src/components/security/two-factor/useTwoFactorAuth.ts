
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import * as OTPAuth from 'otpauth';

interface TwoFactorSettings {
  id: string;
  secret: string;
  backup_codes: string[];
  is_enabled: boolean;
}

export const useTwoFactorAuth = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<TwoFactorSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (user) {
      loadTwoFactorSettings();
    }
  }, [user]);

  const loadTwoFactorSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('two_factor_auth')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading 2FA settings:', error);
      } else {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading 2FA settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSecret = () => {
    // إنشاء سر قوي وآمن للمصادقة الثنائية
    const secret = new OTPAuth.Secret({ size: 20 });
    const base32Secret = secret.base32;
    
    // إنشاء TOTP object
    const totp = new OTPAuth.TOTP({
      issuer: 'TradingPlatform',
      label: user?.email || 'user@example.com',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: base32Secret,
    });

    // إنشاء URL للمصادقة الثنائية
    const otpAuthUrl = totp.toString();
    
    // إنشاء QR Code
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`;
    
    console.log('Generated secret:', base32Secret);
    console.log('OTP Auth URL:', otpAuthUrl);
    console.log('QR Code URL:', qrUrl);
    
    setQrCodeUrl(qrUrl);
    return base32Secret;
  };

  const verifyTOTP = (token: string, secret: string): boolean => {
    try {
      const totp = new OTPAuth.TOTP({
        issuer: 'TradingPlatform',
        label: user?.email || 'user@example.com',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret,
      });

      // التحقق من الكود الحالي والكود السابق (للتعامل مع تأخير الوقت)
      const currentToken = totp.generate();
      const previousToken = totp.generate({ timestamp: Date.now() - 30000 }); // 30 ثانية سابقة
      
      console.log('Expected tokens:', { currentToken, previousToken });
      console.log('Provided token:', token);
      
      return token === currentToken || token === previousToken;
    } catch (error) {
      console.error('Error verifying TOTP:', error);
      return false;
    }
  };

  const setupTwoFactor = async () => {
    if (!user) return;

    try {
      setSetupMode(true);
      const secret = generateSecret();

      // توليد أكواد احتياطية
      const backupCodes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );

      // التحقق من وجود إعداد سابق
      const { data: existingData } = await supabase
        .from('two_factor_auth')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let result;
      
      if (existingData) {
        // تحديث الإعداد الموجود
        result = await supabase
          .from('two_factor_auth')
          .update({
            secret,
            backup_codes: backupCodes,
            is_enabled: false
          })
          .eq('user_id', user.id)
          .select()
          .single();
      } else {
        // إنشاء إعداد جديد
        result = await supabase
          .from('two_factor_auth')
          .insert({
            user_id: user.id,
            secret,
            backup_codes: backupCodes,
            is_enabled: false
          })
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      setSettings(result.data);

      toast({
        title: "تم إعداد المصادقة الثنائية",
        description: "امسح رمز QR بتطبيق المصادقة (Google Authenticator أو Authy) واكمل التفعيل"
      });

    } catch (error) {
      console.error('Error setting up 2FA:', error);
      toast({
        title: "خطأ في الإعداد",
        description: "حدث خطأ أثناء إعداد المصادقة الثنائية",
        variant: "destructive"
      });
      setSetupMode(false);
    }
  };

  const verifyAndEnable = async (verificationCode: string) => {
    if (!settings || !verificationCode) return;

    if (verificationCode.length !== 6 || !/^\d{6}$/.test(verificationCode)) {
      toast({
        title: "كود غير صحيح",
        description: "يرجى إدخال كود صحيح مكون من 6 أرقام",
        variant: "destructive"
      });
      return;
    }

    // التحقق الحقيقي من الكود
    const isValid = verifyTOTP(verificationCode, settings.secret);
    
    if (!isValid) {
      toast({
        title: "كود غير صحيح",
        description: "الكود المدخل غير صحيح. تأكد من إدخال الكود من تطبيق المصادقة",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('two_factor_auth')
        .update({ is_enabled: true })
        .eq('id', settings.id);

      if (error) throw error;

      setSettings({ ...settings, is_enabled: true });
      setSetupMode(false);

      await logSecurityActivity('2fa_enabled', { success: true });

      toast({
        title: "تم التفعيل بنجاح",
        description: "تم تفعيل المصادقة الثنائية بنجاح"
      });

    } catch (error) {
      console.error('Error enabling 2FA:', error);
      toast({
        title: "خطأ في التفعيل",
        description: "حدث خطأ أثناء تفعيل المصادقة الثنائية",
        variant: "destructive"
      });
    }
  };

  const disableTwoFactor = async () => {
    if (!settings) return;

    try {
      const { error } = await supabase
        .from('two_factor_auth')
        .update({ is_enabled: false })
        .eq('id', settings.id);

      if (error) throw error;

      setSettings({ ...settings, is_enabled: false });

      await logSecurityActivity('2fa_disabled', { success: true });

      toast({
        title: "تم الإلغاء",
        description: "تم إلغاء تفعيل المصادقة الثنائية"
      });

    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إلغاء التفعيل",
        variant: "destructive"
      });
    }
  };

  const logSecurityActivity = async (action: string, details: any) => {
    if (!user) return;

    try {
      await supabase
        .from('security_logs')
        .insert({
          user_id: user.id,
          action,
          details,
          success: details.success || true
        });
    } catch (error) {
      console.error('Error logging security activity:', error);
    }
  };

  return {
    settings,
    loading,
    setupMode,
    qrCodeUrl,
    setSetupMode,
    setupTwoFactor,
    verifyAndEnable,
    disableTwoFactor
  };
};
