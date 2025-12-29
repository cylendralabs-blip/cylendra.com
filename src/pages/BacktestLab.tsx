/**
 * Backtest Lab Page
 * 
 * Main page for running backtests with 3-step wizard
 * 
 * Phase 2: Backtest UI - Task 1
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, Target, TrendingUp, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStartBacktest } from '@/hooks/useBacktest';
import { useBotSettings } from '@/hooks/useBotSettings';
import { getDefaultStrategyPresets } from '@/backtest/strategyAdapter';
import { useToast } from '@/hooks/use-toast';
import type { BacktestStartRequest } from '@/services/backtest/backtestService';
import { BotSettingsDisplay } from '@/components/backtest/BotSettingsDisplay';

// Step 1: Choose Strategy
function StrategyStep({ 
  onNext, 
  formData, 
  setFormData 
}: { 
  onNext: () => void; 
  formData: any; 
  setFormData: (data: any) => void;
}) {
  const { botSettings } = useBotSettings();
  const presets = getDefaultStrategyPresets();
  const [selectedType, setSelectedType] = useState<'profile' | 'preset'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [selectedProfile, setSelectedProfile] = useState<string>('current');

  const handleNext = () => {
    if (selectedType === 'preset' && selectedPreset) {
      setFormData({
        ...formData,
        strategyType: 'preset',
        strategyPreset: selectedPreset
      });
      onNext();
    } else if (selectedType === 'profile' && selectedProfile) {
      // Ensure botSettings is properly formatted
      if (!botSettings) {
        console.error('No bot settings found');
        return;
      }
      
      // Extract exchange from default_platform
      let exchange: 'binance' | 'okx' = 'binance';
      if (botSettings.default_platform) {
        const platform = String(botSettings.default_platform).toLowerCase();
        if (platform.includes('okx')) {
          exchange = 'okx';
        }
      }
      
      console.log('📋 Using Bot Profile:', {
        hasBotSettings: !!botSettings,
        risk_percentage: botSettings.risk_percentage,
        stop_loss_percentage: botSettings.stop_loss_percentage,
        take_profit_percentage: botSettings.take_profit_percentage,
        exchange,
        marketType: botSettings.market_type
      });
      
      setFormData({
        ...formData,
        strategyType: 'profile',
        botProfile: {
          botSettings: botSettings, // Pass full botSettings object
          strategyId: 'main-strategy',
          exchange: exchange,
          marketType: (botSettings.market_type as 'spot' | 'futures') || 'spot'
        }
      });
      onNext();
    }
  };

  const selectedPresetData = presets.find(p => p.id === selectedPreset);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">اختر نوع الاستراتيجية</h3>
        <div className="flex gap-4 mb-6">
          <Button
            variant={selectedType === 'preset' ? 'default' : 'outline'}
            onClick={() => setSelectedType('preset')}
            className="flex-1"
          >
            Strategy Presets
          </Button>
          <Button
            variant={selectedType === 'profile' ? 'default' : 'outline'}
            onClick={() => setSelectedType('profile')}
            className="flex-1"
          >
            Bot Profile
          </Button>
        </div>
      </div>

      {selectedType === 'preset' && (
        <div className="space-y-3">
          {presets.map((preset) => (
            <Card
              key={preset.id}
              className={cn(
                "cursor-pointer transition-all",
                selectedPreset === preset.id && "ring-2 ring-primary"
              )}
              onClick={() => setSelectedPreset(preset.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{preset.name}</CardTitle>
                  {selectedPreset === preset.id && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Risk: {preset.botSettings.risk_percentage}%</p>
                  <p>DCA Levels: {preset.botSettings.dca_levels || 0}</p>
                  <p>TP: {preset.botSettings.take_profit_percentage}% | SL: {preset.botSettings.stop_loss_percentage}%</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedType === 'profile' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات البوت الحالية</CardTitle>
              <CardDescription>
                سيتم استخدام جميع إعدادات البوت الحالية في الباكتيست
              </CardDescription>
            </CardHeader>
          </Card>
          <BotSettingsDisplay botSettings={botSettings} />
        </div>
      )}

      {selectedPresetData && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm">Strategy Summary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p><strong>Risk Model:</strong> {selectedPresetData.botSettings.risk_percentage}% per trade</p>
            <p><strong>TP/SL Rules:</strong> TP {selectedPresetData.botSettings.take_profit_percentage}% | SL {selectedPresetData.botSettings.stop_loss_percentage}%</p>
            <p><strong>DCA:</strong> {selectedPresetData.botSettings.dca_levels && selectedPresetData.botSettings.dca_levels > 0 ? `${selectedPresetData.botSettings.dca_levels} levels` : 'Disabled'}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button 
          onClick={handleNext}
          disabled={(selectedType === 'preset' && !selectedPreset) || (selectedType === 'profile' && !botSettings)}
        >
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 2: Market Selection
function MarketStep({ 
  onNext, 
  onPrev,
  formData, 
  setFormData 
}: { 
  onNext: () => void;
  onPrev: () => void;
  formData: any; 
  setFormData: (data: any) => void;
}) {
  const ALLOWED_PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
  const ALLOWED_TIMEFRAMES = ['15m', '1h', '4h', '1D'];
  const ALLOWED_PLATFORMS = ['binance', 'okx', 'bybit'];

  const [platform, setPlatform] = useState<string>(formData.platform || 'binance');
  const [pair, setPair] = useState<string>(formData.pair || 'BTCUSDT');
  const [timeframe, setTimeframe] = useState<string>(formData.timeframe || '1h');
  const [period, setPeriod] = useState<'3M' | '6M' | '1Y' | 'custom'>(formData.period || '1Y');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');

  const [warnings, setWarnings] = useState<string[]>([]);

  const validateAndWarn = () => {
    const newWarnings: string[] = [];
    
    if (!ALLOWED_PAIRS.includes(pair)) {
      newWarnings.push(`Pair ${pair} is not in allowed list. Allowed: ${ALLOWED_PAIRS.join(', ')}`);
    }
    
    if (!ALLOWED_TIMEFRAMES.includes(timeframe)) {
      newWarnings.push(`Timeframe ${timeframe} is not in allowed list. Allowed: ${ALLOWED_TIMEFRAMES.join(', ')}`);
    }

    if (period === 'custom') {
      const from = new Date(customFrom);
      const to = new Date(customTo);
      const diffMs = to.getTime() - from.getTime();
      const maxMs = 365 * 24 * 60 * 60 * 1000; // 1 year
      
      if (diffMs > maxMs) {
        newWarnings.push('Period cannot exceed 1 year');
      }
      
      if (from >= to) {
        newWarnings.push('Start date must be before end date');
      }
    }

    setWarnings(newWarnings);
    return newWarnings.length === 0;
  };

  const handleNext = () => {
    if (!validateAndWarn()) {
      return;
    }

    let periodValue: '3M' | '6M' | '1Y' | { from: string; to: string };
    
    if (period === 'custom') {
      periodValue = { from: customFrom, to: customTo };
    } else {
      periodValue = period;
    }

    setFormData({
      ...formData,
      platform,
      pair,
      timeframe,
      period: periodValue
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">اختر إعدادات السوق</h3>
      </div>

      {/* Platform */}
      <div>
        <label className="text-sm font-medium mb-2 block">Platform</label>
        <div className="grid grid-cols-3 gap-2">
          {ALLOWED_PLATFORMS.map((p) => (
            <Button
              key={p}
              variant={platform === p ? 'default' : 'outline'}
              onClick={() => setPlatform(p)}
              className="capitalize"
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      {/* Pair */}
      <div>
        <label className="text-sm font-medium mb-2 block">Trading Pair</label>
        <div className="grid grid-cols-3 gap-2">
          {ALLOWED_PAIRS.map((p) => (
            <Button
              key={p}
              variant={pair === p ? 'default' : 'outline'}
              onClick={() => setPair(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      {/* Timeframe */}
      <div>
        <label className="text-sm font-medium mb-2 block">Timeframe</label>
        <div className="grid grid-cols-4 gap-2">
          {ALLOWED_TIMEFRAMES.map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? 'default' : 'outline'}
              onClick={() => setTimeframe(tf)}
            >
              {tf}
            </Button>
          ))}
        </div>
      </div>

      {/* Period */}
      <div>
        <label className="text-sm font-medium mb-2 block">Historical Period</label>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant={period === '3M' ? 'default' : 'outline'}
              onClick={() => setPeriod('3M')}
            >
              3 Months
            </Button>
            <Button
              variant={period === '6M' ? 'default' : 'outline'}
              onClick={() => setPeriod('6M')}
            >
              6 Months
            </Button>
            <Button
              variant={period === '1Y' ? 'default' : 'outline'}
              onClick={() => setPeriod('1Y')}
            >
              1 Year
            </Button>
            <Button
              variant={period === 'custom' ? 'default' : 'outline'}
              onClick={() => setPeriod('custom')}
            >
              Custom
            </Button>
          </div>

          {period === 'custom' && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">From</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">To</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Warnings:</p>
                {warnings.map((warning, i) => (
                  <p key={i} className="text-xs text-yellow-700 dark:text-yellow-300">{warning}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={handleNext} disabled={warnings.length > 0}>
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 3: Simulation Settings
function SimulationStep({ 
  onPrev,
  formData, 
  setFormData,
  onSubmit
}: { 
  onPrev: () => void;
  formData: any; 
  setFormData: (data: any) => void;
  onSubmit: (data: any) => void;
}) {
  const [initialBalance, setInitialBalance] = useState<number>(formData.initialCapital || 1000);
  const [makerFee, setMakerFee] = useState<number>(formData.simulationSettings?.fees?.makerPct || 0.1);
  const [takerFee, setTakerFee] = useState<number>(formData.simulationSettings?.fees?.takerPct || 0.1);
  const [slippageEnabled, setSlippageEnabled] = useState<boolean>(formData.simulationSettings?.slippage?.enabled || false);
  const [slippageMax, setSlippageMax] = useState<number>(formData.simulationSettings?.slippage?.maxPct || 0.05);
  const [riskMode, setRiskMode] = useState<'fixed' | 'percentage'>(formData.riskMode || 'percentage');
  const [saveDetailedTrades, setSaveDetailedTrades] = useState<boolean>(formData.saveDetailedTrades || false);

  const handleSubmit = () => {
    const finalData = {
      ...formData,
      initialCapital: initialBalance,
      simulationSettings: {
        fees: {
          makerPct: makerFee,
          takerPct: takerFee
        },
        slippage: {
          enabled: slippageEnabled,
          maxPct: slippageMax
        }
      },
      riskMode,
      saveDetailedTrades
    };

    onSubmit(finalData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">إعدادات المحاكاة</h3>
      </div>

      {/* Initial Balance */}
      <div>
        <label className="text-sm font-medium mb-2 block">Initial Balance (USDT)</label>
        <input
          type="number"
          value={initialBalance}
          onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 1000)}
          min={100}
          step={100}
          className="w-full px-3 py-2 border rounded-md"
        />
        <p className="text-xs text-muted-foreground mt-1">Default: 1000 USDT</p>
      </div>

      {/* Fees */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Maker Fee (%)</label>
          <input
            type="number"
            value={makerFee}
            onChange={(e) => setMakerFee(parseFloat(e.target.value) || 0.1)}
            min={0}
            max={1}
            step={0.01}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Taker Fee (%)</label>
          <input
            type="number"
            value={takerFee}
            onChange={(e) => setTakerFee(parseFloat(e.target.value) || 0.1)}
            min={0}
            max={1}
            step={0.01}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      {/* Slippage */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Enable Slippage</label>
          <input
            type="checkbox"
            checked={slippageEnabled}
            onChange={(e) => setSlippageEnabled(e.target.checked)}
            className="h-4 w-4"
          />
        </div>
        {slippageEnabled && (
          <div>
            <label className="text-sm font-medium mb-2 block">Max Slippage (%)</label>
            <input
              type="number"
              value={slippageMax}
              onChange={(e) => setSlippageMax(parseFloat(e.target.value) || 0.05)}
              min={0}
              max={1}
              step={0.01}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        )}
      </div>

      {/* Risk Mode */}
      <div>
        <label className="text-sm font-medium mb-2 block">Risk Model</label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={riskMode === 'fixed' ? 'default' : 'outline'}
            onClick={() => setRiskMode('fixed')}
          >
            Fixed Position Size
          </Button>
          <Button
            variant={riskMode === 'percentage' ? 'default' : 'outline'}
            onClick={() => setRiskMode('percentage')}
          >
            % of Equity
          </Button>
        </div>
      </div>

      {/* Save Detailed Trades */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium">Save Detailed Trades</label>
          <p className="text-xs text-muted-foreground">Store individual trades in database</p>
        </div>
        <input
          type="checkbox"
          checked={saveDetailedTrades}
          onChange={(e) => setSaveDetailedTrades(e.target.checked)}
          className="h-4 w-4"
        />
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={handleSubmit}>
          <Target className="mr-2 h-4 w-4" />
          Start Backtest
        </Button>
      </div>
    </div>
  );
}

/**
 * Main Backtest Lab Component
 */
export default function BacktestLab() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { mutate: startBacktest, isPending } = useStartBacktest();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});

  const steps = [
    { id: 'strategy', title: 'Choose Strategy', icon: Target },
    { id: 'market', title: 'Market Selection', icon: TrendingUp },
    { id: 'simulation', title: 'Simulation Settings', icon: Settings }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;
  const CurrentStepComponent = currentStep === 0 
    ? StrategyStep 
    : currentStep === 1 
    ? MarketStep 
    : SimulationStep;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (finalData: any) => {
    console.log('🚀 Submitting backtest request:', {
      strategyType: finalData.strategyType,
      hasBotProfile: !!finalData.botProfile,
      botProfileKeys: finalData.botProfile ? Object.keys(finalData.botProfile) : [],
      botSettingsKeys: finalData.botProfile?.botSettings ? Object.keys(finalData.botProfile.botSettings) : [],
      risk_percentage: finalData.botProfile?.botSettings?.risk_percentage,
      stop_loss_percentage: finalData.botProfile?.botSettings?.stop_loss_percentage,
      take_profit_percentage: finalData.botProfile?.botSettings?.take_profit_percentage
    });
    
    const request: BacktestStartRequest = {
      pair: finalData.pair,
      timeframe: finalData.timeframe,
      period: finalData.period,
      initialCapital: finalData.initialCapital,
      simulationSettings: finalData.simulationSettings,
      ...(finalData.strategyType === 'preset' 
        ? { strategyPreset: finalData.strategyPreset }
        : { botProfile: finalData.botProfile })
    };
    
    console.log('📤 Final request payload:', JSON.stringify(request, null, 2));

    startBacktest(request, {
      onSuccess: (response) => {
        navigate(`/dashboard/backtest/run/${response.run_id}`);
      },
      onError: (error: any) => {
        toast({
          title: 'فشل بدء الباك تست',
          description: error.message || 'حدث خطأ أثناء بدء الباك تست',
          variant: 'destructive'
        });
      }
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Backtest Lab</h1>
        <p className="text-muted-foreground">
          Test your trading strategies on historical data
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle>Backtest Configuration</CardTitle>
              <CardDescription>
                Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
              </CardDescription>
            </div>
            <Badge variant="outline">
              {Math.round(progress)}% Complete
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent>
          {currentStep === 0 && (
            <StrategyStep
              onNext={handleNext}
              formData={formData}
              setFormData={setFormData}
            />
          )}
          {currentStep === 1 && (
            <MarketStep
              onNext={handleNext}
              onPrev={handlePrev}
              formData={formData}
              setFormData={setFormData}
            />
          )}
          {currentStep === 2 && (
            <SimulationStep
              onPrev={handlePrev}
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

