import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Download, Settings } from 'lucide-react';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { useTradingPerformance } from '@/hooks/useTradingPerformance';

// Import new components
import RiskMetricsGrid from './components/RiskMetricsGrid';
import RiskRadarChart from './components/RiskRadarChart';
import VaRAnalysisChart from './components/VaRAnalysisChart';
import CorrelationMatrix from './components/CorrelationMatrix';
import StressTestScenarios from './components/StressTestScenarios';
import PortfolioRiskSummary from './components/PortfolioRiskSummary';

const AdvancedRiskAnalysis = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
  const [riskTolerance, setRiskTolerance] = useState('moderate');
  const { realStats } = useRealTimeData();
  const { data: performance } = useTradingPerformance();

  const riskMetrics = useMemo(() => {
    const currentRisk = realStats?.currentRiskPercentage || 2;
    const maxDrawdown = Math.abs(performance?.max_drawdown || 0);
    const sharpeRatio = 1.8;
    const volatility = 15.2;
    const beta = 0.85;
    const diversification = 78;
    
    return [
      {
        name: 'مستوى المخاطر الحالي',
        value: currentRisk,
        target: 5,
        status: (currentRisk < 3 ? 'safe' : 
                currentRisk < 5 ? 'warning' : 'danger') as 'safe' | 'warning' | 'danger',
        description: 'نسبة رأس المال المعرض للمخاطر'
      },
      {
        name: 'أقصى انخفاض',
        value: maxDrawdown,
        target: 10,
        status: (maxDrawdown < 5 ? 'safe' : 
                maxDrawdown < 10 ? 'warning' : 'danger') as 'safe' | 'warning' | 'danger',
        description: 'أكبر خسارة من أعلى نقطة'
      },
      {
        name: 'نسبة شارب',
        value: sharpeRatio,
        target: 1.5,
        status: (sharpeRatio > 1.5 ? 'safe' : sharpeRatio > 1 ? 'warning' : 'danger') as 'safe' | 'warning' | 'danger',
        description: 'مقياس العائد المعدل بالمخاطر'
      },
      {
        name: 'التقلبات',
        value: volatility,
        target: 20,
        status: (volatility < 15 ? 'safe' : volatility < 20 ? 'warning' : 'danger') as 'safe' | 'warning' | 'danger',
        description: 'مستوى التقلبات في المحفظة'
      },
      {
        name: 'معامل بيتا',
        value: beta,
        target: 1,
        status: (beta < 1 ? 'safe' : beta < 1.2 ? 'warning' : 'danger') as 'safe' | 'warning' | 'danger',
        description: 'حساسية المحفظة لحركة السوق'
      },
      {
        name: 'التنويع',
        value: diversification,
        target: 70,
        status: (diversification > 70 ? 'safe' : diversification > 50 ? 'warning' : 'danger') as 'safe' | 'warning' | 'danger',
        description: 'مستوى التنويع في المحفظة'
      }
    ];
  }, [realStats, performance]);

  const varData = [
    { timeframe: '1d', var95: 1.2, var99: 2.1, expectedShortfall: 2.8 },
    { timeframe: '1w', var95: 3.8, var99: 6.2, expectedShortfall: 8.1 },
    { timeframe: '1m', var95: 8.5, var99: 14.2, expectedShortfall: 18.7 },
    { timeframe: '3m', var95: 15.3, var99: 25.8, expectedShortfall: 32.4 }
  ];

  const riskRadarData = [
    { metric: 'السيولة', value: 85, fullMark: 100 },
    { metric: 'التقلبات', value: 65, fullMark: 100 },
    { metric: 'التنويع', value: 78, fullMark: 100 },
    { metric: 'الرافعة', value: 45, fullMark: 100 },
    { metric: 'التركز', value: 60, fullMark: 100 },
    { metric: 'الارتباط', value: 70, fullMark: 100 }
  ];

  const correlationMatrix = [
    { asset: 'BTC', BTC: 1.00, ETH: 0.85, BNB: 0.72, ADA: 0.68, SOL: 0.74 },
    { asset: 'ETH', BTC: 0.85, ETH: 1.00, BNB: 0.79, ADA: 0.71, SOL: 0.82 },
    { asset: 'BNB', BTC: 0.72, ETH: 0.79, BNB: 1.00, ADA: 0.65, SOL: 0.69 },
    { asset: 'ADA', BTC: 0.68, ETH: 0.71, BNB: 0.65, ADA: 1.00, SOL: 0.63 },
    { asset: 'SOL', BTC: 0.74, ETH: 0.82, BNB: 0.69, ADA: 0.63, SOL: 1.00 }
  ];

  const stressTestScenarios = [
    {
      name: 'انهيار السوق (-50%)',
      impact: -12.5,
      probability: 5,
      description: 'انخفاض حاد في جميع الأصول'
    },
    {
      name: 'تصحيح متوسط (-20%)',
      impact: -4.8,
      probability: 25,
      description: 'تصحيح طبيعي في السوق'
    },
    {
      name: 'تقلبات عالية',
      impact: -2.2,
      probability: 40,
      description: 'زيادة في التقلبات اليومية'
    },
    {
      name: 'أزمة سيولة',
      impact: -6.1,
      probability: 15,
      description: 'نقص في السيولة المتاحة'
    }
  ];

  const portfolioAssets = [
    { name: 'BTC', allocation: 40, risk: 'متوسط' },
    { name: 'ETH', allocation: 30, risk: 'متوسط' },
    { name: 'BNB', allocation: 15, risk: 'منخفض' },
    { name: 'أخرى', allocation: 15, risk: 'عالي' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2 space-x-reverse">
            <AlertTriangle className="w-6 h-6" />
            <span>تحليل المخاطر المتقدم</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            أدوات تحليل وإدارة المخاطر الشاملة
          </p>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4" />
            <span className="ml-1">تقرير</span>
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="var">VaR Analysis</TabsTrigger>
          <TabsTrigger value="correlation">الارتباط</TabsTrigger>
          <TabsTrigger value="stress">اختبار الضغط</TabsTrigger>
          <TabsTrigger value="portfolio">المحفظة</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <RiskMetricsGrid metrics={riskMetrics} />
          <RiskRadarChart data={riskRadarData} />
        </TabsContent>

        <TabsContent value="var" className="space-y-6">
          <VaRAnalysisChart data={varData} />
        </TabsContent>

        <TabsContent value="correlation" className="space-y-6">
          <CorrelationMatrix data={correlationMatrix} />
        </TabsContent>

        <TabsContent value="stress" className="space-y-6">
          <StressTestScenarios scenarios={stressTestScenarios} />
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          <PortfolioRiskSummary assets={portfolioAssets} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedRiskAnalysis;
