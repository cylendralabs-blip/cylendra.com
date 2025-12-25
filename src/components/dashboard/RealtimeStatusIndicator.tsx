import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

export const RealtimeStatusIndicator = () => {
  const { t } = useTranslation('dashboard');
  const [isConnected, setIsConnected] = useState(false);
  const [channelCount, setChannelCount] = useState(0);

  useEffect(() => {
    const checkConnection = () => {
      const channels = supabase.getChannels();
      setChannelCount(channels.length);

      // Check if at least one channel is subscribed
      const hasActiveChannels = channels.some(
        channel => channel.state === 'joined'
      );
      setIsConnected(hasActiveChannels);
    };

    // Check initially
    checkConnection();

    // Check periodically
    const interval = setInterval(checkConnection, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Badge
      variant={isConnected ? 'default' : 'secondary'}
      className="gap-2"
    >
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3 animate-pulse" />
          <span>{t('realtime.connected', { count: channelCount })}</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>{t('realtime.disconnected')}</span>
        </>
      )}
    </Badge>
  );
};
