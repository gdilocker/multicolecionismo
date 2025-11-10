/**
 * Simple In-Memory Cache
 *
 * Provides basic caching for frequently accessed data
 * to reduce database queries and improve performance
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup every 5 minutes
    this.startCleanup();
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + (ttlSeconds * 1000);

    this.cache.set(key, {
      value,
      expiresAt,
    });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get or set pattern (if not in cache, fetch and store)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    this.set(key, value, ttlSeconds);

    return value;
  }

  /**
   * Start cleanup interval
   */
  private startCleanup(): void {
    if (typeof window === 'undefined' && !this.cleanupInterval) {
      // Only run cleanup in Node/Deno environment, not in browser
      return;
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`[Cache] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Stop cleanup interval (for cleanup)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Export singleton instance
export const cache = new SimpleCache();

// Cache key builders
export const CacheKeys = {
  subscriptionPlan: (planId: string) => `subscription:plan:${planId}`,
  userProfile: (userId: string) => `user:profile:${userId}`,
  userRole: (userId: string) => `user:role:${userId}`,
  domainAvailability: (domain: string) => `domain:availability:${domain}`,
  premiumDomain: (domainId: string) => `premium:domain:${domainId}`,
  profileBySubdomain: (subdomain: string) => `profile:subdomain:${subdomain}`,
  profileLinks: (profileId: string) => `profile:links:${profileId}`,
  socialPost: (postId: string) => `social:post:${postId}`,
  socialFeed: (profileId: string, page: number) => `social:feed:${profileId}:${page}`,
};

// TTL constants (in seconds)
export const CacheTTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 1800,       // 30 minutes
  VERY_LONG: 3600,  // 1 hour
};
