
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SecurityLog {
  id: string;
  user_id: string;
  action: string;
  details: any;
  ip_address: unknown;
  user_agent: string | null;
  success: boolean;
  created_at: string;
}

export const useSecurityLogs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSecurityLogs();
    }
  }, [user]);

  const loadSecurityLogs = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('security_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading security logs:', error);
        toast({
          title: "خطأ في تحميل السجل",
          description: "حدث خطأ أثناء تحميل سجل الأنشطة الأمنية",
          variant: "destructive"
        });
      } else {
        setLogs(data || []);
      }
    } catch (error) {
      console.error('Error loading security logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearOldLogs = async () => {
    if (!user) return;

    try {
      // حذف السجلات الأقدم من 30 يوم
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error } = await supabase
        .from('security_logs')
        .delete()
        .eq('user_id', user.id)
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (error) {
        console.error('Error clearing old logs:', error);
        toast({
          title: "خطأ في المسح",
          description: "حدث خطأ أثناء مسح السجلات القديمة",
          variant: "destructive"
        });
      } else {
        await loadSecurityLogs(); // إعادة تحميل السجلات
        toast({
          title: "تم المسح",
          description: "تم مسح السجلات القديمة بنجاح"
        });
      }
    } catch (error) {
      console.error('Error clearing old logs:', error);
    }
  };

  return {
    logs,
    loading,
    loadSecurityLogs,
    clearOldLogs
  };
};
