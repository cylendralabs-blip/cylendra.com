/**
 * Onboarding Wizard Component
 * 
 * Multi-step wizard for first-time users to set up their trading bot
 * Guides users through API connection, strategy selection, and risk setup
 * 
 * Phase 10: UI/UX Improvement - Task 9
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Zap,
  Shield,
  Target,
  Settings,
  TrendingUp,
  Play,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  component: React.ComponentType<OnboardingStepProps>;
}

interface OnboardingStepProps {
  onNext: () => void;
  onPrev: () => void;
  onSkip?: () => void;
  formData: OnboardingFormData;
  setFormData: (data: Partial<OnboardingFormData>) => void;
}

export interface OnboardingFormData {
  // Step 1: Welcome
  agreedToTerms: boolean;
  
  // Step 2: API Connection
  hasApiKey: boolean;
  platform: 'binance' | 'okx' | null;
  
  // Step 3: Market Type
  marketType: 'spot' | 'futures' | null;
  
  // Step 4: Strategy
  strategy: 'main-strategy' | null;
  
  // Step 5: Risk Preset
  riskPreset: 'low' | 'medium' | 'high' | null;
  
  // Step 6: Testnet
  useTestnet: boolean;
}

const STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Orbitra AI',
    description: 'Let\'s get you started with automated trading',
    icon: Sparkles,
    component: WelcomeStep,
  },
  {
    id: 'api',
    title: 'Connect Your Exchange',
    description: 'Link your Binance or OKX account to start trading',
    icon: Zap,
    component: APIConnectionStep,
  },
  {
    id: 'market',
    title: 'Choose Market Type',
    description: 'Select Spot or Futures trading',
    icon: TrendingUp,
    component: MarketTypeStep,
  },
  {
    id: 'strategy',
    title: 'Select Strategy',
    description: 'Choose your trading strategy',
    icon: Target,
    component: StrategyStep,
  },
  {
    id: 'risk',
    title: 'Set Risk Level',
    description: 'Choose your risk tolerance',
    icon: Shield,
    component: RiskPresetStep,
  },
  {
    id: 'testnet',
    title: 'Start with Testnet',
    description: 'Test your setup safely before going live',
    icon: Play,
    component: TestnetStep,
  },
];

/**
 * Welcome Step Component
 */
function WelcomeStep({ onNext, formData, setFormData }: OnboardingStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-3xl font-bold">Welcome to Orbitra AI</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Your intelligent trading assistant powered by AI. Let's set up your bot in a few simple steps.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What You'll Need</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Exchange Account:</strong> Binance or OKX account with API keys
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Trading Capital:</strong> Funds ready for automated trading
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Risk Understanding:</strong> Knowledge of trading risks and your tolerance
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
                Important Disclaimer
              </h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Trading cryptocurrencies involves substantial risk. You may lose your entire investment. 
                Always start with testnet mode and never invest more than you can afford to lose.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          This setup will take approximately 5 minutes
        </div>
        <Button onClick={onNext} size="lg" className="gap-2">
          Get Started
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * API Connection Step Component
 */
function APIConnectionStep({ onNext, onSkip, formData, setFormData }: OnboardingStepProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Connect Your Exchange</h2>
        <p className="text-muted-foreground">
          Link your exchange account to enable automated trading
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            formData.platform === 'binance' && "ring-2 ring-primary"
          )}
          onClick={() => setFormData({ platform: 'binance', hasApiKey: false })}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                <span className="text-xl font-bold">B</span>
              </div>
              <CardTitle>Binance</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              The world's largest cryptocurrency exchange
            </p>
            {formData.platform === 'binance' && (
              <Badge>Selected</Badge>
            )}
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            formData.platform === 'okx' && "ring-2 ring-primary"
          )}
          onClick={() => setFormData({ platform: 'okx', hasApiKey: false })}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <span className="text-xl font-bold">O</span>
              </div>
              <CardTitle>OKX</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Professional-grade trading platform
            </p>
            {formData.platform === 'okx' && (
              <Badge>Selected</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {formData.platform && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-sm font-medium">
                Next: Connect your {formData.platform === 'binance' ? 'Binance' : 'OKX'} API keys
              </p>
              <Button
                onClick={() => {
                  navigate('/dashboard/api-settings');
                  // Will continue onboarding after API setup
                }}
                className="w-full"
                variant="outline"
              >
                Go to API Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onSkip}>
          Skip for Now
        </Button>
        <Button 
          onClick={onNext} 
          size="lg" 
          disabled={!formData.platform}
          className="gap-2"
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Market Type Step Component
 */
function MarketTypeStep({ onNext, onPrev, formData, setFormData }: OnboardingStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Market Type</h2>
        <p className="text-muted-foreground">
          Select the type of trading you want to do
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            formData.marketType === 'spot' && "ring-2 ring-primary"
          )}
          onClick={() => setFormData({ marketType: 'spot' })}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Spot Trading
            </CardTitle>
            <CardDescription>Buy and sell cryptocurrencies directly</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Lower risk</li>
              <li>• Own the assets</li>
              <li>• No leverage</li>
              <li>• Good for beginners</li>
            </ul>
            {formData.marketType === 'spot' && (
              <Badge className="mt-4">Selected</Badge>
            )}
          </CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            formData.marketType === 'futures' && "ring-2 ring-primary"
          )}
          onClick={() => setFormData({ marketType: 'futures' })}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Futures Trading
            </CardTitle>
            <CardDescription>Trade with leverage for higher returns</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Higher risk/reward</li>
              <li>• Leverage available</li>
              <li>• More complex</li>
              <li>• For experienced traders</li>
            </ul>
            {formData.marketType === 'futures' && (
              <Badge className="mt-4">Selected</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onPrev}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={onNext} 
          size="lg" 
          disabled={!formData.marketType}
          className="gap-2"
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Strategy Step Component
 */
function StrategyStep({ onNext, onPrev, formData, setFormData }: OnboardingStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Select Strategy</h2>
        <p className="text-muted-foreground">
          Choose your trading strategy
        </p>
      </div>

      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          formData.strategy === 'main-strategy' && "ring-2 ring-primary"
        )}
        onClick={() => setFormData({ strategy: 'main-strategy' })}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Main Strategy
            </CardTitle>
            {formData.strategy === 'main-strategy' && (
              <Badge>Selected</Badge>
            )}
          </div>
          <CardDescription>
            AI-powered strategy with DCA, TP/SL, and risk management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Automated entry signals</li>
            <li>• DCA (Dollar Cost Averaging)</li>
            <li>• Dynamic TP/SL</li>
            <li>• Risk management</li>
            <li>• Best for most users</li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onPrev}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={onNext} 
          size="lg" 
          disabled={!formData.strategy}
          className="gap-2"
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Risk Preset Step Component
 */
