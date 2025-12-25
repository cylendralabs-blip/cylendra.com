
import { supabase } from '@/integrations/supabase/client';

export const setupRealtimeSubscriptions = (onDataChange: () => void) => {
  try {
    console.log('Setting up realtime subscriptions...');
    
    const channel = supabase
      .channel('dashboard-updates', {
        config: {
          broadcast: { self: false },
          presence: { key: 'user' }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades'
        },
        (payload) => {
          console.log('Trade data updated:', payload);
          // تأخير قصير لتجنب التحديثات المتكررة
          setTimeout(onDataChange, 1000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trading_performance'
        },
        (payload) => {
          console.log('Performance data updated:', payload);
          setTimeout(onDataChange, 1000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bot_settings'
        },
        (payload) => {
          console.log('Bot settings updated:', payload);
          setTimeout(onDataChange, 1000);
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to realtime updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.log('Realtime subscription error, will continue without realtime updates');
        } else if (status === 'TIMED_OUT') {
          console.log('Realtime subscription timed out, will continue without realtime updates');
        } else if (status === 'CLOSED') {
          console.log('Realtime subscription closed');
        }
        
        if (err) {
          console.log('Realtime subscription error:', err);
        }
      });

    return channel;
  } catch (error) {
    console.log('Failed to setup realtime subscriptions, will continue without real-time updates');
    return null;
  }
};
