/**
 * Field Tooltip Component
 * 
 * Helper component to add tooltips to form fields
 * 
 * Phase 10: UI/UX Improvement - Task 3
 */

import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FieldTooltipProps {
  content: string;
  className?: string;
}

export const FieldTooltip = ({ content, className }: FieldTooltipProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              className
            )}
          >
            <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

