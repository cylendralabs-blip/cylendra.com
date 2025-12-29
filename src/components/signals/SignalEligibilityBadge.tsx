/**
 * Signal Eligibility Badge Component
 * 
 * Phase X: Auto Trading UI from Signals
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Zap, XCircle } from 'lucide-react';
import { useAutoTradingEligibility } from '@/hooks/useAutoTradingEligibility';

interface SignalEligibilityBadgeProps {
  signal: {
    signal_type: string;
    confidence_score: number;
    source?: string;
  };
}

export default function SignalEligibilityBadge({ signal }: SignalEligibilityBadgeProps) {
  const eligibility = useAutoTradingEligibility(signal);

  if (eligibility.isEligible) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
              <Zap className="w-3 h-3 mr-1" />
              Eligible
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>This signal is eligible for auto trading</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className="opacity-50">
            <XCircle className="w-3 h-3 mr-1" />
            Not Eligible
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            {eligibility.reasons.length > 0 ? (
              <ul className="list-disc list-inside">
                {eligibility.reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            ) : (
              <p>Auto trading is disabled</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

