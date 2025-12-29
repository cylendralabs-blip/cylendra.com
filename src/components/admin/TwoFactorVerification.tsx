/**
 * Two-Factor Verification Component
 * 
 * Component for verifying 2FA code during admin login
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Loader2 } from 'lucide-react';
import { TOTP } from 'otpauth';

interface TwoFactorVerificationProps {
  secret: string;
  email: string;
  onVerify: (code: string) => Promise<boolean>;
  onCancel: () => void;
}

export default function TwoFactorVerification({
  secret,
  email,
  onVerify,
  onCancel,
}: TwoFactorVerificationProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      setError('رمز التحقق يجب أن يكون 6 أرقام');
      return;
    }

    setLoading(true);
    try {
      const isValid = await onVerify(code);
      if (!isValid) {
        setError('رمز التحقق غير صحيح');
      }
    } catch (err) {
      setError('حدث خطأ أثناء التحقق');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <CardTitle>المصادقة الثنائية (2FA)</CardTitle>
        <CardDescription>
          يرجى إدخال رمز التحقق من تطبيق المصادقة
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="2fa-code">رمز التحقق</Label>
            <Input
              id="2fa-code"
              type="text"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(value);
                setError('');
              }}
              placeholder="000000"
              maxLength={6}
              className="text-center text-2xl tracking-widest"
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || code.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري التحقق...
                </>
              ) : (
                'التحقق'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

