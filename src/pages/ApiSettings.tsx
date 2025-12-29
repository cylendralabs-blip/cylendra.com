import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Plus, Trash2, CheckCircle, XCircle, WifiOff, Zap } from 'lucide-react';
import { TestnetBadge } from '@/components/settings/TestnetToggle';
import { TestnetToggle } from '@/components/settings/TestnetToggle';
import { useTranslation } from 'react-i18next';

interface ApiKey {
  id: string;
  platform: string;
  api_key: string;
  secret_key: string;
  passphrase?: string;
  testnet: boolean;
  is_active: boolean;
  created_at: string;
}

const ApiSettings = () => {
  const { t, i18n } = useTranslation('api_settings');
  const { user } = useAuth();
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const [newKey, setNewKey] = useState({
    platform: '',
    api_key: '',
    secret_key: '',
    passphrase: '',
    testnet: true
  });

  const platforms = [
    // Binance
    { value: 'binance', label: 'Binance (Live)', requiresPassphrase: false },
    { value: 'binance-demo', label: 'Binance Demo Trading (Spot + Futures)', requiresPassphrase: false },
    { value: 'binance-spot-testnet', label: 'Binance Spot Testnet (Old)', requiresPassphrase: false },
    { value: 'binance-futures-testnet', label: 'Binance Futures Testnet (Old)', requiresPassphrase: false },

    // Bybit
    { value: 'bybit', label: 'Bybit', requiresPassphrase: false },
    { value: 'bybit-testnet', label: 'Bybit Testnet', requiresPassphrase: false },

    // OKX
    { value: 'okx', label: 'OKX', requiresPassphrase: true },
    { value: 'okx-demo', label: 'OKX Demo Trading', requiresPassphrase: true },

    // KuCoin (future)
    { value: 'kucoin', label: 'KuCoin', requiresPassphrase: true }
  ];

  useEffect(() => {
    if (user) {
      fetchApiKeys();
    }
  }, [user]);

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      toast({
        title: t('toast.error'),
        description: t('toast.fetch_failed'),
        variant: 'destructive',
      });
    }
  };

  const addApiKey = async () => {
    if (!newKey.platform || !newKey.api_key || !newKey.secret_key) {
      toast({
        title: t('toast.error'),
        description: t('toast.fields_required'),
        variant: 'destructive',
      });
      return;
    }

    const selectedPlatform = platforms.find(p => p.value === newKey.platform);
    if (selectedPlatform?.requiresPassphrase && !newKey.passphrase) {
      toast({
        title: t('toast.error'),
        description: t('toast.passphrase_required'),
        variant: 'destructive',
      });
      return;
    }

    // Ensure testnet is set correctly based on platform
    // Demo/testnet platforms must have testnet = true
    const isTestnetPlatform = newKey.platform === 'okx-demo' ||
      newKey.platform === 'bybit-testnet' ||
      newKey.platform === 'binance-futures-testnet' ||
      newKey.platform === 'binance-demo';
    const finalTestnet = isTestnetPlatform ? true : newKey.testnet;

    // Prevent impossible combinations
    if (isTestnetPlatform && !finalTestnet) {
      toast({
        title: t('toast.error'),
        description: t('toast.must_be_demo', { label: selectedPlatform?.label }),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: insertedKey, error: insertError } = await supabase
        .from('api_keys')
        .insert({
          user_id: user?.id,
          platform: newKey.platform,
          api_key: newKey.api_key,
          secret_key: newKey.secret_key,
          passphrase: newKey.passphrase || null,
          testnet: finalTestnet,
          is_active: true
        })
        .select()
        .single();

      if (insertError || !insertedKey) throw insertError || new Error(t('toast.save_failed'));

      // اختبار الاتصال بالمنصة عبر Edge Function
      const { data: testResult, error: testError } = await supabase.functions.invoke('exchange-portfolio', {
        body: {
          action: 'test-connection',
          api_key_id: insertedKey.id,
        },
      });

      if (testError) {
        // حذف المفتاح إذا فشل الاختبار
        await supabase.from('api_keys').delete().eq('id', insertedKey.id);
        toast({
          title: t('toast.connection_error'),
          description: testError.message || t('toast.connection_failed'),
          variant: 'destructive',
        });
        throw testError;
      }

      if (!testResult?.success) {
        // حذف المفتاح إذا كان الاتصال فاشلاً
        await supabase.from('api_keys').delete().eq('id', insertedKey.id);
        toast({
          title: t('toast.invalid_key'),
          description: testResult?.error || t('toast.invalid_key_desc'),
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: t('toast.connected'),
        description: selectedPlatform
          ? t('toast.verified_platform', { label: selectedPlatform.label })
          : t('toast.verified'),
      });

      setNewKey({
        platform: '',
        api_key: '',
        secret_key: '',
        passphrase: '',
        testnet: true
      });

      fetchApiKeys();
    } catch (error: any) {
      toast({
        title: t('toast.error'),
        description: error?.message || t('toast.add_failed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: t('toast.success'),
        description: t('toast.deleted'),
      });

      fetchApiKeys();
    } catch (error) {
      toast({
        title: t('toast.error'),
        description: t('toast.delete_failed'),
        variant: 'destructive',
      });
    }
  };

  const toggleApiKey = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: t('toast.success'),
        description: !isActive ? t('toast.enabled') : t('toast.disabled'),
      });

      fetchApiKeys();
    } catch (error) {
      toast({
        title: t('toast.error'),
        description: t('toast.update_failed'),
        variant: 'destructive',
      });
    }
  };

  const toggleSecretVisibility = (keyId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const maskSecret = (secret: string) => {
    if (secret.length <= 8) return '*'.repeat(secret.length);
    return secret.substring(0, 4) + '*'.repeat(secret.length - 8) + secret.substring(secret.length - 4);
  };

  const selectedPlatform = platforms.find(p => p.value === newKey.platform);

  return (
    <div className="min-h-screen bg-trading-bg dark:bg-gray-900 p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('subtitle')}
          </p>
        </div>

        <Tabs defaultValue="manage" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manage">{t('tabs.manage')}</TabsTrigger>
            <TabsTrigger value="add">{t('tabs.add')}</TabsTrigger>
          </TabsList>

          <TabsContent value="manage" className="space-y-4">
            {apiKeys.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <WifiOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t('manage.no_platforms')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('manage.no_platforms_desc')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {apiKeys.map((apiKey) => (
                  <Card key={apiKey.id} className="relative">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className={`w-3 h-3 rounded-full ${apiKey.is_active ? 'bg-trading-success' : 'bg-gray-400'}`}></div>
                          <div>
                            <CardTitle className="text-lg">
                              {platforms.find(p => p.value === apiKey.platform)?.label || apiKey.platform}
                            </CardTitle>
                            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                              {apiKey.testnet ? (
                                <>
                                  <TestnetBadge testnet={true} />
                                  <span>{t('manage.platforms.demo')}</span>
                                </>
                              ) : (
                                <>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700">
                                    <Zap className="w-3 h-3" />
                                    Live
                                  </span>
                                  <span>{t('manage.platforms.live')}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>{t('manage.platforms.created_at', { date: new Date(apiKey.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar' : 'en-US') })}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {apiKey.is_active ? (
                            <CheckCircle className="w-5 h-5 text-trading-success" />
                          ) : (
                            <XCircle className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">{t('manage.fields.api_key')}</Label>
                          <div className="flex items-center space-x-2 space-x-reverse mt-1">
                            <Input
                              value={showSecrets[apiKey.id] ? apiKey.api_key : maskSecret(apiKey.api_key)}
                              readOnly
                              className="bg-gray-50 dark:bg-gray-800"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleSecretVisibility(apiKey.id)}
                            >
                              {showSecrets[apiKey.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">{t('manage.fields.secret_key')}</Label>
                          <div className="flex items-center space-x-2 space-x-reverse mt-1">
                            <Input
                              value={showSecrets[apiKey.id] ? apiKey.secret_key : maskSecret(apiKey.secret_key)}
                              readOnly
                              className="bg-gray-50 dark:bg-gray-800"
                            />
                          </div>
                        </div>
                      </div>
                      {apiKey.passphrase && (
                        <div>
                          <Label className="text-sm font-medium">{t('manage.fields.passphrase')}</Label>
                          <Input
                            value={showSecrets[apiKey.id] ? apiKey.passphrase : maskSecret(apiKey.passphrase)}
                            readOnly
                            className="bg-gray-50 dark:bg-gray-800 mt-1"
                          />
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Switch
                          checked={apiKey.is_active}
                          onCheckedChange={() => toggleApiKey(apiKey.id, apiKey.is_active)}
                        />
                        <Label className="text-sm">
                          {apiKey.is_active ? t('manage.platforms.enabled') : t('manage.platforms.disabled')}
                        </Label>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteApiKey(apiKey.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('manage.platforms.delete')}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  {t('add.title')}
                </CardTitle>
                <CardDescription>
                  {t('add.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="platform">{t('add.fields.platform')}</Label>
                  <Select value={newKey.platform} onValueChange={(value) => setNewKey({ ...newKey, platform: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('add.fields.platform_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((platform) => (
                        <SelectItem key={platform.value} value={platform.value}>
                          {platform.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="api_key">{t('add.fields.api_key')}</Label>
                  <Input
                    id="api_key"
                    value={newKey.api_key}
                    onChange={(e) => setNewKey({ ...newKey, api_key: e.target.value })}
                    placeholder={t('add.fields.api_key_placeholder')}
                  />
                </div>

                <div>
                  <Label htmlFor="secret_key">{t('add.fields.secret_key')}</Label>
                  <Input
                    id="secret_key"
                    type="password"
                    value={newKey.secret_key}
                    onChange={(e) => setNewKey({ ...newKey, secret_key: e.target.value })}
                    placeholder={t('add.fields.secret_key_placeholder')}
                  />
                </div>

                {selectedPlatform?.requiresPassphrase && (
                  <div>
                    <Label htmlFor="passphrase">{t('add.fields.passphrase')} <span className="text-red-500">*</span></Label>
                    <Input
                      id="passphrase"
                      type="password"
                      value={newKey.passphrase}
                      onChange={(e) => setNewKey({ ...newKey, passphrase: e.target.value })}
                      placeholder={t('add.fields.passphrase_placeholder')}
                    />
                  </div>
                )}

                {!['binance-futures-testnet', 'binance-spot-testnet', 'binance-demo', 'bybit-testnet', 'okx-demo'].includes(newKey.platform) && (
                  <div className="space-y-2">
                    <TestnetToggle
                      checked={newKey.testnet}
                      onCheckedChange={(checked) => setNewKey({ ...newKey, testnet: checked })}
                      showBadge={true}
                      confirmLiveMode={true}
                    />
                    {!newKey.testnet && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          {t('add.live_warning')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    {t('add.security.title')}
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• {t('add.security.instruction_1')}</li>
                    <li>• {t('add.security.instruction_2')}</li>
                    <li>• {t('add.security.instruction_3')}</li>
                    <li>• {t('add.security.instruction_4')}</li>
                    {selectedPlatform?.requiresPassphrase && (
                      <li>• {t('add.security.instruction_passphrase', { label: selectedPlatform.label })}</li>
                    )}
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={addApiKey}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? t('add.button_loading') : t('add.button')}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ApiSettings;
