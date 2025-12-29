
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Mail, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Auth = () => {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState('');
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        console.error('Login error details:', error);
        toast({
          title: t('messages.signin_error_title'),
          description: error.message || t('messages.signin_error_desc'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('messages.signin_success_title'),
          description: t('messages.signin_success_desc'),
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Unexpected login error:', error);
      toast({
        title: t('messages.unexpected_error_title'),
        description: error?.message || t('messages.unexpected_error_desc'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast({
          title: t('messages.signup_error_title'),
          description: error.message || t('messages.signup_error_desc'),
          variant: 'destructive',
        });
        setSignUpSuccess(false);
      } else {
        // نجح التسجيل - إظهار رسالة واضحة
        setSignUpSuccess(true);
        setSignUpEmail(email);

        // مسح الحقول
        setEmail('');
        setPassword('');
        setFullName('');

        toast({
          title: t('messages.signup_success_title'),
          description: t('messages.signup_success_desc'),
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: t('messages.unexpected_error_title'),
        description: t('messages.unexpected_error_desc'),
        variant: 'destructive',
      });
      setSignUpSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center mb-2">
            <img
              src="/logo/orbitra-ai-logo.svg"
              alt="Orbitra AI"
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--ai-purple))] to-[hsl(var(--ai-cyan))] bg-clip-text text-transparent">Orbitra AI™</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t('tabs.signin')}</TabsTrigger>
              <TabsTrigger value="signup">{t('tabs.signup')}</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">{t('fields.email')}</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">{t('fields.password')}</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('buttons.signing_in') : t('buttons.signin')}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              {signUpSuccess ? (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-800 dark:text-green-200">
                    {t('messages.activation_sent_title')}
                  </AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-300 mt-2 space-y-2">
                    <p>
                      {t('messages.activation_sent_desc')}
                    </p>
                    <p className="font-semibold flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {signUpEmail}
                    </p>
                    <div className="mt-4 pt-4 border-t border-green-300 dark:border-green-700">
                      <p className="font-medium mb-2">{t('messages.next_steps')}</p>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>{t('messages.next_step_1')}</li>
                        <li>{t('messages.next_step_2')}</li>
                        <li>{t('messages.next_step_3')}</li>
                        <li>{t('messages.next_step_4')}</li>
                      </ol>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => {
                        setSignUpSuccess(false);
                        setSignUpEmail('');
                      }}
                    >
                      {t('buttons.create_new')}
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-fullname">{t('fields.fullname')}</Label>
                    <Input
                      id="signup-fullname"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{t('fields.email')}</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t('fields.password')}</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t('buttons.signing_up') : t('buttons.signup')}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
