
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Settings, Eye, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import BotStatusIndicator from './BotStatusIndicator';
import RiskLevelControls from './RiskLevelControls';
import { useBotControl } from '@/hooks/useBotControl';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';

interface BotControlPanelProps {
  isRunning: boolean;
  riskPercentage: number;
  botSettings: any;
}

const BotControlPanel = ({ isRunning, riskPercentage, botSettings }: BotControlPanelProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation('dashboard');

  // Use new bot control hook
  const {
    status,
    isRunning: botIsRunning,
    start,
    stop,
    isStarting,
    isStopping,
    canStart,
    canStartReason,
    statusData
  } = useBotControl();

  const toggleBot = async () => {
    if (!user || !botSettings) return;

    if (botIsRunning) {
      // Stop bot
      stop();
    } else {
      // Start bot
      if (!canStart) {
        toast({
          title: t('bot_control.cannot_start'),
          description: canStartReason || t('bot_control.check_settings'),
          variant: 'destructive'
        });
        return;
      }
      start();
    }
  };

  const updateRiskLevel = async (newRisk: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('bot_settings')
        .update({ risk_percentage: newRisk })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: t('bot_control.risk_updated'),
        description: t('bot_control.risk_updated_desc', { value: newRisk }),
      });
    } catch (error) {
      toast({
        title: t('bot_control.error_title'),
        description: t('bot_control.risk_update_error'),
        variant: 'destructive',
      });
    }
  };

  const handleViewAllTrades = () => {
    navigate('/dashboard/trading-history');
  };

  const handleAdvancedSettings = () => {
    navigate('/dashboard/bot-settings');
  };

  const isUpdating = isStarting || isStopping;
  const actualIsRunning = botIsRunning || isRunning; // Fallback to prop for backward compatibility

  return (
    <Card className="p-3 sm:p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
          {t('bot_control.title')}
        </h3>
        <BotStatusIndicator isRunning={actualIsRunning} />
      </div>

      {/* Error Alert */}
      {status === 'ERROR' && statusData?.errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {statusData.errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Warning if no strategy selected */}
      {!canStart && canStartReason && !actualIsRunning && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {canStartReason}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Controls */}
      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        <div className="flex items-center justify-center">
          <Button
            onClick={toggleBot}
            disabled={isUpdating || (!canStart && !actualIsRunning)}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full ${actualIsRunning
                ? 'bg-trading-danger hover:bg-red-600'
                : 'bg-trading-success hover:bg-green-600'
              } text-white`}
          >
            {isUpdating ? (
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : actualIsRunning ? (
              <Pause className="w-6 h-6 sm:w-8 sm:h-8" />
            ) : (
              <Play className="w-6 h-6 sm:w-8 sm:h-8" />
            )}
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {actualIsRunning ? t('bot_control.press_to_stop') : t('bot_control.press_to_start')}
          </p>
          {statusData?.activeStrategy && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {t('bot_control.strategy_label', { name: statusData.activeStrategy.name, version: statusData.activeStrategy.version })}
            </p>
          )}
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-3 sm:space-y-4 border-t pt-3 sm:pt-4">
        <RiskLevelControls
          riskPercentage={riskPercentage}
          onRiskChange={updateRiskLevel}
        />
      </div>

      <div className="grid grid-cols-1 gap-2 mt-3 sm:mt-4">
        <Button
          variant="outline"
          onClick={handleViewAllTrades}
          className="w-full text-xs sm:text-sm"
        >
          <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
          {t('bot_control.view_all_trades')}
        </Button>

        <Button
          variant="outline"
          onClick={handleAdvancedSettings}
          className="w-full text-xs sm:text-sm"
        >
          <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
          {t('bot_control.advanced_settings')}
        </Button>
      </div>
    </Card>
  );
};

export default BotControlPanel;
