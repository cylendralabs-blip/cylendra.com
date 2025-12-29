
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

const DataCleanup = () => {
  const { t } = useTranslation('bot_settings');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isClearing, setIsClearing] = useState(false);

  const clearAllData = async () => {
    if (!user) return;

    setIsClearing(true);
    try {
      // Clear trades
      const { error: tradesError } = await supabase
        .from('trades')
        .delete()
        .eq('user_id', user.id);

      if (tradesError) throw tradesError;

      // Clear DCA orders
      const { error: dcaError } = await supabase
        .from('dca_orders')
        .delete()
        .eq('user_id', user.id);

      if (dcaError) throw dcaError;

      // Clear trading performance
      const { error: performanceError } = await supabase
        .from('trading_performance')
        .delete()
        .eq('user_id', user.id);

      if (performanceError) throw performanceError;

      // Clear portfolio balances
      const { error: portfolioError } = await supabase
        .from('portfolio_balances')
        .delete()
        .eq('user_id', user.id);

      if (portfolioError) throw portfolioError;

      // Clear notifications
      const { error: notificationsError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (notificationsError) throw notificationsError;

      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();

      toast({
        title: t('cleanup.success.title'),
        description: t('cleanup.success.description'),
      });

    } catch (error) {
      console.error('Error clearing data:', error);
      toast({
        title: t('cleanup.error.title'),
        description: t('cleanup.error.description'),
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <div className="flex items-center space-x-2 space-x-reverse">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <CardTitle className="text-destructive">{t('cleanup.title')}</CardTitle>
        </div>
        <CardDescription>
          {t('cleanup.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-destructive/10 p-4 rounded-lg">
            <h4 className="font-medium text-destructive mb-2">{t('cleanup.delete_following')}</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• {t('cleanup.data_list.trades')}</li>
              <li>• {t('cleanup.data_list.dca')}</li>
              <li>• {t('cleanup.data_list.performance')}</li>
              <li>• {t('cleanup.data_list.portfolio')}</li>
              <li>• {t('cleanup.data_list.notifications')}</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center space-x-2 space-x-reverse">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>{t('common.warning', 'Warning', { ns: 'dashboard' })}:</strong> {t('cleanup.warning')}
              </p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isClearing} className="w-full">
                {isClearing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {t('cleanup.button_clearing')}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('cleanup.button')}
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('cleanup.dialog.title')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('cleanup.dialog.description')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cleanup.dialog.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={clearAllData} className="bg-destructive hover:bg-destructive/90">
                  {t('cleanup.dialog.confirm')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataCleanup;
