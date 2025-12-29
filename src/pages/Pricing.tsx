/**
 * Pricing Page
 * 
 * Phase X.10 - Subscription Plans Engine
 */

import { usePlans, useUserPlan } from '@/hooks/useUserPlan';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Rocket, Star, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import PaymentMethodSelector from '@/components/payments/PaymentMethodSelector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useEffect } from 'react';
import { isBetaFreeMode, getBetaModeConfigWithExpiration } from '@/services/billing/BillingConfigService';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

const planIcons = {
  FREE: <Zap className="w-6 h-6" />,
  BASIC: <Zap className="w-6 h-6" />,
  PREMIUM: <Rocket className="w-6 h-6" />,
  PRO: <Star className="w-6 h-6" />,
  VIP: <Crown className="w-6 h-6" />,
};

const planColors = {
  FREE: 'border-gray-300 dark:border-gray-700',
  BASIC: 'border-blue-500 dark:border-blue-400',
  PREMIUM: 'border-purple-500 dark:border-purple-400',
  PRO: 'border-orange-500 dark:border-orange-400',
  VIP: 'border-yellow-500 dark:border-yellow-400',
};

export default function Pricing() {
  const { t } = useTranslation('marketing');
  const { user } = useAuth();
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: userPlan } = useUserPlan();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<{ code: string; name: string; amount: number } | null>(null);
  const [betaMode, setBetaMode] = useState(false);
  const [betaEndDate, setBetaEndDate] = useState<string | null>(null);
  const [betaDaysRemaining, setBetaDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    const checkBetaMode = async () => {
      const isBeta = await isBetaFreeMode();
      setBetaMode(isBeta);

      if (isBeta) {
        const config = await getBetaModeConfigWithExpiration();
        setBetaEndDate(config.endDate);
        setBetaDaysRemaining(config.daysRemaining);
      }
    };
    checkBetaMode();
  }, []);

  if (plansLoading) {
    return (
      <div className="container mx-auto p-6 pt-24">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Crown className="w-8 h-8 mx-auto mb-4 animate-spin text-accent" />
            <p className="text-gray-600 dark:text-gray-400">{t('pricing.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 pt-24 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">{t('pricing.title')}</h1>
        <p className="text-xl text-muted-foreground">
          {t('pricing.subtitle')}
        </p>
      </div>

      {/* Beta Mode Banner */}
      {betaMode && (
        <Alert className="bg-blue-500/10 border-blue-500/50">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <AlertDescription className="text-blue-400">
            <strong>🎉 {t('pricing.beta_title')}</strong> {t('pricing.beta_desc')}
            {betaEndDate && (
              <span className="block mt-2">
                {t('pricing.beta_ends')} <strong>{format(new Date(betaEndDate), 'yyyy-MM-dd')}</strong>.
                {betaDaysRemaining !== null && betaDaysRemaining > 0 && (
                  <span> ({t('pricing.beta_remaining', { count: betaDaysRemaining })})</span>
                )}
                {t('pricing.beta_after')}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan Badge */}
      {user && userPlan && (
        <div className="text-center">
          <Badge variant="outline" className="text-lg px-4 py-2">
            {t('pricing.current_plan')}: {userPlan.code}
          </Badge>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {plans?.map((plan) => {
          const isCurrentPlan = userPlan?.code === plan.code;
          const isUpgrade = userPlan && plan.sort_order > (plans.find(p => p.code === userPlan.code)?.sort_order || 0);

          return (
            <Card
              key={plan.id}
              className={`relative ${planColors[plan.code as keyof typeof planColors]} ${isCurrentPlan ? 'ring-2 ring-primary' : ''
                }`}
            >
              {isCurrentPlan && (
                <Badge className="absolute -top-3 right-4">{t('pricing.current_badge')}</Badge>
              )}
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {planIcons[plan.code as keyof typeof planIcons]}
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">${plan.price_usd}</div>
                    <div className="text-sm text-muted-foreground">/{t('pricing.month')}</div>
                  </div>
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.code}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Features */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      {plan.features.signals.web_ai_ultra ? '✅' : '❌'} {t('pricing.features.signals')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      {plan.features.ai.live_center ? '✅' : '❌'} {t('pricing.features.live')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      {plan.features.bots.enabled ? '✅' : '❌'} {t('pricing.features.auto')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      {plan.features.bots.futures ? '✅' : '❌'} {t('pricing.features.futures')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      {plan.features.signals.telegram_ai ? '✅' : '❌'} {t('pricing.features.telegram')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      {t('pricing.features.max_bots')}: {plan.features.bots.max_active_bots === -1 ? '∞' : plan.features.bots.max_active_bots}
                    </span>
                  </div>
                </div>

                {/* Limits */}
                <div className="pt-4 border-t space-y-1 text-sm text-muted-foreground">
                  <div>{t('pricing.limits.signals')}: {plan.limits.signals_per_day === -1 ? '∞' : plan.limits.signals_per_day}</div>
                  <div>{t('pricing.limits.ai_calls')}: {plan.limits.ai_calls_per_day === -1 ? '∞' : plan.limits.ai_calls_per_day}</div>
                </div>

                {/* Action Button */}
                <Button
                  className="w-full"
                  variant={isCurrentPlan ? 'outline' : isUpgrade ? 'default' : 'secondary'}
                  disabled={isCurrentPlan}
                  onClick={() => {
                    if (!user) {
                      navigate('/auth');
                      return;
                    }

                    if (isCurrentPlan) {
                      return;
                    }

                    // Open payment method selector
                    setSelectedPlan({
                      code: plan.code,
                      name: plan.name,
                      amount: plan.price_usd,
                    });
                  }}
                >
                  {isCurrentPlan ? t('pricing.buttons.current') : isUpgrade ? t('pricing.buttons.subscribe') : t('pricing.buttons.select')}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="text-center text-sm text-muted-foreground">
        <p>{t('pricing.footer')}</p>
      </div>

      {/* Payment Method Selector Modal */}
      {selectedPlan && (
        <PaymentMethodSelector
          isOpen={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          planCode={selectedPlan.code as any}
          planName={selectedPlan.name}
          amount={selectedPlan.amount}
        />
      )}
    </div>
  );
}