function RiskPresetStep({ onNext, onPrev, formData, setFormData }: OnboardingStepProps) {
  const presets = [
    {
      id: 'low' as const,
      name: 'Low Risk',
      description: 'Conservative approach, minimal risk per trade',
      icon: Shield,
      color: 'text-green-600',
      details: '1% risk, 1x leverage, safer for beginners',
    },
    {
      id: 'medium' as const,
      name: 'Medium Risk',
      description: 'Balanced risk/reward for steady growth',
      icon: Target,
      color: 'text-blue-600',
      details: '2% risk, 2x leverage, recommended for most',
    },
    {
      id: 'high' as const,
      name: 'High Risk',
      description: 'Aggressive strategy with higher tolerance',
      icon: Zap,
      color: 'text-orange-600',
      details: '3% risk, 5x leverage, for experienced traders',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Set Risk Level</h2>
        <p className="text-muted-foreground">
          Choose your risk tolerance level
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {presets.map((preset) => {
          const Icon = preset.icon;
          return (
            <Card
              key={preset.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                formData.riskPreset === preset.id && "ring-2 ring-primary"
              )}
              onClick={() => setFormData({ riskPreset: preset.id })}
            >
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn("h-5 w-5", preset.color)} />
                  <CardTitle>{preset.name}</CardTitle>
                </div>
                <CardDescription>{preset.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {preset.details}
                </p>
                {formData.riskPreset === preset.id && (
                  <Badge>Selected</Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onPrev}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={onNext} 
          size="lg" 
          disabled={!formData.riskPreset}
          className="gap-2"
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Testnet Step Component
 */
function TestnetStep({ onPrev, formData, setFormData }: OnboardingStepProps) {
  const navigate = useNavigate();

  const handleComplete = async () => {
    // Mark onboarding as complete
    // Apply settings to bot
    // Redirect to dashboard
    setFormData({ useTestnet: true });
    
    // TODO: Save onboarding completion and apply settings
    // For now, just redirect
    navigate('/dashboard');
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Start with Testnet</h2>
        <p className="text-muted-foreground">
          Test your setup safely before going live
        </p>
      </div>

      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Testnet Mode Recommended
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            We strongly recommend starting with testnet mode for at least 24 hours before going live.
          </p>
          
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">Test strategies risk-free</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">Familiarize with the platform</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">Verify bot behavior</span>
            </div>
          </div>

          <div className="pt-4 border-t">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.useTestnet}
                onChange={(e) => setFormData({ useTestnet: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">
                Enable testnet mode (Recommended)
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review Your Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform:</span>
              <span className="font-medium">
                {formData.platform ? formData.platform.toUpperCase() : 'Not selected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Market Type:</span>
              <span className="font-medium capitalize">
                {formData.marketType || 'Not selected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Strategy:</span>
              <span className="font-medium">
                {formData.strategy || 'Not selected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Risk Level:</span>
              <span className="font-medium capitalize">
                {formData.riskPreset || 'Not selected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Testnet Mode:</span>
              <span className="font-medium">
                {formData.useTestnet ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onPrev}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={handleComplete} 
          size="lg" 
          className="gap-2"
        >
          Complete Setup
          <CheckCircle2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Main Onboarding Wizard Component
 */
export const OnboardingWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingFormData>({
    agreedToTerms: false,
    hasApiKey: false,
    platform: null,
    marketType: null,
    strategy: null,
    riskPreset: null,
    useTestnet: true,
  });

  const currentStepData = STEPS[currentStep];
  const StepComponent = currentStepData.component;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    // Skip to next step or complete
    if (currentStep < STEPS.length - 1) {
      handleNext();
    }
  };

  const handleFormDataUpdate = (updates: Partial<OnboardingFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-2xl">Setup Wizard</CardTitle>
              <CardDescription>
                Step {currentStep + 1} of {STEPS.length}: {currentStepData.title}
              </CardDescription>
            </div>
            <Badge variant="outline">
              {Math.round(progress)}% Complete
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent>
          <StepComponent
            onNext={handleNext}
            onPrev={handlePrev}
            onSkip={handleSkip}
            formData={formData}
            setFormData={handleFormDataUpdate}
          />
        </CardContent>
      </Card>
    </div>
  );
};

