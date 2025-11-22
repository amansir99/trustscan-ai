import { NextResponse } from 'next/server'
import { performanceMonitor, systemHealthChecker, databasePoolMonitor, queryMonitor, PerformanceOptimizer } from '@/lib/performance-monitor'
import { ErrorReporter } from '@/lib/error-handler'

// Register health checks
systemHealthChecker.registerHealthCheck('database', async () => {
  try {
    // Simple database connectivity check
    const { Pool } = require('pg')
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
      connectionTimeoutMillis: 5000,
    })
    
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
    await pool.end()
    
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
})

systemHealthChecker.registerHealthCheck('memory', async () => {
  const memUsage = process.memoryUsage()
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100
  return heapUsedPercent < 90 // Healthy if less than 90% heap usage
})

systemHealthChecker.registerHealthCheck('performance', async () => {
  const stats = performanceMonitor.getStats(5 * 60 * 1000) // Last 5 minutes
  return stats.averageResponseTime < 5000 && stats.errorRate < 20
})

export async function GET() {
  try {
    // Run all health checks
    const healthResults = await systemHealthChecker.runHealthChecks()
    
    // Get performance statistics
    const performanceStats = performanceMonitor.getStats()
    const systemStats = performanceMonitor.getSystemStats()
    const systemHealth = performanceMonitor.isSystemHealthy()
    
    // Get error statistics
    const errorReporter = ErrorReporter.getInstance()
    const errorStats = errorReporter.getErrorStats()
    const systemHealthy = errorReporter.isSystemHealthy()
    
    // Get database pool health
    const poolHealth = databasePoolMonitor.getPoolHealth()
    
    // Get slow queries
    const slowQueries = queryMonitor.getSlowQueries()
    
    // Get cache statistics
    const cacheStats = PerformanceOptimizer.getCacheStats()
    
    // Get optimization suggestions
    const optimizationSuggestions = PerformanceOptimizer.getMemoryOptimizationSuggestions()
    
    // Calculate overall health score
    const healthScore = calculateHealthScore({
      healthResults,
      systemHealth,
      systemHealthy,
      poolHealth,
      performanceStats,
      errorStats
    })

    const response = {
      status: healthResults.overall && systemHealth.healthy && systemHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      healthScore,
      
      // Health checks
      healthChecks: healthResults.checks,
      
      // Performance metrics
      performance: {
        ...performanceStats,
        system: systemStats,
        health: systemHealth
      },
      
      // Error metrics
      errors: {
        ...errorStats,
        healthy: systemHealthy
      },
      
      // Database metrics
      database: {
        pool: poolHealth,
        slowQueries: slowQueries.slice(0, 5) // Top 5 slow queries
      },
      
      // Cache metrics
      cache: cacheStats,
      
      // Optimization
      optimization: {
        suggestions: optimizationSuggestions
      }
    }

    // Set appropriate HTTP status based on health
    const httpStatus = healthResults.overall && systemHealth.healthy && systemHealthy ? 200 : 503

    return NextResponse.json(response, { status: httpStatus })
    
  } catch (error) {
    console.error('Health check endpoint error:', error)
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Detailed health endpoint for monitoring systems
export async function POST() {
  try {
    // Trigger optimization if requested
    PerformanceOptimizer.optimizeMemoryUsage()
    
    // Get detailed metrics
    const endpointStats = performanceMonitor.getEndpointStats()
    const systemHistory = performanceMonitor.getSystemHistory()
    const recentErrors = ErrorReporter.getInstance().getRecentErrors(50)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      detailed: true,
      
      endpoints: endpointStats,
      systemHistory: systemHistory.slice(-20), // Last 20 data points
      recentErrors: recentErrors.map(error => ({
        type: error.type,
        severity: error.severity,
        message: error.message,
        timestamp: error.timestamp,
        component: error.component
      })),
      
      optimization: {
        memoryOptimized: true,
        suggestions: PerformanceOptimizer.getMemoryOptimizationSuggestions()
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get detailed health metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function calculateHealthScore(metrics: {
  healthResults: any;
  systemHealth: any;
  systemHealthy: boolean;
  poolHealth: any;
  performanceStats: any;
  errorStats: any;
}): number {
  let score = 100
  
  // Deduct points for failed health checks
  const failedChecks = Object.values(metrics.healthResults.checks).filter((check: any) => !check.healthy).length
  score -= failedChecks * 20
  
  // Deduct points for system issues
  if (!metrics.systemHealth.healthy) {
    score -= metrics.systemHealth.issues.length * 10
  }
  
  // Deduct points for error rate
  if (metrics.errorStats.recentCount > 0) {
    score -= Math.min(metrics.errorStats.recentCount * 2, 30)
  }
  
  // Deduct points for high response times
  if (metrics.performanceStats.averageResponseTime > 2000) {
    score -= Math.min((metrics.performanceStats.averageResponseTime - 2000) / 100, 20)
  }
  
  // Deduct points for database pool issues
  if (!metrics.poolHealth.healthy) {
    score -= metrics.poolHealth.issues.length * 5
  }
  
  return Math.max(0, Math.round(score))
}