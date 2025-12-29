
// نظام المؤشرات التقنية المتقدمة
export interface TechnicalIndicatorData {
  rsi: number;
  macd: {
    line: number;
    signal: number;
    histogram: number;
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    squeeze: boolean;
    position: 'ABOVE_UPPER' | 'BETWEEN' | 'BELOW_LOWER';
  };
  stochastic: {
    k: number;
    d: number;
    signal: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL';
  };
  williams: number;
  cci: number;
  adx: {
    value: number;
    trend_strength: 'STRONG' | 'MODERATE' | 'WEAK';
  };
}

export interface CandlestickPattern {
  name: string;
  type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  reliability: number;
  description: string;
  confirmation: boolean;
}

export class TechnicalIndicatorsEngine {
  
  // حساب RSI (Relative Strength Index)
  static calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    // حساب المتوسط الأولي
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    // حساب RSI باستخدام EMA
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;
      
      avgGain = ((avgGain * (period - 1)) + gain) / period;
      avgLoss = ((avgLoss * (period - 1)) + loss) / period;
    }
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }
  
  // حساب MACD
  static calculateMACD(prices: number[]): {
    line: number;
    signal: number;
    histogram: number;
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  } {
    if (prices.length < 26) {
      return { line: 0, signal: 0, histogram: 0, trend: 'NEUTRAL' };
    }
    
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;
    
    // حساب Signal Line (EMA 9 من MACD Line)
    const macdHistory = [macdLine]; // في التطبيق الحقيقي نحتاج تاريخ MACD
    const signalLine = this.calculateEMA(macdHistory, 9);
    const histogram = macdLine - signalLine;
    
    let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (macdLine > signalLine && histogram > 0) trend = 'BULLISH';
    else if (macdLine < signalLine && histogram < 0) trend = 'BEARISH';
    
    return {
      line: Number(macdLine.toFixed(4)),
      signal: Number(signalLine.toFixed(4)),
      histogram: Number(histogram.toFixed(4)),
      trend
    };
  }
  
  // حساب Bollinger Bands
  static calculateBollingerBands(prices: number[], period: number = 20, multiplier: number = 2): {
    upper: number;
    middle: number;
    lower: number;
    squeeze: boolean;
    position: 'ABOVE_UPPER' | 'BETWEEN' | 'BELOW_LOWER';
  } {
    if (prices.length < period) {
      const currentPrice = prices[prices.length - 1] || 0;
      return {
        upper: currentPrice * 1.02,
        middle: currentPrice,
        lower: currentPrice * 0.98,
        squeeze: false,
        position: 'BETWEEN'
      };
    }
    
    const recentPrices = prices.slice(-period);
    const sma = recentPrices.reduce((sum, price) => sum + price, 0) / period;
    
    // حساب الانحراف المعياري
    const squaredDiffs = recentPrices.map(price => Math.pow(price - sma, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / period;
    const stdDev = Math.sqrt(variance);
    
    const upper = sma + (multiplier * stdDev);
    const lower = sma - (multiplier * stdDev);
    const currentPrice = prices[prices.length - 1];
    
    // تحديد موقع السعر
    let position: 'ABOVE_UPPER' | 'BETWEEN' | 'BELOW_LOWER' = 'BETWEEN';
    if (currentPrice > upper) position = 'ABOVE_UPPER';
    else if (currentPrice < lower) position = 'BELOW_LOWER';
    
    // كشف Bollinger Squeeze (عندما تكون الباندات ضيقة)
    const bandWidth = (upper - lower) / sma;
    const squeeze = bandWidth < 0.1; // 10% كحد أدنى
    
    return {
      upper: Number(upper.toFixed(4)),
      middle: Number(sma.toFixed(4)),
      lower: Number(lower.toFixed(4)),
      squeeze,
      position
    };
  }
  
  // حساب Stochastic Oscillator
  static calculateStochastic(highs: number[], lows: number[], closes: number[], kPeriod: number = 14): {
    k: number;
    d: number;
    signal: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL';
  } {
    if (closes.length < kPeriod) {
      return { k: 50, d: 50, signal: 'NEUTRAL' };
    }
    
    const recentHighs = highs.slice(-kPeriod);
    const recentLows = lows.slice(-kPeriod);
    const currentClose = closes[closes.length - 1];
    
    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);
    
    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    const d = k; // مبسط - في الحقيقة نحتاج متوسط آخر 3 قيم K
    
    let signal: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL' = 'NEUTRAL';
    if (k > 80) signal = 'OVERBOUGHT';
    else if (k < 20) signal = 'OVERSOLD';
    
    return {
      k: Number(k.toFixed(2)),
      d: Number(d.toFixed(2)),
      signal
    };
  }
  
  // حساب Williams %R
  static calculateWilliamsR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
    if (closes.length < period) return -50;
    
    const recentHighs = highs.slice(-period);
    const recentLows = lows.slice(-period);
    const currentClose = closes[closes.length - 1];
    
    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);
    
    return ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
  }
  
  // حساب CCI (Commodity Channel Index)
  static calculateCCI(highs: number[], lows: number[], closes: number[], period: number = 20): number {
    if (closes.length < period) return 0;
    
    const typicalPrices = closes.map((close, index) => 
      (highs[index] + lows[index] + close) / 3
    );
    
    const recentTypical = typicalPrices.slice(-period);
    const smaTypical = recentTypical.reduce((sum, price) => sum + price, 0) / period;
    const currentTypical = typicalPrices[typicalPrices.length - 1];
    
    // حساب Mean Deviation
    const deviations = recentTypical.map(price => Math.abs(price - smaTypical));
    const meanDeviation = deviations.reduce((sum, dev) => sum + dev, 0) / period;
    
    return (currentTypical - smaTypical) / (0.015 * meanDeviation);
  }
  
  // حساب ADX (Average Directional Index)
  static calculateADX(highs: number[], lows: number[], closes: number[], period: number = 14): {
    value: number;
    trend_strength: 'STRONG' | 'MODERATE' | 'WEAK';
  } {
    // مبسط للـ ADX - في الحقيقة يحتاج حسابات معقدة أكثر
    if (closes.length < period + 1) {
      return { value: 25, trend_strength: 'MODERATE' };
    }
    
    let totalMovement = 0;
    for (let i = 1; i < Math.min(period + 1, closes.length); i++) {
      totalMovement += Math.abs(closes[i] - closes[i - 1]);
    }
    
    const avgMovement = totalMovement / Math.min(period, closes.length - 1);
    const adxValue = Math.min(100, avgMovement * 100 / closes[closes.length - 1]);
    
    let strength: 'STRONG' | 'MODERATE' | 'WEAK' = 'MODERATE';
    if (adxValue > 50) strength = 'STRONG';
    else if (adxValue < 25) strength = 'WEAK';
    
    return {
      value: Number(adxValue.toFixed(2)),
      trend_strength: strength
    };
  }
  
  // حساب EMA (Exponential Moving Average)
  private static calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    if (prices.length === 1) return prices[0];
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }
  
  // تحليل شامل للمؤشرات التقنية
  static analyzeAllIndicators(
    prices: number[],
    highs: number[],
    lows: number[],
    closes: number[]
  ): TechnicalIndicatorData {
    
    return {
      rsi: this.calculateRSI(prices),
      macd: this.calculateMACD(prices),
      bollingerBands: this.calculateBollingerBands(prices),
      stochastic: this.calculateStochastic(highs, lows, closes),
      williams: this.calculateWilliamsR(highs, lows, closes),
      cci: this.calculateCCI(highs, lows, closes),
      adx: this.calculateADX(highs, lows, closes)
    };
  }
}

