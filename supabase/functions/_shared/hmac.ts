/**
 * HMAC Verification for Edge Functions
 * 
 * Phase X.15 - Security Hardening
 */

/**
 * Verify HMAC signature
 */
export async function verifyHMAC(
  payload: string | object,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const payloadString = typeof payload === 'string' 
      ? payload 
      : JSON.stringify(payload);
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payloadString);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      messageData
    );
    
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Constant-time comparison
    return constantTimeCompare(signature.toLowerCase(), expectedSignature.toLowerCase());
  } catch (error) {
    console.error('HMAC verification error:', error);
    return false;
  }
}

/**
 * Constant-time string comparison
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
 * Get IP address from request
 */
export function getClientIP(req: Request): string {
  // Check X-Forwarded-For header (from proxy/load balancer)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Check X-Real-IP header
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback (not reliable in Deno Deploy)
  return 'unknown';
}

