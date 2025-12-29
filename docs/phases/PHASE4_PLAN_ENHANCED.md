# Phase 4 - Strategy Engine Plan (Enhanced)

## 🎯 Goals

Build real strategy engine that generates signals from live market data (no mock/random data).

## 📊 Current State Analysis

### ✅ What Exists:
1. **Technical Indicators** - `src/utils/technicalIndicators.ts`
   - TechnicalIndicatorsEngine: RSI, MACD, Bollinger Bands, Stochastic, Williams R, CCI, ADX
   - CandlestickPatternDetector
   
2. **Market Data**:
   - `supabase/functions/get-live-prices` - Fetches current prices (ticker only)
   - `src/hooks/useRealTimePrices` - Real-time price updates (ticker)
   - Binance client structure exists (`src/services/exchange/binance/`)
   - ❌ **Missing**: Candles/Historical data API
   
3. **Watchlist**:
   - `price_watchlist` table exists
   - `useWatchlist` hook available
   
4. **Auto-Trader Worker**:
   - Reads from `tradingview_signals` table
   - Supports any `source` value (including `internal_engine`)
   - Already compatible! ✅

5. **Strategies**:
   - Base structure exists (`src/services/strategies/`)
   - DCAStrategyService, GridStrategyService (stubs)

### 🔧 Integration Points:
- Use existing `tradingview_signals` table (add `source='internal_engine'`)
- Move `TechnicalIndicatorsEngine` to `src/core/engines/`
- Extend Binance API to fetch candles
- Create OKX market data feed
- Strategy writes to same table auto-trader reads from

---

## 📋 Tasks (9 tasks)

### Task 1: Market Data Layer 🔄
**Status:** In Progress

**Files to Create:**
- `src/services/marketData/types.ts` - Unified types
- `src/services/marketData/binanceFeed.ts` - Binance market data (candles, ticker)
- `src/services/marketData/okxFeed.ts` - OKX market data
- `src/services/marketData/marketDataRouter.ts` - Router for exchanges
- `supabase/functions/get-candles/index.ts` - Edge Function for candles

**Required Functions:**
- `getCandles(symbol, timeframe, limit)` - Historical candles
- `getTicker(symbol)` - Current price
- `normalizeCandles()` - Unified candle format

**Note:** Use Binance Public API (no auth needed for candles)

---

### Task 2: Strategy Interface
**Status:** Pending

**Files:**
- `src/strategies/Strategy.ts` - Base interface
- `src/strategies/StrategyContext.ts` - Context type

**Interface:**
```typescript
export interface Strategy {
  id: string;
  name: string;
  supportsMarket: ('spot' | 'futures')[];
  timeframes: string[];
  init?(ctx: StrategyContext): Promise<void>;
  generateSignal(ctx: StrategyContext): Promise<Signal | null>;
  onPositionOpen?(pos: Position, ctx: StrategyContext): Promise<void>;
  onPositionClose?(pos: Position, ctx: StrategyContext): Promise<void>;
}

export interface StrategyContext {
  symbol: string;
  timeframe: string;
  candles: Candle[];
  indicators: TechnicalIndicatorData;
  botSettings: BotSettings;
  lastSignals: Signal[];
  portfolioSnapshot?: any;
  riskSnapshot?: any;
}
```

---

### Task 3: Indicator Engine
**Status:** Pending

**Files:**
- Move `src/utils/technicalIndicators.ts` → `src/core/engines/indicatorEngine.ts`
- Enhance with unified interface
- Keep backward compatibility

---

### Task 4: Strategy Runner Worker
**Status:** Pending

**Files:**
- `supabase/functions/strategy-runner-worker/index.ts`
- `supabase/functions/strategy-runner-worker/config.ts`
- `supabase/functions/strategy-runner-worker/signalGenerator.ts`

**Functionality:**
- Scheduled Edge Function
- Different intervals per timeframe (1m, 5m, 15m, 1h, 4h, 1d)
- Fetches candles from market data layer
- Calculates indicators
- Runs strategy.generateSignal()
- Writes signals to `tradingview_signals` with `source='internal_engine'`

---

### Task 5: Main Strategy Implementation
**Status:** Pending

**Files:**
- `src/strategies/mainStrategy.ts` - Production strategy

**Requirements:**
- Uses real indicators (RSI, MACD, Bollinger Bands)
- No random/mock data
- Real candles only
- Returns confidence score (0-100)

---

### Task 6: Signal Scoring & Confidence
**Status:** Pending

**Files:**
- `src/services/signals/signalScoring.ts`

**Features:**
- Confidence calculation based on indicators
- Risk level assessment
- Signal strength rating

---

### Task 7: Safety Guards
**Status:** Pending

**Files:**
- `src/services/signals/safetyGuards.ts` (extend existing filters)

**Guards:**
- Signal cooldown (per symbol)
- Market type compatibility
- Volatility guard (ATR-based)

---

### Task 8: Auto-Trader Integration
**Status:** ✅ Already Compatible!

**Notes:**
- Auto-trader reads from `tradingview_signals` table
- Already supports `source='internal_engine'`
- No changes needed! ✅

---

### Task 9: Tests
**Status:** Pending

**Files:**
- `supabase/functions/strategy-runner-worker/tests/`
- Unit tests for strategies
- Integration tests

---

## 🗂️ File Structure

```
src/
  ├── services/
  │   ├── marketData/
  │   │   ├── types.ts
  │   │   ├── binanceFeed.ts
  │   │   ├── okxFeed.ts
  │   │   └── marketDataRouter.ts
  │   └── signals/
  │       ├── signalScoring.ts
  │       └── safetyGuards.ts (extend existing)
  │
  ├── strategies/
  │   ├── Strategy.ts              # Base interface
  │   ├── StrategyContext.ts       # Context type
  │   └── mainStrategy.ts          # Production strategy
  │
  └── core/
      └── engines/
          ├── indicatorEngine.ts   # Moved from utils
          └── [existing...]

supabase/functions/
  ├── get-candles/
  │   └── index.ts                 # New: Fetch candles
  └── strategy-runner-worker/
      ├── index.ts
      ├── config.ts
      └── signalGenerator.ts
```

---

## 🚀 Implementation Order

1. **Task 1:** Market Data Layer (candles API)
2. **Task 3:** Indicator Engine (move & enhance)
3. **Task 2:** Strategy Interface (foundation)
4. **Task 6:** Signal Scoring (needed by strategy)
5. **Task 5:** Main Strategy (uses above)
6. **Task 7:** Safety Guards (protect)
7. **Task 4:** Strategy Runner Worker (orchestrate)
8. **Task 8:** Integration (verify - already done!)
9. **Task 9:** Tests

---

## ✅ Success Criteria

- [ ] Can fetch real candles from Binance/OKX
- [ ] Strategy generates signals from real indicators
- [ ] No random/mock data in production
- [ ] Signals written to database
- [ ] Auto-trader processes internal signals
- [ ] All safety guards active
- [ ] Tests pass

---

**Ready to implement!** 🚀

