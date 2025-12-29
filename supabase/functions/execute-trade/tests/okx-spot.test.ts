/**
 * OKX Spot Integration Tests
 * 
 * Tests for OKX Spot trading execution
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { 
  TEST_CONFIG, 
  isTestEnvironmentConfigured,
  assertOrderResponse,
  sleep
} from './setup.ts';
import { executeTradeStrategy, TradeExecutionRequest } from '../trade-executor.ts';

Deno.test({
  name: 'OKX Spot - Get Symbol Info',
  ignore: !isTestEnvironmentConfigured(),
  async fn() {
    const okxPlatform = await import('../platforms/okx.ts');
    
    const credentials = {
      apiKey: TEST_CONFIG.OKX_TESTNET_API_KEY,
      secretKey: TEST_CONFIG.OKX_TESTNET_SECRET_KEY,
      passphrase: TEST_CONFIG.OKX_TESTNET_PASSPHRASE,
      testnet: true
    };
    
    const symbolRules = await okxPlatform.getOKXInstrumentInfo(
      credentials,
      TEST_CONFIG.TEST_SYMBOL,
      'spot'
    );
    
    assertExists(symbolRules);
    assertExists(symbolRules.quantityPrecision);
    assertExists(symbolRules.pricePrecision);
    
    console.log('OKX Spot symbol rules:', symbolRules);
  }
});

Deno.test({
  name: 'OKX Spot - Market Order Execution',
  ignore: !isTestEnvironmentConfigured(),
  async fn() {
    const request: TradeExecutionRequest = {
      platform: 'okx',
      symbol: TEST_CONFIG.TEST_SYMBOL,
      marketType: 'spot',
      orderType: 'market',
      entryPrice: TEST_CONFIG.TEST_ENTRY_PRICE,
      stopLossPrice: TEST_CONFIG.TEST_STOP_LOSS_PRICE,
      takeProfitPrice: TEST_CONFIG.TEST_TAKE_PROFIT_PRICE,
      initialAmount: TEST_CONFIG.MIN_AMOUNT,
      dcaLevels: [],
      leverage: 1,
      autoExecute: true,
      apiKey: TEST_CONFIG.OKX_TESTNET_API_KEY,
      secretKey: TEST_CONFIG.OKX_TESTNET_SECRET_KEY,
      passphrase: TEST_CONFIG.OKX_TESTNET_PASSPHRASE,
      testnet: true,
      userId: TEST_CONFIG.TEST_USER_ID
    };
    
    const result = await executeTradeStrategy(request);
    
    console.log('OKX Spot execution result:', result);
    
    assertEquals(result.success, true);
    assertExists(result.placedOrders);
    
    await sleep(2000);
  }
});

Deno.test({
  name: 'OKX Spot - Limit Order Execution',
  ignore: !isTestEnvironmentConfigured(),
  async fn() {
    const request: TradeExecutionRequest = {
      platform: 'okx',
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
      apiKey: TEST_CONFIG.OKX_TESTNET_API_KEY,
      secretKey: TEST_CONFIG.OKX_TESTNET_SECRET_KEY,
      passphrase: TEST_CONFIG.OKX_TESTNET_PASSPHRASE,
      testnet: true,
      userId: TEST_CONFIG.TEST_USER_ID
    };
    
    const result = await executeTradeStrategy(request);
    
    console.log('OKX Spot limit order result:', result);
    
    assertEquals(result.success, true);
    assertExists(result.placedOrders);
  }
});

Deno.test({
  name: 'OKX Spot - Error Handling',
  ignore: !isTestEnvironmentConfigured(),
  async fn() {
    const request: TradeExecutionRequest = {
      platform: 'okx',
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
      passphrase: 'invalid-passphrase',
      testnet: true,
      userId: TEST_CONFIG.TEST_USER_ID
    };
    
    const result = await executeTradeStrategy(request);
    
    console.log('OKX error handling result:', result);
    
    assertEquals(result.success, false);
    assertEquals(result.executionStatus, 'FAILED');
    assertExists(result.error);
  }
});


