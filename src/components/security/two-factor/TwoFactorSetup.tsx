
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Check } from 'lucide-react';

interface TwoFactorSetupProps {
  qrCodeUrl: string;
  onVerify: (code: string) => Promise<void>;
  onCancel: () => void;
}

const TwoFactorSetup = ({ qrCodeUrl, onVerify, onCancel }: TwoFactorSetupProps) => {
  const [verificationCode, setVerificationCode] = useState('');

  const handleVerify = () => {
    onVerify(verificationCode);
    setVerificationCode('');
  };

  return (
    <div className="space-y-4">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          امسح رمز QR التالي بتطبيق المصادقة (مثل Google Authenticator) ثم أدخل الكود للتأكيد
        </AlertDescription>
      </Alert>

      <div className="text-center">
        <img src={qrCodeUrl} alt="QR Code" className="mx-auto border rounded-lg" />
      </div>

      <div className="space-y-2">
        <Label>كود التحقق من التطبيق</Label>
        <Input
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          placeholder="123456"
          maxLength={6}
          className="text-center text-lg"
        />
      </div>

      <div className="flex space-x-2 space-x-reverse">
        <Button onClick={handleVerify} disabled={verificationCode.length !== 6}>
          <Check className="w-4 h-4 ml-2" />
          تأكيد وتفعيل
        </Button>
        <Button variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
      </div>
    </div>
  );
};

export default TwoFactorSetup;
