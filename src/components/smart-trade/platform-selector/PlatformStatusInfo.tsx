
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';

interface PlatformInfo {
  platform: string;
  testnet: boolean;
}

interface PlatformStatusInfoProps {
  selectedPlatformInfo: PlatformInfo | null;
  getPlatformDisplayName: (platform: string, testnet: boolean) => string;
  pairsLoading: boolean;
  pairsCount: number;
  marketType: 'spot' | 'futures';
  selectedSymbol: string;
}

const PlatformStatusInfo = ({
  selectedPlatformInfo,
  getPlatformDisplayName,
  pairsLoading,
  pairsCount,
  marketType,
  selectedSymbol
}: PlatformStatusInfoProps) => {
  return (
    <div className="space-y-2 animate-slide-in-right" style={{ animationDelay: '0.4s' }}>
      <label className="text-sm font-medium text-muted-foreground">
        الحالة
      </label>
      <div className="flex flex-col gap-1">
        {selectedPlatformInfo ? (
          <>
            <Badge variant="default" className="text-xs status-success">
              <Activity className="w-3 h-3 mr-1 icon-interactive" />
              متصل
            </Badge>
            <span className="text-xs text-muted-foreground">
              {getPlatformDisplayName(selectedPlatformInfo.platform, selectedPlatformInfo.testnet)}
            </span>
          </>
        ) : (
          <Badge variant="outline" className="text-xs">
            غير محدد
          </Badge>
        )}
      </div>
    </div>
  );
};

export default PlatformStatusInfo;
