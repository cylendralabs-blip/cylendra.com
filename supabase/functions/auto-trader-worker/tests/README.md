# Auto-Trader Worker Tests

## Overview

Unit and integration tests for the auto-trader-worker Edge Function.

## Test Structure

```
tests/
├── setup.ts              # Test utilities and configuration
├── signalFilters.test.ts # Signal filter logic tests
└── README.md             # This file
```

## Running Tests

### Run All Tests

```bash
deno test --allow-net --allow-env supabase/functions/auto-trader-worker/tests/
```

### Run Specific Test Suite

```bash
# Signal filters tests
deno test --allow-net --allow-env supabase/functions/auto-trader-worker/tests/signalFilters.test.ts
```

### Run Tests with Verbose Output

```bash
deno test --allow-net --allow-env --verbose supabase/functions/auto-trader-worker/tests/
```

## Test Coverage

### Signal Filters
- ✅ Bot enabled check
- ✅ Max concurrent trades
- ✅ Confidence score
- ✅ Trade direction

### Worker Integration (To be added)
- ⏳ Signal fetching
- ⏳ Status updates
- ⏳ Trade execution
- ⏳ Error handling

## Notes

1. **Test Environment:** Tests use test database credentials
2. **Cleanup:** Tests attempt to clean up created data
3. **Mocking:** Some tests use mocks for external dependencies

## Future Tests

- [ ] Worker integration tests
- [ ] End-to-end flow tests
- [ ] Performance tests
- [ ] Error handling tests

