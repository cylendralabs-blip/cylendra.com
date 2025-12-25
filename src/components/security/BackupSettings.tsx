import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Database,
  Download,
  Upload,
  Trash2,
  Plus,
  Calendar,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

interface Backup {
  id: string;
  backup_name: string;
  bot_settings: any;
  api_settings: any;
  strategies: any;
  created_at: string;
  is_auto_backup: boolean;
  backup_type: 'manual' | 'auto' | 'scheduled';
}

const BackupSettings = () => {
  const { t, i18n } = useTranslation('settings');
  const { user } = useAuth();
  const { toast } = useToast();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [backupName, setBackupName] = useState('');
  const [autoBackup, setAutoBackup] = useState(false);

  useEffect(() => {
    loadBackups();
  }, [user]);

  const loadBackups = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('settings_backups')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Type cast the data to match our interface
      const typedBackups: Backup[] = (data || []).map(backup => ({
        ...backup,
        backup_type: backup.backup_type as 'manual' | 'auto' | 'scheduled'
      }));

      setBackups(typedBackups);
    } catch (error) {
      console.error('Error loading backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    if (!user || !backupName.trim()) {
      toast({
        title: t('toast.name_required'),
        description: t('toast.enter_name'),
        variant: "destructive"
      });
      return;
    }

    setCreating(true);

    try {
      // جلب إعدادات البوت
      const { data: botSettings } = await supabase
        .from('bot_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // جلب إعدادات API
      const { data: apiSettings } = await supabase
        .from('api_keys')
        .select('platform, is_active, testnet')
        .eq('user_id', user.id);

      // strategy_templates table doesn't exist yet - use empty array
      const strategies = [];

      // إنشاء النسخة الاحتياطية
      const { error } = await supabase
        .from('settings_backups')
        .insert([{
          user_id: user.id,
          backup_name: backupName.trim(),
          bot_settings: botSettings,
          api_settings: apiSettings,
          strategies: strategies,
          backup_type: 'manual'
        }]);

      if (error) throw error;

      await loadBackups();
      setBackupName('');

      toast({
        title: t('toast.created_success'),
        description: t('toast.created_desc')
      });

    } catch (error) {
      console.error('Error creating backup:', error);
      toast({
        title: t('toast.create_error'),
        description: t('toast.create_error_desc'),
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const downloadBackup = (backup: Backup) => {
    const data = {
      backup_info: {
        name: backup.backup_name,
        created_at: backup.created_at,
        type: backup.backup_type
      },
      bot_settings: backup.bot_settings,
      api_settings: backup.api_settings,
      strategies: backup.strategies
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${backup.backup_name}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: t('toast.downloaded'),
      description: t('toast.downloaded_desc')
    });
  };

  const deleteBackup = async (backupId: string) => {
    try {
      const { error } = await supabase
        .from('settings_backups')
        .delete()
        .eq('id', backupId);

      if (error) throw error;

      await loadBackups();

      toast({
        title: t('toast.deleted'),
        description: t('toast.deleted_desc')
      });

    } catch (error) {
      console.error('Error deleting backup:', error);
      toast({
        title: t('toast.delete_error'),
        description: t('toast.delete_error_desc'),
        variant: "destructive"
      });
    }
  };

  const restoreBackup = async (backup: Backup) => {
    if (!backup.bot_settings) {
      toast({
        title: t('toast.no_data'),
        description: t('toast.no_bot_settings'),
        variant: "destructive"
      });
      return;
    }

    try {
      // استعادة إعدادات البوت
      const { error: botError } = await supabase
        .from('bot_settings')
        .upsert({
          ...backup.bot_settings,
          user_id: user?.id,
          updated_at: new Date().toISOString()
        });

      if (botError) throw botError;

      toast({
        title: t('toast.restored'),
        description: t('toast.restored_desc')
      });

    } catch (error) {
      console.error('Error restoring backup:', error);
      toast({
        title: t('toast.restore_error'),
        description: t('toast.restore_error_desc'),
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (i18n.language === 'ar') {
      return new Date(dateString).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return new Date(dateString).toLocaleString('en-US');
  };

  const getBackupTypeBadge = (type: string) => {
    switch (type) {
      case 'auto':
        return <Badge className="bg-blue-100 text-blue-800">{t('data.backups.type_auto')}</Badge>;
      case 'scheduled':
        return <Badge className="bg-purple-100 text-purple-800">{t('data.backups.type_scheduled')}</Badge>;
      default:
        return <Badge variant="outline">{t('data.backups.type_manual')}</Badge>;
    }
  };

  if (loading) {
    return <div className="animate-pulse h-48 bg-gray-200 rounded-lg"></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 space-x-reverse">
          <Database className="w-5 h-5" />
          <span>{t('data.backups.title')}</span>
        </CardTitle>
        <CardDescription>
          {t('data.backups.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* إنشاء نسخة احتياطية جديدة */}
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium flex items-center space-x-2 space-x-reverse">
            <Plus className="w-4 h-4" />
            <span>{t('data.backups.create_new')}</span>
          </h4>

          <div className="space-y-3">
            <div>
              <Label>{t('data.backups.name')}</Label>
              <Input
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
                placeholder={t('data.backups.name_placeholder')}
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                checked={autoBackup}
                onCheckedChange={setAutoBackup}
                id="auto-backup"
              />
              <Label htmlFor="auto-backup">{t('data.backups.enable_auto')}</Label>
            </div>

            <Button
              onClick={createBackup}
              disabled={creating || !backupName.trim()}
              className="w-full"
            >
              {creating ? t('data.backups.creating') : t('data.backups.create_button')}
            </Button>
          </div>
        </div>

        {autoBackup && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              {t('data.backups.auto_info')}
            </AlertDescription>
          </Alert>
        )}

        {/* قائمة النسخ الاحتياطية */}
        <div className="space-y-3">
          <h4 className="font-medium">{t('data.backups.saved_count', { count: backups.length })}</h4>

          {backups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>{t('data.backups.no_backups')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 space-x-reverse mb-2">
                      <h5 className="font-medium">{backup.backup_name}</h5>
                      {getBackupTypeBadge(backup.backup_type)}
                    </div>
                    <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-500">
                      <span className="flex items-center space-x-1 space-x-reverse">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(backup.created_at)}</span>
                      </span>
                      {backup.bot_settings && (
                        <span className="text-green-600">✓ {t('data.backups.bot_settings')}</span>
                      )}
                      {backup.strategies && backup.strategies.length > 0 && (
                        <span className="text-blue-600">✓ {t('data.backups.strategies')} ({backup.strategies.length})</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadBackup(backup)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => restoreBackup(backup)}
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteBackup(backup.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {backups.length > 5 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('data.backups.recommend_delete', { count: backups.length })}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default BackupSettings;
