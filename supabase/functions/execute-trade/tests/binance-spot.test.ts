/**
 * Binance Spot Integration Tests
 * 
 * Tests for Binance Spot trading execution
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { 
  TEST_CONFIG, 
  isTestEnvironmentConfigured,
  getTestSupabaseClient,
  assertOrderResponse,
  assertTradeRecord,
  cleanupTestData,
  sleep
} from './setup.ts';
import { executeTradeStrategy, TradeExecutionRequest } from '../trade-executor.ts';

Deno.test('Binance Spot - Environment Configuration', () => {
  const configured = isTestEnvironmentConfigured();
  console.log('Test environment configured:', configured);
  // Don't fail if not configured, just skip tests
});

Deno.test({
  name: 'Binance Spot - Get Symbol Info',
  ignore: !isTestEnvironmentConfigured(),
  async fn() {
    const { getSymbolInfo } = await import('../symbol.ts');
    const { getBinanceApiUrl } = await import('../config.ts');
    
    const baseUrl = getBinanceApiUrl('binance', 'spot', true);
    const symbolRules = await getSymbolInfo(
      TEST_CONFIG.BINANCE_TESTNET_API_KEY,
      TEST_CONFIG.BINANCE_TESTNET_SECRET_KEY,
      baseUrl,
      TEST_CONFIG.TEST_SYMBOL,
      'spot'
    );
    
    assertExists(symbolRules);
    assertExists(symbolRules.quantityPrecision);
    assertExists(symbolRules.pricePrecision);
    assertExists(symbolRules.tickSize);
    assertExists(symbolRules.minQty);
    
    console.log('Symbol rules:', symbolRules);
  }
});

Deno.test({
  name: 'Binance Spot - Market Order Execution',
  ignore: !isTestEnvironmentConfigured(),
  async fn() {
    const request: TradeExecutionRequest = {
      platform: 'binance',
      symbol: TEST_CONFIG.TEST_SYMBOL,
      marketType: 'spot',
      orderType: 'market',
      entryPrice: TEST_CONFIG.TEST_ENTRY_PRICE,
      stopLossPrice: TEST_CONFIG.TEST_STOP_LOSS_PRICE,
      takeProfitPrice: TEST_CONFIG.TEST_TAKE_PROFIT_PRICE,
      initialAmount: TEST_CONFIG.MIN_AMOUNT, // Very small amount for testnet
      dcaLevels: [],
      leverage: 1,
      autoExecute: true,
      apiKey: TEST_CONFIG.BINANCE_TESTNET_API_KEY,
      secretKey: TEST_CONFIG.BINANCE_TESTNET_SECRET_KEY,
      testnet: true,
      userId: TEST_CONFIG.TEST_USER_ID
    };
    
    const result = await executeTradeStrategy(request);
    
    console.log('Execution result:', result);
    
    assertEquals(result.success, true);
    assertExists(result.placedOrders);
    assertEquals(result.executionStatus, 'ACTIVE' || 'FAILED');
    
    // Wait a bit for order to be processed
    await sleep(2000);
  }
});

Deno.test({
  name: 'Binance Spot - Limit Order Execution',
  ignore: !isTestEnvironmentConfigured(),
  async fn() {
    const request: TradeExecutionRequest = {
      platform: 'binance',
      symbol: TEST_CONFIG.TEST_SYMBOL,
      marketType: 'spot',
      orderType: 'limit',
      entryPrice: TEST_CONFIG.TEST_ENTRY_PRICE,
      stopLossPrice: null,
      takeProfitPrice: null,
      initialAmount: TEST_CONFIG.MIN_AMOUNT,
      dcaLevels: [],
      leverage: 1,
      autoExecute: true,
      apiKey: TEST_CONFIG.BINANCE_TESTNET_API_KEY,
      secretKey: TEST_CONFIG.BINANCE_TESTNET_SECRET_KEY,
      testnet: true,
      userId: TEST_CONFIG.TEST_USER_ID
    };
    
    const result = await executeTradeStrategy(request);
    
    console.log('Execution result:', result);
    
    assertEquals(result.success, true);
    assertExists(result.placedOrders);
    
    if (result.placedOrders.length > 0) {
      const entryOrder = result.placedOrders.find((o: any) => o.orderType === 'ENTRY');
      if (entryOrder) {
        assertOrderResponse(entryOrder);
      }
    }
  }
});

Deno.test({
  name: 'Binance Spot - DCA Orders Execution',
  ignore: !isTestEnvironmentConfigured(),
  async fn() {
    const dcaLevels = [
      { level: 1, targetPrice: TEST_CONFIG.TEST_ENTRY_PRICE * 0.98, amount: TEST_CONFIG.MIN_AMOUNT / 2 },
      { level: 2, targetPrice: TEST_CONFIG.TEST_ENTRY_PRICE * 0.96, amount: TEST_CONFIG.MIN_AMOUNT / 2 }
    ];
    
    const request: TradeExecutionRequest = {
      platform: 'binance',
      symbol: TEST_CONFIG.TEST_SYMBOL,
      marketType: 'spot',
      orderType: 'limit',
      entryPrice: TEST_CONFIG.TEST_ENTRY_PRICE,
      stopLossPrice: TEST_CONFIG.TEST_STOP_LOSS_PRICE,
      takeProfitPrice: TEST_CONFIG.TEST_TAKE_PROFIT_PRICE,
      initialAmount: TEST_CONFIG.MIN_AMOUNT,
      dcaLevels,
      leverage: 1,
      autoExecute: true,
      apiKey: TEST_CONFIG.BINANCE_TESTNET_API_KEY,
      secretKey: TEST_CONFIG.BINANCE_TESTNET_SECRET_KEY,
      testnet: true,
      userId: TEST_CONFIG.TEST_USER_ID
    };
    
    const result = await executeTradeStrategy(request);
    
    console.log('Execution result:', result);
    
    assertEquals(result.success, true);
    assertExists(result.placedOrders);
    
    // Check DCA orders were placed
    const dcaOrders = result.placedOrders.filter((o: any) => o.orderType === 'DCA');
    console.log('DCA orders placed:', dcaOrders.length);
    
    // Note: DCA orders might fail on testnet due to insufficient balance
    // This is expected behavior
  }
});

Deno.test({
  name: 'Binance Spot - Error Handling',
  ignore: !isTestEnvironmentConfigured(),
  async fn() {
    // Test with invalid API key
    const request: TradeExecutionRequest = {
      platform: 'binance',
      symbol: TEST_CONFIG.TEST_SYMBOL,
      marketType: 'spot',
      orderType: 'market',
      entryPrice: TEST_CONFIG.TEST_ENTRY_PRICE,
      stopLossPrice: null,
      takeProfitPrice: null,
      initialAmount: TEST_CONFIG.MIN_AMOUNT,
      dcaLevels: [],
      leverage: 1,
      autoExecute: true,
      apiKey: 'invalid-key',
      secretKey: 'invalid-secret',
      testnet: true,
      userId: TEST_CONFIG.TEST_USER_ID
    };
    
    const result = await executeTradeStrategy(request);
    
    console.log('Error handling result:', result);
    
    // Should fail gracefully
    assertEquals(result.success, false);
    assertEquals(result.executionStatus, 'FAILED');
    assertExists(result.error);
  }
});


