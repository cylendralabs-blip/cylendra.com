/**
 * Help Tooltip Component
 * 
 * Phase X.15 - Pre-Launch Preparation
 * Reusable tooltip component for feature explanations
 */

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { ReactNode } from 'react';

interface HelpTooltipProps {
  content: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  children?: ReactNode;
}

export function HelpTooltip({ content, side = 'top', children }: HelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus:outline-none"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

