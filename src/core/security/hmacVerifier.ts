/**
 * HMAC Verification System
 * 
 * Phase X.15 - Security Hardening
 * Verifies webhook signatures to prevent unauthorized requests
 */

import { createHmac } from 'crypto';

/**
 * Verify HMAC signature for webhook requests
 */
export function verifyHMAC(
  payload: string | object,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): boolean {
  try {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const hmac = createHmac(algorithm, secret);
    hmac.update(payloadString);
    const expectedSignature = hmac.digest('hex');

    // Use constant-time comparison to prevent timing attacks
    return constantTimeCompare(signature, expectedSignature);
  } catch (error) {
    console.error('HMAC verification error:', error);
    return false;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generate HMAC signature for outgoing requests
 */
export function generateHMAC(
  payload: string | object,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): string {
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const hmac = createHmac(algorithm, secret);
  hmac.update(payloadString);
  return hmac.digest('hex');
}

