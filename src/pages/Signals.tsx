
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Star, TrendingUp, CheckCircle, Brain, Activity, BarChart3, Settings } from 'lucide-react';
// import NewEnhancedSignalEnginePanel from '@/components/signals/NewEnhancedSignalEnginePanel'; // REMOVED: Mock component - use TradingView or Internal Strategy instead
import EnhancedSignalsTable from '@/components/signals/EnhancedSignalsTable';
import SignalExecutionModal from '@/components/signals/SignalExecutionModal';
import AutoTradingStatusWidget from '@/components/signals/AutoTradingStatusWidget';
// import AdvancedAnalysisPanel from '@/components/signals/AdvancedAnalysisPanel'; // REMOVED: Mock component - use TradingView or Internal Strategy instead
import TechnicalIndicatorsPanel from '@/components/signals/TechnicalIndicatorsPanel';
import { TradingSignal } from '@/types/signals';
import { useTechnicalIndicators } from '@/hooks/useTechnicalIndicators';
import { useIsMobile } from '@/hooks/use-mobile';

const Signals = () => {
  const [selectedSignal, setSelectedSignal] = useState<TradingSignal | null>(null);
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const isMobile = useIsMobile();
  
  const { 
    analyzeIndicators, 
    indicators, 
    patterns, 
    isAnalyzing, 
    lastUpdate 
  } = useTechnicalIndicators();

  const handleSignalExecution = (signal: TradingSignal) => {
    console.log('🎯 تنفيذ الإشارة:', signal);
    setSelectedSignal(signal);
    setIsExecutionModalOpen(true);
  };

  const handleExecuteTrade = (tradeData: any) => {
    console.log('🚀 تنفيذ الصفقة:', tradeData);
    setIsExecutionModalOpen(false);
  };

  const handleSymbolChange = (symbol: string) => {
    setSelectedSymbol(symbol);
    analyzeIndicators(symbol);
  };

  return (
    <div className="container mx-auto p-3 md:p-6">
      {/* العنوان الرئيسي - محسن للموبايل */}
      <div className="mb-6 md:mb-8">
        <h1 className={`font-bold mb-3 flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 text-foreground ${
          isMobile ? 'text-2xl' : 'text-4xl'
        }`}>
          <div className="flex items-center gap-2">
            <Zap className={`text-emerald-600 ${isMobile ? 'w-6 h-6' : 'w-10 h-10'}`} />
            <span>نظام الإشارات المتطور</span>
          </div>
          <span className={`bg-gradient-to-r from-emerald-600 to-green-600 text-white px-3 py-1 md:px-4 md:py-2 rounded-lg shadow-lg ${
            isMobile ? 'text-sm self-start' : 'text-lg'
          }`}>
            AI POWERED
          </span>
        </h1>
        <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-lg'}`}>
          نظام إشارات متطور مع تحليل السيولة والحجم ونشاط الحيتان والذكاء الاصطناعي
        </p>
      </div>

      {/* معلومات النظام المحسن */}
      <Card className="mb-6 md:mb-8 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
        <CardHeader className={isMobile ? 'p-4' : ''}>
          <CardTitle className={`flex items-center gap-2 text-foreground ${isMobile ? 'text-lg' : ''}`}>
            <Star className={`text-emerald-600 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
            <span>مميزات النظام المتطور</span>
          </CardTitle>
          <CardDescription className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
            نظام متقدم مع تحليل شامل للسيولة والحجم ونشاط الحيتان والمؤشرات التقنية
          </CardDescription>
        </CardHeader>
        <CardContent className={isMobile ? 'p-4 pt-0' : ''}>
          <div className={`grid gap-3 md:gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            <div className={`flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg`}>
              <CheckCircle className={`text-emerald-600 flex-shrink-0 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
              <span className={`font-medium text-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>تحليل السيولة المتقدم</span>
            </div>
            <div className={`flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg`}>
              <CheckCircle className={`text-emerald-600 flex-shrink-0 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
              <span className={`font-medium text-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>كشف نشاط الحيتان</span>
            </div>
            <div className={`flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg`}>
              <CheckCircle className={`text-emerald-600 flex-shrink-0 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
              <span className={`font-medium text-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>تحليل الحجم الذكي</span>
            </div>
            <div className={`flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg`}>
              <Brain className={`text-purple-600 flex-shrink-0 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
              <span className={`font-medium text-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>تحليل معنويات السوق</span>
            </div>
            <div className={`flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg`}>
              <TrendingUp className={`text-blue-600 flex-shrink-0 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
              <span className={`font-medium text-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>تقييم المخاطر الذكي</span>
            </div>
            <div className={`flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg`}>
              <Activity className={`text-orange-600 flex-shrink-0 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
              <span className={`font-medium text-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>المؤشرات التقنية المتقدمة</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* التبويبات الرئيسية - محسنة للموبايل */}
      <Tabs defaultValue="signals" className="space-y-4 md:space-y-6">
        <TabsList className={`w-full ${isMobile ? 'h-auto p-1 grid-cols-2 gap-1' : 'grid-cols-4 h-14'}`}>
          <TabsTrigger 
            value="signals" 
            className={`flex items-center gap-1 md:gap-2 ${
              isMobile ? 'text-xs px-2 py-3 flex-col h-auto' : 'text-base'
            }`}
          >
            <Zap className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
            <span>الإشارات</span>
          </TabsTrigger>
          <TabsTrigger 
            value="engine" 
            className={`flex items-center gap-1 md:gap-2 ${
              isMobile ? 'text-xs px-2 py-3 flex-col h-auto' : 'text-base'
            }`}
          >
            <Settings className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
            <span>المحرك</span>
          </TabsTrigger>
          <TabsTrigger 
            value="analysis" 
            className={`flex items-center gap-1 md:gap-2 ${
              isMobile ? 'text-xs px-2 py-3 flex-col h-auto' : 'text-base'
            }`}
          >
            <Brain className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
            <span>التحليل</span>
          </TabsTrigger>
          <TabsTrigger 
            value="indicators" 
            className={`flex items-center gap-1 md:gap-2 ${
              isMobile ? 'text-xs px-2 py-3 flex-col h-auto' : 'text-base'
            }`}
          >
            <BarChart3 className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
            <span>المؤشرات</span>
          </TabsTrigger>
        </TabsList>

        {/* تبويب الإشارات المحققة */}
        <TabsContent value="signals" className="space-y-4 md:space-y-6">
          {/* Phase X: Auto Trading Status Widget */}
          <AutoTradingStatusWidget />
          
          <div className={`text-center ${isMobile ? 'mb-4' : 'mb-6'}`}>
            <h2 className={`font-bold text-foreground mb-2 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
              جدول الإشارات المحققة
            </h2>
            <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
              عرض الإشارات مع الأسعار الحقيقية المحققة 100%
            </p>
          </div>
          <EnhancedSignalsTable />
        </TabsContent>

        {/* تبويب المحرك المحسن - REMOVED: Mock component */}
        <TabsContent value="engine" className="space-y-4 md:space-y-6">
          <Card className="text-center p-8">
            <CardContent>
              <Settings className="text-muted-foreground mx-auto mb-4 w-16 h-16" />
              <h3 className="font-semibold mb-2 text-xl">المحرك المحسن - غير متاح</h3>
              <p className="text-muted-foreground mb-4">
                تم إزالة المكون الوهمي. استخدم TradingView Webhook أو Internal Strategy Engine للحصول على إشارات حقيقية.
              </p>
              <p className="text-sm text-muted-foreground">
                System uses: TradingView Webhook + Internal Strategy Engine (mainStrategy)
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب التحليل المتقدم - REMOVED: Mock component */}
        <TabsContent value="analysis" className="space-y-4 md:space-y-6">
          <Card className="text-center p-8">
            <CardContent>
              <Brain className="text-muted-foreground mx-auto mb-4 w-16 h-16" />
              <h3 className="font-semibold mb-2 text-xl">التحليل المتقدم - غير متاح</h3>
              <p className="text-muted-foreground mb-4">
                تم إزالة المكون الوهمي. استخدم TradingView Webhook أو Internal Strategy Engine للحصول على تحليل حقيقي.
              </p>
              <p className="text-sm text-muted-foreground">
                System uses: TradingView Webhook + Internal Strategy Engine (mainStrategy)
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب المؤشرات التقنية */}
        <TabsContent value="indicators" className="space-y-4 md:space-y-6">
          <div className={`text-center ${isMobile ? 'mb-4' : 'mb-6'}`}>
            <h2 className={`font-bold text-foreground mb-2 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
              المؤشرات التقنية المتقدمة
            </h2>
            <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
              تحليل تفصيلي للمؤشرات التقنية وأنماط الشموع
            </p>
          </div>
          {indicators && patterns && (
            <TechnicalIndicatorsPanel 
              data={indicators} 
              patterns={patterns} 
              symbol={selectedSymbol}
            />
          )}
          {!indicators && (
            <Card className={`text-center ${isMobile ? 'p-6' : 'p-8'}`}>
              <CardContent>
                <Brain className={`text-muted-foreground mx-auto mb-4 ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}`} />
                <h3 className={`font-semibold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                  لا توجد بيانات متاحة
                </h3>
                <p className={`text-muted-foreground mb-4 ${isMobile ? 'text-sm' : ''}`}>
                  انتقل إلى تبويب "التحليل المتقدم" لتشغيل تحليل المؤشرات التقنية
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* نافذة تنفيذ الصفقات */}
      <SignalExecutionModal
        signal={selectedSignal}
        open={isExecutionModalOpen && !!selectedSignal}
        onOpenChange={setIsExecutionModalOpen}
        onExecute={handleExecuteTrade}
      />
    </div>
  );
};

export default Signals;
