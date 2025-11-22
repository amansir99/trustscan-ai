import { NextRequest } from 'next/server'

// In-memory store for rate limiting (in production, use Redis)
interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastRequest: number;
}

class InMemoryStore {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key)
  }

  set(key: string, value: RateLimitEntry): void {
    this.store.set(key, value)
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of Array.from(this.store.entries())) {
      if (entry.resetTime < now) {
        this.store.delete(key)
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

// Global store instance
const store = new InMemoryStore()

export interface RateLimitConfig {
  windowMs: number;     // Time window in milliseconds
  maxRequests: number;  // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  message?: string;
}

/**
 * Rate limiter implementation for API endpoints
 * Requirements: 7.1, 7.2, 7.3, 7.5
 */
export class RateLimiter {
  private config: Required<RateLimitConfig>

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      keyGenerator: config.keyGenerator || this.defaultKeyGenerator.bind(this),
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      skipFailedRequests: config.skipFailedRequests || false,
      message: config.message || 'Too many requests, please try again later.'
    }
  }

  /**
   * Check if request should be rate limited
   */
  async checkLimit(request: NextRequest): Promise<RateLimitResult> {
    const key = this.config.keyGenerator(request)
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    // Get or create rate limit entry
    let entry = store.get(key)
    
    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired entry
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
        lastRequest: now
      }
    }

    // Check if request is within the current window
    if (entry.lastRequest < windowStart) {
      // Reset count for new window
      entry.count = 0
      entry.resetTime = now + this.config.windowMs
    }

    // Increment request count
    entry.count++
    entry.lastRequest = now

    // Store updated entry
    store.set(key, entry)

    // Calculate remaining requests
    const remaining = Math.max(0, this.config.maxRequests - entry.count)
    const allowed = entry.count <= this.config.maxRequests

    const result: RateLimitResult = {
      allowed,
      limit: this.config.maxRequests,
      remaining,
      resetTime: entry.resetTime
    }

    if (!allowed) {
      result.retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      result.message = this.config.message
    }

    return result
  }

  /**
   * Record a request (for post-processing rate limiting)
   */
  async recordRequest(request: NextRequest, success: boolean): Promise<void> {
    // Skip recording based on configuration
    if ((success && this.config.skipSuccessfulRequests) ||
        (!success && this.config.skipFailedRequests)) {
      return
    }

    // For post-processing, we just ensure the entry exists
    await this.checkLimit(request)
  }

  /**
   * Default key generator using IP address and user agent
   */
  private defaultKeyGenerator(request: NextRequest): string {
    const ip = this.getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    return `${ip}:${this.hashString(userAgent)}`
  }

  /**
   * Get client IP address from request
   */
  private getClientIP(request: NextRequest): string {
    // Check various headers for real IP
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }

    const realIP = request.headers.get('x-real-ip')
    if (realIP) {
      return realIP
    }

    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    if (cfConnectingIP) {
      return cfConnectingIP
    }

    // Fallback to a default value
    return 'unknown'
  }

  /**
   * Simple hash function for strings
   */
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }
}

/**
 * Pre-configured rate limiters for different endpoints
 */
export const RateLimiters = {
  // Strict rate limiting for audit analysis (expensive operations)
  audit: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,           // 10 requests per 15 minutes
    message: 'Too many audit requests. Please wait before analyzing another project.'
  }),

  // Moderate rate limiting for API endpoints
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,          // 100 requests per 15 minutes
    message: 'API rate limit exceeded. Please slow down your requests.'
  }),

  // Lenient rate limiting for authentication
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20,           // 20 requests per 15 minutes
    message: 'Too many authentication attempts. Please try again later.'
  }),

  // Very strict rate limiting for registration
  register: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,            // 5 registrations per hour
    message: 'Registration limit exceeded. Please try again later.'
  }),

  // User-specific rate limiting (uses user ID as key)
  user: new RateLimiter({
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 60,           // 60 requests per minute
    keyGenerator: (request: NextRequest) => {
      // Extract user ID from token or use IP as fallback
      const authHeader = request.headers.get('authorization')
      if (authHeader) {
        try {
          const token = authHeader.replace('Bearer ', '')
          // In a real implementation, you'd decode the JWT to get user ID
          return `user:${token.substring(0, 10)}`
        } catch {
          // Fall back to IP-based limiting
        }
      }
      
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
      return `ip:${ip}`
    },
    message: 'User rate limit exceeded. Please slow down your requests.'
  })
}

