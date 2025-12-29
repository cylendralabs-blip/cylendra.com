/**
 * Feature Lock Component
 * 
 * Phase X.10 - Subscription Plans Engine
 * 
 * Displays a lock screen when user doesn't have access to a feature
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Crown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeatureLockProps {
  featureName: string;
  requiredPlan: string;
  currentPlan?: string;
  description?: string;
}

export function FeatureLock({ 
  featureName, 
  requiredPlan, 
  currentPlan = 'FREE',
  description 
}: FeatureLockProps) {
  const navigate = useNavigate();

  const planNames: Record<string, string> = {
    'FREE': 'مجاني',
    'BASIC': 'أساسي',
    'PREMIUM': 'مميز',
    'PRO': 'احترافي',
    'VIP': 'VIP',
  };

  return (
    <Card className="border-dashed border-2">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-4 bg-muted rounded-full w-fit">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <CardTitle className="text-xl">هذه الميزة غير متاحة</CardTitle>
        <CardDescription className="mt-2">
          {description || `الميزة "${featureName}" متاحة فقط في خطة ${planNames[requiredPlan] || requiredPlan} أو أعلى.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className="text-center">
            <p className="text-muted-foreground">خطتك الحالية</p>
            <p className="font-semibold">{planNames[currentPlan] || currentPlan}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <div className="text-center">
            <p className="text-muted-foreground">الخطة المطلوبة</p>
            <p className="font-semibold text-primary">{planNames[requiredPlan] || requiredPlan}</p>
          </div>
        </div>
        <Button 
          className="w-full" 
          onClick={() => navigate('/dashboard/subscription')}
        >
          <Crown className="w-4 h-4 mr-2" />
          ترقية الخطة
        </Button>
      </CardContent>
    </Card>
  );
}

