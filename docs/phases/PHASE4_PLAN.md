# Phase 4 - Strategy Engine Plan

## 🎯 Goals

Build real strategy engine that generates signals from live market data without any mock or random data.

## 📊 Current State Analysis

### ✅ Existing Components:
1. **Technical Indicators** - `src/utils/technicalIndicators.ts` (TechnicalIndicatorsEngine)
   - RSI, MACD, Bollinger Bands, Stochastic, Williams R, CCI, ADX
   - Candlestick pattern detection
   
2. **Market Data**:
   - `supabase/functions/get-live-prices` - Fetches current prices from Binance
   - `src/hooks/useRealTimePrices` - Real-time price updates
   - `src/services/exchange/binance/` - Binance client structure exists
   
3. **Strategies**:
   - `src/services/strategies/StrategyService.ts` - Base service (limited)
   - `src/services/strategies/DCAStrategyService.ts` - DCA strategy (stub)
   - `src/services/strategies/GridStrategyService.ts` - Grid strategy (stub)
   
4. **Auto-Trader Worker**:
   - Reads from `tradingview_signals` table
   - Filters signals with `execution_status='PENDING'`
   - Already supports `source='tradingview'` and can support `source='internal_engine'`

### 🔧 Integration Points:
- Use existing `tradingview_signals` table for signals (add `source='internal_engine'`)
- Use existing `TechnicalIndicatorsEngine` but move to `src/core/engines/`
- Extend Binance client to support candles/historical data
- Create OKX market data feed
- Strategy runner should write signals compatible with auto-trader worker

---

## 📋 Tasks (9 tasks)

### Task 1: Market Data Layer ✅
**Status:** Partially exists, needs enhancement

**Files to Create/Update:**
- `src/services/marketData/binanceFeed.ts`
- `src/services/marketData/okxFeed.ts`
- `src/services/marketData/marketDataRouter.ts`
- `src/services/marketData/types.ts`

**Required Functions:**
- `getCandles(symbol, timeframe, limit)` - Historical candles
- `getTicker(symbol)` - Current price
- `subscribePriceStream(symbols[], cb)` - WebSocket (future)
- `normalizeCandles()` - Unified candle format

### Task 2: Strategy Interface
**Status:** Need to create

**Files:**
- `src/strategies/Strategy.ts` - Base strategy interface
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
```

### Task 3: Indicator Engine
**Status:** Exists, needs to move

**Files:**
- Move `src/utils/technicalIndicators.ts` → `src/core/engines/indicatorEngine.ts`
- Enhance with more indicators
- Add unified indicator interface

### Task 4: Strategy Runner Worker
**Status:** Need to create

**Files:**
- `supabase/functions/strategy-runner-worker/index.ts`
- `supabase/functions/strategy-runner-worker/config.ts`
- `supabase/functions/strategy-runner-worker/signalGenerator.ts`

**Functionality:**
- Scheduled Edge Function (different intervals per timeframe)
- Fetches market data
- Calculates indicators
- Runs strategy.generateSignal()
- Writes signals to `tradingview_signals` table with `source='internal_engine'`

### Task 5: Main Strategy Implementation
**Status:** Need to create

**Files:**
- `src/strategies/mainStrategy.ts` - Production strategy
- Uses real indicators and market data
- No random/mock data

### Task 6: Signal Scoring & Confidence
**Status:** Need to implement

**Files:**
- `src/services/signals/signalScoring.ts`
- Calculate confidence score (0-100)
- Risk level assessment

### Task 7: Safety Guards
**Status:** Need to implement

**Files:**
- `src/services/signals/safetyGuards.ts`
- Signal cooldown
- Market type compatibility
- Volatility guard

### Task 8: Auto-Trader Integration
**Status:** Already compatible!

**Notes:**
- Auto-trader reads from `tradingview_signals` table
- Already supports any `source` value
- Signals with `source='internal_engine'` will be processed automatically

### Task 9: Tests
**Status:** Need to create

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
  │   │   ├── binanceFeed.ts
  │   │   ├── okxFeed.ts
  │   │   ├── marketDataRouter.ts
  │   │   └── types.ts
  │   └── signals/
  │       ├── signalScoring.ts
  │       └── safetyGuards.ts
  │
  ├── strategies/
  │   ├── Strategy.ts              # Base interface
  │   ├── StrategyContext.ts       # Context type
  │   ├── mainStrategy.ts          # Production strategy
  │   └── [future strategies...]
  │
  └── core/
      └── engines/
          ├── indicatorEngine.ts   # Moved from utils
          └── [existing engines...]

supabase/functions/
  └── strategy-runner-worker/
      ├── index.ts
      ├── config.ts
      ├── signalGenerator.ts
      └── tests/
```

---

## 🚀 Implementation Order

1. Task 3: Indicator Engine (move & enhance existing)
2. Task 1: Market Data Layer (build on existing get-live-prices)
3. Task 2: Strategy Interface (foundation)
4. Task 6: Signal Scoring (needed by strategy)
5. Task 5: Main Strategy (uses above)
6. Task 7: Safety Guards (protect strategy)
7. Task 4: Strategy Runner Worker (orchestrates everything)
8. Task 8: Integration (verify auto-trader compatibility)
9. Task 9: Tests (validate everything)

---

## ✅ Success Criteria

- [ ] Real market data fetched from exchanges
- [ ] Strategy generates signals from real indicators
- [ ] No random/mock data in production
- [ ] Signals written to database
- [ ] Auto-trader processes internal signals
- [ ] All safety guards active
- [ ] Tests pass

---

**Ready to start implementation!** 🚀

