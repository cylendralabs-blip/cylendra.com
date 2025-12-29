
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ApiKey {
  id: string;
  platform: string;
  is_active: boolean;
  testnet: boolean;
}

interface PlatformSelectProps {
  selectedPlatform: string;
  availableApiKeys: ApiKey[];
  onPlatformChange: (platformId: string) => void;
  getPlatformDisplayName: (platform: string, testnet: boolean) => string;
}

const PlatformSelect = ({ 
  selectedPlatform, 
  availableApiKeys, 
  onPlatformChange, 
  getPlatformDisplayName 
}: PlatformSelectProps) => {
  return (
    <Select value={selectedPlatform} onValueChange={onPlatformChange}>
      <SelectTrigger className="w-full trading-input focus-ring">
        <SelectValue placeholder="اختر المنصة" />
      </SelectTrigger>
      <SelectContent className="bg-card border-border shadow-trading-lg">
        {availableApiKeys.map((key) => (
          <SelectItem key={key.id} value={key.id} className="transition-smooth hover:bg-secondary/50">
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {getPlatformDisplayName(key.platform, key.testnet)}
              </span>
              {key.testnet && (
                <Badge variant="outline" className="text-xs status-warning">
                  تجريبي
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default PlatformSelect;
