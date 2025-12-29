/**
 * Elliott Wave Analyzer
 * 
 * Detects Elliott Wave patterns:
 * - Impulse Waves (1-2-3-4-5)
 * - Corrective Waves (A-B-C)
 * - Fibonacci retracements
 * 
 * Phase X.1: AI Multi-Factor Analyzer
 */

import { Candle } from '@/services/marketData/types';
import type { ElliottWaveAnalysisResult, AnalyzerConfig } from '../types';

/**
 * Wave Point
 */
interface WavePoint {
  index: number;
  price: number;
  type: 'HIGH' | 'LOW';
}

/**
 * Wave Structure
 */
interface WaveStructure {
  wave1?: { start: number; end: number; price: number };
  wave2?: { start: number; end: number; price: number };
  wave3?: { start: number; end: number; price: number };
  wave4?: { start: number; end: number; price: number };
  wave5?: { start: number; end: number; price: number };
}

/**
 * Find significant swing points for wave analysis
 */
function findWavePoints(candles: Candle[], minSwingPercent: number = 1.0): WavePoint[] {
  if (candles.length < 10) return [];

  const points: WavePoint[] = [];
  const lookback = Math.max(3, Math.floor(candles.length / 20));

  for (let i = lookback; i < candles.length - lookback; i++) {
    const currentHigh = candles[i].high;
    const currentLow = candles[i].low;
    const avgPrice = (candles[i].high + candles[i].low) / 2;

    // Check for local high
    let isLocalHigh = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && candles[j].high >= currentHigh) {
        isLocalHigh = false;
        break;
      }
    }

    // Check for local low
    let isLocalLow = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && candles[j].low <= currentLow) {
        isLocalLow = false;
        break;
      }
    }

    if (isLocalHigh) {
      const swingPercent = points.length > 0
        ? Math.abs((currentHigh - points[points.length - 1].price) / points[points.length - 1].price) * 100
        : 100;

      if (swingPercent >= minSwingPercent) {
        points.push({ index: i, price: currentHigh, type: 'HIGH' });
      }
    }

    if (isLocalLow) {
      const swingPercent = points.length > 0
        ? Math.abs((currentLow - points[points.length - 1].price) / points[points.length - 1].price) * 100
        : 100;

      if (swingPercent >= minSwingPercent) {
        points.push({ index: i, price: currentLow, type: 'LOW' });
      }
    }
  }

  return points;
}

/**
 * Calculate Fibonacci retracement levels
 */
function calculateFibonacciLevels(
  high: number,
  low: number
): {
  retracement_382: number;
  retracement_500: number;
  retracement_618: number;
} {
  const range = high - low;

  return {
    retracement_382: high - (range * 0.382),
    retracement_500: high - (range * 0.500),
    retracement_618: high - (range * 0.618)
  };
}

/**
 * Detect Impulse Wave (1-2-3-4-5)
 */
