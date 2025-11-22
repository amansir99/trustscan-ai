import { NextRequest } from 'next/server'

// Performance metrics interfaces
interface RequestMetrics {
  id: string;
  method: string;
  url: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  statusCode?: number;
  userAgent?: string;
  ip?: string;
  userId?: string;
  memoryUsage?: NodeJS.MemoryUsage;
  error?: string;
}

interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  requestsPerSecond: number;
  slowestRequests: RequestMetrics[];
  errorRequests: RequestMetrics[];
}

interface SystemMetrics {
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
  uptime: number;
  timestamp: number;
}

/**
 * Database connection pool monitoring
 */
export class DatabasePoolMonitor {
  private connectionMetrics: {
    active: number;
    idle: number;
    waiting: number;
    total: number;
    timestamp: number;
  }[] = []

  private maxHistory = 1000

  recordPoolStats(stats: {
    active: number;
    idle: number;
    waiting: number;
    total: number;
  }): void {
    this.connectionMetrics.push({
      ...stats,
      timestamp: Date.now()
    })

    if (this.connectionMetrics.length > this.maxHistory) {
      this.connectionMetrics = this.connectionMetrics.slice(-this.maxHistory)
    }
  }

  getPoolHealth(): {
    healthy: boolean;
    issues: string[];
    current: any;
    averages: any;
  } {
    if (this.connectionMetrics.length === 0) {
      return {
        healthy: true,
        issues: [],
        current: null,
        averages: null
      }
    }

    const current = this.connectionMetrics[this.connectionMetrics.length - 1]
    const issues: string[] = []

    // Calculate averages over last 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    const recentMetrics = this.connectionMetrics.filter(m => m.timestamp >= fiveMinutesAgo)
    
    const averages = {
      active: recentMetrics.reduce((sum, m) => sum + m.active, 0) / recentMetrics.length,
      idle: recentMetrics.reduce((sum, m) => sum + m.idle, 0) / recentMetrics.length,
      waiting: recentMetrics.reduce((sum, m) => sum + m.waiting, 0) / recentMetrics.length,
      total: recentMetrics.reduce((sum, m) => sum + m.total, 0) / recentMetrics.length
    }

    // Check for issues
    if (current.waiting > 5) {
      issues.push(`High connection queue: ${current.waiting} waiting`)
    }

    if (current.active / current.total > 0.9) {
      issues.push(`High connection utilization: ${Math.round((current.active / current.total) * 100)}%`)
    }

    if (averages.waiting > 2) {
      issues.push(`Consistently high queue: avg ${Math.round(averages.waiting)} waiting`)
    }

    return {
      healthy: issues.length === 0,
      issues,
      current,
      averages: {
        active: Math.round(averages.active),
        idle: Math.round(averages.idle),
        waiting: Math.round(averages.waiting),
        total: Math.round(averages.total)
      }
    }
  }
}

/**
 * Query performance monitoring
 */
export class QueryMonitor {
  private queryMetrics: {
    query: string;
    duration: number;
    timestamp: number;
    error?: string;
  }[] = []

  private maxHistory = 5000
  private slowQueryThreshold = 1000 // 1 second

  recordQuery(query: string, duration: number, error?: string): void {
    this.queryMetrics.push({
      query: this.normalizeQuery(query),
      duration,
      timestamp: Date.now(),
      error
    })

    if (this.queryMetrics.length > this.maxHistory) {
      this.queryMetrics = this.queryMetrics.slice(-this.maxHistory)
    }

    // Log slow queries
    if (duration > this.slowQueryThreshold) {
      console.warn(`Slow query detected (${duration}ms):`, query.substring(0, 100))
    }
  }

