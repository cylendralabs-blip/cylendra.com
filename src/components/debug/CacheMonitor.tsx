
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cacheManager } from '@/utils/cacheManager';
import { useTranslation } from 'react-i18next';

const CacheMonitor = () => {
  const { t } = useTranslation('common');
  const [stats, setStats] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      setStats(cacheManager.getStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible || process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 p-4 w-80 z-50 bg-white/95 backdrop-blur">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-sm">Cache Monitor</h3>
        <Button size="sm" variant="ghost" onClick={() => setIsVisible(false)}>
          ×
        </Button>
      </div>

      {stats && (
        <div className="space-y-2 text-xs">
          <div>{t('cache_monitor.cache_items', { count: stats.size })}</div>
          <div>{t('cache_monitor.memory_usage', { kb: Math.round(stats.memory / 1024) })}</div>
          <div className="space-y-1">
            <div className="font-medium">{t('cache_monitor.keys')}</div>
            {stats.keys.slice(0, 5).map((key: string, i: number) => (
              <div key={i} className="text-gray-600 truncate">{key}</div>
            ))}
            {stats.keys.length > 5 && (
              <div className="text-gray-500">{t('cache_monitor.more', { count: stats.keys.length - 5 })}</div>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" onClick={() => cacheManager.clear()}>
              {t('cache_monitor.clear_all')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => cacheManager.cleanup()}>
              {t('cache_monitor.cleanup')}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

// Component for development activation
export const CacheDebugToggle = () => {
  const [showMonitor, setShowMonitor] = useState(false);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="fixed bottom-4 left-4 z-50"
        onClick={() => setShowMonitor(!showMonitor)}
      >
        📊 Cache
      </Button>
      {showMonitor && <CacheMonitor />}
    </>
  );
};

export default CacheMonitor;
