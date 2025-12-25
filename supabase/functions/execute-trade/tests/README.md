# Execute Trade Integration Tests

## Overview

Integration tests for the execute-trade Edge Function covering all platforms and scenarios.

## Test Structure

```
tests/
├── setup.ts              # Test utilities and configuration
├── binance-spot.test.ts  # Binance Spot tests
├── binance-futures.test.ts # Binance Futures tests
├── okx-spot.test.ts      # OKX Spot tests
├── okx-futures.test.ts   # OKX Futures tests
├── idempotency.test.ts   # Idempotency tests
├── retry.test.ts         # Retry logic tests
└── README.md             # This file
```

## Setup

### Environment Variables

Set the following environment variables before running tests:

```bash
# Binance Testnet
export BINANCE_TESTNET_API_KEY="your-binance-testnet-api-key"
export BINANCE_TESTNET_SECRET_KEY="your-binance-testnet-secret-key"

# OKX Testnet
export OKX_TESTNET_API_KEY="your-okx-testnet-api-key"
export OKX_TESTNET_SECRET_KEY="your-okx-testnet-secret-key"
export OKX_TESTNET_PASSPHRASE="your-okx-passphrase"

# Supabase
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Testnet Accounts

1. **Binance Testnet:**
   - Sign up at: https://testnet.binancefuture.com/
   - Get testnet API keys
   - Add test funds

2. **OKX Testnet:**
   - Sign up at: https://www.okx.com/
   - Enable Demo Trading mode
   - Get API keys with passphrase

## Running Tests

### Run All Tests

```bash
deno test --allow-net --allow-env supabase/functions/execute-trade/tests/
```

### Run Specific Test Suite

```bash
# Binance Spot tests
deno test --allow-net --allow-env supabase/functions/execute-trade/tests/binance-spot.test.ts

# OKX tests
deno test --allow-net --allow-env supabase/functions/execute-trade/tests/okx-spot.test.ts

# Idempotency tests
deno test --allow-net --allow-env supabase/functions/execute-trade/tests/idempotency.test.ts
```

### Run Tests with Verbose Output

```bash
deno test --allow-net --allow-env --verbose supabase/functions/execute-trade/tests/
```

## Test Coverage

### Binance Spot
- ✅ Symbol info retrieval
- ✅ Market order execution
- ✅ Limit order execution
- ✅ DCA orders
- ✅ Error handling

### Binance Futures
- ✅ Symbol info retrieval
- ✅ Market order with leverage
- ✅ SL/TP orders

### OKX Spot
- ✅ Symbol info retrieval
- ✅ Market order execution
- ✅ Limit order execution
- ✅ Error handling

### OKX Futures
- ✅ (To be implemented)

### Idempotency
- ✅ Client order ID generation
- ✅ Duplicate order detection

### Retry Logic
- ✅ Retryable error detection
- ✅ Exponential backoff
- ✅ Retry exhaustion

## Notes

1. **Test Amounts:** All tests use very small amounts (`MIN_AMOUNT = $5`) suitable for testnet
2. **Cleanup:** Tests attempt to clean up created orders, but manual cleanup may be needed
3. **Rate Limits:** Tests include delays to respect exchange rate limits
4. **Testnet Only:** All tests use testnet credentials - never use real API keys in tests

## Troubleshooting

### Tests Skipped
- Check if environment variables are set
- Verify testnet API keys are valid
- Ensure testnet accounts have funds

### Order Failures
- Check testnet balance
- Verify symbol exists on testnet
- Check minimum order requirements

### Connection Errors
- Verify internet connection
- Check exchange API status
- Verify Supabase connection

## Future Tests

- [ ] Order lifecycle tracking tests
- [ ] Partial fill handling tests
- [ ] Database integration tests
- [ ] End-to-end trade flow tests
- [ ] Performance tests


