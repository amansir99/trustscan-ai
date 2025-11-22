/**
 * Comprehensive audit logging and debugging service
 * Requirements: 7.1, 7.3, 7.4
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface AuditLogEntry {
  timestamp: Date;
  level: LogLevel;
  component: string;
  action: string;
  message: string;
  metadata?: Record<string, any>;
  userId?: string;
  auditId?: string;
  url?: string;
  duration?: number;
  error?: {
    type: string;
    message: string;
    stack?: string;
  };
}

export interface AuditMetrics {
  totalAudits: number;
  successfulAudits: number;
  failedAudits: number;
  averageProcessingTime: number;
  errorsByType: Record<string, number>;
  performanceMetrics: {
    averageExtractionTime: number;
    averageAnalysisTime: number;
    averageScoringTime: number;
    averageReportTime: number;
    averageStorageTime: number;
  };
  serviceHealth: {
    contentExtraction: number; // success rate %
    aiAnalysis: number;
    trustScoring: number;
    reportGeneration: number;
    databaseStorage: number;
    hederaStorage: number;
  };
}

/**
 * Centralized audit logging service with structured logging and metrics
 */
export class AuditLogger {
  private static instance: AuditLogger;
  private logs: AuditLogEntry[] = [];
  private maxLogEntries = 10000; // Keep last 10k entries in memory
  private metrics: AuditMetrics;

