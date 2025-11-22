import crypto from 'crypto'

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccess: number;
}

// Cache statistics interface
interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  hitRate: number;
  memoryUsage: number;
}

/**
 * In-memory cache implementation with TTL and LRU eviction
 * Requirements: 7.1, 7.2, 7.3, 7.5
 */
export class MemoryCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>()
  private stats = { hits: 0, misses: 0 }
  private maxSize: number
  private defaultTTL: number
  private cleanupInterval: NodeJS.Timeout

  constructor(options: {
    maxSize?: number;
    defaultTTL?: number;
    cleanupIntervalMs?: number;
  } = {}) {
    this.maxSize = options.maxSize || 1000
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000 // 5 minutes
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, options.cleanupIntervalMs || 60 * 1000) // 1 minute
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      return null
    }

    // Check if entry has expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    // Update access statistics
    entry.hits++
    entry.lastAccess = Date.now()
    this.stats.hits++

    return entry.data
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now()
    const entryTTL = ttl || this.defaultTTL

    // Check if we need to evict entries
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU()
    }

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: now,
      ttl: entryTTL,
      hits: 0,
      lastAccess: now
    }

    this.cache.set(key, entry)
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.stats = { hits: 0, misses: 0 }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0
    
    // Estimate memory usage (rough calculation)
    let memoryUsage = 0
    for (const [key, entry] of Array.from(this.cache.entries())) {
      memoryUsage += key.length * 2 // UTF-16 characters
      memoryUsage += JSON.stringify(entry.data).length * 2
      memoryUsage += 64 // Overhead for entry metadata
    }

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      entries: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage
    }
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now > entry.timestamp + entry.ttl) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.clear()
  }
}

/**
 * Cache key generator utilities
 */
export class CacheKeyGenerator {
  /**
   * Generate cache key for audit results
   */
  static auditResult(url: string, options: any = {}): string {
    const normalizedUrl = this.normalizeUrl(url)
    const optionsHash = this.hashObject(options)
    return `audit:${normalizedUrl}:${optionsHash}`
  }

  /**
   * Generate cache key for user profile
   */
  static userProfile(userId: string, includeStats: boolean = false): string {
    return `profile:${userId}:${includeStats ? 'with-stats' : 'basic'}`
  }

  /**
   * Generate cache key for audit history
   */
  static auditHistory(userId: string, filters: any = {}, pagination: any = {}): string {
    const filtersHash = this.hashObject(filters)
    const paginationHash = this.hashObject(pagination)
    return `history:${userId}:${filtersHash}:${paginationHash}`
  }

  /**
   * Generate cache key for usage statistics
   */
  static usageStats(userId: string): string {
    return `usage:${userId}`
  }

  /**
   * Generate cache key for content extraction
   */
  static contentExtraction(url: string): string {
    const normalizedUrl = this.normalizeUrl(url)
    return `content:${normalizedUrl}`
  }

  /**
   * Generate cache key for AI analysis
   */
  static aiAnalysis(url: string, contentLength: number): string {
    const normalizedUrl = this.normalizeUrl(url)
    return `ai-analysis:${normalizedUrl}:${contentLength}`
  }

  /**
   * Normalize URL for consistent caching
   */
  private static normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      // Remove fragment and normalize
      urlObj.hash = ''
      // Sort query parameters for consistency
      urlObj.searchParams.sort()
      return urlObj.toString().toLowerCase()
    } catch {
      return url.toLowerCase()
    }
  }

  /**
   * Generate hash for objects
   */
  private static hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort())
    return crypto.createHash('md5').update(str).digest('hex').substring(0, 8)
  }
}

/**
 * Pre-configured cache instances for different use cases
 */
