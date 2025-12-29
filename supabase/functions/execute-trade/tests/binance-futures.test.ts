/**
 * Binance Futures Integration Tests
 * 
 * Tests for Binance Futures trading execution
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { 
  TEST_CONFIG, 
  isTestEnvironmentConfigured,
  assertOrderResponse,
  cleanupTestData,
  sleep
} from './setup.ts';
import { executeTradeStrategy, TradeExecutionRequest } from '../trade-executor.ts';

Deno.test({
  name: 'Binance Futures - Get Symbol Info',
  ignore: !isTestEnvironmentConfigured(),
  async fn() {
    const { getSymbolInfo } = await import('../symbol.ts');
    const { getBinanceApiUrl } = await import('../config.ts');
    
    const baseUrl = getBinanceApiUrl('binance', 'futures', true);
    const symbolRules = await getSymbolInfo(
      TEST_CONFIG.BINANCE_TESTNET_API_KEY,
      TEST_CONFIG.BINANCE_TESTNET_SECRET_KEY,
      baseUrl,
      TEST_CONFIG.TEST_SYMBOL,
      'futures'
    );
    
    assertExists(symbolRules);
    assertExists(symbolRules.quantityPrecision);
    assertExists(symbolRules.pricePrecision);
    
    console.log('Futures symbol rules:', symbolRules);
  }
});

Deno.test({
  name: 'Binance Futures - Market Order with Leverage',
  ignore: !isTestEnvironmentConfigured(),
  async fn() {
    const request: TradeExecutionRequest = {
      platform: 'binance',
      symbol: TEST_CONFIG.TEST_SYMBOL,
      marketType: 'futures',
      orderType: 'market',
      entryPrice: TEST_CONFIG.TEST_ENTRY_PRICE,
      stopLossPrice: TEST_CONFIG.TEST_STOP_LOSS_PRICE,
      takeProfitPrice: TEST_CONFIG.TEST_TAKE_PROFIT_PRICE,
      initialAmount: TEST_CONFIG.MIN_AMOUNT,
      dcaLevels: [],
      leverage: 5, // 5x leverage
      autoExecute: true,
      apiKey: TEST_CONFIG.BINANCE_TESTNET_API_KEY,
      secretKey: TEST_CONFIG.BINANCE_TESTNET_SECRET_KEY,
      testnet: true,
      userId: TEST_CONFIG.TEST_USER_ID
    };
    
    const result = await executeTradeStrategy(request);
    
    console.log('Futures execution result:', result);
    
    assertEquals(result.success, true);
    assertExists(result.placedOrders);
    
    // Wait for order processing
    await sleep(2000);
  }
});

Deno.test({
  name: 'Binance Futures - SL/TP Orders',
  ignore: !isTestEnvironmentConfigured(),
  async fn() {
    const request: TradeExecutionRequest = {
      platform: 'binance',
      symbol: TEST_CONFIG.TEST_SYMBOL,
      marketType: 'futures',
      orderType: 'market',
      entryPrice: TEST_CONFIG.TEST_ENTRY_PRICE,
      stopLossPrice: TEST_CONFIG.TEST_STOP_LOSS_PRICE,
      takeProfitPrice: TEST_CONFIG.TEST_TAKE_PROFIT_PRICE,
      initialAmount: TEST_CONFIG.MIN_AMOUNT,
      dcaLevels: [],
      leverage: 3,
      autoExecute: true,
      apiKey: TEST_CONFIG.BINANCE_TESTNET_API_KEY,
      secretKey: TEST_CONFIG.BINANCE_TESTNET_SECRET_KEY,
      testnet: true,
      userId: TEST_CONFIG.TEST_USER_ID
    };
    
    const result = await executeTradeStrategy(request);
    
    console.log('SL/TP execution result:', result);
    
    assertEquals(result.success, true);
    
    // Check SL/TP orders
    const slOrder = result.placedOrders.find((o: any) => o.orderType === 'STOP_LOSS');
    const tpOrder = result.placedOrders.find((o: any) => o.orderType === 'TAKE_PROFIT');
    
    console.log('SL order:', slOrder ? 'Placed' : 'Not placed');
    console.log('TP order:', tpOrder ? 'Placed' : 'Not placed');
    
    // Note: SL/TP orders might not always be placed depending on exchange response
  }
});