function detectImpulseWave(
  points: WavePoint[],
  candles: Candle[]
): { wave: string; phase: 'IMPULSE'; structure: WaveStructure; confidence: number } | null {
  if (points.length < 5) return null;

  // Look for 5-wave pattern: up-down-up-down-up (or reverse)
  const recentPoints = points.slice(-10);

  // Try to identify 5 waves
  // Wave 1: First move
  // Wave 2: Retracement (typically 38.2% - 61.8% of Wave 1)
  // Wave 3: Strongest move (typically 161.8% of Wave 1)
  // Wave 4: Retracement (typically 23.6% - 38.2% of Wave 3)
  // Wave 5: Final move (typically 61.8% - 100% of Wave 1)

  // Simplified detection: look for alternating swings
  let waveCount = 0;
  const structure: WaveStructure = {};

  for (let i = 0; i < recentPoints.length - 4; i++) {
    const p1 = recentPoints[i];
    const p2 = recentPoints[i + 1];
    const p3 = recentPoints[i + 2];
    const p4 = recentPoints[i + 3];
    const p5 = recentPoints[i + 4];

    // Check if they alternate (HIGH-LOW-HIGH-LOW-HIGH or reverse)
    const isAlternating = 
      (p1.type !== p2.type) &&
      (p2.type !== p3.type) &&
      (p3.type !== p4.type) &&
      (p4.type !== p5.type);

    if (isAlternating) {
      // Determine if it's bullish or bearish impulse
      const firstMove = p2.price - p1.price;
      const isBullish = firstMove > 0;

      if (isBullish) {
        // Bullish impulse: L-H-L-H-L pattern
        if (p1.type === 'LOW' && p2.type === 'HIGH' && p3.type === 'LOW' && 
            p4.type === 'HIGH' && p5.type === 'LOW') {
          structure.wave1 = { start: p1.index, end: p2.index, price: p2.price };
          structure.wave2 = { start: p2.index, end: p3.index, price: p3.price };
          structure.wave3 = { start: p3.index, end: p4.index, price: p4.price };
          structure.wave4 = { start: p4.index, end: p5.index, price: p5.price };
          
          // Estimate wave 5 (current price)
          const currentPrice = candles[candles.length - 1].close;
          structure.wave5 = { 
            start: p5.index, 
            end: candles.length - 1, 
            price: currentPrice 
          };

          // Calculate confidence based on wave relationships
          const wave1Size = Math.abs(p2.price - p1.price);
          const wave2Size = Math.abs(p3.price - p2.price);
          const wave3Size = Math.abs(p4.price - p3.price);
          const wave4Size = Math.abs(p5.price - p4.price);

          // Wave 2 should retrace 38.2% - 61.8% of Wave 1
          const wave2Retrace = wave2Size / wave1Size;
          const wave2Valid = wave2Retrace >= 0.382 && wave2Retrace <= 0.618;

          // Wave 3 should be longer than Wave 1
          const wave3Valid = wave3Size > wave1Size;

          // Wave 4 should retrace 23.6% - 38.2% of Wave 3
          const wave4Retrace = wave4Size / wave3Size;
          const wave4Valid = wave4Retrace >= 0.236 && wave4Retrace <= 0.382;

          let confidence = 0.5; // Base confidence
          if (wave2Valid) confidence += 0.15;
          if (wave3Valid) confidence += 0.15;
          if (wave4Valid) confidence += 0.15;

          if (confidence >= 0.6) {
            return {
              wave: 'Impulse Wave (Bullish)',
              phase: 'IMPULSE',
              structure,
              confidence: Math.min(1.0, confidence)
            };
          }
        }
      } else {
        // Bearish impulse: H-L-H-L-H pattern
        if (p1.type === 'HIGH' && p2.type === 'LOW' && p3.type === 'HIGH' && 
            p4.type === 'LOW' && p5.type === 'HIGH') {
          structure.wave1 = { start: p1.index, end: p2.index, price: p2.price };
          structure.wave2 = { start: p2.index, end: p3.index, price: p3.price };
          structure.wave3 = { start: p3.index, end: p4.index, price: p4.price };
          structure.wave4 = { start: p4.index, end: p5.index, price: p5.price };
          
          const currentPrice = candles[candles.length - 1].close;
          structure.wave5 = { 
            start: p5.index, 
            end: candles.length - 1, 
            price: currentPrice 
          };

          const wave1Size = Math.abs(p2.price - p1.price);
          const wave2Size = Math.abs(p3.price - p2.price);
          const wave3Size = Math.abs(p4.price - p3.price);
          const wave4Size = Math.abs(p5.price - p4.price);

          const wave2Retrace = wave2Size / wave1Size;
          const wave2Valid = wave2Retrace >= 0.382 && wave2Retrace <= 0.618;

          const wave3Valid = wave3Size > wave1Size;

          const wave4Retrace = wave4Size / wave3Size;
          const wave4Valid = wave4Retrace >= 0.236 && wave4Retrace <= 0.382;

          let confidence = 0.5;
          if (wave2Valid) confidence += 0.15;
          if (wave3Valid) confidence += 0.15;
          if (wave4Valid) confidence += 0.15;

          if (confidence >= 0.6) {
            return {
              wave: 'Impulse Wave (Bearish)',
              phase: 'IMPULSE',
              structure,
              confidence: Math.min(1.0, confidence)
            };
          }
        }
      }
    }
  }

  return null;
}

/**
 * Detect Corrective Wave (A-B-C)
 */