export class CandlestickPatternDetector {
  
  // كشف أنماط الشموع اليابانية
  static detectPatterns(
    opens: number[],
    highs: number[],
    lows: number[],
    closes: number[]
  ): CandlestickPattern[] {
    
    const patterns: CandlestickPattern[] = [];
    const len = closes.length;
    
    if (len < 3) return patterns;
    
    // Doji Pattern
    const currentDoji = this.isDoji(opens[len-1], closes[len-1], highs[len-1], lows[len-1]);
    if (currentDoji) {
      patterns.push({
        name: 'Doji',
        type: 'NEUTRAL',
        reliability: 70,
        description: 'شمعة دوجي تشير لتردد السوق',
        confirmation: true
      });
    }
    
    // Hammer Pattern
    const hammer = this.isHammer(opens[len-1], highs[len-1], lows[len-1], closes[len-1]);
    if (hammer && closes[len-1] < closes[len-2]) {
      patterns.push({
        name: 'Hammer',
        type: 'BULLISH',
        reliability: 75,
        description: 'مطرقة صاعدة - إشارة انعكاس صاعد محتمل',
        confirmation: closes[len-1] > opens[len-1]
      });
    }
    
    // Shooting Star Pattern
    const shootingStar = this.isShootingStar(opens[len-1], highs[len-1], lows[len-1], closes[len-1]);
    if (shootingStar && closes[len-1] > closes[len-2]) {
      patterns.push({
        name: 'Shooting Star',
        type: 'BEARISH',
        reliability: 75,
        description: 'نجمة ساقطة - إشارة انعكاس هابط محتمل',
        confirmation: closes[len-1] < opens[len-1]
      });
    }
    
    // Engulfing Patterns
    if (len >= 2) {
      const bullishEngulfing = this.isBullishEngulfing(
        opens[len-2], closes[len-2],
        opens[len-1], closes[len-1]
      );
      
      if (bullishEngulfing) {
        patterns.push({
          name: 'Bullish Engulfing',
          type: 'BULLISH',
          reliability: 85,
          description: 'ابتلاع صاعد - إشارة انعكاس صاعد قوية',
          confirmation: true
        });
      }
      
      const bearishEngulfing = this.isBearishEngulfing(
        opens[len-2], closes[len-2],
        opens[len-1], closes[len-1]
      );
      
      if (bearishEngulfing) {
        patterns.push({
          name: 'Bearish Engulfing',
          type: 'BEARISH',
          reliability: 85,
          description: 'ابتلاع هابط - إشارة انعكاس هابط قوية',
          confirmation: true
        });
      }
    }
    
    return patterns;
  }
  
