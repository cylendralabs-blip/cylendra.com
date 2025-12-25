
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Play, Pause, Settings, TrendingUp, Zap } from 'lucide-react';
import { useStrategyTemplates } from '@/hooks/useStrategyTemplates';
import { useStrategyTrades } from '@/hooks/useStrategyTrades';
import CreateStrategyDialog from './CreateStrategyDialog';
import StrategyCard from './StrategyCard';
import EnhancedDCAStrategies from './enhanced/EnhancedDCAStrategies';

const DCAStrategies = () => {
  const { strategies, isLoading } = useStrategyTemplates();
  
  const dcaStrategies = strategies.filter(strategy => 
    strategy.type.includes('dca')
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
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
    <div className="space-y-6">
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">DCA أساسية</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {dcaStrategies.filter(s => s.type === 'dca_basic').length}
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">DCA متقدمة</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {dcaStrategies.filter(s => s.type === 'dca_advanced').length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">DCA ذكية</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {dcaStrategies.filter(s => s.type === 'dca_smart').length}
                </p>
              </div>
              <Zap className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التبديل بين العرض القديم والجديد */}
      <Tabs defaultValue="enhanced" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="enhanced">العرض المحسن</TabsTrigger>
            <TabsTrigger value="classic">العرض التقليدي</TabsTrigger>
          </TabsList>
          
          <CreateStrategyDialog />
        </div>

        <TabsContent value="enhanced">
          <EnhancedDCAStrategies />
        </TabsContent>

        <TabsContent value="classic" className="space-y-4">
          {/* رأس القسم */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">استراتيجيات DCA التقليدية</h3>
              <Badge variant="outline" className="text-xs">
                {dcaStrategies.length} استراتيجية
              </Badge>
            </div>
          </div>

          {/* قائمة الاستراتيجيات */}
          {dcaStrategies.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  لا توجد استراتيجيات DCA
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  قم بإنشاء استراتيجية DCA جديدة للبدء في التداول التلقائي
                </p>
                <CreateStrategyDialog />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {dcaStrategies.map((strategy) => (
                <StrategyCard key={strategy.id} strategy={strategy} />
              ))}
            </div>
          )}

          {/* نصائح وإرشادات */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100 text-lg">
                💡 نصائح حول استراتيجيات DCA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <p><strong>DCA الأساسية:</strong> الأكثر أماناً وتناسب المبتدئين</p>
              <p><strong>DCA المتقدمة:</strong> مميزات إضافية مثل الدخول الذكي وجني الأرباح الديناميكي</p>
              <p><strong>DCA الذكية:</strong> تستخدم الذكاء الاصطناعي لتحسين نقاط الدخول</p>
              <p><strong>نصيحة:</strong> ابدأ برأس مال صغير لتجربة الاستراتيجية</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DCAStrategies;