  private constructor() {
    this.metrics = this.initializeMetrics();
  }

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Log audit workflow start
   */
  logAuditStart(userId: string, url: string, options: any): void {
    this.addLogEntry({
      level: LogLevel.INFO,
      component: 'AuditWorkflow',
      action: 'start',
      message: `Starting audit workflow for ${url}`,
      userId,
      url,
      metadata: {
        options,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`🚀 [AUDIT-START] User ${userId} initiated audit for ${url}`, options);
  }

  /**
   * Log audit workflow completion
   */
  logAuditComplete(
    userId: string,
    url: string,
    auditId: string,
    processingTime: number,
    performance: any,
    warnings: string[] = [],
    fallbacksUsed: string[] = []
  ): void {
    this.addLogEntry({
      level: LogLevel.INFO,
      component: 'AuditWorkflow',
      action: 'complete',
      message: `Audit workflow completed successfully`,
      userId,
      auditId,
      url,
      duration: processingTime,
      metadata: {
        performance,
        warnings,
        fallbacksUsed,
        timestamp: new Date().toISOString()
      }
    });

    this.updateSuccessMetrics(processingTime, performance);

    console.log(`✅ [AUDIT-COMPLETE] Audit ${auditId} completed in ${processingTime}ms`, {
      userId,
      url,
      performance,
      warnings: warnings.length,
      fallbacksUsed: fallbacksUsed.length
    });
  }

  /**
   * Log audit workflow failure
   */
  logAuditFailure(
    userId: string,
    url: string,
    error: any,
    processingTime: number,
    steps: any[] = []
  ): void {
    this.addLogEntry({
      level: LogLevel.ERROR,
      component: 'AuditWorkflow',
      action: 'failure',
      message: `Audit workflow failed: ${error.message || 'Unknown error'}`,
      userId,
      url,
      duration: processingTime,
      error: {
        type: error.type || 'UNKNOWN_ERROR',
        message: error.message || 'Unknown error occurred',
        stack: error.stack
      },
      metadata: {
        steps,
        stepsCompleted: steps.filter(s => s.success).length,
        totalSteps: steps.length,
        timestamp: new Date().toISOString()
      }
    });

    this.updateFailureMetrics(error.type || 'UNKNOWN_ERROR');

    console.error(`❌ [AUDIT-FAILURE] Audit failed for ${url} after ${processingTime}ms`, {
      userId,
      errorType: error.type,
      errorMessage: error.message,
      stepsCompleted: steps.filter(s => s.success).length,
      totalSteps: steps.length
    });
  }

  /**
   * Log individual step execution
   */
  logStepExecution(
    step: string,
    success: boolean,
    duration: number,
    userId?: string,
    auditId?: string,
    metadata?: any,
    error?: any
  ): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const action = success ? 'step_success' : 'step_failure';
    const message = success 
      ? `Step '${step}' completed successfully in ${duration}ms`
      : `Step '${step}' failed after ${duration}ms: ${error?.message || 'Unknown error'}`;

    this.addLogEntry({
      level,
      component: 'AuditStep',
      action,
      message,
      userId,
      auditId,
      duration,
      error: error ? {
        type: error.type || 'STEP_ERROR',
        message: error.message || 'Step execution failed',
        stack: error.stack
      } : undefined,
      metadata: {
        step,
        ...metadata,
        timestamp: new Date().toISOString()
      }
    });

    if (success) {
      console.log(`✅ [STEP-SUCCESS] ${step} completed in ${duration}ms`, metadata);
    } else {
      console.error(`❌ [STEP-FAILURE] ${step} failed after ${duration}ms`, {
        error: error?.message,
        metadata
      });
    }
  }

  /**
   * Log performance warning
   */
  logPerformanceWarning(
    component: string,
    action: string,
    duration: number,
    threshold: number,
    userId?: string,
    auditId?: string
  ): void {
    this.addLogEntry({
      level: LogLevel.WARN,
      component,
      action: 'performance_warning',
      message: `Performance warning: ${action} took ${duration}ms (threshold: ${threshold}ms)`,
      userId,
      auditId,
      duration,
      metadata: {
        threshold,
        exceedBy: duration - threshold,
        timestamp: new Date().toISOString()
      }
    });

    console.warn(`⚠️ [PERFORMANCE-WARNING] ${component}.${action} took ${duration}ms (threshold: ${threshold}ms)`, {
      userId,
      auditId,
      exceedBy: duration - threshold
    });
  }

  /**
   * Log system health status
   */
  logHealthStatus(services: Record<string, boolean>, issues: string[] = []): void {
    const healthy = issues.length === 0;
    
    this.addLogEntry({
      level: healthy ? LogLevel.INFO : LogLevel.WARN,
      component: 'SystemHealth',
      action: 'health_check',
      message: healthy ? 'All systems operational' : `System health issues detected: ${issues.join(', ')}`,
      metadata: {
        services,
        issues,
        healthyServices: Object.values(services).filter(Boolean).length,
        totalServices: Object.keys(services).length,
        timestamp: new Date().toISOString()
      }
    });

    if (healthy) {
      console.log('💚 [HEALTH-CHECK] All systems operational', services);
    } else {
      console.warn('⚠️ [HEALTH-CHECK] System health issues detected', { services, issues });
    }
  }

  /**
   * Get recent logs with filtering
   */
  getRecentLogs(
    limit: number = 100,
    level?: LogLevel,
    component?: string,
    userId?: string
  ): AuditLogEntry[] {
    let filteredLogs = [...this.logs];

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    if (component) {
      filteredLogs = filteredLogs.filter(log => log.component === component);
    }

    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === userId);
    }

    return filteredLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get current metrics
   */
  getMetrics(): AuditMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance summary for the last N audits
   */
  getPerformanceSummary(lastN: number = 100): {
    averageProcessingTime: number;
    successRate: number;
    errorDistribution: Record<string, number>;
    performanceTrends: any;
  } {
    const recentAudits = this.logs
      .filter(log => log.action === 'complete' || log.action === 'failure')
      .slice(-lastN);

    if (recentAudits.length === 0) {
      return {
        averageProcessingTime: 0,
        successRate: 0,
        errorDistribution: {},
        performanceTrends: {}
      };
    }

    const successful = recentAudits.filter(log => log.action === 'complete');
    const failed = recentAudits.filter(log => log.action === 'failure');

    const averageProcessingTime = successful.length > 0
      ? successful.reduce((sum, log) => sum + (log.duration || 0), 0) / successful.length
      : 0;

    const successRate = (successful.length / recentAudits.length) * 100;

    const errorDistribution: Record<string, number> = {};
    failed.forEach(log => {
      const errorType = log.error?.type || 'UNKNOWN_ERROR';
      errorDistribution[errorType] = (errorDistribution[errorType] || 0) + 1;
    });

    return {
      averageProcessingTime,
      successRate,
      errorDistribution,
      performanceTrends: {
        totalAudits: recentAudits.length,
        successfulAudits: successful.length,
        failedAudits: failed.length
      }
    };
  }

