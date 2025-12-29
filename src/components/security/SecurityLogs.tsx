import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, Trash2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useSecurityLogs } from './useSecurityLogs';
import { useTranslation } from 'react-i18next';

const SecurityLogs = () => {
  const { t, i18n } = useTranslation('settings');
  const { logs, loading, loadSecurityLogs, clearOldLogs } = useSecurityLogs();

  if (loading) {
    return <div className="animate-pulse h-48 bg-gray-200 rounded-lg"></div>;
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case '2fa_enabled':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case '2fa_disabled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Shield className="w-4 h-4 text-blue-600" />;
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case '2fa_enabled':
        return t('security.logs.actions.2fa_enabled');
      case '2fa_disabled':
        return t('security.logs.actions.2fa_disabled');
      case 'login':
        return t('security.logs.actions.login');
      case 'logout':
        return t('security.logs.actions.logout');
      default:
        return action;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Shield className="w-5 h-5" />
              <span>{t('security.logs.title')}</span>
            </CardTitle>
            <CardDescription>
              {t('security.logs.subtitle')}
            </CardDescription>
          </div>
          <div className="flex space-x-2 space-x-reverse">
            <Button variant="outline" size="sm" onClick={loadSecurityLogs}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={clearOldLogs}>
              <Trash2 className="w-4 h-4 ml-2" />
              {t('security.logs.clear_old')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t('security.logs.no_activities')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log, index) => (
              <div key={log.id}>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    {getActionIcon(log.action)}
                    <div>
                      <p className="font-medium">{getActionText(log.action)}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(log.created_at).toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={log.success ? "default" : "destructive"}>
                    {log.success ? t('security.logs.status_success') : t('security.logs.status_failed')}
                  </Badge>
                </div>
                {index < logs.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SecurityLogs;
