
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PlatformFilterProps {
  selectedPlatform: string;
  onPlatformChange: (platform: string) => void;
  onSyncPlatform: (platform: string) => void;
  isSyncing: boolean;
  platforms: string[];
}

const PlatformFilter = ({ 
  selectedPlatform, 
  onPlatformChange, 
  onSyncPlatform,
  isSyncing,
  platforms 
}: PlatformFilterProps) => {
  const isMobile = useIsMobile();

  const getPlatformLabel = (platform: string) => {
    const labels: Record<string, string> = {
      'all': 'جميع المنصات',
      'binance': 'بايننس',
      'binance-futures': 'بايننس فيوتشر',
      'bybit': 'بايبيت',
      'kucoin': 'كوكوين',
      'okx': 'أوككس'
    };
    return labels[platform] || platform;
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      'binance': 'bg-yellow-500',
      'binance-futures': 'bg-orange-500',
      'bybit': 'bg-blue-500',
      'kucoin': 'bg-green-500',
      'okx': 'bg-purple-500'
    };
    return colors[platform] || 'bg-gray-500';
  };

  return (
    <div className={`flex items-center gap-2 ${isMobile ? 'flex-col w-full' : ''}`}>
      <Select value={selectedPlatform} onValueChange={onPlatformChange}>
        <SelectTrigger className={isMobile ? 'w-full' : 'w-[180px]'}>
          <SelectValue placeholder="اختر المنصة" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">جميع المنصات</SelectItem>
          {platforms.map((platform) => (
            <SelectItem key={platform} value={platform}>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getPlatformColor(platform)}`} />
                {getPlatformLabel(platform)}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedPlatform !== 'all' && (
        <Button
          variant="outline"
          size={isMobile ? "default" : "sm"}
          onClick={() => onSyncPlatform(selectedPlatform)}
          disabled={isSyncing}
          className={isMobile ? 'w-full' : ''}
        >
          {isSyncing ? (
            <>
              <RefreshCw className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'} mr-2 animate-spin`} />
              جاري المزامنة...
            </>
          ) : (
            <>
              <RefreshCw className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'} mr-2`} />
              مزامنة
            </>
          )}
        </Button>
      )}

      {platforms.length > 0 && (
        <div className={`flex flex-wrap gap-1 ${isMobile ? 'w-full' : ''}`}>
          {platforms.map((platform) => (
            <Badge
              key={platform}
              variant="outline"
              className={`${getPlatformColor(platform)} text-white text-xs`}
            >
              {getPlatformLabel(platform)}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlatformFilter;
