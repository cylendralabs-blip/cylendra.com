import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Wifi, WifiOff, Settings, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface ApiKey {
  id: string;
  platform: string;
  is_active: boolean;
  testnet: boolean;
}

interface ConnectionStatus {
  api_key_id: string;
  status: string;
  last_checked: string;
  error_message: string | null;
  response_time_ms: number | null;
}

const ExchangeConnection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<{[key: string]: ConnectionStatus}>({});
  const [testingConnections, setTestingConnections] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (user) {
      fetchApiKeys();
      fetchConnectionStatuses();
    }
  }, [user]);

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, platform, is_active, testnet')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    }
  };

  const fetchConnectionStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('connection_status')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      
      const statusMap: {[key: string]: ConnectionStatus} = {};
      data?.forEach(status => {
        statusMap[status.api_key_id] = status;
      });
      setConnectionStatus(statusMap);
    } catch (error) {
      console.error('Error fetching connection statuses:', error);
    }
  };

  const testConnection = async (keyId: string) => {
    setTestingConnections(prev => ({ ...prev, [keyId]: true }));

    try {
      console.log('Testing connection for API key ID:', keyId);
      
      const { data, error } = await supabase.functions.invoke('exchange-portfolio', {
        body: { 
          action: 'test-connection', 
          api_key_id: keyId 
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to call edge function');
      }

      console.log('Connection test response:', data);

      if (data && data.success) {
        toast({
          title: 'متصل بنجاح',
          description: data.responseTime ? `وقت الاستجابة: ${data.responseTime}ms` : 'تم الاتصال بنجاح',
          variant: 'default',
        });
      } else {
        const errorMessage = data?.error || 'فشل في الاتصال بالمنصة';
        console.error('Connection test failed:', errorMessage);
        toast({
          title: 'فشل الاتصال',
          description: errorMessage,
          variant: 'destructive',
        });
      }

      await fetchConnectionStatuses();
    } catch (error) {
      console.error('Error testing connection:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في اختبار الاتصال',
        variant: 'destructive',
      });
    } finally {
      setTestingConnections(prev => ({ ...prev, [keyId]: false }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-trading-success';
      case 'testing': return 'bg-trading-warning animate-pulse';
      case 'error': return 'bg-trading-danger';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'متصل';
      case 'testing': return 'جاري الاختبار...';
      case 'error': return 'خطأ في الاتصال';
      default: return 'غير متصل';
    }
  };

  const getPlatformName = (platform: string) => {
    const names: {[key: string]: string} = {
      'binance': 'Binance',
      'binance-futures-testnet': 'Binance Futures Testnet',
      'okx': 'OKX',
      'bybit': 'Bybit',
      'kucoin': 'KuCoin'
    };
    return names[platform] || platform;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Wifi className="w-5 h-5 mr-2" />
              حالة الاتصال بالمنصات
            </CardTitle>
            <CardDescription>
              منصات التداول المتصلة ومعلومات الاتصال
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Link to="/portfolio">
              <Button variant="outline" size="sm">
                <Activity className="w-4 h-4 mr-2" />
                عرض المحفظة
              </Button>
            </Link>
            <Link to="/api-settings">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                إدارة المنصات
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {apiKeys.length === 0 ? (
          <div className="text-center py-6">
            <WifiOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              لا توجد منصات مربوطة
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              قم بإضافة منصة تداول لتبدأ التداول الآلي
            </p>
            <Link to="/api-settings">
              <Button>
                إضافة منصة تداول
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((apiKey) => {
              const status = connectionStatus[apiKey.id];
              const isCurrentlyTesting = testingConnections[apiKey.id];
              const currentStatus = isCurrentlyTesting ? 'testing' : (status?.status || 'disconnected');
              
              return (
                <div key={apiKey.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(currentStatus)}`}></div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {getPlatformName(apiKey.platform)}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {getStatusText(currentStatus)}
                        </p>
                        {status?.response_time_ms && (
                          <span className="text-xs text-gray-500">
                            ({status.response_time_ms}ms)
                          </span>
                        )}
                      </div>
                      {status?.last_checked && (
                        <p className="text-xs text-gray-500">
                          آخر فحص: {new Date(status.last_checked).toLocaleString('ar')}
                        </p>
                      )}
                      {status?.error_message && (
                        <p className="text-xs text-red-500">
                          {status.error_message}
                        </p>
                      )}
                    </div>
                    {apiKey.testnet && (
                      <Badge variant="secondary" className="text-xs">
                        تجريبي
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnection(apiKey.id)}
                      disabled={isCurrentlyTesting}
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      {isCurrentlyTesting ? 'جاري الاختبار...' : 'اختبار الاتصال'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExchangeConnection;
