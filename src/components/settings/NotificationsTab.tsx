import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Mail, Smartphone, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NotificationsTabProps {
  settings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    tradingAlerts: boolean;
    priceAlerts: boolean;
    soundEffects: boolean;
  };
  onSettingChange: (key: string, value: boolean | string) => void;
}

const NotificationsTab = ({ settings, onSettingChange }: NotificationsTabProps) => {
  const { t } = useTranslation('settings');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 space-x-reverse">
          <Bell className="w-5 h-5" />
          <span>{t('notifications.title')}</span>
        </CardTitle>
        <CardDescription>
          {t('notifications.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium">{t('notifications.app.title')}</h4>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label>{t('notifications.app.email')}</Label>
                  <p className="text-sm text-muted-foreground">{t('notifications.app.email_desc')}</p>
                </div>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => onSettingChange('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label>{t('notifications.app.push')}</Label>
                  <p className="text-sm text-muted-foreground">{t('notifications.app.push_desc')}</p>
                </div>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => onSettingChange('pushNotifications', checked)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">{t('notifications.trading.title')}</h4>

            <div className="flex items-center justify-between">
              <div>
                <Label>{t('notifications.trading.alerts')}</Label>
                <p className="text-sm text-muted-foreground">{t('notifications.trading.alerts_desc')}</p>
              </div>
              <Switch
                checked={settings.tradingAlerts}
                onCheckedChange={(checked) => onSettingChange('tradingAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>{t('notifications.trading.price')}</Label>
                <p className="text-sm text-muted-foreground">{t('notifications.trading.price_desc')}</p>
              </div>
              <Switch
                checked={settings.priceAlerts}
                onCheckedChange={(checked) => onSettingChange('priceAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label>{t('notifications.trading.sounds')}</Label>
                  <p className="text-sm text-muted-foreground">{t('notifications.trading.sounds_desc')}</p>
                </div>
              </div>
              <Switch
                checked={settings.soundEffects}
                onCheckedChange={(checked) => onSettingChange('soundEffects', checked)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationsTab;
