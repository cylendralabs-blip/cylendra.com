
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { useStrategyTemplates } from '@/hooks/useStrategyTemplates';
import CreateStrategyDialog from './CreateStrategyDialog';
import StrategyCard from './StrategyCard';

const MomentumStrategies = () => {
  const { strategies, isLoading } = useStrategyTemplates();
  
  const momentumStrategies = strategies.filter(strategy => 
    strategy.type.includes('momentum')
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* رأس القسم */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold">استراتيجيات Momentum</h3>
          <Badge variant="outline" className="text-xs">
            {momentumStrategies.length} استراتيجية
          </Badge>
        </div>
        <CreateStrategyDialog />
      </div>

      {/* قائمة الاستراتيجيات */}
      {momentumStrategies.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              لا توجد استراتيجيات Momentum
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              قم بإنشاء استراتيجية Momentum لتتبع الاتجاهات القوية
            </p>
            <CreateStrategyDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {momentumStrategies.map((strategy) => (
            <StrategyCard key={strategy.id} strategy={strategy} />
          ))}
        </div>
      )}

      {/* معلومات عن Momentum Trading */}
      <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="text-orange-900 dark:text-orange-100 text-lg">
            🚀 ما هو Momentum Trading؟
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-orange-800 dark:text-orange-200">
          <p><strong>المبدأ:</strong> التداول في اتجاه الزخم السعري القوي</p>
          <p><strong>المؤشرات:</strong> RSI، MACD، الحجم، والكسر من المقاومات</p>
          <p><strong>الأفضل لـ:</strong> الأسواق الترندية والأخبار القوية</p>
          <p><strong>المخاطر:</strong> تحتاج لإدارة مخاطر صارمة وسرعة في التنفيذ</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MomentumStrategies;