  /**
   * Export logs for debugging
   */
  exportLogs(
    startDate?: Date,
    endDate?: Date,
    level?: LogLevel,
    component?: string
  ): AuditLogEntry[] {
    let filteredLogs = [...this.logs];

    if (startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= startDate);
    }

    if (endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= endDate);
    }

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    if (component) {
      filteredLogs = filteredLogs.filter(log => log.component === component);
    }

    return filteredLogs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Clear old logs to prevent memory issues
   */
  clearOldLogs(): void {
    if (this.logs.length > this.maxLogEntries) {
      const keepCount = Math.floor(this.maxLogEntries * 0.8); // Keep 80% of max
      this.logs = this.logs
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, keepCount);
      
      console.log(`🧹 [LOG-CLEANUP] Cleared old logs, keeping ${keepCount} most recent entries`);
    }
  }

  private addLogEntry(entry: Omit<AuditLogEntry, 'timestamp'>): void {
    const logEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date()
    };

    this.logs.push(logEntry);
    this.clearOldLogs();
  }

  private initializeMetrics(): AuditMetrics {
    return {
      totalAudits: 0,
      successfulAudits: 0,
      failedAudits: 0,
      averageProcessingTime: 0,
      errorsByType: {},
      performanceMetrics: {
        averageExtractionTime: 0,
        averageAnalysisTime: 0,
        averageScoringTime: 0,
        averageReportTime: 0,
        averageStorageTime: 0
      },
      serviceHealth: {
        contentExtraction: 100,
        aiAnalysis: 100,
        trustScoring: 100,
        reportGeneration: 100,
        databaseStorage: 100,
        hederaStorage: 100
      }
    };
  }

  private updateSuccessMetrics(processingTime: number, performance: any): void {
    this.metrics.totalAudits++;
    this.metrics.successfulAudits++;
    
    // Update average processing time
    const totalSuccessful = this.metrics.successfulAudits;
    this.metrics.averageProcessingTime = 
      ((this.metrics.averageProcessingTime * (totalSuccessful - 1)) + processingTime) / totalSuccessful;

    // Update performance metrics
    if (performance) {
      const updateAverage = (current: number, newValue: number, count: number) => 
        ((current * (count - 1)) + newValue) / count;

      this.metrics.performanceMetrics.averageExtractionTime = 
        updateAverage(this.metrics.performanceMetrics.averageExtractionTime, performance.extractionTime || 0, totalSuccessful);
      
      this.metrics.performanceMetrics.averageAnalysisTime = 
        updateAverage(this.metrics.performanceMetrics.averageAnalysisTime, performance.analysisTime || 0, totalSuccessful);
      
      this.metrics.performanceMetrics.averageScoringTime = 
        updateAverage(this.metrics.performanceMetrics.averageScoringTime, performance.scoringTime || 0, totalSuccessful);
      
      this.metrics.performanceMetrics.averageReportTime = 
        updateAverage(this.metrics.performanceMetrics.averageReportTime, performance.reportTime || 0, totalSuccessful);
      
      this.metrics.performanceMetrics.averageStorageTime = 
        updateAverage(this.metrics.performanceMetrics.averageStorageTime, performance.storageTime || 0, totalSuccessful);
    }
  }

  private updateFailureMetrics(errorType: string): void {
    this.metrics.totalAudits++;
    this.metrics.failedAudits++;
    this.metrics.errorsByType[errorType] = (this.metrics.errorsByType[errorType] || 0) + 1;
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();