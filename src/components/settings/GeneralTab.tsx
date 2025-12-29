import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';
import { Sun, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface GeneralTabProps {
  settings: {
    autoSave: boolean;
    sessionTimeout: string;
    language: string;
    currency: string;
  };
  onSettingChange: (key: string, value: boolean | string) => void;
}

const GeneralTab = ({ settings, onSettingChange }: GeneralTabProps) => {
  const { t } = useTranslation('settings');
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    const modeLabel = newTheme === 'dark' ? t('general.appearance.dark') : (newTheme === 'light' ? t('general.appearance.light') : t('general.appearance.system'));
    toast({
      title: t('toast.theme_changed'),
      description: t('toast.switched_to', { mode: modeLabel })
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* إعدادات المظهر */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Sun className="w-5 h-5" />
            <span>{t('general.appearance.title')}</span>
          </CardTitle>
          <CardDescription>
            {t('general.appearance.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('general.appearance.mode')}</Label>
              <p className="text-sm text-muted-foreground">{t('general.appearance.mode_desc')}</p>
            </div>
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t('general.appearance.light')}</SelectItem>
                <SelectItem value="dark">{t('general.appearance.dark')}</SelectItem>
                <SelectItem value="system">{t('general.appearance.system')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>{t('general.appearance.language')}</Label>
              <p className="text-sm text-muted-foreground">{t('general.appearance.language_desc')}</p>
            </div>
            <Select value={settings.language} onValueChange={(value) => onSettingChange('language', value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>{t('general.appearance.currency')}</Label>
              <p className="text-sm text-muted-foreground">{t('general.appearance.currency_desc')}</p>
            </div>
            <Select value={settings.currency} onValueChange={(value) => onSettingChange('currency', value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="SAR">SAR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* إعدادات الجلسة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Lock className="w-5 h-5" />
            <span>{t('general.session.title')}</span>
          </CardTitle>
          <CardDescription>
            {t('general.session.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('general.session.timeout')}</Label>
              <p className="text-sm text-muted-foreground">{t('general.session.timeout_desc')}</p>
            </div>
            <Select value={settings.sessionTimeout} onValueChange={(value) => onSettingChange('sessionTimeout', value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30m">{t('general.session.30m')}</SelectItem>
                <SelectItem value="1h">{t('general.session.1h')}</SelectItem>
                <SelectItem value="6h">{t('general.session.6h')}</SelectItem>
                <SelectItem value="24h">{t('general.session.24h')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>{t('general.session.auto_save')}</Label>
              <p className="text-sm text-muted-foreground">{t('general.session.auto_save_desc')}</p>
            </div>
            <Switch
              checked={settings.autoSave}
              onCheckedChange={(checked) => onSettingChange('autoSave', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralTab;