export const Caches = {
  // Cache for audit results (longer TTL, smaller size)
  auditResults: new MemoryCache({
    maxSize: 500,
    defaultTTL: 30 * 60 * 1000, // 30 minutes
    cleanupIntervalMs: 5 * 60 * 1000 // 5 minutes
  }),

  // Cache for content extraction (medium TTL, medium size)
  contentExtraction: new MemoryCache({
    maxSize: 1000,
    defaultTTL: 15 * 60 * 1000, // 15 minutes
    cleanupIntervalMs: 2 * 60 * 1000 // 2 minutes
  }),

  // Cache for user profiles (short TTL, large size)
  userProfiles: new MemoryCache({
    maxSize: 2000,
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    cleanupIntervalMs: 60 * 1000 // 1 minute
  }),

  // Cache for API responses (very short TTL, large size)
  apiResponses: new MemoryCache({
    maxSize: 5000,
    defaultTTL: 2 * 60 * 1000, // 2 minutes
    cleanupIntervalMs: 30 * 1000 // 30 seconds
  }),

  // Cache for usage statistics (short TTL, medium size)
  usageStats: new MemoryCache({
    maxSize: 1000,
    defaultTTL: 60 * 1000, // 1 minute
    cleanupIntervalMs: 30 * 1000 // 30 seconds
  }),

  // Cache for AI analysis results (medium TTL, medium size)
  aiAnalysis: new MemoryCache({
    maxSize: 800,
    defaultTTL: 10 * 60 * 1000, // 10 minutes
    cleanupIntervalMs: 2 * 60 * 1000 // 2 minutes
  })
}

/**
 * Cache middleware function
 */
export function withCache<T>(
  cache: MemoryCache<T>,
  keyGenerator: (request: any) => string,
  ttl?: number
) {
  return function(handler: Function) {
    return async function(request: any): Promise<T> {
      const cacheKey = keyGenerator(request)
      
      // Try to get from cache first
      const cached = cache.get(cacheKey)
      if (cached !== null) {
        return cached
      }

      // Execute handler and cache result
      const result = await handler(request)
      
      // Only cache successful results
      if (result && typeof result === 'object' && !(result as any).error) {
        cache.set(cacheKey, result, ttl)
      }

      return result
    }
  }
}

/**
 * Cache warming utilities
 */
export class CacheWarmer {
  /**
   * Warm up audit result cache for popular projects
   */
  static async warmAuditCache(popularUrls: string[]): Promise<void> {
    console.log(`Warming audit cache for ${popularUrls.length} URLs`)
    
    for (const url of popularUrls) {
      try {
        const cacheKey = CacheKeyGenerator.auditResult(url)
        
        // Only warm if not already cached
        if (!Caches.auditResults.has(cacheKey)) {
          // In a real implementation, you'd call the actual audit service
          // For now, we'll just mark the cache as warmed
          console.log(`Warming cache for: ${url}`)
        }
      } catch (error) {
        console.warn(`Failed to warm cache for ${url}:`, error)
      }
    }
  }

  /**
   * Warm up content extraction cache
   */
  static async warmContentCache(urls: string[]): Promise<void> {
    console.log(`Warming content cache for ${urls.length} URLs`)
    
    for (const url of urls) {
      try {
        const cacheKey = CacheKeyGenerator.contentExtraction(url)
        
        if (!Caches.contentExtraction.has(cacheKey)) {
          console.log(`Warming content cache for: ${url}`)
          // In a real implementation, you'd call the content extraction service
        }
      } catch (error) {
        console.warn(`Failed to warm content cache for ${url}:`, error)
      }
    }
  }
}

/**
 * Cache monitoring and metrics
 */
export class CacheMonitor {
  /**
   * Get comprehensive cache statistics
   */
  static getAllStats(): Record<string, CacheStats> {
    return {
      auditResults: Caches.auditResults.getStats(),
      contentExtraction: Caches.contentExtraction.getStats(),
      userProfiles: Caches.userProfiles.getStats(),
      apiResponses: Caches.apiResponses.getStats(),
      usageStats: Caches.usageStats.getStats()
    }
  }

  /**
   * Log cache performance metrics
   */
  static logMetrics(): void {
    const stats = this.getAllStats()
    
    console.log('Cache Performance Metrics:')
    for (const [cacheName, cacheStats] of Object.entries(stats)) {
      console.log(`  ${cacheName}:`, {
        hitRate: `${cacheStats.hitRate}%`,
        entries: cacheStats.entries,
        memoryUsage: `${Math.round(cacheStats.memoryUsage / 1024)}KB`
      })
    }
  }

  /**
   * Clear all caches
   */
  static clearAll(): void {
    Object.values(Caches).forEach(cache => cache.clear())
    console.log('All caches cleared')
  }
}

/**
 * Cleanup function for graceful shutdown
 */
export function cleanup(): void {
  Object.values(Caches).forEach(cache => cache.destroy())
}

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('SIGTERM', cleanup)
  process.on('SIGINT', cleanup)
}