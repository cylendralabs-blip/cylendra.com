
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, Zap, CheckCircle, TrendingUp, Trash2 } from 'lucide-react';
import { useSyncRealTrades } from '@/hooks/useSyncRealTrades';
import { useIsMobile } from '@/hooks/use-mobile';

interface RealDataActionsProps {
  availablePlatforms: string[];
  onRefreshPrices: () => void;
  isUpdatingPrices: boolean;
  livePrices?: Record<string, number>;
}

const RealDataActions = ({ 
  availablePlatforms, 
  onRefreshPrices, 
  isUpdatingPrices,
  livePrices = {}
}: RealDataActionsProps) => {
  const isMobile = useIsMobile();
  const { syncTradesFromPlatform, generateSampleTrades, clearAllTrades, isSyncing } = useSyncRealTrades();

  const getPlatformLabel = (platform: string) => {
    const labels: Record<string, string> = {
      'binance': 'بايننس',
      'binance-futures-testnet': 'بايننس فيوتشر (تجريبي)',
      'bybit': 'بايبيت',
      'kucoin': 'كوكوين',
      'okx': 'أوككس'
    };
    return labels[platform] || platform;
  };

  const hasLivePrices = Object.keys(livePrices).length > 0;

  return (
    <Card className="mb-6 border-2 border-blue-200 dark:border-blue-800">
      <CardHeader className={`${isMobile ? 'p-3 pb-2' : 'p-4 pb-3'} bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950`}>
        <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
          <TrendingUp className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-blue-500`} />
          البيانات الحية والمزامنة
          {hasLivePrices && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
              <CheckCircle className="w-3 h-3 mr-1" />
              متصل - {Object.keys(livePrices).length} عملة
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className={isMobile ? 'p-3 pt-0' : 'p-4 pt-0'}>
        <div className={`space-y-3 ${isMobile ? '' : 'space-y-4'}`}>
          
          {/* تحديث الأسعار */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className={`font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>
                تحديث الأسعار الحية
              </h4>
              <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                جلب أحدث أسعار العملات من Binance - {hasLivePrices ? 'نشط' : 'غير متصل'}
              </p>
            </div>
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={onRefreshPrices}
              disabled={isUpdatingPrices}
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              {isUpdatingPrices ? (
                <>
                  <RefreshCw className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2 animate-spin`} />
                  {isMobile ? 'جاري...' : 'جاري التحديث...'}
                </>
              ) : (
                <>
                  <RefreshCw className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
                  {isMobile ? 'تحديث' : 'تحديث الأسعار'}
                </>
              )}
            </Button>
          </div>

          {/* مزامنة الصفقات */}
          {availablePlatforms.length > 0 && (
            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className={`font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>
                  مزامنة الصفقات من المنصات
                </h4>
                <Badge variant="secondary" className="text-xs">
                  {availablePlatforms.length} منصة
                </Badge>
              </div>
              <div className={`grid gap-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
                {availablePlatforms.map((platform) => (
                  <Button
                    key={platform}
                    variant="outline"
                    size={isMobile ? "sm" : "default"}
                    onClick={() => syncTradesFromPlatform.mutate(platform)}
                    disabled={isSyncing}
                    className="justify-start border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    {isSyncing ? (
                      <RefreshCw className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2 animate-spin`} />
                    ) : (
                      <Download className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
                    )}
                    {getPlatformLabel(platform)}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* إدارة البيانات */}
          <div className="border-t pt-3">
            <h4 className={`font-medium mb-3 ${isMobile ? 'text-sm' : 'text-base'}`}>
              إدارة البيانات
            </h4>
            <div className={`grid gap-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <Button
                variant="outline"
                size={isMobile ? "sm" : "default"}
                onClick={() => generateSampleTrades.mutate()}
                disabled={isSyncing}
                className="justify-start border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                {isSyncing ? (
                  <RefreshCw className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2 animate-spin`} />
                ) : (
                  <Zap className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
                )}
                {isMobile ? 'إنشاء صفقات' : 'إنشاء صفقات بأسعار حية'}
              </Button>
              
              <Button
                variant="outline"
                size={isMobile ? "sm" : "default"}
                onClick={() => clearAllTrades.mutate()}
                disabled={isSyncing}
                className="justify-start border-red-300 text-red-700 hover:bg-red-50"
              >
                {isSyncing ? (
                  <RefreshCw className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2 animate-spin`} />
                ) : (
                  <Trash2 className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
                )}
                {isMobile ? 'حذف الكل' : 'حذف جميع الصفقات'}
              </Button>
            </div>
            <p className={`text-muted-foreground mt-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              إنشاء صفقات نموذجية بأسعار حقيقية أو حذف جميع البيانات الموجودة
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealDataActions;
