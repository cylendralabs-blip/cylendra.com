
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatNumber } from '@/utils/tradingFormat';

interface StressTestScenario {
  name: string;
  impact: number;
  probability: number;
  description: string;
}

interface StressTestScenariosProps {
  scenarios: StressTestScenario[];
}

const StressTestScenarios = ({ scenarios }: StressTestScenariosProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>اختبار الضغط</CardTitle>
        <CardDescription>تحليل تأثير السيناريوهات المختلفة على المحفظة</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {scenarios.map((scenario, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{scenario.name}</h4>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Badge variant="outline">
                    احتمالية: {scenario.probability}%
                  </Badge>
                  <Badge className={scenario.impact < -10 ? 'bg-red-500' : scenario.impact < -5 ? 'bg-orange-500' : 'bg-yellow-500'}>
                    {scenario.impact > 0 ? '+' : ''}{formatNumber(scenario.impact)}%
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
              <Progress 
                value={scenario.probability} 
                className="h-2"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default StressTestScenarios;
