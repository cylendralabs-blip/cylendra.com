
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useBotSettingsData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bot-settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('bot_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching bot settings:', error);
        throw error;
      }
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent automatic refetch
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount after initial load
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
};
