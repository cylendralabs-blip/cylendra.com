
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, RefreshCw, Key } from 'lucide-react';

interface TwoFactorStatusProps {
  isEnabled: boolean;
  hasSettings: boolean;
  onSetup: () => void;
  onDisable: () => void;
  onResetup: () => void;
  onEnable: () => void;
}

const TwoFactorStatus = ({ 
  isEnabled, 
  hasSettings, 
  onSetup, 
  onDisable, 
  onResetup, 
  onEnable 
}: TwoFactorStatusProps) => {
  if (!hasSettings) {
    return (
      <div className="text-center space-y-4">
        <p className="text-gray-600">لم يتم إعداد المصادقة الثنائية بعد</p>
        <Button onClick={onSetup} className="flex items-center space-x-2 space-x-reverse">
          <Key className="w-4 h-4" />
          <span>إعداد المصادقة الثنائية</span>
        </Button>
      </div>
    );
  }

  if (isEnabled) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span>حالة المصادقة الثنائية</span>
          <Switch
            checked={isEnabled}
            onCheckedChange={(checked) => {
              if (!checked) {
                onDisable();
              }
            }}
          />
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            المصادقة الثنائية مفعلة. احتفظ بأكواد النسخ الاحتياطية في مكان آمن.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <p className="text-gray-600">المصادقة الثنائية معدة لكن غير مفعلة</p>
      <div className="flex space-x-2 space-x-reverse justify-center">
        <Button onClick={onEnable}>
          تفعيل الآن
        </Button>
        <Button variant="outline" onClick={onResetup}>
          <RefreshCw className="w-4 h-4 ml-2" />
          إعادة الإعداد
        </Button>
      </div>
    </div>
  );
};

export default TwoFactorStatus;
