
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Brain, Calculator, TrendingDown, TrendingUp, Target, Clock, Droplets } from 'lucide-react';

interface SmartStopLossDisplayProps {
  suggestedLossPercentage: number;
  maxAllowedLoss: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reasoning: string;
  isWithinRiskLimits: boolean;
  riskWarning?: string;
  technicalLevel?: string;
  confidence?: number;
}

const SmartStopLossDisplay = ({
  suggestedLossPercentage,
  maxAllowedLoss,
  riskLevel,
  reasoning,
  isWithinRiskLimits,
  riskWarning,
  technicalLevel,
  confidence
}: SmartStopLossDisplayProps) => {
  const getRiskLevelColor = () => {
    switch (riskLevel) {
      case 'LOW': return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200';
      case 'MEDIUM': return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200';
      case 'HIGH': return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
    }
  };

  const getRiskBadgeColor = () => {
    switch (riskLevel) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-red-100 text-red-800';
    }
  };

  const getTechnicalLevelInfo = () => {
    switch (technicalLevel) {
      case 'SUPPORT': return { icon: TrendingUp, label: 'مستوى دعم', color: 'text-green-600' };
      case 'RESISTANCE': return { icon: TrendingDown, label: 'مستوى مقاومة', color: 'text-red-600' };
      case 'FIBONACCI': return { icon: Target, label: 'فيبوناتشي', color: 'text-blue-600' };
      case 'PIVOT_SUPPORT': return { icon: TrendingUp, label: 'نقطة محورية دعم', color: 'text-green-500' };
      case 'PIVOT_RESISTANCE': return { icon: TrendingDown, label: 'نقطة محورية مقاومة', color: 'text-red-500' };
      default: return { icon: Calculator, label: 'تحليل عام', color: 'text-gray-600' };
    }
  };

  // استخراج معلومات التايم فريم والسيولة من reasoning
  const parseReasoningDetails = (reasoning: string) => {
    const timeframeMatch = reasoning.match(/(\w+)\s*\(×([\d.]+)\)/);
    const liquidityMatch = reasoning.match(/(\w+\s*\w*)\s*\(×([\d.]+)\)$/);
    
    return {
      timeframe: timeframeMatch ? timeframeMatch[1] : null,
      timeframeMultiplier: timeframeMatch ? timeframeMatch[2] : null,
      liquidityCategory: liquidityMatch ? liquidityMatch[1] : null,
      liquidityMultiplier: liquidityMatch ? liquidityMatch[2] : null
    };
  };

  const reasoningDetails = parseReasoningDetails(reasoning);
  const technicalInfo = getTechnicalLevelInfo();
  const TechnicalIcon = technicalInfo.icon;

  return (
    <Card className={getRiskLevelColor()}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 space-x-reverse text-sm">
          <Brain className="w-4 h-4" />
          <span>Stop Loss التحليل الفني المحسن</span>
          <Badge className={getRiskBadgeColor()}>{riskLevel}</Badge>
          {confidence && (
            <Badge variant="outline" className="text-xs">
              {confidence}% ثقة
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-xs">
          تحليل متقدم يأخذ في الاعتبار التايم فريم وسيولة العملة
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center space-x-2 space-x-reverse">
            <TrendingDown className="w-3 h-3" />
            <span>نسبة الخسارة المحسنة:</span>
          </div>
          <div className="font-bold text-sm">{suggestedLossPercentage.toFixed(2)}%</div>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            <Calculator className="w-3 h-3" />
            <span>الحد الأقصى للخسارة:</span>
          </div>
          <div className="font-bold">${maxAllowedLoss.toFixed(2)}</div>
        </div>

        {/* معلومات التايم فريم والسيولة */}
        {(reasoningDetails.timeframe || reasoningDetails.liquidityCategory) && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {reasoningDetails.timeframe && (
              <div className="flex items-center space-x-2 space-x-reverse p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
                <Clock className="w-3 h-3 text-blue-600" />
                <span className="font-medium">{reasoningDetails.timeframe}</span>
                <span className="text-blue-600">×{reasoningDetails.timeframeMultiplier}</span>
              </div>
            )}
            {reasoningDetails.liquidityCategory && (
              <div className="flex items-center space-x-2 space-x-reverse p-2 bg-purple-50 dark:bg-purple-950/20 rounded">
                <Droplets className="w-3 h-3 text-purple-600" />
                <span className="font-medium">{reasoningDetails.liquidityCategory}</span>
                <span className="text-purple-600">×{reasoningDetails.liquidityMultiplier}</span>
              </div>
            )}
          </div>
        )}

        {technicalLevel && (
          <div className="flex items-center space-x-2 space-x-reverse text-xs p-2 bg-white/50 dark:bg-gray-800/50 rounded">
            <TechnicalIcon className={`w-3 h-3 ${technicalInfo.color}`} />
            <span className="font-medium">المستوى الفني:</span>
            <span className={technicalInfo.color}>{technicalInfo.label}</span>
          </div>
        )}

        <div className="text-xs">
          <span className="font-medium">التحليل الفني: </span>
          <span>{reasoning.split(' |')[0]}</span>
        </div>

        {!isWithinRiskLimits && riskWarning && (
          <div className="flex items-start space-x-2 space-x-reverse bg-red-100 dark:bg-red-950/30 p-2 rounded text-xs text-red-800 dark:text-red-200">
            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>{riskWarning}</span>
          </div>
        )}

        {isWithinRiskLimits && (
          <div className="flex items-center space-x-2 space-x-reverse text-xs text-green-600 dark:text-green-400">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>ضمن حدود إدارة المخاطر المحسنة</span>
          </div>
        )}

        {confidence && confidence >= 80 && (
          <div className="flex items-center space-x-2 space-x-reverse text-xs text-blue-600 dark:text-blue-400">
            <Target className="w-3 h-3" />
            <span>تحليل فني عالي الدقة مع عوامل متقدمة</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartStopLossDisplay;
