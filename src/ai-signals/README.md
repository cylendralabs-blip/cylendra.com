# AI Ultra Signal Engine - Phase X.1

## نظرة عامة

نظام تحليل متقدم متعدد العوامل (AI Multi-Factor Analyzer) يجمع بين 6 أنواع من التحليل لإنتاج تقييم موحد للسوق.

## المكونات

### 1. Technical Analyzer (`analyzer/technical.ts`)
- **المؤشرات**: RSI, MACD, EMA (20/50/200), ADX, ATR, Stochastic, Bollinger Bands, VWAP
- **المخرجات**: Trend, Momentum, Volatility, Technical Score (0-100)

### 2. Volume Analyzer (`analyzer/volume.ts`)
- **التحليل**: Volume spikes, Delta volume, Buy/Sell pressure, Liquidity zones
- **المخرجات**: Volume Score, Buy/Sell Pressure, Liquidity Bias

### 3. Pattern Analyzer (`analyzer/patterns.ts`)
- **الأنماط**: Triangles, Wedges, Flags, Double Tops/Bottoms, Head & Shoulders, Channels
- **المخرجات**: Pattern Score, Detected Pattern, Pattern Type

### 4. Elliott Wave Analyzer (`analyzer/elliott.ts`)
- **الموجات**: Impulse Waves (1-5), ABC Corrections, Fibonacci Retracements
- **المخرجات**: Wave Score, Wave Phase, Current Wave, Fibonacci Levels

### 5. Sentiment Analyzer (`analyzer/sentiment.ts`)
- **المصادر**: Fear & Greed Index, Funding Rates, Social Sentiment
- **المخرجات**: Sentiment Score, Overall Sentiment, Funding Bias

### 6. AI Fusion Engine (`analyzer/ai.ts`)
- **الدمج**: Weighted formula combining all analyzers
- **المخرجات**: Combined Score, Market Bias, Confidence, Risk Level, Reasoning

## الاستخدام

### مثال أساسي

```typescript
import { analyzeMarket } from '@/ai-signals';
import { Candle } from '@/services/marketData/types';

const input = {
  symbol: 'BTCUSDT',
  timeframe: '5m',
  candles: candles, // Array of Candle objects
  sentimentData: {
    fear_greed_index: 65,
    funding_rate: -0.005
  }
};

const result = await analyzeMarket(input);

console.log(result.combined_score); // 0-100
console.log(result.bias); // 'BUY' | 'SELL' | 'WAIT'
console.log(result.ai_fusion.reasoning); // Array of reasoning strings
```

### استخدام UltraSignalAnalyzer Class

```typescript
import { UltraSignalAnalyzer } from '@/ai-signals';

const analyzer = new UltraSignalAnalyzer({
  min_candles: 100,
  fusion_weights: {
    technical: 0.30,
    volume: 0.25,
    pattern: 0.15,
    wave: 0.15,
    sentiment: 0.10,
    buy_pressure: 0.05,
    sell_pressure: 0.00
  }
});

const result = await analyzer.analyzeMarket(input);
```

### استخدام Analyzers منفصلة

```typescript
import { 
  analyzeTechnical,
  analyzeVolume,
  analyzePatterns,
  analyzeElliottWaves,
  analyzeSentimentSync,
  fuseAnalysis
} from '@/ai-signals';

// Technical analysis
const technical = analyzeTechnical(candles);

// Volume analysis
const volume = analyzeVolume({ candles });

// Pattern detection
const patterns = analyzePatterns(candles);

// Elliott Wave analysis
const elliott = analyzeElliottWaves(candles);

// Sentiment analysis
const sentiment = analyzeSentimentSync('BTCUSDT', {
  fear_greed_index: 65,
  funding_rate: -0.005
});

// Fuse all results
const fusion = fuseAnalysis(technical, volume, patterns, elliott, sentiment);
```

## النتيجة (AnalysisResult)

```typescript
{
  symbol: string;
  timeframe: Timeframe;
  timestamp: number;
  
  // Core metrics
  trend: 'UP' | 'DOWN' | 'SIDEWAYS';
  momentum: number; // 0-100
  volatility: number; // 0-100
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  bias: 'BUY' | 'SELL' | 'WAIT';
  
  // Individual scores
  technical_score: number; // 0-100
  volume_score: number; // 0-100
  pattern_score: number; // 0-100
  wave_score: number; // 0-100
  sentiment_score: number; // 0-100
  
  // Combined AI score
  combined_score: number; // 0-100
  
  // Detailed results
  technical: TechnicalAnalysisResult;
  volume: VolumeAnalysisResult;
  patterns: PatternAnalysisResult;
  elliott: ElliottWaveAnalysisResult;
  sentiment: SentimentAnalysisResult;
  ai_fusion: AIFusionResult;
}
```

## الإعدادات (Configuration)

```typescript
const config = {
  // Technical indicators
  rsi_period: 14,
  macd_fast: 12,
  macd_slow: 26,
  ema_periods: { short: 20, medium: 50, long: 200 },
  
  // Volume analysis
  volume_spike_threshold: 1.5,
  volume_lookback: 20,
  
  // Pattern detection
  pattern_min_confidence: 0.6,
  
  // Elliott Wave
  wave_min_swings: 5,
  
  // AI Fusion weights
  fusion_weights: {
    technical: 0.25,
    volume: 0.20,
    pattern: 0.15,
    wave: 0.15,
    sentiment: 0.10,
    buy_pressure: 0.10,
    sell_pressure: 0.05
  },
  
  // Minimum candles required
  min_candles: 50
};
```

## الاختبارات

```bash
npm test src/ai-signals/tests
```

## الملاحظات

- **Minimum Candles**: يتطلب النظام على الأقل 50 شمعة للتحليل الدقيق
- **Performance**: جميع الـ analyzers تعمل بشكل متوازي (parallel) لتحسين الأداء
- **Error Handling**: النظام يتحقق من صحة البيانات ويرمي أخطاء واضحة
- **Extensibility**: يمكن إضافة analyzers جديدة بسهولة

## المرحلة التالية

بعد إكمال Phase X.1، سيتم الانتقال إلى:
- **Phase X.2**: Signal Fusion Engine (دمج مع TradingView + النظام الحالي)
- **Phase X.3**: Real-Time Engine + Telegram + TTL
- **Phase X.4**: UI - Live Ultra Signals + History

