/**
 * Dashboard Advanced Section
 * 
 * Collapsible advanced metrics section for experienced users
 * Shows: Sharpe ratio, winrate, profit factor, drawdown chart, allocation details
 * 
 * Phase 10: UI/UX Improvement - Task 2
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface DashboardAdvancedSectionProps {
  className?: string;
}

export const DashboardAdvancedSection = ({ className }: DashboardAdvancedSectionProps) => {
  const { t } = useTranslation('dashboard');
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('advanced_metrics.title')}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                {t('advanced_metrics.hide_advanced')}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                {t('advanced_metrics.show_advanced')}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Placeholder for advanced metrics */}
            <div className="text-sm text-muted-foreground">
              {t('advanced_metrics.placeholder')}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

