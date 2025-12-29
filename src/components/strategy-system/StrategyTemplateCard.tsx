/**
 * Strategy Template Card Component
 * 
 * Displays a strategy template with option to create instance
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StrategyTemplate } from '@/types/strategy-system';
import { Target, TrendingUp, Grid3x3, Zap, Plus } from 'lucide-react';

interface StrategyTemplateCardProps {
  template: StrategyTemplate;
  onCreateInstance: (template: StrategyTemplate) => void;
}

const iconMap: Record<string, any> = {
  Target,
  TrendingUp,
  Grid3x3,
  Zap,
};

const riskColors = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function StrategyTemplateCard({ template, onCreateInstance }: StrategyTemplateCardProps) {
  const Icon = iconMap[template.icon] || Target;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Icon className="w-5 h-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription className="text-sm mt-1">
                {template.description}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge className={riskColors[template.risk_level]}>
            {template.risk_level === 'low' && 'مخاطرة منخفضة'}
            {template.risk_level === 'medium' && 'مخاطرة متوسطة'}
            {template.risk_level === 'high' && 'مخاطرة عالية'}
          </Badge>
          
          <Badge variant="outline">{template.category}</Badge>
          
          {template.supports_spot && (
            <Badge variant="secondary">Spot</Badge>
          )}
          
          {template.supports_futures && (
            <Badge variant="secondary">Futures</Badge>
          )}
          
          {template.supports_leverage && (
            <Badge variant="secondary">Leverage</Badge>
          )}
        </div>

        {/* Create Instance Button */}
        <Button 
          className="w-full" 
          onClick={() => onCreateInstance(template)}
        >
          <Plus className="w-4 h-4 mr-2" />
          إنشاء استراتيجية جديدة
        </Button>
      </CardContent>
    </Card>
  );
}

