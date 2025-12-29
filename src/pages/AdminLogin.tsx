
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AdminService } from '@/services/admin/AdminService';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { getAdminSecuritySettings, logLoginAttempt } from '@/services/admin/AdminSecurityService';
import TwoFactorVerification from '@/components/admin/TwoFactorVerification';
import { TOTP } from 'otpauth';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // تسجيل الدخول أولاً
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: 'خطأ في تسجيل الدخول',
          description: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // التحقق من صلاحيات الإدارة (Phase Admin F: RBAC)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'خطأ في المصادقة',
          description: 'فشل في الحصول على بيانات المستخدم',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Use AdminService.isAdmin which checks RBAC (owner/admin roles)
      const isAdmin = await AdminService.isAdmin(user.id);
      
      if (!isAdmin) {
        // تسجيل خروج المستخدم إذا لم يكن مدير
        await supabase.auth.signOut();
        toast({
          title: 'غير مخول',
          description: 'ليس لديك صلاحيات للوصول إلى لوحة الإدارة',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Check if 2FA is enabled
      const { settings: securitySettings } = await getAdminSecuritySettings(user.id);
      
      if (securitySettings?.two_factor_enabled && securitySettings?.two_factor_secret) {
        // 2FA is enabled - show verification step
        setTwoFactorSecret(securitySettings.two_factor_secret);
        setUserId(user.id);
        setShow2FA(true);
        setLoading(false);
        return;
      }

      // No 2FA or not enabled - proceed to admin panel
      toast({
        title: 'مرحباً بك في لوحة الإدارة',
        description: 'تم تسجيل دخولك بنجاح كمدير',
      });

      navigate('/admin');
    } catch (error) {
      console.error('Admin login error:', error);
      toast({
        title: 'خطأ غير متوقع',
        description: 'حدث خطأ أثناء تسجيل الدخول',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (code: string): Promise<boolean> => {
    if (!twoFactorSecret || !userId) return false;

    try {
      // Validate TOTP code
      const totp = new TOTP({
        issuer: 'Orbitra AI',
        label: email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: twoFactorSecret,
      });

      // Generate current token and previous/next tokens (to handle time drift)
      const currentToken = totp.generate();
      const previousToken = totp.generate({ timestamp: Date.now() - 30000 });
      const nextToken = totp.generate({ timestamp: Date.now() + 30000 });

      const isValid = code === currentToken || code === previousToken || code === nextToken;

      if (isValid) {
        // Log successful login
        await logLoginAttempt(userId, email, '', '', true, undefined, true);

        toast({
          title: 'مرحباً بك في لوحة الإدارة',
          description: 'تم تسجيل دخولك بنجاح كمدير',
        });

        navigate('/admin');
        return true;
      } else {
        // Log failed 2FA attempt
        await logLoginAttempt(userId, email, '', '', false, 'Invalid 2FA code', false);
        return false;
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      return false;
    }
  };

  const handle2FACancel = async () => {
    // Sign out user if they cancel 2FA
    await supabase.auth.signOut();
    setShow2FA(false);
    setTwoFactorSecret(null);
    setUserId(null);
    setEmail('');
    setPassword('');
  };

  // Show 2FA verification if needed
  if (show2FA && twoFactorSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4">
        <TwoFactorVerification
          secret={twoFactorSecret}
          email={email}
          onVerify={handle2FAVerify}
          onCancel={handle2FACancel}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4">
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>
      
      <Card className="w-full max-w-md relative z-10 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-2 border-blue-200 dark:border-blue-800 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--ai-purple))] to-[hsl(var(--ai-cyan))] bg-clip-text text-transparent">
              Orbitra AI™ Admin
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
              لوحة التحكم الإدارية
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-sm font-medium">
                البريد الإلكتروني للمدير
              </Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@smarttrader.com"
                className="h-11"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-sm font-medium">
                كلمة المرور
              </Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  جاري التحقق...
                </div>
              ) : (
                'دخول لوحة الإدارة'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/auth')}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              تسجيل دخول عادي للمستخدمين
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
