/**
 * Slippage Model
 * 
 * Simulates slippage for backtesting (deterministic)
 * 
 * Phase 9: Backtesting Engine - Task 5
 */

/**
 * Slippage Configuration
 */
export interface SlippageConfig {
  /** Enable slippage simulation */
  enabled: boolean;
  /** Maximum slippage percentage (e.g., 0.1 for 0.1%) */
  maxPct: number;
}

/**
 * Simple deterministic random number generator (for consistent backtests)
 * Uses Linear Congruential Generator (LCG)
 */
class DeterministicRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  /**
   * Generate next random number between 0 and 1
   */
  next(): number {
    // LCG: (a * seed + c) mod m
    // Using constants from Numerical Recipes
    this.seed = (this.seed * 1664525 + 1013904223) % Math.pow(2, 32);
    return this.seed / Math.pow(2, 32);
  }
  
  /**
   * Generate random number in range [min, max]
   */
  nextRange(min: number, max: number): number {
    return min + (max - min) * this.next();
  }
}

/**
 * Apply slippage to price (deterministic)
 * 
 * @param price - Original price
 * @param side - Trade side ('buy' | 'sell')
 * @param slippageConfig - Slippage configuration
 * @param seed - Seed for deterministic randomness (based on timestamp or trade ID)
 * @returns Price with slippage applied
 */
export function applySlippage(
  price: number,
  side: 'buy' | 'sell',
  slippageConfig: SlippageConfig,
  seed: number
): number {
  if (!slippageConfig.enabled || slippageConfig.maxPct <= 0) {
    return price;
  }
  
  const random = new DeterministicRandom(seed);
  
  // Slippage is always adverse (worse price)
  // For buy: price increases (slippage adds to price)
  // For sell: price decreases (slippage subtracts from price)
  
  const slippagePct = random.nextRange(0, slippageConfig.maxPct);
  
  if (side === 'buy') {
    // Buy: adverse slippage means paying more
    return price * (1 + slippagePct / 100);
  } else {
    // Sell: adverse slippage means receiving less
    return price * (1 - slippagePct / 100);
  }
}

/**
 * Generate seed from timestamp and symbol
 * 
 * @param timestamp - Candle timestamp
 * @param symbol - Trading symbol
 * @returns Deterministic seed
 */
export function generateSeed(timestamp: number, symbol: string): number {
  // Create deterministic seed from timestamp and symbol
  let hash = 0;
  const str = `${timestamp}_${symbol}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Apply slippage to multiple prices (batch)
 * 
 * @param prices - Array of prices
 * @param sides - Array of trade sides
 * @param slippageConfig - Slippage configuration
 * @param timestamp - Timestamp for seed generation
 * @param symbol - Symbol for seed generation
 * @returns Array of prices with slippage applied
 */
export function applySlippageBatch(
  prices: number[],
  sides: ('buy' | 'sell')[],
  slippageConfig: SlippageConfig,
  timestamp: number,
  symbol: string
): number[] {
  if (!slippageConfig.enabled) {
    return prices;
  }
  
  return prices.map((price, index) => {
    const seed = generateSeed(timestamp + index, symbol);
    return applySlippage(price, sides[index], slippageConfig, seed);
  });
}

/**
 * Default slippage configuration
 */
export const DEFAULT_SLIPPAGE: SlippageConfig = {
  enabled: false, // Disabled by default
  maxPct: 0.1     // 0.1% max slippage if enabled
};

