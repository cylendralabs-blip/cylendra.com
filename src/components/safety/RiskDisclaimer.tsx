/**
 * Risk Disclaimer Component
 * 
 * Displays risk warning and disclaimer for trading operations
 * 
 * Phase 10: UI/UX Improvement - Task 12
 */

import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface RiskDisclaimerProps {
  variant?: 'full' | 'compact';
  className?: string;
}

export const RiskDisclaimer = ({ variant = 'full', className }: RiskDisclaimerProps) => {
  if (variant === 'compact') {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Risk Warning</AlertTitle>
        <AlertDescription>
          Trading cryptocurrencies involves substantial risk. You may lose your entire investment.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={`border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20 ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
              Important Risk Disclaimer
            </h4>
            <div className="text-sm text-yellow-800 dark:text-yellow-200 space-y-2">
              <p>
                <strong>Trading cryptocurrencies involves substantial risk of loss.</strong> The value of cryptocurrencies 
                can fluctuate significantly, and you may lose some or all of your invested capital.
              </p>
              <p>
                Past performance is not indicative of future results. Automated trading systems, including this bot, 
                cannot guarantee profits or protect against losses.
              </p>
              <p>
                <strong>Before using this service:</strong>
              </p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Only invest what you can afford to lose</li>
                <li>Understand the risks involved in cryptocurrency trading</li>
                <li>Start with testnet mode to familiarize yourself with the system</li>
                <li>Never share your API keys with anyone</li>
                <li>Monitor your positions regularly</li>
              </ul>
              <p className="font-semibold mt-3">
                By using this service, you acknowledge that you understand and accept these risks.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

