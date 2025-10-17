/**
 * In-Memory Cache Utility
 * Simple caching mechanism for API responses
 */

import { config } from '../config';
import { logger } from './logger';
import type { CacheEntry } from '../types';

class Cache {
  private store: Map<string, CacheEntry<unknown>>;
  private enabled: boolean;
  private ttl: number;

  constructor() {
    this.store = new Map();
    this.enabled = config.cache.enabled;
    this.ttl = config.cache.ttl * 1000; // Convert to milliseconds
  }

  /**
   * Get cached value
   */
  get<T>(key: string): T | null {
    if (!this.enabled) return null;

    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      logger.debug('Cache miss', { key });
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      logger.debug('Cache expired', { key });
      this.store.delete(key);
      return null;
    }

    logger.debug('Cache hit', { key });
    return entry.data;
  }

  /**
   * Set cache value
   */
  set<T>(key: string, data: T, ttl?: number): void {
    if (!this.enabled) return;

    const expiresAt = Date.now() + (ttl || this.ttl);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt,
    };

    this.store.set(key, entry as CacheEntry<unknown>);
    logger.debug('Cache set', { key, expiresIn: ttl || this.ttl });
  }

  /**
   * Delete cache entry
   */
  delete(key: string): void {
    this.store.delete(key);
    logger.debug('Cache deleted', { key });
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.store.clear();
    logger.info('Cache cleared');
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.store.size,
      enabled: this.enabled,
      ttl: this.ttl,
    };
  }

  /**
   * Clean expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cache cleanup: removed ${cleaned} expired entries`);
    }
  }
}

export const cache = new Cache();

// Run cleanup every 5 minutes
if (config.cache.enabled) {
  setInterval(() => cache.cleanup(), 5 * 60 * 1000);
}

