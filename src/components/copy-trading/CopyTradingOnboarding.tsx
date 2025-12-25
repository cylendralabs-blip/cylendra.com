/**
 * Copy Trading Onboarding Tutorial
 * 
 * Phase X.17 - Onboarding Tutorial
 * 
 * Interactive tutorial for new users
 */

import { useState, useEffect } from 'react';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  ArrowRight,
  ArrowLeft,
  X,
  Copy,
  TrendingUp,
  Shield,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

interface TutorialStep {
  id: string;
  icon: React.ComponentType<any>;
}

export default function CopyTradingOnboarding() {
  const { t } = useTranslation('copy_trading');
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [completed, setCompleted] = useState(false);

  const tutorialSteps: TutorialStep[] = [
    { id: 'welcome', icon: Copy },
    { id: 'how_it_works', icon: Copy },
    { id: 'risk_management', icon: Shield },
    { id: 'allocation', icon: TrendingUp },
  ];

  // Check if user has completed onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) return;

      const { data } = await (supabase as any)
        .from('user_preferences')
        .select('copy_trading_onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if ((data as any)?.copy_trading_onboarding_completed) {
        setCompleted(true);
      } else {
        setIsOpen(true);
      }
    };

    checkOnboarding();
  }, [user]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    await (supabase as any)
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        copy_trading_onboarding_completed: true,
      });

    setCompleted(true);
    setIsOpen(false);
  };

  const handleSkip = () => {
    setIsOpen(false);
  };

  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;
  const currentStepData = tutorialSteps[currentStep];
  const Icon = currentStepData.icon;
  const stepKey = currentStepData.id;

  const renderStepContent = () => {
    switch (stepKey) {
      case 'welcome':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {t('onboarding.steps.welcome.intro')}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <Users className="h-8 w-8 mb-2 text-primary" />
                <h4 className="font-semibold">{t('onboarding.steps.welcome.follow_strategies')}</h4>
                <p className="text-sm text-muted-foreground">{t('onboarding.steps.welcome.follow_desc')}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <TrendingUp className="h-8 w-8 mb-2 text-primary" />
                <h4 className="font-semibold">{t('onboarding.steps.welcome.auto_profit')}</h4>
                <p className="text-sm text-muted-foreground">{t('onboarding.steps.welcome.auto_desc')}</p>
              </div>
            </div>
          </div>
        );

      case 'how_it_works':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">1</div>
                <div>
                  <h4 className="font-semibold">{t('onboarding.steps.how_it_works.step1_title')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('onboarding.steps.how_it_works.step1_desc')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">2</div>
                <div>
                  <h4 className="font-semibold">{t('onboarding.steps.how_it_works.step2_title')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('onboarding.steps.how_it_works.step2_desc')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">3</div>
                <div>
                  <h4 className="font-semibold">{t('onboarding.steps.how_it_works.step3_title')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('onboarding.steps.how_it_works.step3_desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'risk_management':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {t('onboarding.steps.risk_management.intro')}
            </p>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <h4 className="font-semibold mb-1">{t('onboarding.steps.risk_management.daily_loss')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('onboarding.steps.risk_management.daily_loss_desc')}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-semibold mb-1">{t('onboarding.steps.risk_management.total_loss')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('onboarding.steps.risk_management.total_loss_desc')}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-semibold mb-1">{t('onboarding.steps.risk_management.max_leverage')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('onboarding.steps.risk_management.max_leverage_desc')}
                </p>
              </div>
            </div>
          </div>
        );

      case 'allocation':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {t('onboarding.steps.allocation.intro')}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <Badge className="mb-2">{t('onboarding.steps.allocation.percent_badge')}</Badge>
                <h4 className="font-semibold mb-1">{t('onboarding.steps.allocation.percent_title')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('onboarding.steps.allocation.percent_desc')}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <Badge className="mb-2">{t('onboarding.steps.allocation.fixed_badge')}</Badge>
                <h4 className="font-semibold mb-1">{t('onboarding.steps.allocation.fixed_title')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('onboarding.steps.allocation.fixed_desc')}
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (completed) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {t(`onboarding.steps.${stepKey}.title`)}
          </DialogTitle>
          <DialogDescription>{t(`onboarding.steps.${stepKey}.description`)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Progress value={progress} className="w-full" />

          <div className="text-sm text-muted-foreground">
            {t('onboarding.step_progress', { current: currentStep + 1, total: tutorialSteps.length })}
          </div>

          <Card>
            <CardContent className="pt-6">
              {renderStepContent()}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleSkip}>
              {t('onboarding.skip')}
            </Button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('onboarding.previous')}
                </Button>
              )}
              <Button onClick={handleNext}>
                {currentStep === tutorialSteps.length - 1 ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {t('onboarding.finish')}
                  </>
                ) : (
                  <>
                    {t('onboarding.next')}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
