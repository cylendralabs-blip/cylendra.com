import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Database } from 'lucide-react';
import BackupSettings from '@/components/security/BackupSettings';
import { useTranslation } from 'react-i18next';

const DataTab = () => {
  const { t } = useTranslation('settings');

  return (
    <div className="grid grid-cols-1 gap-6">
      <BackupSettings />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Database className="w-5 h-5" />
            <span>{t('data.title')}</span>
          </CardTitle>
          <CardDescription>
            {t('data.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Button variant="outline" className="w-full">
              {t('data.export')}
            </Button>
            <Button variant="outline" className="w-full">
              {t('data.activity_report')}
            </Button>
            <Separator />
            <Button variant="destructive" className="w-full">
              {t('data.delete_all')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataTab;