function detectCorrectiveWave(
  points: WavePoint[],
  candles: Candle[]
): { wave: string; phase: 'CORRECTION'; structure: WaveStructure; confidence: number } | null {
  if (points.length < 3) return null;

  const recentPoints = points.slice(-6);

  // ABC correction: 3-wave pattern
  for (let i = 0; i < recentPoints.length - 2; i++) {
    const p1 = recentPoints[i];
    const p2 = recentPoints[i + 1];
    const p3 = recentPoints[i + 2];

    // Check if they form ABC pattern
    const isABC = 
      (p1.type !== p2.type) &&
      (p2.type !== p3.type);

    if (isABC) {
      const structure: WaveStructure = {};
      const currentPrice = candles[candles.length - 1].close;

      // Map to A-B-C (simplified)
      structure.wave1 = { start: p1.index, end: p2.index, price: p2.price }; // Wave A
      structure.wave2 = { start: p2.index, end: p3.index, price: p3.price }; // Wave B
      structure.wave3 = { 
        start: p3.index, 
        end: candles.length - 1, 
        price: currentPrice 
      }; // Wave C

      // Calculate confidence
      const waveASize = Math.abs(p2.price - p1.price);
      const waveBSize = Math.abs(p3.price - p2.price);
      const waveBRetrace = waveBSize / waveASize;

      // Wave B typically retraces 38.2% - 78.6% of Wave A
      const isValid = waveBRetrace >= 0.382 && waveBRetrace <= 0.786;

      if (isValid) {
        return {
          wave: 'ABC Correction',
          phase: 'CORRECTION',
          structure,
          confidence: 0.65
        };
      }
    }
  }

  return null;
}

/**
 * Analyze Elliott Waves
 */
export function analyzeElliottWaves(
  candles: Candle[],
  config: AnalyzerConfig = {}
): ElliottWaveAnalysisResult {
  if (candles.length < (config.min_candles || 50)) {
    throw new Error(`Insufficient candles for Elliott Wave analysis (minimum: ${config.min_candles || 50})`);
  }

  const minSwings = config.wave_min_swings || 5;

  // Find wave points
  const points = findWavePoints(candles, 0.5); // 0.5% minimum swing

  if (points.length < minSwings) {
    // Not enough swings detected
    return {
      wave_score: 50,
      wave: undefined,
      wave_phase: 'UNKNOWN',
      current_wave: undefined,
      wave_structure: undefined,
      fibonacci_levels: undefined
    };
  }

  // Try to detect impulse wave first
  let detectedWave = detectImpulseWave(points, candles);

  // If no impulse wave, try corrective wave
  if (!detectedWave) {
    const correctiveWave = detectCorrectiveWave(points, candles);
    if (correctiveWave) {
      detectedWave = correctiveWave;
    }
  }

  // Calculate wave score (0-100)
  let waveScore = 50; // Base score

  if (detectedWave) {
    const confidence = detectedWave.confidence;

    if (detectedWave.phase === 'IMPULSE') {
      // Impulse waves are generally more reliable
      if (detectedWave.wave.includes('Bullish')) {
        waveScore = 50 + (50 * confidence);
      } else {
        waveScore = 50 - (50 * confidence);
      }
    } else if (detectedWave.phase === 'CORRECTION') {
      // Corrections are less directional
      waveScore = 50 + (20 * confidence * (Math.random() > 0.5 ? 1 : -1));
    }

    // Calculate Fibonacci levels if we have wave structure
    if (detectedWave.structure.wave1 && detectedWave.structure.wave2) {
      const high = Math.max(
        detectedWave.structure.wave1.price,
        detectedWave.structure.wave2.price
      );
      const low = Math.min(
        detectedWave.structure.wave1.price,
        detectedWave.structure.wave2.price
      );

      const fibonacciLevels = calculateFibonacciLevels(high, low);

      // Determine current wave
      let currentWave: number | undefined;
      if (detectedWave.structure.wave5) {
        currentWave = 5;
      } else if (detectedWave.structure.wave4) {
        currentWave = 4;
      } else if (detectedWave.structure.wave3) {
        currentWave = 3;
      } else if (detectedWave.structure.wave2) {
        currentWave = 2;
      } else if (detectedWave.structure.wave1) {
        currentWave = 1;
      }

      return {
        wave_score: Math.max(0, Math.min(100, waveScore)),
        wave: detectedWave.wave,
        wave_phase: detectedWave.phase,
        current_wave: currentWave,
        wave_structure: detectedWave.structure,
        fibonacci_levels: fibonacciLevels
      };
    }

    return {
      wave_score: Math.max(0, Math.min(100, waveScore)),
      wave: detectedWave.wave,
      wave_phase: detectedWave.phase,
      current_wave: undefined,
      wave_structure: detectedWave.structure,
      fibonacci_levels: undefined
    };
  }

  // No wave detected
  return {
    wave_score: 50,
    wave: undefined,
    wave_phase: 'UNKNOWN',
    current_wave: undefined,
    wave_structure: undefined,
    fibonacci_levels: undefined
  };
}

