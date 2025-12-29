import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PlatformInfoProps {
  platformName: string;
  totalCapital: number;
  availableBalance: number;
  isTestnet: boolean;
  isConnected: boolean;
}

const PlatformInfo = ({
  platformName,
  totalCapital,
  availableBalance,
  isTestnet,
  isConnected
}: PlatformInfoProps) => {
  const { t } = useTranslation('bot_settings');

  const getPlatformDisplayName = (platform: string) => {
    const platformNames: { [key: string]: string } = {
      'binance': t('general.platforms.binance_live'),
      'binance-futures-testnet': t('general.platforms.binance_futures_testnet'),
      'okx': t('general.platforms.okx'),
      'bybit': t('general.platforms.bybit_live'),
      'kucoin': t('general.platforms.kucoin')
    };
    return platformNames[platform] || platform.toUpperCase();
  };

  const getBalanceStatus = () => {
    if (availableBalance === 0) {
      return {
        message: t('capital.platform_info.compatibility.not_fetched'),
        type: 'warning' as const,
        label: t('capital.platform_info.compatibility.loading')
      };
    }
    if (totalCapital > availableBalance) {
      return {
        message: t('capital.platform_info.compatibility.too_high'),
        type: 'error' as const,
        label: t('capital.platform_info.compatibility.incompatible')
      };
    }
    return {
      message: t('capital.platform_info.compatibility.good'),
      type: 'success' as const,
      label: t('capital.platform_info.compatibility.compatible')
    };
  };

  const balanceStatus = getBalanceStatus();

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            {t('capital.platform_info.title')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? (
                <><CheckCircle className="w-3 h-3 mr-1" />{t('capital.platform_info.connected')}</>
              ) : (
                <><AlertCircle className="w-3 h-3 mr-1" />{t('capital.platform_info.disconnected')}</>
              )}
            </Badge>
            {availableBalance === 0 && (
              <Badge variant="outline" className="text-xs">
                <RefreshCw className="w-3 h-3 mr-1" />
                {t('capital.platform_info.loading')}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          {t('capital.platform_info.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('capital.platform_info.platform')}
            </label>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{getPlatformDisplayName(platformName)}</span>
              {isTestnet && (
                <Badge variant="secondary" className="text-xs">
                  {t('capital.platform_info.demo')}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('capital.platform_info.available_balance')}
            </label>
            <div className={`text-2xl font-bold ${availableBalance > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
              }`}>
              {availableBalance > 0 ? availableBalance.toLocaleString() : '---'} USDT
            </div>
            <p className="text-xs text-gray-500">
              {availableBalance > 0
                ? t('capital.platform_info.available_desc')
                : t('capital.platform_info.update_auto')
              }
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('capital.platform_info.total_defined')}
            </label>
            <div className="text-xl font-semibold text-blue-600 dark:text-blue-400">
              {totalCapital > 0 ? totalCapital.toLocaleString() : '---'} USDT
            </div>
            <p className="text-xs text-gray-500">
              {t('capital.platform_info.defined_desc')}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('capital.platform_info.compatibility.title')}
            </label>
            <div className="flex items-center gap-2">
              <Badge variant={
                balanceStatus.type === 'success' ? 'default' :
                  balanceStatus.type === 'warning' ? 'secondary' : 'destructive'
              }>
                {balanceStatus.type === 'success' && <CheckCircle className="w-3 h-3 mr-1" />}
                {balanceStatus.type === 'warning' && <RefreshCw className="w-3 h-3 mr-1" />}
                {balanceStatus.type === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                {balanceStatus.label}
              </Badge>
            </div>
            <p className="text-xs text-gray-500">
              {balanceStatus.message}
            </p>
          </div>
        </div>

        {totalCapital > 0 && availableBalance > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-800 dark:text-blue-200">{t('capital.platform_info.usage')}</span>
              <span className="font-semibold text-blue-900 dark:text-blue-100">
                {Math.round((totalCapital / availableBalance) * 100)}%
              </span>
            </div>
            <div className="mt-2 bg-blue-200 rounded-full h-2 dark:bg-blue-700">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((totalCapital / availableBalance) * 100, 100)}%`
                }}
              ></div>
            </div>
          </div>
        )}

        {totalCapital > availableBalance && availableBalance > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{t('capital.platform_info.warning.title')}</span>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              {t('capital.platform_info.warning.message', {
                total_capital: totalCapital.toLocaleString(),
                available_balance: availableBalance.toLocaleString()
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlatformInfo;