  // كشف شمعة دوجي
  private static isDoji(open: number, close: number, high: number, low: number): boolean {
    const bodySize = Math.abs(close - open);
    const totalRange = high - low;
    return totalRange > 0 && (bodySize / totalRange) < 0.1;
  }
  
  // كشف مطرقة
  private static isHammer(open: number, high: number, low: number, close: number): boolean {
    const bodySize = Math.abs(close - open);
    const lowerShadow = Math.min(open, close) - low;
    const upperShadow = high - Math.max(open, close);
    const totalRange = high - low;
    
    return totalRange > 0 && 
           lowerShadow > bodySize * 2 && 
           upperShadow < bodySize * 0.5;
  }
  
  // كشف نجمة ساقطة
  private static isShootingStar(open: number, high: number, low: number, close: number): boolean {
    const bodySize = Math.abs(close - open);
    const upperShadow = high - Math.max(open, close);
    const lowerShadow = Math.min(open, close) - low;
    const totalRange = high - low;
    
    return totalRange > 0 && 
           upperShadow > bodySize * 2 && 
           lowerShadow < bodySize * 0.5;
  }
  
  // كشف ابتلاع صاعد
  private static isBullishEngulfing(
    prevOpen: number, prevClose: number,
    currOpen: number, currClose: number
  ): boolean {
    return prevClose < prevOpen && // الشمعة السابقة حمراء
           currClose > currOpen && // الشمعة الحالية خضراء
           currOpen < prevClose && // فتح أقل من إغلاق السابقة
           currClose > prevOpen; // إغلاق أعلى من فتح السابقة
  }
  
  // كشف ابتلاع هابط
  private static isBearishEngulfing(
    prevOpen: number, prevClose: number,
    currOpen: number, currClose: number
  ): boolean {
    return prevClose > prevOpen && // الشمعة السابقة خضراء
           currClose < currOpen && // الشمعة الحالية حمراء
           currOpen > prevClose && // فتح أعلى من إغلاق السابقة
           currClose < prevOpen; // إغلاق أقل من فتح السابقة
  }
}
