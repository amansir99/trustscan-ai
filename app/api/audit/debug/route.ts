import { NextRequest, NextResponse } from 'next/server'
import { AuditWorkflowService, AuditWorkflowOptions } from '@/lib/audit-workflow-service'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { ErrorReporter, handleError } from '@/lib/error-handler'
import { auditLogger } from '@/lib/audit-logger'

// Initialize services
const workflowService = new AuditWorkflowService()
const errorReporter = ErrorReporter.getInstance()

interface DebugRequest {
  url: string;
  enableVerboseLogging?: boolean;
  skipSteps?: string[];
  testMode?: boolean;
}

/**
 * POST /api/audit/debug - Debug audit workflow execution
 * This endpoint provides detailed debugging information for audit workflows
 * Requirements: 7.1, 7.3 (comprehensive logging and debugging capabilities)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    let requestBody: DebugRequest;
    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid JSON in request body',
          debugInfo: {
            requestParsingFailed: true,
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }

    const { url, enableVerboseLogging = true, skipSteps = [], testMode = false } = requestBody;

    // Validate required fields
    if (!url) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'URL is required for debugging',
          debugInfo: {
            validationFailed: true,
            missingFields: ['url'],
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }

    // Validate URL format
    let validatedUrl: URL;
    try {
      validatedUrl = new URL(url);
      if (!['http:', 'https:'].includes(validatedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid URL format. Please provide a valid HTTP or HTTPS URL.',
          debugInfo: {
            urlValidationFailed: true,
            providedUrl: url,
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }

    // Authenticate user (optional for debug mode, but recommended)
    const token = getTokenFromRequest(request);
    let user = null;
    
    if (token) {
      user = await verifyToken(token);
      if (!user) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid authentication token',
            debugInfo: {
              authenticationFailed: true,
              tokenProvided: true,
              timestamp: new Date().toISOString()
            }
          },
          { status: 401 }
        );
      }
    } else if (!testMode) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required for debug mode. Use testMode=true for anonymous debugging.',
          debugInfo: {
            authenticationRequired: true,
            testModeAvailable: true,
            timestamp: new Date().toISOString()
          }
        },
        { status: 401 }
      );
    }

    // Set up debug workflow options
    const workflowOptions: AuditWorkflowOptions = {
      url: validatedUrl.toString(),
      userId: user?.id || 'debug_user',
      storeOnHedera: false, // Disable blockchain storage for debugging
      detailedAnalysis: true,
      priority: 'normal',
      timeout: 45000, // Extended timeout for debugging
      retryAttempts: 1 // Reduced retries for faster debugging
    };

    console.log(`🔍 [DEBUG-API] Starting debug workflow for ${validatedUrl.toString()}`, {
      userId: user?.id || 'anonymous',
      testMode,
      enableVerboseLogging,
      skipSteps
    });

    // Execute debug workflow
    const debugResult = await workflowService.debugWorkflowExecution(workflowOptions, request);

    // Get additional debug information
    const workflowHealth = await workflowService.getWorkflowHealth();
    const workflowStats = workflowService.getWorkflowStatistics();
    const recentLogs = auditLogger.getRecentLogs(20, undefined, 'AuditWorkflow', user?.id);
    const performanceSummary = auditLogger.getPerformanceSummary(10);

    // Compile comprehensive debug response
    const debugResponse = {
      success: debugResult.success,
      timestamp: new Date().toISOString(),
      
      // Workflow execution results
      workflowResult: debugResult.result ? {
        auditId: debugResult.result.auditId,
        processingTime: debugResult.result.metadata.processingTime,
        stepsCompleted: debugResult.result.metadata.steps.filter(s => s.success).length,
        totalSteps: debugResult.result.metadata.steps.length,
        warningsCount: debugResult.result.metadata.warnings.length,
        fallbacksUsed: debugResult.result.metadata.fallbacksUsed.length,
        hederaStored: !!debugResult.result.hederaTransactionId
      } : null,

      // Detailed debug information
      debugInfo: {
        ...debugResult.debugInfo,
        
        // Add request context
        requestContext: {
          url: validatedUrl.toString(),
          userAgent: request.headers.get('user-agent'),
          userId: user?.id || 'anonymous',
          testMode,
          enableVerboseLogging,
          skipSteps
        },

        // Add system context
        systemContext: {
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsage: process.memoryUsage(),
          uptime: process.uptime(),
          environment: process.env.NODE_ENV
        }
      },

      // Service health at time of debug
      serviceHealth: workflowHealth,

      // Performance metrics
      performance: {
        workflowStats,
        recentPerformance: performanceSummary,
        
        // Performance analysis
        analysis: {
          isPerformanceHealthy: performanceSummary.averageProcessingTime < 30000,
          successRateHealthy: performanceSummary.successRate > 80,
          errorRateAcceptable: Object.keys(performanceSummary.errorDistribution).length < 5,
          recommendations: generatePerformanceRecommendations(performanceSummary, workflowStats)
        }
      },

      // Recent audit logs
      recentLogs: recentLogs.map(log => ({
        timestamp: log.timestamp,
        level: log.level,
        component: log.component,
        action: log.action,
        message: log.message,
        duration: log.duration,
        error: log.error ? {
          type: log.error.type,
          message: log.error.message
        } : undefined
      })),

      // Debug recommendations
      recommendations: generateDebugRecommendations(debugResult, workflowHealth, performanceSummary),

      // Error analysis
      errorAnalysis: debugResult.debugInfo.errors.length > 0 ? {
        totalErrors: debugResult.debugInfo.errors.length,
        errorTypes: Array.from(new Set(debugResult.debugInfo.errors.map(e => e.type))),
        criticalErrors: debugResult.debugInfo.errors.filter(e => e.type?.includes('CRITICAL')),
        recoverableErrors: debugResult.debugInfo.errors.filter(e => e.type?.includes('RECOVERABLE')),
        suggestions: generateErrorSuggestions(debugResult.debugInfo.errors)
      } : null
    };

    // Log debug session completion
    console.log(`🔍 [DEBUG-API] Debug session completed`, {
      success: debugResult.success,
      userId: user?.id || 'anonymous',
      processingTime: debugResult.debugInfo.timings.total,
      stepsExecuted: debugResult.debugInfo.steps.length,
      errorsFound: debugResult.debugInfo.errors.length,
      warningsFound: debugResult.debugInfo.warnings.length
    });

    return NextResponse.json(debugResponse);

  } catch (error) {
    console.error('Debug endpoint error:', error);

    // Report debug endpoint failure
    const appError = handleError(error, {
      component: 'AuditDebugAPI',
      action: 'debugWorkflow'
    });
    errorReporter.logError(appError);

    return NextResponse.json({
      success: false,
      error: 'Debug session failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      debugInfo: {
        debugEndpointFailed: true,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      }
    }, { status: 500 });
  }
}

/**
 * GET /api/audit/debug - Get debug information and system status
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get comprehensive system debug information
    const workflowHealth = await workflowService.getWorkflowHealth();
    const workflowStats = workflowService.getWorkflowStatistics();
    const errorStats = errorReporter.getErrorStats();
    const recentErrors = errorReporter.getRecentErrors(10);
    const performanceSummary = auditLogger.getPerformanceSummary(50);

    const debugInfo = {
      timestamp: new Date().toISOString(),
      
      // System health overview
      systemHealth: {
        overall: workflowHealth.healthy && errorStats.recentCount < 5,
        services: workflowHealth.services,
        issues: workflowHealth.issues,
        lastHealthCheck: workflowHealth.lastHealthCheck
      },

      // Performance overview
      performance: {
        averageProcessingTime: Math.round(performanceSummary.averageProcessingTime),
        successRate: Math.round(performanceSummary.successRate),
        totalWorkflows: workflowStats.totalWorkflowsExecuted,
        recentAudits: performanceSummary.performanceTrends.totalAudits,
        
        stepPerformance: Object.entries(workflowStats.stepPerformance).map(([step, time]) => ({
          step,
          averageTime: Math.round(time),
          status: time < 10000 ? 'good' : time < 20000 ? 'warning' : 'slow'
        }))
      },

      // Error overview
      errors: {
        total: errorStats.total,
        recent: errorStats.recentCount,
        byType: errorStats.byType,
        bySeverity: errorStats.bySeverity,
        recentErrors: recentErrors.map(error => ({
          type: error.type,
          severity: error.severity,
          message: error.message,
          timestamp: error.timestamp,
          component: error.component
        }))
      },

      // Service diagnostics
      diagnostics: workflowHealth.diagnostics,

      // System resources
      resources: {
        memory: process.memoryUsage(),
        uptime: Math.round(process.uptime()),
        platform: process.platform,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV
      },

      // Debug capabilities
      debugCapabilities: {
        verboseLogging: true,
        stepSkipping: true,
        testMode: true,
        performanceAnalysis: true,
        errorAnalysis: true,
        serviceHealthChecks: true
      }
    };

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('Debug info retrieval failed:', error);
    
    return NextResponse.json({
      error: 'Failed to retrieve debug information',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Helper functions for generating recommendations and analysis

function generatePerformanceRecommendations(
  performanceSummary: any, 
  workflowStats: any
): string[] {
  const recommendations: string[] = [];

  if (performanceSummary.averageProcessingTime > 30000) {
    recommendations.push('Average processing time is high. Consider optimizing content extraction or AI analysis.');
  }

  if (performanceSummary.successRate < 80) {
    recommendations.push('Success rate is below optimal. Review error patterns and improve error handling.');
  }

  if (workflowStats.stepPerformance.contentExtraction > 15000) {
    recommendations.push('Content extraction is slow. Check website complexity and anti-bot measures.');
  }

  if (workflowStats.stepPerformance.aiAnalysis > 10000) {
    recommendations.push('AI analysis is slow. Monitor Gemini API performance and consider fallback strategies.');
  }

  if (Object.keys(performanceSummary.errorDistribution).length > 3) {
    recommendations.push('Multiple error types detected. Review error handling and service reliability.');
  }

  return recommendations;
}

function generateDebugRecommendations(
  debugResult: any,
  workflowHealth: any,
  performanceSummary: any
): string[] {
  const recommendations: string[] = [];

  if (!debugResult.success) {
    recommendations.push('Workflow execution failed. Check error details and service health.');
  }

  if (debugResult.debugInfo.errors.length > 0) {
    recommendations.push('Errors detected during execution. Review error analysis section.');
  }

  if (debugResult.debugInfo.warnings.length > 2) {
    recommendations.push('Multiple warnings generated. Consider addressing underlying issues.');
  }

  if (!workflowHealth.healthy) {
    recommendations.push('Service health issues detected. Check diagnostics section for details.');
  }

  if (debugResult.debugInfo.timings.total > 45000) {
    recommendations.push('Execution time exceeded normal range. Review performance metrics.');
  }

  if (debugResult.debugInfo.memoryUsage.delta.heapUsed > 100 * 1024 * 1024) {
    recommendations.push('High memory usage detected. Monitor for memory leaks.');
  }

  return recommendations;
}

function generateErrorSuggestions(errors: any[]): string[] {
  const suggestions: string[] = [];
  const errorTypes = Array.from(new Set(errors.map(e => e.type)));

  if (errorTypes.includes('SCRAPING_ERROR')) {
    suggestions.push('Content extraction failed. Try a different page or check for anti-bot protection.');
  }

  if (errorTypes.includes('AI_ANALYSIS_ERROR')) {
    suggestions.push('AI analysis failed. Check Gemini API status and fallback mechanisms.');
  }

  if (errorTypes.includes('DATABASE_ERROR')) {
    suggestions.push('Database issues detected. Check connection and query performance.');
  }

  if (errorTypes.includes('NETWORK_ERROR')) {
    suggestions.push('Network connectivity issues. Check internet connection and firewall settings.');
  }

  if (errorTypes.includes('TIMEOUT_ERROR')) {
    suggestions.push('Timeout occurred. Consider increasing timeout values or optimizing operations.');
  }

  return suggestions;
}

// Method not allowed responses
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to debug a workflow or GET for debug info.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to debug a workflow or GET for debug info.' },
    { status: 405 }
  );
}