  getSlowQueries(windowMs: number = 15 * 60 * 1000): Array<{
    query: string;
    avgDuration: number;
    count: number;
    maxDuration: number;
  }> {
    const now = Date.now()
    const windowStart = now - windowMs
    
    const recentQueries = this.queryMetrics.filter(m => 
      m.timestamp >= windowStart && m.duration > this.slowQueryThreshold
    )

    const queryStats: Record<string, {
      durations: number[];
      count: number;
    }> = {}

    recentQueries.forEach(metric => {
      if (!queryStats[metric.query]) {
        queryStats[metric.query] = {
          durations: [],
          count: 0
        }
      }
      queryStats[metric.query].durations.push(metric.duration)
      queryStats[metric.query].count++
    })

    return Object.entries(queryStats)
      .map(([query, stats]) => ({
        query,
        avgDuration: Math.round(stats.durations.reduce((sum, d) => sum + d, 0) / stats.durations.length),
        count: stats.count,
        maxDuration: Math.max(...stats.durations)
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
  }

  private normalizeQuery(query: string): string {
    // Remove specific values to group similar queries
    return query
      .replace(/\$\d+/g, '$?') // Replace parameter placeholders
      .replace(/'\w+'/g, "'?'") // Replace string literals
      .replace(/\d+/g, '?') // Replace numbers
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }
}

/**
 * Performance monitoring system for API endpoints
 * Requirements: 7.1, 7.2, 7.5
 */
export class PerformanceMonitor {
  private metrics: RequestMetrics[] = []
  private systemMetrics: SystemMetrics[] = []
  private maxMetricsHistory = 10000
  private maxSystemMetricsHistory = 1000
  private monitoringInterval: NodeJS.Timeout | null = null
  private cpuUsageStart: NodeJS.CpuUsage | null = null

  constructor() {
    this.startSystemMonitoring()
  }

  /**
   * Start monitoring a request
   */
  startRequest(request: NextRequest, userId?: string): string {
    const id = this.generateRequestId()
    const startTime = Date.now()

    const metric: RequestMetrics = {
      id,
      method: request.method,
      url: request.url,
      startTime,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: this.getClientIP(request),
      userId,
      memoryUsage: process.memoryUsage()
    }

    this.metrics.push(metric)
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory)
    }

    return id
  }

  /**
   * End monitoring a request
   */
  endRequest(id: string, statusCode: number, error?: string): void {
    const metric = this.metrics.find(m => m.id === id)
    if (!metric) return

    const endTime = Date.now()
    metric.endTime = endTime
    metric.duration = endTime - metric.startTime
    metric.statusCode = statusCode
    metric.error = error

    // Log slow requests
    if (metric.duration > 5000) { // 5 seconds
      console.warn(`Slow request detected: ${metric.method} ${metric.url} took ${metric.duration}ms`)
    }

    // Log errors
    if (error) {
      console.error(`Request error: ${metric.method} ${metric.url} - ${error}`)
    }
  }

  /**
   * Get performance statistics for a time window
   */
  getStats(windowMs: number = 15 * 60 * 1000): PerformanceStats {
    const now = Date.now()
    const windowStart = now - windowMs
    
    const recentMetrics = this.metrics.filter(m => 
      m.startTime >= windowStart && m.endTime && m.duration !== undefined
    )

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        medianResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
        requestsPerSecond: 0,
        slowestRequests: [],
        errorRequests: []
      }
    }

    // Calculate response time statistics
    const durations = recentMetrics.map(m => m.duration!).sort((a, b) => a - b)
    const totalRequests = recentMetrics.length
    const averageResponseTime = durations.reduce((sum, d) => sum + d, 0) / totalRequests
    const medianResponseTime = this.getPercentile(durations, 50)
    const p95ResponseTime = this.getPercentile(durations, 95)
    const p99ResponseTime = this.getPercentile(durations, 99)

    // Calculate error rate
    const errorRequests = recentMetrics.filter(m => 
      m.statusCode && (m.statusCode >= 400 || m.error)
    )
    const errorRate = (errorRequests.length / totalRequests) * 100

    // Calculate requests per second
    const windowSeconds = windowMs / 1000
    const requestsPerSecond = totalRequests / windowSeconds

