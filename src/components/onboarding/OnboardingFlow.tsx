/**
 * Onboarding Flow Component
 * 
 * Phase X.15 - Pre-Launch Preparation
 * Guides new users through the platform
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, ArrowRight, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void | Promise<void>;
  };
  optional?: boolean;
}

interface OnboardingFlowProps {
  onComplete?: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState(false);

  // Check if user has completed onboarding
  useEffect(() => {
    if (!user) return;

    const checkOnboardingStatus = async () => {
      const { data } = await (supabase as any)
        .from('user_preferences')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if ((data as { onboarding_completed?: boolean })?.onboarding_completed) {
        setDismissed(true);
      }
    };

    checkOnboardingStatus();
  }, [user]);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'مرحباً بك في Orbitra AI',
      description: 'نظام تداول ذكي مدعوم بالذكاء الاصطناعي. دعنا نبدأ بجولة سريعة.',
    },
    {
      id: 'api-keys',
      title: 'إضافة مفاتيح API',
      description: 'أضف مفاتيح API الخاصة بك من Binance أو OKX لبدء التداول التلقائي.',
      action: {
        label: 'إضافة مفتاح API',
        onClick: () => {
          window.location.href = '/dashboard/api-settings';
        },
      },
    },
    {
      id: 'bot-settings',
      title: 'إعداد البوت',
      description: 'قم بإعداد البوت الخاص بك: اختيار الاستراتيجية، إدارة المخاطر، وتحديد حجم الصفقات.',
      action: {
        label: 'إعداد البوت',
        onClick: () => {
          window.location.href = '/dashboard/bot-settings';
        },
      },
    },
    {
      id: 'signals',
      title: 'استكشف الإشارات',
      description: 'تصفح الإشارات الحية من AI Live Center أو Ultra Signals Dashboard.',
      action: {
        label: 'عرض الإشارات',
        onClick: () => {
          window.location.href = '/dashboard/ai-live';
        },
      },
    },
    {
      id: 'complete',
      title: 'أنت جاهز!',
      description: 'لقد أكملت الإعداد الأساسي. ابدأ التداول الآن!',
    },
  ];

  const handleStepComplete = async (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepId);
    setCompletedSteps(newCompleted);

    if (stepId === 'complete' && user) {
      // Mark onboarding as completed
      await (supabase as any)
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        });
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setDismissed(true);
      onComplete?.();
    }
  };

  const handleSkip = () => {
    setDismissed(true);
  };

  const handleDismiss = async () => {
    if (user) {
      await (supabase as any)
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          onboarding_completed: true,
          onboarding_dismissed: true,
        });
    }
    setDismissed(true);
  };

  if (dismissed) {
    return null;
  }

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Card className="fixed bottom-4 right-4 w-96 z-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">دليل البدء السريع</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Progress value={progress} className="mt-2" />
        <CardDescription className="text-xs mt-1">
          الخطوة {currentStep + 1} من {steps.length}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-1">{currentStepData.title}</h3>
          <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
        </div>

        {currentStepData.component}

        <div className="flex items-center gap-2">
          {currentStepData.action && (
            <Button
              onClick={async () => {
                await currentStepData.action!.onClick();
                handleStepComplete(currentStepData.id);
              }}
              className="flex-1"
            >
              {currentStepData.action.label}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {!currentStepData.action && (
            <Button
              onClick={() => handleStepComplete(currentStepData.id)}
              className="flex-1"
            >
              {currentStepData.id === 'complete' ? 'ابدأ التداول' : 'التالي'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {currentStepData.optional && (
            <Button variant="outline" onClick={handleSkip}>
              تخطي
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`h-2 w-2 rounded-full ${
                index <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

