import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Database
} from 'lucide-react';
import SettingsHeader from '@/components/settings/SettingsHeader';
import GeneralTab from '@/components/settings/GeneralTab';
import NotificationsTab from '@/components/settings/NotificationsTab';
import SecurityTab from '@/components/settings/SecurityTab';
import DataTab from '@/components/settings/DataTab';
import PageSkeleton from '@/components/loading/PageSkeleton';
import { useCachedSettingsQuery } from '@/hooks/useCachedQuery';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

const Settings = () => {
  const { t } = useTranslation('settings');
  const { toast } = useToast();
  const { user } = useAuth();

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    tradingAlerts: true,
    priceAlerts: true,
    soundEffects: false,
    autoSave: true,
    twoFactorAuth: false,
    biometricAuth: false,
    sessionTimeout: '1h',
    language: 'ar',
    currency: 'USD',
    timeZone: 'Asia/Riyadh'
  });

  // تحميل الإعدادات من Cache
  const { data: userSettings, isLoading } = useCachedSettingsQuery(
    ['user-settings', user?.id || ''],
    async () => {
      // محاكاة تحميل الإعدادات
      await new Promise(resolve => setTimeout(resolve, 100));
      return settings;
    },
    { enabled: !!user }
  );

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));

    toast({
      title: t('toast.saved'),
      description: t('toast.updated')
    });
  };

  // عرض Skeleton أثناء التحميل
  if (isLoading) {
    return <PageSkeleton type="settings" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <SettingsHeader />

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center space-x-2 space-x-reverse">
              <SettingsIcon className="w-4 h-4" />
              <span>{t('tabs.general')}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2 space-x-reverse">
              <Bell className="w-4 h-4" />
              <span>{t('tabs.notifications')}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2 space-x-reverse">
              <Shield className="w-4 h-4" />
              <span>{t('tabs.security')}</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center space-x-2 space-x-reverse">
              <Database className="w-4 h-4" />
              <span>{t('tabs.data')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <GeneralTab settings={userSettings || settings} onSettingChange={handleSettingChange} />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationsTab settings={userSettings || settings} onSettingChange={handleSettingChange} />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecurityTab />
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <DataTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
