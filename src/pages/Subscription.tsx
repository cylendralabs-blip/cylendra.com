/**
 * Subscription Dashboard
 * 
 * Phase X.10 - Subscription Plans Engine
 */

import { useUserPlan, usePlans } from '@/hooks/useUserPlan';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Calendar, CreditCard, ArrowRight, Check, Coins, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import CryptoPaymentButton from '@/components/payments/CryptoPaymentButton';
import PaymentMethodSelector from '@/components/payments/PaymentMethodSelector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useEffect } from 'react';
import { isBetaFreeMode, getBetaModeConfigWithExpiration } from '@/services/billing/BillingConfigService';
import { useTranslation } from 'react-i18next';

export default function Subscription() {
  const { t } = useTranslation('subscription');
  const { user } = useAuth();
  const { data: userPlan, isLoading } = useUserPlan();
  const { data: plans } = usePlans();
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Crown className="w-8 h-8 mx-auto mb-4 animate-spin text-accent" />
            <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  const currentPlan = plans?.find(p => p.code === userPlan?.code);
  const availableUpgrades = plans?.filter(p =>
    p.sort_order > (currentPlan?.sort_order || 0)
  ) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>
        <Button onClick={() => navigate('/pricing')}>
          <Crown className="w-4 h-4 mr-2" />
          {t('view_all_plans')}
        </Button>
      </div>

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{t('current_plan.title')}</CardTitle>
              <CardDescription>
                {currentPlan?.name || 'Free'} - {userPlan?.code || 'FREE'}
              </CardDescription>
            </div>
            <Badge variant={userPlan?.status === 'active' ? 'default' : 'secondary'} className="text-lg px-4 py-2">
              {userPlan?.status === 'active' ? t('current_plan.status.active') : userPlan?.status || t('current_plan.status.inactive')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">{t('current_plan.monthly_price')}</div>
              <div className="text-2xl font-bold">
                ${currentPlan?.price_usd || 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">{t('current_plan.activation_date')}</div>
              <div className="text-lg font-semibold">
                {userPlan?.expires_at
                  ? format(new Date(userPlan.expires_at), 'yyyy-MM-dd')
                  : t('current_plan.permanent')}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">{t('current_plan.expiration_date')}</div>
              <div className="text-lg font-semibold">
                {userPlan?.expires_at
                  ? format(new Date(userPlan.expires_at), 'yyyy-MM-dd')
                  : t('current_plan.not_specified')}
              </div>
            </div>
          </div>

          {/* Features List */}
          {currentPlan && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{t('features.title')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{t('features.ai_ultra_signals')}: {currentPlan.features.signals.web_ai_ultra ? '✅' : '❌'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{t('features.live_center')}: {currentPlan.features.ai.live_center ? '✅' : '❌'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{t('features.auto_trading')}: {currentPlan.features.bots.enabled ? '✅' : '❌'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{t('features.futures')}: {currentPlan.features.bots.futures ? '✅' : '❌'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{t('features.telegram_ai')}: {currentPlan.features.signals.telegram_ai ? '✅' : '❌'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{t('features.max_bots')}: {currentPlan.features.bots.max_active_bots === -1 ? t('features.unlimited') : currentPlan.features.bots.max_active_bots}</span>
                </div>
              </div>
            </div>
          )}

          {/* Limits Usage */}
          {currentPlan && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{t('limits.title')}</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{t('limits.ai_signals')}</span>
                    <span>
                      {currentPlan.limits.signals_per_day === -1
                        ? t('limits.unlimited')
                        : `0 / ${currentPlan.limits.signals_per_day}`}
                    </span>
                  </div>
                  {currentPlan.limits.signals_per_day !== -1 && (
                    <Progress value={0} className="h-2" />
                  )}
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{t('limits.ai_calls')}</span>
                    <span>
                      {currentPlan.limits.ai_calls_per_day === -1
                        ? t('limits.unlimited')
                        : `0 / ${currentPlan.limits.ai_calls_per_day}`}
                    </span>
                  </div>
                  {currentPlan.limits.ai_calls_per_day !== -1 && (
                    <Progress value={0} className="h-2" />
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      {availableUpgrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('upgrade.title')}</CardTitle>
            <CardDescription>
              {t('upgrade.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableUpgrades.map((plan) => (
                <Card key={plan.id} className="relative">
                  <CardHeader>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="text-2xl font-bold">${plan.price_usd}{t('upgrade.per_month')}</div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full"
                      onClick={() => navigate('/pricing', { state: { planCode: plan.code } })}
                    >
                      {t('upgrade.upgrade_to', { plan: plan.name })}
                      <ArrowRight className="w-4 h-4 mr-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Beta Mode Banner */}
      {betaMode && (
        <Alert className="bg-blue-500/10 border-blue-500/50">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <AlertDescription className="text-blue-400">
            <strong>{t('beta.title')}</strong> {t('beta.description')}
            {betaEndDate && (
              <span className="block mt-2">
                {t('beta.expires', { date: format(new Date(betaEndDate), 'yyyy-MM-dd') })}
                {betaDaysRemaining !== null && betaDaysRemaining > 0 && (
                  <span> {t('beta.days_remaining', { days: betaDaysRemaining })}</span>
                )}
                {t('beta.after_expiry')}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Method & Crypto Payment */}
      <Card>
        <CardHeader>
          <CardTitle>{t('payment.title')}</CardTitle>
          <CardDescription>
            {t('payment.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userPlan && userPlan.expires_at && (
            <div className="flex items-center gap-4 pb-4 border-b">
              <CreditCard className="w-6 h-6 text-muted-foreground" />
              <div>
                <div className="font-semibold">{t('payment.current_method')}</div>
                <div className="text-sm text-muted-foreground">
                  {userPlan.payment_method === 'beta_free' ? (
                    <span className="text-purple-400 font-medium">{t('payment.beta_free')}</span>
                  ) : (
                    userPlan.payment_method || t('payment.not_specified')
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payment Options */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold">{t('payment.options_title')}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('payment.options_subtitle')}
            </p>
            <div className="flex flex-wrap gap-2">
              {currentPlan && currentPlan.price_usd > 0 && (
                <Button
                  onClick={() => setSelectedPlan({
                    code: currentPlan.code,
                    name: currentPlan.name,
                    amount: currentPlan.price_usd,
                  })}
                  variant="default"
                >
                  {t('upgrade.renew', { plan: currentPlan.name })}
                </Button>
              )}
              {availableUpgrades.map((plan) => (
                <Button
                  key={plan.id}
                  onClick={() => setSelectedPlan({
                    code: plan.code,
                    name: plan.name,
                    amount: plan.price_usd,
                  })}
                  variant="outline"
                >
                  {t('upgrade.upgrade_to', { plan: plan.name })}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

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

