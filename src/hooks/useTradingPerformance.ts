
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useTradingPerformance = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['trading-performance', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      try {
        const { data, error } = await supabase
          .from('trading_performance')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (error) {
          console.log('No trading performance data available yet');
          return null;
        }
        
        return data;
      } catch (error) {
        console.log('Trading performance will be available after first trades');
        return null;
      }
    },
    enabled: !!user,
    retry: false, // Don't retry if no data exists
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
  });
};
