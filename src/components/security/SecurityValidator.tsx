
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SecurityValidatorProps {
  children: React.ReactNode;
}

export const SecurityValidator = ({ children }: SecurityValidatorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    // تسجيل نشاط المستخدم
    const logUserActivity = async () => {
      try {
        await supabase
          .from('security_logs')
          .insert({
            user_id: user.id,
            action: 'PAGE_ACCESS',
            details: {
              timestamp: new Date().toISOString(),
              page: window.location.pathname,
              user_agent: navigator.userAgent
            },
            success: true
          });
      } catch (error) {
        console.error('Error logging user activity:', error);
      }
    };

    // مراقبة محاولات الوصول المشبوهة
    const detectSuspiciousActivity = () => {
      const lastActivity = localStorage.getItem('lastActivity');
      const now = Date.now();
      
      if (lastActivity) {
        const timeDiff = now - parseInt(lastActivity);
        // إذا كان الفرق أقل من ثانية واحدة، قد يكون نشاط مشبوه
        if (timeDiff < 1000) {
          toast({
            title: 'تحذير أمني',
            description: 'تم اكتشاف نشاط سريع غير طبيعي',
            variant: 'destructive'
          });
        }
      }
      
      localStorage.setItem('lastActivity', now.toString());
    };

    // تشفير البيانات الحساسة في localStorage
    const encryptSensitiveData = () => {
      const sensitiveKeys = ['tradingSettings', 'apiKeys', 'personalData'];
      sensitiveKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data && !data.startsWith('encrypted:')) {
          // تشفير بسيط (في الإنتاج يجب استخدام تشفير أقوى)
          const encrypted = btoa(data);
          localStorage.setItem(key, `encrypted:${encrypted}`);
        }
      });
    };

    logUserActivity();
    detectSuspiciousActivity();
    encryptSensitiveData();

    // تنظيف البيانات المؤقتة كل 10 دقائق
    const cleanupInterval = setInterval(() => {
      const tempKeys = Object.keys(localStorage).filter(key => key.startsWith('temp_'));
      tempKeys.forEach(key => localStorage.removeItem(key));
    }, 10 * 60 * 1000);

    return () => {
      clearInterval(cleanupInterval);
    };
  }, [user, toast]);

  return <>{children}</>;
};
