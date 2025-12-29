// نظام التحليل الفني المتقدم لحساب مستويات الدعم والمقاومة
export interface TechnicalLevels {
  support: number[];
  resistance: number[];
  pivotPoints: {
    pivot: number;
    s1: number;
    s2: number;
    s3: number;
    r1: number;
    r2: number;
    r3: number;
  };
  fibonacci: {
    levels: number[];
    trend: 'BULLISH' | 'BEARISH';
    strength: number;
  };
  trendAnalysis: {
    direction: 'UP' | 'DOWN' | 'SIDEWAYS';
    strength: number;
    trendLine: number;
  };
}

export interface SmartStopLossResult {
  suggestedStopLoss: number;
  lossPercentage: number;
  confidence: number;
  reasoning: string;
  technicalLevel: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class TechnicalAnalysisEngine {
  
  // حساب النقاط المحورية
  static calculatePivotPoints(high: number, low: number, close: number) {
    const pivot = (high + low + close) / 3;
    
    return {
      pivot,
      s1: (2 * pivot) - high,
      s2: pivot - (high - low),
      s3: low - 2 * (high - pivot),
      r1: (2 * pivot) - low,
      r2: pivot + (high - low),
      r3: high + 2 * (pivot - low)
    };
  }

  // حساب مستويات فيبوناتشي
  static calculateFibonacciLevels(high: number, low: number, trend: 'BULLISH' | 'BEARISH') {
    const range = high - low;
    const levels: number[] = [];
    
    const fibRatios = [0.236, 0.382, 0.5, 0.618, 0.786];
    
    if (trend === 'BULLISH') {
      // في الترند الصاعد، نحسب الارتداد من الأعلى
      fibRatios.forEach(ratio => {
        levels.push(high - (range * ratio));
      });
    } else {
      // في الترند الهابط، نحسب الارتداد من الأسفل
      fibRatios.forEach(ratio => {
        levels.push(low + (range * ratio));
      });
    }
    
    return levels.sort((a, b) => a - b);
  }

  // تحليل الترند البسيط
  static analyzeTrend(prices: number[]): {
    direction: 'UP' | 'DOWN' | 'SIDEWAYS';
    strength: number;
    trendLine: number;
  } {
    if (prices.length < 10) {
      return { direction: 'SIDEWAYS', strength: 0, trendLine: prices[prices.length - 1] };
    }

    // حساب خط الاتجاه باستخدام Linear Regression بسيط
    const n = prices.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = prices;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const trendLine = slope * (n - 1) + intercept;
    const currentPrice = prices[prices.length - 1];
    
    // تحديد قوة واتجاه الترند
    const slopePercent = (slope / currentPrice) * 100;
    const strength = Math.min(Math.abs(slopePercent) * 10, 100);
    
    let direction: 'UP' | 'DOWN' | 'SIDEWAYS' = 'SIDEWAYS';
    if (Math.abs(slopePercent) > 0.1) {
      direction = slopePercent > 0 ? 'UP' : 'DOWN';
    }
    
    return { direction, strength, trendLine };
  }

  // تحديد مستويات الدعم والمقاومة
  static findSupportResistanceLevels(prices: number[], currentPrice: number) {
    const support: number[] = [];
    const resistance: number[] = [];
    
    // البحث عن القمم والقيعان المحلية
    for (let i = 2; i < prices.length - 2; i++) {
      const current = prices[i];
      const prev2 = prices[i - 2];
      const prev1 = prices[i - 1];
      const next1 = prices[i + 1];
      const next2 = prices[i + 2];
      
      // قاع محلي (دعم)
      if (current <= prev2 && current <= prev1 && current <= next1 && current <= next2) {
        if (current < currentPrice && !support.some(level => Math.abs(level - current) / current < 0.01)) {
          support.push(current);
        }
      }
      
      // قمة محلية (مقاومة)
      if (current >= prev2 && current >= prev1 && current >= next1 && current >= next2) {
        if (current > currentPrice && !resistance.some(level => Math.abs(level - current) / current < 0.01)) {
          resistance.push(current);
        }
      }
    }
    
    // ترتيب المستويات
    support.sort((a, b) => b - a); // الأقرب للسعر الحالي أولاً
    resistance.sort((a, b) => a - b); // الأقرب للسعر الحالي أولاً
    
    return {
      support: support.slice(0, 3), // أخذ أقرب 3 مستويات دعم
      resistance: resistance.slice(0, 3) // أخذ أقرب 3 مستويات مقاومة
    };
  }

  // تحليل شامل للمستويات الفنية
  static analyzeTechnicalLevels(
    prices: number[],
    highs: number[],
    lows: number[],
    currentPrice: number
  ): TechnicalLevels {
    
    if (prices.length < 20) {
      // بيانات غير كافية، استخدام قيم افتراضية
      return {
        support: [currentPrice * 0.95],
        resistance: [currentPrice * 1.05],
        pivotPoints: this.calculatePivotPoints(currentPrice * 1.02, currentPrice * 0.98, currentPrice),
        fibonacci: {
          levels: [currentPrice * 0.98, currentPrice * 0.95, currentPrice * 0.92],
          trend: 'BEARISH' as const,
          strength: 50
        },
        trendAnalysis: {
          direction: 'SIDEWAYS' as const,
          strength: 50,
          trendLine: currentPrice
        }
      };
    }

    // حساب أعلى وأقل سعر في آخر فترة
    const recentHigh = Math.max(...highs.slice(-20));
    const recentLow = Math.min(...lows.slice(-20));
    
    // تحديد اتجاه الترند
    const trendAnalysis = this.analyzeTrend(prices.slice(-20));
    // تحويل SIDEWAYS إلى BEARISH لأغراض فيبوناتشي
    const trendDirection: 'BULLISH' | 'BEARISH' = trendAnalysis.direction === 'UP' ? 'BULLISH' : 'BEARISH';
    
    // حساب مستويات الدعم والمقاومة
    const { support, resistance } = this.findSupportResistanceLevels(prices, currentPrice);
    
    // حساب النقاط المحورية
    const pivotPoints = this.calculatePivotPoints(recentHigh, recentLow, currentPrice);
    
    // حساب مستويات فيبوناتشي
    const fibonacciLevels = this.calculateFibonacciLevels(recentHigh, recentLow, trendDirection);
    
    return {
      support,
      resistance,
      pivotPoints,
      fibonacci: {
        levels: fibonacciLevels,
        trend: trendDirection,
        strength: trendAnalysis.strength
      },
      trendAnalysis
    };
  }

  // حساب عامل التايم فريم
  static getTimeframeMultiplier(timeframe: string): number {
    const timeframeMultipliers: { [key: string]: number } = {
      '1m': 0.3,   // 1 دقيقة - تقلبات سريعة جداً
      '5m': 0.5,   // 5 دقائق - تقلبات سريعة
      '15m': 0.7,  // 15 دقيقة - تقلبات متوسطة سريعة
      '30m': 0.8,  // 30 دقيقة
      '1h': 1.0,   // 1 ساعة - الأساس
      '2h': 1.3,   // 2 ساعة
      '4h': 1.6,   // 4 ساعات - تقلبات أوسع
      '6h': 1.8,   // 6 ساعات
      '8h': 2.0,   // 8 ساعات
      '12h': 2.3,  // 12 ساعة
      '1d': 2.8,   // يومي - تقلبات واسعة
      '3d': 3.5,   // 3 أيام
      '1w': 4.2,   // أسبوعي - تقلبات واسعة جداً
      '1M': 5.0    // شهري - أوسع التقلبات
    };
    
    return timeframeMultipliers[timeframe] || 1.0;
  }

  // حساب عامل السيولة للعملة
  static getLiquidityMultiplier(symbol: string): { multiplier: number; category: string } {
    const cleanSymbol = symbol.toUpperCase()
      .replace('/USDT', '')
      .replace('USDT', '')
      .replace('/BUSD', '')
      .replace('BUSD', '')
      .replace('/USD', '')
      .replace('USD', '');

    // عملات عالية السيولة - حركة مستقرة نسبياً
    const highLiquidityCoins = [
      'BTC', 'ETH', 'BNB', 'ADA', 'XRP', 'DOT', 'LINK', 
      'LTC', 'BCH', 'UNI', 'CHAINLINK', 'BITCOIN', 'ETHEREUM'
    ];
    
    // عملات متوسطة السيولة
    const mediumLiquidityCoins = [
      'SOL', 'AVAX', 'MATIC', 'ATOM', 'DOGE', 'SHIB', 'TRX',
      'ETC', 'FIL', 'ALGO', 'VET', 'ICP', 'THETA', 'XLM'
    ];
    
    // عملات منخفضة السيولة - تقلبات عالية
    const lowLiquidityCoins = [
      'FTM', 'SAND', 'MANA', 'GALA', 'CHZ', 'ENJ', 'BAT',
      'ZIL', 'HOT', 'WIN', 'BTT', 'DENT', 'ONE', 'HBAR'
    ];
    
    // عملات عالية المخاطر - تقلبات شديدة
    const highRiskCoins = [
      'LUNC', 'USTC', 'BABYDOGE', 'SAFEMOON', 'FLOKI', 'PEPE',
      'BONK', 'WIF', 'BOME', 'SLERF', 'MEME', 'PNUT'
    ];

    if (highLiquidityCoins.includes(cleanSymbol)) {
      return { multiplier: 0.7, category: 'عالية السيولة' }; // تقليل المسافة
    } else if (mediumLiquidityCoins.includes(cleanSymbol)) {
      return { multiplier: 1.0, category: 'متوسطة السيولة' }; // المسافة العادية
    } else if (lowLiquidityCoins.includes(cleanSymbol)) {
      return { multiplier: 1.4, category: 'منخفضة السيولة' }; // زيادة المسافة
    } else if (highRiskCoins.includes(cleanSymbol)) {
      return { multiplier: 2.0, category: 'عالية المخاطر' }; // مسافة كبيرة جداً
    } else {
      // عملات غير معروفة - نفترض مخاطر متوسطة إلى عالية
      return { multiplier: 1.3, category: 'غير مصنفة' };
    }
  }

  // حساب stop loss ذكي بناءً على التحليل الفني مع التايم فريم والسيولة
  static calculateSmartStopLoss(
    currentPrice: number,
    signalType: 'BUY' | 'SELL' | 'HOLD' | 'STRONG_BUY' | 'STRONG_SELL',
    technicalLevels: TechnicalLevels,
    confidenceScore: number = 70,
    timeframe: string = '1h',
    symbol: string = 'BTC/USDT'
  ): SmartStopLossResult {
    
    // تحويل أنواع الإشارات إلى BUY أو SELL
    let normalizedSignalType: 'BUY' | 'SELL';
    if (signalType === 'BUY' || signalType === 'STRONG_BUY') {
      normalizedSignalType = 'BUY';
    } else if (signalType === 'SELL' || signalType === 'STRONG_SELL') {
      normalizedSignalType = 'SELL';
    } else {
      // في حالة HOLD، نستخدم BUY كافتراضي مع تقليل الثقة
      normalizedSignalType = 'BUY';
      confidenceScore = Math.max(confidenceScore - 20, 30);
    }

    // حساب عوامل التايم فريم والسيولة
    const timeframeMultiplier = this.getTimeframeMultiplier(timeframe);
    const liquidityInfo = this.getLiquidityMultiplier(symbol);
    const liquidityMultiplier = liquidityInfo.multiplier;
    
    // العامل المجمع
    const combinedMultiplier = timeframeMultiplier * liquidityMultiplier;
    
    let suggestedStopLoss: number;
    let reasoning: string;
    let technicalLevel: string = 'GENERAL';
    let confidence = 70;
    
    if (normalizedSignalType === 'BUY') {
      // للشراء، البحث عن أقرب مستوى دعم
      const baseStopLoss = currentPrice * 0.97; // افتراضي 3% كأساس
      let bestStopLoss = baseStopLoss;
      
      // فحص مستويات الدعم
      if (technicalLevels.support.length > 0) {
        const nearestSupport = technicalLevels.support[0];
        const supportDistance = (currentPrice - nearestSupport) / currentPrice;
        
        if (nearestSupport < currentPrice && supportDistance <= 0.15) { // حتى 15%
          bestStopLoss = nearestSupport * 0.998; // أقل بقليل من مستوى الدعم
          reasoning = `دعم عند ${nearestSupport.toFixed(4)}`;
          technicalLevel = 'SUPPORT';
          confidence = 85;
        }
      }
      
      // فحص النقاط المحورية
      const pivotSupports = [technicalLevels.pivotPoints.s1, technicalLevels.pivotPoints.s2];
      for (const pivotSupport of pivotSupports) {
        if (pivotSupport < currentPrice && (currentPrice - pivotSupport) / currentPrice <= 0.12) {
          if (Math.abs(currentPrice - pivotSupport) < Math.abs(currentPrice - bestStopLoss)) {
            bestStopLoss = pivotSupport * 0.998;
            reasoning = `نقطة محورية ${pivotSupport.toFixed(4)}`;
            technicalLevel = 'PIVOT_SUPPORT';
            confidence = 80;
          }
        }
      }
      
      // فحص مستويات فيبوناتشي
      for (const fibLevel of technicalLevels.fibonacci.levels) {
        if (fibLevel < currentPrice && (currentPrice - fibLevel) / currentPrice <= 0.10) {
          if (Math.abs(currentPrice - fibLevel) < Math.abs(currentPrice - bestStopLoss)) {
            bestStopLoss = fibLevel * 0.998;
            reasoning = `فيبوناتشي ${fibLevel.toFixed(4)}`;
            technicalLevel = 'FIBONACCI';
            confidence = 75;
          }
        }
      }
      
      // تطبيق العوامل المجمعة
      const adjustedDistance = Math.abs(currentPrice - bestStopLoss) * combinedMultiplier;
      suggestedStopLoss = currentPrice - adjustedDistance;
      
      // التأكد من عدم تجاوز حدود معقولة
      const minStopLoss = currentPrice * 0.85; // حد أدنى 15%
      const maxStopLoss = currentPrice * 0.99; // حد أقصى 1%
      suggestedStopLoss = Math.max(minStopLoss, Math.min(suggestedStopLoss, maxStopLoss));
      
    } else {
      // للبيع، البحث عن أقرب مستوى مقاومة
      const baseStopLoss = currentPrice * 1.03; // افتراضي 3% كأساس
      let bestStopLoss = baseStopLoss;
      
      // فحص مستويات المقاومة
      if (technicalLevels.resistance.length > 0) {
        const nearestResistance = technicalLevels.resistance[0];
        const resistanceDistance = (nearestResistance - currentPrice) / currentPrice;
        
        if (nearestResistance > currentPrice && resistanceDistance <= 0.15) { // حتى 15%
          bestStopLoss = nearestResistance * 1.002; // أعلى بقليل من مستوى المقاومة
          reasoning = `مقاومة عند ${nearestResistance.toFixed(4)}`;
          technicalLevel = 'RESISTANCE';
          confidence = 85;
        }
      }
      
      // فحص النقاط المحورية
      const pivotResistances = [technicalLevels.pivotPoints.r1, technicalLevels.pivotPoints.r2];
      for (const pivotResistance of pivotResistances) {
        if (pivotResistance > currentPrice && (pivotResistance - currentPrice) / currentPrice <= 0.12) {
          if (Math.abs(currentPrice - pivotResistance) < Math.abs(currentPrice - bestStopLoss)) {
            bestStopLoss = pivotResistance * 1.002;
            reasoning = `نقطة محورية ${pivotResistance.toFixed(4)}`;
            technicalLevel = 'PIVOT_RESISTANCE';
            confidence = 80;
          }
        }
      }
      
      // فحص مستويات فيبوناتشي
      for (const fibLevel of technicalLevels.fibonacci.levels) {
        if (fibLevel > currentPrice && (fibLevel - currentPrice) / currentPrice <= 0.10) {
          if (Math.abs(currentPrice - fibLevel) < Math.abs(currentPrice - bestStopLoss)) {
            bestStopLoss = fibLevel * 1.002;
            reasoning = `فيبوناتشي ${fibLevel.toFixed(4)}`;
            technicalLevel = 'FIBONACCI';
            confidence = 75;
          }
        }
      }
      
      // تطبيق العوامل المجمعة
      const adjustedDistance = Math.abs(bestStopLoss - currentPrice) * combinedMultiplier;
      suggestedStopLoss = currentPrice + adjustedDistance;
      
      // التأكد من عدم تجاوز حدود معقولة
      const minStopLoss = currentPrice * 1.01; // حد أدنى 1%
      const maxStopLoss = currentPrice * 1.15; // حد أقصى 15%
      suggestedStopLoss = Math.max(minStopLoss, Math.min(suggestedStopLoss, maxStopLoss));
    }
    
    // حساب نسبة الخسارة
    const lossPercentage = Math.abs((currentPrice - suggestedStopLoss) / currentPrice) * 100;
    
    // تحديد مستوى المخاطرة
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    if (lossPercentage <= 3.0) riskLevel = 'LOW';
    else if (lossPercentage >= 8.0) riskLevel = 'HIGH';
    
    // تعديل الثقة حسب درجة ثقة الإشارة
    confidence = Math.min(95, confidence + (confidenceScore - 70) * 0.3);
    
    // إضافة معلومات التايم فريم والسيولة للتفسير
    if (!reasoning) {
      reasoning = 'تحليل فني عام';
    }
    reasoning += ` | ${timeframe} (×${timeframeMultiplier.toFixed(1)}) | ${liquidityInfo.category} (×${liquidityMultiplier.toFixed(1)})`;
    
    console.log('🎯 Smart Stop Loss المحسن:', {
      symbol,
      timeframe,
      liquidityCategory: liquidityInfo.category,
      timeframeMultiplier: timeframeMultiplier.toFixed(2),
      liquidityMultiplier: liquidityMultiplier.toFixed(2),
      combinedMultiplier: combinedMultiplier.toFixed(2),
      currentPrice: currentPrice.toFixed(4),
      suggestedStopLoss: suggestedStopLoss.toFixed(4),
      lossPercentage: lossPercentage.toFixed(2) + '%',
      reasoning,
      confidence: confidence.toFixed(0) + '%'
    });
    
    return {
      suggestedStopLoss,
      lossPercentage: Number(lossPercentage.toFixed(2)),
      confidence: Number(confidence.toFixed(0)),
      reasoning,
      technicalLevel,
      riskLevel
    };
  }
}
