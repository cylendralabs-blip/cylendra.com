import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PlatformCapitalDisplayProps {
  availableBalance: number;
  selectedPlatformInfo: {
    platform: string;
    testnet?: boolean;
  } | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  marketType?: string;
}

const PlatformCapitalDisplay = ({
  availableBalance,
  selectedPlatformInfo,
  isLoading = false,
  onRefresh,
  marketType = 'spot'
}: PlatformCapitalDisplayProps) => {
  const { t, i18n } = useTranslation('bot_settings');

  const getPlatformDisplayName = (platform: string) => {
    const platformNames: { [key: string]: string } = {
      'binance': t('general.platforms.binance_live'),
      'binance-demo': t('general.platforms.binance_demo'),
      'binance-spot-testnet': t('general.platforms.binance_spot_testnet'),
      'binance-futures-testnet': t('general.platforms.binance_futures_testnet'),
      'okx': t('general.platforms.okx'),
      'okx-demo': t('general.platforms.okx_demo'),
      'bybit': t('general.platforms.bybit_live'),
      'bybit-testnet': t('general.platforms.bybit_testnet'),
      'kucoin': t('general.platforms.kucoin')
    };
    return platformNames[platform] || platform.toUpperCase();
  };

  const getMarketType = (formMarketType: string) => {
    if (formMarketType === 'futures') {
      return t('capital.markets.futures');
    } else if (formMarketType === 'spot') {
      return t('capital.markets.spot');
    }
    return t('capital.markets.spot');
  };

  const isBinancePlatform = selectedPlatformInfo?.platform === 'binance' ||
    selectedPlatformInfo?.platform === 'binance-demo' ||
    selectedPlatformInfo?.platform === 'binance-spot-testnet' ||
    selectedPlatformInfo?.platform === 'binance-futures-testnet';

  const formatTime = () => {
    return new Date().toLocaleTimeString(i18n.language === 'ar' ? 'ar-SA' : 'en-US');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {t('capital.display.label')}
        </label>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-8 px-3"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? t('capital.display.refreshing') : t('capital.display.refresh')}
          </Button>
        )}
      </div>

      <div className={`p-4 border rounded-lg ${isBinancePlatform
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
        }`}>
        <div className={`text-2xl font-bold ${isLoading
            ? 'text-blue-600 dark:text-blue-400'
            : availableBalance > 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-400'
          }`}>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin" />
              {t('capital.display.fetching', {
                platform: selectedPlatformInfo ? getPlatformDisplayName(selectedPlatformInfo.platform) : t('capital.display.platform_short'),
                market: getMarketType(marketType)
              })}
            </div>
          ) : (
            <>
              {availableBalance > 0 ? `${availableBalance.toLocaleString()} USDT` : '--- USDT'}
            </>
          )}
        </div>

        <div className="mt-2 space-y-1">
          {selectedPlatformInfo && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800 dark:text-blue-200">
                <strong>{t('capital.display.source')}</strong> {getPlatformDisplayName(selectedPlatformInfo.platform)} - {getMarketType(marketType)}
                {selectedPlatformInfo.testnet && ` ${t('capital.display.demo')}`}
                <br />
                <strong>{t('capital.display.wallet_type')}</strong> {marketType.toUpperCase()}
              </span>
            </div>
          )}

          <p className="text-xs text-gray-500">
            {isLoading
              ? t('capital.display.status.fetching', {
                platform: selectedPlatformInfo ? getPlatformDisplayName(selectedPlatformInfo.platform) : '',
                market: getMarketType(marketType)
              })
              : availableBalance > 0
                ? t('capital.display.status.fetched', {
                  market: getMarketType(marketType),
                  platform: selectedPlatformInfo ? getPlatformDisplayName(selectedPlatformInfo.platform) : t('capital.display.platform_short')
                })
                : selectedPlatformInfo
                  ? isBinancePlatform
                    ? t('capital.display.status.not_found', {
                      market: getMarketType(marketType),
                      platform: getPlatformDisplayName(selectedPlatformInfo.platform)
                    })
                    : t('capital.display.status.no_data', {
                      platform: getPlatformDisplayName(selectedPlatformInfo.platform)
                    })
                  : t('capital.display.status.update_auto')
            }
          </p>

          {!isLoading && availableBalance === 0 && selectedPlatformInfo && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-xs text-yellow-700 dark:text-yellow-300">
                {isBinancePlatform
                  ? (
                    <>
                      {t('capital.display.warnings.no_balance', {
                        market: getMarketType(marketType),
                        platform: getPlatformDisplayName(selectedPlatformInfo.platform)
                      })}
                      <br />
                      <strong>{t('capital.display.warnings.check_balance', {
                        market: getMarketType(marketType),
                        platform: getPlatformDisplayName(selectedPlatformInfo.platform)
                      })}</strong>
                    </>
                  )
                  : selectedPlatformInfo.platform === 'okx-demo'
                    ? t('capital.display.warnings.okx_demo')
                    : t('capital.display.warnings.check_balance', {
                      market: getMarketType(marketType),
                      platform: getPlatformDisplayName(selectedPlatformInfo.platform)
                    })
                }
              </span>
            </div>
          )}

          {availableBalance > 0 && selectedPlatformInfo && (
            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
              <div className="text-xs text-green-700 dark:text-green-300">
                {t('capital.display.success.verified', {
                  market: getMarketType(marketType),
                  platform: getPlatformDisplayName(selectedPlatformInfo.platform)
                })}
                <br />
                {t('capital.display.wallet_type')} {marketType.toUpperCase()}
                <br />
                {t('capital.display.success.last_update', { time: formatTime() })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlatformCapitalDisplay;
