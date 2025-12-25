
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Database, Shield, Bell, AlertTriangle, Download, Upload } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import BetaModeSettings from './BetaModeSettings';

const AdminSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    autoBackup: true,
    emailNotifications: true,
    systemAlerts: true,
    maxUsersPerDay: 100,
    maxTradesPerUser: 1000,
    systemMessage: '',
    maintenanceMessage: 'النظام قيد الصيانة، يرجى المحاولة لاحقاً'
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = () => {
    // هنا يمكن حفظ الإعدادات في قاعدة البيانات
    toast({
      title: 'تم حفظ الإعدادات',
      description: 'تم حفظ إعدادات النظام بنجاح'
    });
  };

  const exportData = () => {
    // تصدير البيانات
    toast({
      title: 'تم تصدير البيانات',
      description: 'سيتم تحميل ملف البيانات قريباً'
    });
  };

  const importData = () => {
    // استيراد البيانات
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast({
          title: 'تم تحديد الملف',
          description: `تم تحديد ملف ${file.name} للاستيراد`
        });
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            إعدادات النظام العامة
          </CardTitle>
          <CardDescription>
            التحكم في الإعدادات الأساسية للنظام
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="maintenance">وضع الصيانة</Label>
                <Switch
                  id="maintenance"
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="registration">السماح بالتسجيل</Label>
                <Switch
                  id="registration"
                  checked={settings.registrationEnabled}
                  onCheckedChange={(checked) => handleSettingChange('registrationEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="backup">النسخ الاحتياطي التلقائي</Label>
                <Switch
                  id="backup"
                  checked={settings.autoBackup}
                  onCheckedChange={(checked) => handleSettingChange('autoBackup', checked)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notif">إشعارات البريد الإلكتروني</Label>
                <Switch
                  id="email-notif"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="system-alerts">تنبيهات النظام</Label>
                <Switch
                  id="system-alerts"
                  checked={settings.systemAlerts}
                  onCheckedChange={(checked) => handleSettingChange('systemAlerts', checked)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max-users">الحد الأقصى للمسجلين يومياً</Label>
              <Input
                id="max-users"
                type="number"
                value={settings.maxUsersPerDay}
                onChange={(e) => handleSettingChange('maxUsersPerDay', parseInt(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="max-trades">الحد الأقصى للصفقات لكل مستخدم</Label>
              <Input
                id="max-trades"
                type="number"
                value={settings.maxTradesPerUser}
                onChange={(e) => handleSettingChange('maxTradesPerUser', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="system-message">رسالة النظام</Label>
            <Textarea
              id="system-message"
              placeholder="رسالة تظهر لجميع المستخدمين..."
              value={settings.systemMessage}
              onChange={(e) => handleSettingChange('systemMessage', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="maintenance-message">رسالة الصيانة</Label>
            <Textarea
              id="maintenance-message"
              value={settings.maintenanceMessage}
              onChange={(e) => handleSettingChange('maintenanceMessage', e.target.value)}
            />
          </div>

          <Button onClick={saveSettings} className="w-full">
            حفظ الإعدادات
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            إعدادات الأمان
          </CardTitle>
          <CardDescription>
            إدارة إعدادات الأمان والحماية
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="font-medium mb-2">إعدادات المصادقة</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>المصادقة الثنائية إجبارية</Label>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <Label>انتهاء صلاحية الجلسة</Label>
                  <Input className="w-20" placeholder="24" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-medium mb-2">حماية كلمات المرور</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>الحد الأدنى لطول كلمة المرور</Label>
                  <Input className="w-20" placeholder="8" />
                </div>
                <div className="flex items-center justify-between">
                  <Label>كلمات مرور معقدة</Label>
                  <Switch />
                </div>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Beta Mode Settings */}
      <BetaModeSettings />

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            إدارة البيانات
          </CardTitle>
          <CardDescription>
            تصدير واستيراد البيانات والنسخ الاحتياطية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={exportData} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              تصدير البيانات
            </Button>

            <Button onClick={importData} variant="outline" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              استيراد البيانات
            </Button>

            <Button variant="outline" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              نسخة احتياطية يدوية
            </Button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">تنبيه مهم</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  تأكد من إنشاء نسخة احتياطية قبل إجراء أي تغييرات كبيرة على النظام. 
                  عمليات استيراد البيانات قد تستبدل البيانات الموجودة.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
