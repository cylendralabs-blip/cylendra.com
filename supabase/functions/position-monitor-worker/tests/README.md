# Position Monitor Worker Tests

## Overview

Tests for the Position Monitor Worker Edge Function.

## Test Structure

- **Unit Tests**: Test individual functions in isolation
- **Integration Tests**: Test complete position lifecycle

## Running Tests

### Prerequisites
- Deno installed
- Supabase project linked

### Run Tests
```bash
cd supabase/functions/position-monitor-worker
deno test --allow-net --allow-env
```

## Test Coverage

- ✅ Position processing
- ✅ PnL calculation
- ✅ TP/SL/DCA monitoring
- ✅ Auto-close rules
- ✅ Order sync
- ✅ Database updates
- ✅ Event logging

## Note

These tests require:
- Mock Supabase client
- Mock exchange API responses
- Test fixtures for positions and orders

---

**Phase 6: Position Manager - Task 11: Tests**