/**
 * Middleware function to apply rate limiting
 */
export function withRateLimit(limiter: RateLimiter) {
  return async function(request: NextRequest, handler: Function) {
    const result = await limiter.checkLimit(request)
    
    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: result.message,
          limit: result.limit,
          remaining: result.remaining,
          resetTime: result.resetTime,
          retryAfter: result.retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': result.retryAfter?.toString() || '60'
          }
        }
      )
    }

    // Execute the handler
    const response = await handler(request)

    // Add rate limit headers to successful responses
    if (response instanceof Response) {
      response.headers.set('X-RateLimit-Limit', result.limit.toString())
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString())
    }

    return response
  }
}

/**
 * Request queue for handling high-load scenarios
 * Requirements: 7.1, 7.3
 */
export class RequestQueue {
  private queue: Array<{
    id: string;
    request: NextRequest;
    handler: Function;
    resolve: Function;
    reject: Function;
    timestamp: number;
    priority: number;
  }> = []
  
  private processing = false
  private maxQueueSize = 100
  private maxWaitTime = 30000 // 30 seconds
  private concurrentLimit = 5
  private activeRequests = 0

  /**
   * Add request to queue
   */
  async enqueue(
    request: NextRequest, 
    handler: Function, 
    priority: number = 0
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      // Check queue size
      if (this.queue.length >= this.maxQueueSize) {
        reject(new Error('Request queue is full. Please try again later.'))
        return
      }

      const id = this.generateRequestId()
      const timestamp = Date.now()

      this.queue.push({
        id,
        request,
        handler,
        resolve,
        reject,
        timestamp,
        priority
      })

      // Sort by priority (higher priority first)
      this.queue.sort((a, b) => b.priority - a.priority)

      // Start processing if not already running
      if (!this.processing) {
        this.processQueue()
      }

      // Set timeout for request
      setTimeout(() => {
        const index = this.queue.findIndex(item => item.id === id)
        if (index !== -1) {
          this.queue.splice(index, 1)
          reject(new Error('Request timeout. Please try again.'))
        }
      }, this.maxWaitTime)
    })
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    this.processing = true

    while (this.queue.length > 0 && this.activeRequests < this.concurrentLimit) {
      const item = this.queue.shift()
      if (!item) continue

      this.activeRequests++

      // Process request asynchronously
      this.processRequest(item).finally(() => {
        this.activeRequests--
      })
    }

    // Continue processing if there are more items
    if (this.queue.length > 0 && this.activeRequests < this.concurrentLimit) {
      setTimeout(() => this.processQueue(), 100)
    } else if (this.queue.length === 0) {
      this.processing = false
    }
  }

  /**
   * Process individual request
   */
  private async processRequest(item: any): Promise<void> {
    try {
      const response = await item.handler(item.request)
      item.resolve(response)
    } catch (error) {
      item.reject(error)
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    queueLength: number;
    activeRequests: number;
    maxQueueSize: number;
    concurrentLimit: number;
  } {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      maxQueueSize: this.maxQueueSize,
      concurrentLimit: this.concurrentLimit
    }
  }
}

// Global request queue instance
export const globalRequestQueue = new RequestQueue()

/**
 * Cleanup function for graceful shutdown
 */
export function cleanup(): void {
  store.destroy()
}

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('SIGTERM', cleanup)
  process.on('SIGINT', cleanup)
}