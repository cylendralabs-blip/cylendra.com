import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UseFormReturn } from 'react-hook-form';
import { BotSettingsForm } from '@/types/botSettings';
import { useEffect } from 'react';
import * as React from 'react';
import PlatformInfo from './PlatformInfo';
import PlatformCapitalDisplay from './capital/PlatformCapitalDisplay';
import CapitalFormFields from './capital/CapitalFormFields';
import { useBinanceCapital } from '@/hooks/useBinanceCapital';
import { useTranslation } from 'react-i18next';

interface CapitalSettingsProps {
  form: UseFormReturn<BotSettingsForm>;
}


const CapitalSettings = ({ form }: CapitalSettingsProps) => {
  const { t } = useTranslation('bot_settings');
  const watchDefaultPlatform = form.watch('default_platform');
  const watchMarketType = form.watch('market_type');

  // بسيط ومباشر - جلب الرصيد للمنصة المختارة فوراً
  const { availableBalance, selectedPlatformInfo, refetchBalances, isLoading } = useBinanceCapital(
    watchDefaultPlatform,
    watchMarketType
  );

  console.log('CapitalSettings render - platform:', watchDefaultPlatform, 'market type:', watchMarketType);
  console.log('CapitalSettings render - balance:', availableBalance);
  console.log('CapitalSettings render - platform info:', selectedPlatformInfo);

  // تحديث total_capital في النموذج عندما يتغير الرصيد المتاح
  useEffect(() => {
    console.log('💰 CapitalSettings effect - availableBalance changed to:', availableBalance, 'for platform:', watchDefaultPlatform, 'market type:', watchMarketType);

    if (availableBalance > 0) {
      const currentCapital = form.getValues('total_capital');
      console.log('📊 Current form capital:', currentCapital, '→ New balance:', availableBalance);

      // تحديث دائماً عند اختلاف الرصيد - نريد الرصيد الحقيقي فقط!
      if (currentCapital !== availableBalance) {
        console.log('✅ Updating form total_capital from', currentCapital, 'to', availableBalance);
        form.setValue('total_capital', availableBalance, { shouldValidate: true });
      }
    } else if (availableBalance === 0) {
      // إذا كان الرصيد صفر، نعرض صفر (ليس قيمة قديمة)
      const currentCapital = form.getValues('total_capital');
      if (currentCapital !== 0) {
        console.log('⚠️ Balance is 0, resetting total_capital to 0');
        form.setValue('total_capital', 0, { shouldValidate: true });
      }
    }
  }, [availableBalance, form, watchDefaultPlatform, watchMarketType]);


  return (
    <div className="space-y-6">
      {/* معلومات المنصة */}
      {selectedPlatformInfo && (
        <PlatformInfo
          platformName={selectedPlatformInfo.platform}
          totalCapital={form.watch('total_capital') || 0}
          availableBalance={availableBalance}
          isTestnet={selectedPlatformInfo.testnet}
          isConnected={true}
        />
      )}

      {/* إعدادات رأس المال */}
      <Card>
        <CardHeader>
          <CardTitle>{t('capital.title')}</CardTitle>
          <CardDescription>{t('capital.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <PlatformCapitalDisplay
            availableBalance={availableBalance}
            selectedPlatformInfo={selectedPlatformInfo}
            isLoading={isLoading}
            onRefresh={refetchBalances}
            marketType={watchMarketType}
          />
          <CapitalFormFields form={form} />
        </CardContent>
      </Card>
    </div>
  );
};

export default CapitalSettings;
