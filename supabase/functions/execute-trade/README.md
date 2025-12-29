# Execute Trade Edge Function

## Structure

This function is split into small, focused modules:

- **config.ts** (~50 lines) - Configuration constants
- **utils.ts** (~80 lines) - Utility functions
- **symbol.ts** (~150 lines) - Symbol information operations
- **orders.ts** (~200 lines) - Order placement operations
- **leverage.ts** (~60 lines) - Leverage operations
- **entry-order.ts** (~60 lines) - Entry order placement
- **dca-orders.ts** (~100 lines) - DCA orders placement
- **sl-tp-orders.ts** (~120 lines) - Stop Loss / Take Profit orders
- **database.ts** (~120 lines) - Database operations
- **trade-executor.ts** (~180 lines) - Main trade execution orchestration
- **index.ts** (~150 lines) - Edge function entry point

**Total:** ~1270 lines split across 11 files (average ~115 lines per file)

---

## Flow

1. **index.ts** - Receives request, authenticates user, gets API key
2. **trade-executor.ts** - Orchestrates the execution flow
3. Individual modules handle specific operations:
   - Entry order placement
   - DCA orders placement
   - SL/TP orders placement
   - Database operations

---

## Usage

All code is in English. Modules are small and focused.


