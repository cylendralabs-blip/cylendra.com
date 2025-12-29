/**
 * IP Allowlist System
 * 
 * Phase X.15 - Security Hardening
 * Restricts access to sensitive functions from specific IPs
 */

interface AllowlistConfig {
  allowedIPs: string[];
  allowLocalhost: boolean;
  allowPrivateNetworks: boolean;
}

class IPAllowlist {
  private config: AllowlistConfig = {
    allowedIPs: [],
    allowLocalhost: true,
    allowPrivateNetworks: false,
  };

  /**
   * Configure allowlist
   */
  configure(config: Partial<AllowlistConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if IP is allowed
   */
  isAllowed(ip: string): boolean {
    // Allow localhost in development
    if (this.config.allowLocalhost && (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost')) {
      return true;
    }

    // Check exact match
    if (this.config.allowedIPs.includes(ip)) {
      return true;
    }

    // Check CIDR ranges if needed
    for (const allowedIP of this.config.allowedIPs) {
      if (this.isIPInRange(ip, allowedIP)) {
        return true;
      }
    }

    // Check private networks
    if (this.config.allowPrivateNetworks && this.isPrivateNetwork(ip)) {
      return true;
    }

    return false;
  }

  /**
   * Check if IP is in CIDR range
   */
  private isIPInRange(ip: string, cidr: string): boolean {
    if (!cidr.includes('/')) {
      return ip === cidr;
    }

    // Simple CIDR check (for production, use a proper CIDR library)
    const [network, prefixLength] = cidr.split('/');
    const prefix = parseInt(prefixLength, 10);

    // This is a simplified check - for production use ipaddr.js or similar
    return ip.startsWith(network.split('.').slice(0, Math.floor(prefix / 8)).join('.'));
  }

  /**
   * Check if IP is in private network range
   */
  private isPrivateNetwork(ip: string): boolean {
    // Private network ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x
    return (
      ip.startsWith('10.') ||
      ip.startsWith('172.16.') ||
      ip.startsWith('172.17.') ||
      ip.startsWith('172.18.') ||
      ip.startsWith('172.19.') ||
      ip.startsWith('172.20.') ||
      ip.startsWith('172.21.') ||
      ip.startsWith('172.22.') ||
      ip.startsWith('172.23.') ||
      ip.startsWith('172.24.') ||
      ip.startsWith('172.25.') ||
      ip.startsWith('172.26.') ||
      ip.startsWith('172.27.') ||
      ip.startsWith('172.28.') ||
      ip.startsWith('172.29.') ||
      ip.startsWith('172.30.') ||
      ip.startsWith('172.31.') ||
      ip.startsWith('192.168.')
    );
  }
}

// Singleton instance
export const ipAllowlist = new IPAllowlist();

