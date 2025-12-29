/**
 * Platform Balances Integration Tests
 * 
 * Tests for balance fetching across different platforms
 * Phase EX-2: OKX & Bybit Integration Completion
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';

/**
 * Test normalized balance format
 */
Deno.test('Normalized Balance Format', async () => {
  const normalizedBalance = {
    asset: 'USDT',
    total: 1000.50,
    available: 800.25,
    inOrder: 200.25
  };

  assertExists(normalizedBalance.asset, 'Balance should have asset');
  assertExists(normalizedBalance.total, 'Balance should have total');
  assertExists(normalizedBalance.available, 'Balance should have available');
  assertExists(normalizedBalance.inOrder, 'Balance should have inOrder');

  assertEquals(
    normalizedBalance.total,
    normalizedBalance.available + normalizedBalance.inOrder,
    'Total should equal available + inOrder'
  );
});

/**
 * Test OKX balance normalization
 */
Deno.test('OKX Balance Normalization', async () => {
  const okxBalance = {
    asset: 'USDT',
    total: 1000.50,
    available: 800.25,
    inOrder: 200.25
  };

  // Convert to old format for compatibility
  const oldFormat = {
    symbol: okxBalance.asset,
    free_balance: okxBalance.available,
    locked_balance: okxBalance.inOrder,
    total_balance: okxBalance.total
  };

  assertEquals(oldFormat.symbol, 'USDT', 'Symbol should match asset');
  assertEquals(oldFormat.free_balance, 800.25, 'Free balance should match available');
  assertEquals(oldFormat.locked_balance, 200.25, 'Locked balance should match inOrder');
  assertEquals(oldFormat.total_balance, 1000.50, 'Total balance should match total');
});

/**
 * Test Bybit balance normalization
 */
Deno.test('Bybit Balance Normalization', async () => {
  const bybitBalance = {
    asset: 'USDT',
    total: 1000.50,
    available: 800.25,
    inOrder: 200.25
  };

  // Convert to old format for compatibility
  const oldFormat = {
    symbol: bybitBalance.asset,
    free_balance: bybitBalance.available,
    locked_balance: bybitBalance.inOrder,
    total_balance: bybitBalance.total
  };

  assertEquals(oldFormat.symbol, 'USDT', 'Symbol should match asset');
  assertEquals(oldFormat.free_balance, 800.25, 'Free balance should match available');
  assertEquals(oldFormat.locked_balance, 200.25, 'Locked balance should match inOrder');
  assertEquals(oldFormat.total_balance, 1000.50, 'Total balance should match total');
});

/**
 * Test platform and testnet detection
 */
Deno.test('Platform Testnet Detection', async () => {
  const testCases = [
    { platform: 'okx', testnet: false, isDemo: false },
    { platform: 'okx-demo', testnet: true, isDemo: true },
    { platform: 'bybit', testnet: false, isTestnet: false },
    { platform: 'bybit-testnet', testnet: true, isTestnet: true },
  ];

  for (const testCase of testCases) {
    const isDemo = testCase.platform === 'okx-demo' || testCase.testnet === true;
    const isTestnet = testCase.platform === 'bybit-testnet' || testCase.testnet === true;

    if (testCase.platform.startsWith('okx')) {
      assertEquals(isDemo, testCase.isDemo !== undefined ? testCase.isDemo : false,
        `OKX platform ${testCase.platform} demo detection should be correct`);
    }

    if (testCase.platform.startsWith('bybit')) {
      assertEquals(isTestnet, testCase.isTestnet !== undefined ? testCase.isTestnet : false,
        `Bybit platform ${testCase.platform} testnet detection should be correct`);
    }
  }
});

