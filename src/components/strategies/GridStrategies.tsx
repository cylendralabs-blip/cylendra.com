
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Grid3x3 } from 'lucide-react';
import { useStrategyTemplates } from '@/hooks/useStrategyTemplates';
import CreateStrategyDialog from './CreateStrategyDialog';
import StrategyCard from './StrategyCard';

const GridStrategies = () => {
  const { strategies, isLoading } = useStrategyTemplates();
  
  const gridStrategies = strategies.filter(strategy => 
    strategy.type.includes('grid')
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
          <Grid3x3 className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">استراتيجيات Grid Trading</h3>
          <Badge variant="outline" className="text-xs">
            {gridStrategies.length} استراتيجية
          </Badge>
        </div>
        <CreateStrategyDialog />
      </div>

      {/* قائمة الاستراتيجيات */}
      {gridStrategies.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <Grid3x3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              لا توجد استراتيجيات Grid Trading
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              قم بإنشاء استراتيجية Grid Trading للاستفادة من تقلبات السوق
            </p>
            <CreateStrategyDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {gridStrategies.map((strategy) => (
            <StrategyCard key={strategy.id} strategy={strategy} />
          ))}
        </div>
      )}

      {/* معلومات عن Grid Trading */}
      <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="text-purple-900 dark:text-purple-100 text-lg">
            📊 ما هو Grid Trading؟
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
          <p><strong>المبدأ:</strong> وضع أوامر شراء وبيع على فترات منتظمة</p>
          <p><strong>الهدف:</strong> الاستفادة من تقلبات السعر في نطاق محدد</p>
          <p><strong>الأفضل لـ:</strong> الأسواق الجانبية والعملات المستقرة</p>
          <p><strong>تحذير:</strong> قد يؤدي لخسائر في الترندات القوية</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GridStrategies;
