import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { useTwoFactorAuth } from './two-factor/useTwoFactorAuth';
import TwoFactorSetup from './two-factor/TwoFactorSetup';
import TwoFactorStatus from './two-factor/TwoFactorStatus';
import BackupCodes from './two-factor/BackupCodes';
import { useTranslation } from 'react-i18next';

const TwoFactorAuth = () => {
  const { t } = useTranslation('settings');
  const {
    settings,
    loading,
    setupMode,
    qrCodeUrl,
    setSetupMode,
    setupTwoFactor,
    verifyAndEnable,
    disableTwoFactor
  } = useTwoFactorAuth();

  if (loading) {
    return <div className="animate-pulse h-48 bg-gray-200 rounded-lg"></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 space-x-reverse">
          <Shield className="w-5 h-5" />
          <span>{t('security.two_factor.title')}</span>
          {settings?.is_enabled && (
            <Badge className="bg-green-100 text-green-800">{t('security.two_factor.enabled')}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          {t('security.two_factor.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {settings && !settings.is_enabled && setupMode && (
          <TwoFactorSetup
            qrCodeUrl={qrCodeUrl}
            onVerify={verifyAndEnable}
            onCancel={() => setSetupMode(false)}
          />
        )}

        {settings && settings.is_enabled && (
          <>
            <TwoFactorStatus
              isEnabled={settings.is_enabled}
              hasSettings={!!settings}
              onSetup={setupTwoFactor}
              onDisable={disableTwoFactor}
              onResetup={setupTwoFactor}
              onEnable={() => setSetupMode(true)}
            />
            <BackupCodes codes={settings.backup_codes} />
          </>
        )}

        {(!settings || (!settings.is_enabled && !setupMode)) && (
          <TwoFactorStatus
            isEnabled={false}
            hasSettings={!!settings}
            onSetup={setupTwoFactor}
            onDisable={disableTwoFactor}
            onResetup={setupTwoFactor}
            onEnable={() => setSetupMode(true)}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default TwoFactorAuth;
