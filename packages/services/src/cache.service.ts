/**
 * MANA CALENDAR 2027 — PHASE 7: OFFLINE & PERFORMANCE CACHE SERVICE
 * Supports TTLs, Stale-While-Revalidate, offline persistence, and selective cache purging.
 */

export interface CacheEntry<T> {
  data: T;
  cachedAt: number; // timestamp ms
  expiresAt: number; // timestamp ms
  version: string;
}

export interface CachedResponse<T> {
  data: T | null;
  found: boolean;
  isStale: boolean;
  cachedAt?: string;
  source: 'memory' | 'storage' | 'none';
}

export class OfflineCacheService {
  private static memoryCache = new Map<string, CacheEntry<any>>();
  private static readonly CACHE_VERSION = 'v1_2027';

  /**
   * Sets a cache entry with a specified TTL in seconds
   */
  static set<T>(key: string, data: T, ttlSeconds: number): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      cachedAt: now,
      expiresAt: now + ttlSeconds * 1000,
      version: this.CACHE_VERSION,
    };

    // 1. Memory cache
    this.memoryCache.set(key, entry);

    // 2. Local storage if available
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(`mana_cache:${key}`, JSON.stringify(entry));
      } catch {
        // Storage quota full or unavailable; memory cache still works
      }
    }
  }

  /**
   * Gets a cache entry with graceful offline fallback
   * If expired, returns data with isStale: true rather than failing abruptly
   */
  static get<T>(key: string, allowStale = true): CachedResponse<T> {
    const now = Date.now();

    // 1. Check memory
    let entry = this.memoryCache.get(key) as CacheEntry<T> | undefined;

    // 2. Check localStorage if not in memory
    if (!entry && typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = localStorage.getItem(`mana_cache:${key}`);
        if (raw) {
          entry = JSON.parse(raw) as CacheEntry<T>;
          if (entry) {
            this.memoryCache.set(key, entry);
          }
        }
      } catch {
        // Corrupt storage entry
      }
    }

    if (!entry) {
      return { data: null, found: false, isStale: false, source: 'none' };
    }

    const isExpired = now > entry.expiresAt;

    if (isExpired && !allowStale) {
      this.delete(key);
      return { data: null, found: false, isStale: true, source: 'none' };
    }

    return {
      data: entry.data,
      found: true,
      isStale: isExpired,
      cachedAt: new Date(entry.cachedAt).toISOString(),
      source: 'memory',
    };
  }

  /**
   * Deletes a specific cache key
   */
  static delete(key: string): void {
    this.memoryCache.delete(key);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(`mana_cache:${key}`);
      } catch {
        // Ignore storage errors
      }
    }
  }

  /**
   * Invalidates all cache keys matching a prefix / namespace (e.g. 'banners:')
   */
  static invalidateNamespace(prefix: string): number {
    let purged = 0;
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
        purged++;
      }
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const toRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(`mana_cache:${prefix}`)) {
            toRemove.push(k);
          }
        }
        toRemove.forEach((k) => localStorage.removeItem(k));
      } catch {
        // Ignore
      }
    }

    return purged;
  }

  /**
   * Clears entire cache
   */
  static clear(): void {
    this.memoryCache.clear();
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const toRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('mana_cache:')) {
            toRemove.push(k);
          }
        }
        toRemove.forEach((k) => localStorage.removeItem(k));
      } catch {
        // Ignore
      }
    }
  }
}