    // Get slowest requests
    const slowestRequests = recentMetrics
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10)

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      medianResponseTime: Math.round(medianResponseTime),
      p95ResponseTime: Math.round(p95ResponseTime),
      p99ResponseTime: Math.round(p99ResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      requestsPerSecond: Math.round(requestsPerSecond * 100) / 100,
      slowestRequests,
      errorRequests
    }
  }

  /**
   * Get system performance metrics
   */
  getSystemStats(): SystemMetrics {
    return {
      memoryUsage: process.memoryUsage(),
      cpuUsage: this.cpuUsageStart ? process.cpuUsage(this.cpuUsageStart) : undefined,
      uptime: process.uptime(),
      timestamp: Date.now()
    }
  }

  /**
   * Get historical system metrics
   */
  getSystemHistory(windowMs: number = 60 * 60 * 1000): SystemMetrics[] {
    const now = Date.now()
    const windowStart = now - windowMs
    
    return this.systemMetrics.filter(m => m.timestamp >= windowStart)
  }

  /**
   * Check if system is healthy
   */
  isSystemHealthy(): {
    healthy: boolean;
    issues: string[];
    metrics: SystemMetrics;
  } {
    const metrics = this.getSystemStats()
    const stats = this.getStats()
    const issues: string[] = []

    // Check memory usage (warn if over 80% of heap limit)
    const heapUsedPercent = (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100
    if (heapUsedPercent > 80) {
      issues.push(`High memory usage: ${Math.round(heapUsedPercent)}%`)
    }

    // Check response times
    if (stats.averageResponseTime > 3000) {
      issues.push(`High average response time: ${stats.averageResponseTime}ms`)
    }

    // Check error rate
    if (stats.errorRate > 10) {
      issues.push(`High error rate: ${stats.errorRate}%`)
    }

    // Check if we have too many slow requests
    if (stats.p95ResponseTime > 5000) {
      issues.push(`High P95 response time: ${stats.p95ResponseTime}ms`)
    }

    return {
      healthy: issues.length === 0,
      issues,
      metrics
    }
  }

  /**
   * Get detailed request breakdown by endpoint
   */
  getEndpointStats(windowMs: number = 15 * 60 * 1000): Record<string, {
    count: number;
    averageTime: number;
    errorRate: number;
  }> {
    const now = Date.now()
    const windowStart = now - windowMs
    
    const recentMetrics = this.metrics.filter(m => 
      m.startTime >= windowStart && m.endTime && m.duration !== undefined
    )

    const endpointStats: Record<string, {
      durations: number[];
      errors: number;
      total: number;
    }> = {}

    // Group by endpoint
    recentMetrics.forEach(metric => {
      const endpoint = this.normalizeEndpoint(metric.url)
      
      if (!endpointStats[endpoint]) {
        endpointStats[endpoint] = {
          durations: [],
          errors: 0,
          total: 0
        }
      }

      endpointStats[endpoint].durations.push(metric.duration!)
      endpointStats[endpoint].total++
      
      if (metric.statusCode && (metric.statusCode >= 400 || metric.error)) {
        endpointStats[endpoint].errors++
      }
    })

    // Calculate statistics for each endpoint
    const result: Record<string, {
      count: number;
      averageTime: number;
      errorRate: number;
    }> = {}

    Object.entries(endpointStats).forEach(([endpoint, stats]) => {
      const averageTime = stats.durations.reduce((sum, d) => sum + d, 0) / stats.durations.length
      const errorRate = (stats.errors / stats.total) * 100

      result[endpoint] = {
        count: stats.total,
        averageTime: Math.round(averageTime),
        errorRate: Math.round(errorRate * 100) / 100
      }
    })

    return result
  }

  /**
   * Start system monitoring
   */
  private startSystemMonitoring(): void {
    this.cpuUsageStart = process.cpuUsage()
    
    this.monitoringInterval = setInterval(() => {
      const systemMetric = this.getSystemStats()
      this.systemMetrics.push(systemMetric)
      
      // Keep only recent system metrics
      if (this.systemMetrics.length > this.maxSystemMetricsHistory) {
        this.systemMetrics = this.systemMetrics.slice(-this.maxSystemMetricsHistory)
      }
      
      // Reset CPU usage baseline
      this.cpuUsageStart = process.cpuUsage()
    }, 30000) // Every 30 seconds
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }

    const realIP = request.headers.get('x-real-ip')
    if (realIP) {
      return realIP
    }

    return 'unknown'
  }

  /**
   * Calculate percentile from sorted array
   */
  private getPercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0
    
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))]
  }

  /**
   * Normalize endpoint URL for grouping
   */
  private normalizeEndpoint(url: string): string {
    try {
      const urlObj = new URL(url)
      let pathname = urlObj.pathname
      
      // Replace dynamic segments with placeholders
      pathname = pathname.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      pathname = pathname.replace(/\/\d+/g, '/:id')
      pathname = pathname.replace(/\/[a-zA-Z0-9_-]{10,}/g, '/:id')
      
      return pathname
    } catch {
      return url
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    this.metrics = []
    this.systemMetrics = []
  }
}

