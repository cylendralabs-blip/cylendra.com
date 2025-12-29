/**
 * Strategy Instance Selector Component
 * 
 * Phase 2: Bot Settings Integration
 * Replaces hardcoded strategy dropdown with Strategy Instance selector
 */

import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, ExternalLink, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useStrategyInstances } from '@/hooks/useStrategyInstances';
import { StrategyInstanceService } from '@/services/strategy-system';
import { BotSettingsForm } from '@/types/botSettings';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface StrategyInstanceSelectorProps {
  form: UseFormReturn<BotSettingsForm>;
  botStatus: 'STOPPED' | 'RUNNING' | 'PAUSED' | 'ERROR';
}

const StrategyInstanceSelector = ({ form, botStatus }: StrategyInstanceSelectorProps) => {
  const { t } = useTranslation('bot_settings');
  const navigate = useNavigate();
  const { data: instances, isLoading, error } = useStrategyInstances({ includeTemplate: true });
  const [selectedInstance, setSelectedInstance] = useState<any>(null);
  const [versionInfo, setVersionInfo] = useState<{
    hasNewer: boolean;
    latestVersion: any;
    currentVersion: number;
  } | null>(null);

  const strategyInstanceId = form.watch('strategy_instance_id');
  const isRunning = botStatus === 'RUNNING';

  // Show both 'active' and 'draft' strategies (exclude only 'archived')
  const activeInstances = instances?.filter(i => i.status !== 'archived') || [];

  // Debug: Log instances data
  useEffect(() => {
    console.log('🔍 Strategy Instances Debug:', {
      isLoading,
      error,
      instancesCount: instances?.length,
      instances,
      activeInstancesCount: activeInstances.length,
      activeInstances,
    });
  }, [instances, isLoading, error, activeInstances]);

  // Load selected instance details
  useEffect(() => {
    if (strategyInstanceId && instances) {
      const instance = instances.find(i => i.id === strategyInstanceId);
      setSelectedInstance(instance);

      // Check for newer version
      if (instance) {
        StrategyInstanceService.checkForNewerVersion(instance.id, instance.user_id)
          .then(setVersionInfo)
          .catch(console.error);
      }
    } else {
      setSelectedInstance(null);
      setVersionInfo(null);
    }
  }, [strategyInstanceId, instances]);

  const handleSwitchToLatest = () => {
    if (versionInfo?.latestVersion && !isRunning) {
      form.setValue('strategy_instance_id', versionInfo.latestVersion.id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('strategy.title')}</CardTitle>
        <CardDescription>
          {t('strategy.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Debug Info */}
        {!isLoading && activeInstances.length === 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>{t('strategy.no_strategies')}</strong>
              <br />
              {t('strategy.create_first')}
              <br />
              <span className="text-xs text-gray-500">
                Debug: {isLoading ? t('common.loading', 'Loading...', { ns: 'dashboard' }) : t('strategy.debug_info', { count: instances?.length || 0, active: activeInstances.length })}
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Safe Switching Warning */}
        {isRunning && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{t('strategy.bot_running')}</strong> {t('strategy.stop_first')}
            </AlertDescription>
          </Alert>
        )}

        {/* Strategy Instance Selector */}
        <FormField
          control={form.control}
          name="strategy_instance_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('strategy.label')}</FormLabel>
              <div className="flex gap-2">
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isRunning || isLoading}
                >
                  <FormControl>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={t('strategy.select_placeholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {activeInstances.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        {t('strategy.no_available')}
                      </div>
                    ) : (
                      activeInstances.map((instance) => (
                        <SelectItem key={instance.id} value={instance.id}>
                          <div className="flex items-center gap-2">
                            <span>{instance.name}</span>
                            <Badge variant="outline" className="text-xs">
                              v{instance.version}
                            </Badge>
                            {instance.status === 'draft' && (
                              <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-300">
                                {t('strategy.draft')}
                              </Badge>
                            )}
                            {instance.template && (
                              <Badge variant="secondary" className="text-xs">
                                {instance.template.name}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => navigate('/dashboard/strategies')}
                  title={t('strategy.create_new')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <FormDescription>
                {isRunning
                  ? t('strategy.desc_running')
                  : t('strategy.desc_select')
                }
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Selected Strategy Preview */}
        {selectedInstance && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                {selectedInstance.name}
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/dashboard/strategies?instance=${selectedInstance.id}`)}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                {t('strategy.open')}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-300">{t('strategy.type')}</span>
                <span className="font-medium mr-2">
                  {selectedInstance.template?.name || t('strategy.unknown')}
                </span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">{t('strategy.version')}</span>
                <span className="font-medium mr-2">v{selectedInstance.version}</span>
              </div>
            </div>

            {selectedInstance.description && (
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {selectedInstance.description}
              </p>
            )}
          </div>
        )}

        {/* New Version Available */}
        {versionInfo?.hasNewer && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                <strong>{t('strategy.new_version')}</strong> {t('strategy.version_available', { version: versionInfo.latestVersion.version })}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSwitchToLatest}
                disabled={isRunning}
              >
                {t('strategy.switch_latest')}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Legacy Strategy Warning */}
        {!strategyInstanceId && form.watch('strategy_type') && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{t('strategy.legacy_warning')}</strong> {t('strategy.legacy_desc')}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default StrategyInstanceSelector;

