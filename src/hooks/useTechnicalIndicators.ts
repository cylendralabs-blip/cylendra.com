
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TechnicalIndicatorsEngine, CandlestickPatternDetector, TechnicalIndicatorData, CandlestickPattern } from '@/utils/technicalIndicators';

interface MarketData {
  opens: number[];
  highs: number[];
  lows: number[];
  closes: number[];
  volumes: number[];
}

export const useTechnicalIndicators = () => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [indicators, setIndicators] = useState<TechnicalIndicatorData | null>(null);
  const [patterns, setPatterns] = useState<CandlestickPattern[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // تحليل المؤشرات التقنية
  const analyzeIndicators = async (symbol: string, marketData?: MarketData) => {
    setIsAnalyzing(true);
    
    try {
      console.log(`🔍 بدء تحليل المؤشرات التقنية لـ ${symbol}...`);
      
      // بيانات تجريبية إذا لم تُمرر بيانات حقيقية
      const defaultData: MarketData = marketData || {
        opens: Array.from({ length: 50 }, (_, i) => 100 + Math.random() * 10),
        highs: Array.from({ length: 50 }, (_, i) => 105 + Math.random() * 15),
        lows: Array.from({ length: 50 }, (_, i) => 95 + Math.random() * 10),
        closes: Array.from({ length: 50 }, (_, i) => 100 + Math.random() * 12),
        volumes: Array.from({ length: 50 }, (_, i) => 1000 + Math.random() * 500)
      };
      
      // حساب المؤشرات التقنية
      const technicalData = TechnicalIndicatorsEngine.analyzeAllIndicators(
        defaultData.closes,
        defaultData.highs,
        defaultData.lows,
        defaultData.closes
      );
      
      // كشف أنماط الشموع
      const candlestickPatterns = CandlestickPatternDetector.detectPatterns(
        defaultData.opens,
        defaultData.highs,
        defaultData.lows,
        defaultData.closes
      );
      
      setIndicators(technicalData);
      setPatterns(candlestickPatterns);
      setLastUpdate(new Date());
      
      console.log('✅ تم تحليل المؤشرات التقنية بنجاح');
      console.log('المؤشرات:', technicalData);
      console.log('الأنماط:', candlestickPatterns);
      
      // إشعار بالنتائج
      const strongSignals = [];
      if (technicalData.rsi > 70) strongSignals.push('RSI ذروة شراء');
      if (technicalData.rsi < 30) strongSignals.push('RSI ذروة بيع');
      if (technicalData.macd.trend === 'BULLISH') strongSignals.push('MACD صاعد');
      if (technicalData.macd.trend === 'BEARISH') strongSignals.push('MACD هابط');
      if (candlestickPatterns.length > 0) strongSignals.push(`${candlestickPatterns.length} نمط شموع`);
      
      if (strongSignals.length > 0) {
        toast({
          title: "🎯 تم العثور على إشارات تقنية",
          description: strongSignals.join(' • ')
        });
      }
      
    } catch (error) {
      console.error('❌ خطأ في تحليل المؤشرات التقنية:', error);
      toast({
        title: "❌ خطأ في التحليل",
        description: "حدث خطأ أثناء تحليل المؤشرات التقنية",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // حساب درجة الإشارة الإجمالية
  const calculateOverallSignal = (): { score: number; direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; strength: string } => {
    if (!indicators) return { score: 0, direction: 'NEUTRAL', strength: 'غير متاح' };
    
    let bullishSignals = 0;
    let bearishSignals = 0;
    let totalSignals = 0;
    
    // تحليل RSI
    if (indicators.rsi < 30) bullishSignals++;
    else if (indicators.rsi > 70) bearishSignals++;
    totalSignals++;
    
    // تحليل MACD
    if (indicators.macd.trend === 'BULLISH') bullishSignals++;
    else if (indicators.macd.trend === 'BEARISH') bearishSignals++;
    totalSignals++;
    
    // تحليل Bollinger Bands
    if (indicators.bollingerBands.position === 'BELOW_LOWER') bullishSignals++;
    else if (indicators.bollingerBands.position === 'ABOVE_UPPER') bearishSignals++;
    totalSignals++;
    
    // تحليل Stochastic
    if (indicators.stochastic.signal === 'OVERSOLD') bullishSignals++;
    else if (indicators.stochastic.signal === 'OVERBOUGHT') bearishSignals++;
    totalSignals++;
    
    // تحليل أنماط الشموع
    patterns.forEach(pattern => {
      if (pattern.type === 'BULLISH' && pattern.confirmation) bullishSignals++;
      else if (pattern.type === 'BEARISH' && pattern.confirmation) bearishSignals++;
      totalSignals++;
    });
    
    const bullishPercentage = (bullishSignals / totalSignals) * 100;
    const bearishPercentage = (bearishSignals / totalSignals) * 100;
    
    let direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    let strength = 'ضعيف';
    
    if (bullishPercentage > 60) {
      direction = 'BULLISH';
      strength = bullishPercentage > 80 ? 'قوي جداً' : 'قوي';
    } else if (bearishPercentage > 60) {
      direction = 'BEARISH';
      strength = bearishPercentage > 80 ? 'قوي جداً' : 'قوي';
    } else {
      strength = 'متوسط';
    }
    
    return {
      score: Math.max(bullishPercentage, bearishPercentage),
      direction,
      strength
    };
  };

  return {
    analyzeIndicators,
    indicators,
    patterns,
    isAnalyzing,
    lastUpdate,
    calculateOverallSignal
  };
};