/**
 * System health checker
 */
export class SystemHealthChecker {
  private healthChecks: Map<string, () => Promise<boolean>> = new Map()
  private lastResults: Map<string, { healthy: boolean; timestamp: number; error?: string }> = new Map()

  registerHealthCheck(name: string, check: () => Promise<boolean>): void {
    this.healthChecks.set(name, check)
  }

  async runHealthChecks(): Promise<{
    overall: boolean;
    checks: Record<string, { healthy: boolean; timestamp: number; error?: string }>;
  }> {
    const results: Record<string, { healthy: boolean; timestamp: number; error?: string }> = {}
    let overallHealthy = true

    for (const [name, check] of Array.from(this.healthChecks.entries())) {
      try {
        const healthy = await check()
        const result = { healthy, timestamp: Date.now() }
        results[name] = result
        this.lastResults.set(name, result)
        
        if (!healthy) {
          overallHealthy = false
        }
      } catch (error) {
        const result = {
          healthy: false,
          timestamp: Date.now(),
          error: error instanceof Error ? error.message : 'Unknown error'
        }
        results[name] = result
        this.lastResults.set(name, result)
        overallHealthy = false
      }
    }

    return { overall: overallHealthy, checks: results }
  }

  getLastResults(): Record<string, { healthy: boolean; timestamp: number; error?: string }> {
    const results: Record<string, { healthy: boolean; timestamp: number; error?: string }> = {}
    for (const [name, result] of Array.from(this.lastResults.entries())) {
      results[name] = result
    }
    return results
  }
}

/**
 * Performance optimization utilities
 */
export class PerformanceOptimizer {
  private static cacheHitRates: Map<string, { hits: number; misses: number }> = new Map()

  static recordCacheHit(cacheKey: string): void {
    const stats = this.cacheHitRates.get(cacheKey) || { hits: 0, misses: 0 }
    stats.hits++
    this.cacheHitRates.set(cacheKey, stats)
  }

  static recordCacheMiss(cacheKey: string): void {
    const stats = this.cacheHitRates.get(cacheKey) || { hits: 0, misses: 0 }
    stats.misses++
    this.cacheHitRates.set(cacheKey, stats)
  }

  static getCacheStats(): Record<string, { hitRate: number; total: number }> {
    const stats: Record<string, { hitRate: number; total: number }> = {}
    
    for (const [key, data] of Array.from(this.cacheHitRates.entries())) {
      const total = data.hits + data.misses
      const hitRate = total > 0 ? (data.hits / total) * 100 : 0
      stats[key] = { hitRate: Math.round(hitRate * 100) / 100, total }
    }
    
    return stats
  }

  static optimizeMemoryUsage(): void {
    if (global.gc) {
      global.gc()
      console.log('Manual garbage collection triggered')
    }
  }

  static getMemoryOptimizationSuggestions(): string[] {
    const memUsage = process.memoryUsage()
    const suggestions: string[] = []

    const heapUsedMB = memUsage.heapUsed / 1024 / 1024
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024
    const externalMB = memUsage.external / 1024 / 1024

    if (heapUsedMB > 500) {
      suggestions.push('High heap usage detected. Consider implementing object pooling.')
    }

    if (externalMB > 100) {
      suggestions.push('High external memory usage. Check for memory leaks in native modules.')
    }

    if (heapUsedMB / heapTotalMB > 0.8) {
      suggestions.push('Heap utilization is high. Consider increasing heap size or optimizing memory usage.')
    }

    const cacheStats = this.getCacheStats()
    const lowHitRateCaches = Object.entries(cacheStats)
      .filter(([_, stats]) => stats.hitRate < 50 && stats.total > 100)
      .map(([key]) => key)

    if (lowHitRateCaches.length > 0) {
      suggestions.push(`Low cache hit rates detected for: ${lowHitRateCaches.join(', ')}`)
    }

    return suggestions
  }
}

/**
 * Global performance monitor instances
 */
export const performanceMonitor = new PerformanceMonitor()
export const databasePoolMonitor = new DatabasePoolMonitor()
export const queryMonitor = new QueryMonitor()
export const systemHealthChecker = new SystemHealthChecker()