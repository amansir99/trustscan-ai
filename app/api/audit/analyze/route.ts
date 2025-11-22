import { NextRequest, NextResponse } from 'next/server'
import { AuditWorkflowService, AuditWorkflowOptions } from '@/lib/audit-workflow-service'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { UsageTracker } from '@/lib/usage-tracker'
import { performanceMonitor } from '@/lib/performance-monitor'
import { ErrorReporter, handleError } from '@/lib/error-handler'

// Initialize integrated workflow service
const workflowService = new AuditWorkflowService()
const errorReporter = ErrorReporter.getInstance()

interface AnalyzeRequest {
  url: string;
  options?: {
    storeOnHedera?: boolean;
    detailedAnalysis?: boolean;
  };
}

interface AnalyzeResponse {
  success: boolean;
  auditId: string;
  report?: any;
  summary?: any;
  hederaTransactionId?: string;
  error?: string;
  metadata?: {
    processingTime: number;
    steps: any[];
    performance: any;
    warnings: string[];
    fallbacksUsed: string[];
  };
}

/**
 * POST /api/audit/analyze - Main audit analysis endpoint using integrated workflow
 * Requirements: 1.1, 2.1, 3.1, 4.1, 7.1, 7.2
 */
export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  const requestId = performanceMonitor.startRequest(request);
  
  try {
    // Parse request body
    let requestBody: AnalyzeRequest;
    try {
      requestBody = await request.json();
    } catch (error) {
      const appError = handleError(error, {
        component: 'AuditAnalyzeAPI',
        action: 'parseRequestBody'
      });
      errorReporter.logError(appError);
      
      return NextResponse.json(
        { 
          success: false, 
          auditId: '', 
          error: 'Invalid JSON in request body' 
        },
        { status: 400 }
      );
    }

    const { url, options = {} } = requestBody;

    // Validate required fields
    if (!url) {
      return NextResponse.json(
        { 
          success: false, 
          auditId: '', 
          error: 'URL is required' 
        },
        { status: 400 }
      );
    }

    // Validate URL format (Requirement 7.1)
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
          auditId: '', 
          error: 'Invalid URL format. Please provide a valid HTTP or HTTPS URL.' 
        },
        { status: 400 }
      );
    }

    console.log(`✅ URL validated: ${validatedUrl.toString()} - proceeding with audit`);
    console.log(`🔧 Note: All websites are accepted. Scraper has robust fallback mechanisms.`);

    // Authenticate user (Requirement 7.2)
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          auditId: '', 
          error: 'Authentication required. Please log in to perform audits.' 
        },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          auditId: '', 
          error: 'Invalid authentication token. Please log in again.' 
        },
        { status: 401 }
      );
    }

    // Temporarily skip usage limits check to allow audit generation
    // TODO: Re-enable when database issues are resolved
    console.log('⚠️ Usage limits check temporarily disabled');

    // Execute integrated audit workflow (Requirements: 1.1, 2.1, 3.1, 4.1, 7.1)
    console.log(`🚀 Starting integrated audit workflow for ${validatedUrl.toString()}`);
    
    const workflowOptions: AuditWorkflowOptions = {
      url: validatedUrl.toString(),
      userId: user.id,
      storeOnHedera: options.storeOnHedera || false,
      detailedAnalysis: options.detailedAnalysis || false,
      priority: 'normal',
      timeout: 30000, // 30 seconds
      retryAttempts: 3
    };

    const workflowResult = await workflowService.executeAuditWorkflow(workflowOptions, request);

    // Handle workflow failure
    if (!workflowResult.success) {
      const error = workflowResult.error!;
      
      // Map error types to appropriate HTTP status codes
      let statusCode = 500;
      let userMessage = error.userMessage || 'An unexpected error occurred during analysis.';

      switch (error.type) {
        case 'VALIDATION_ERROR':
          statusCode = 400;
          break;
        case 'SCRAPING_ERROR':
          statusCode = error.message.includes('timeout') ? 408 :
                      error.message.includes('403') ? 403 :
                      error.message.includes('404') ? 404 :
                      error.message.includes('network') ? 502 : 500;
          break;
        case 'AI_ANALYSIS_ERROR':
          statusCode = 503;
          userMessage = 'AI analysis service temporarily unavailable. Please try again in a few minutes.';
          break;
        case 'AUTHENTICATION_ERROR':
          statusCode = 401;
          break;
        case 'RATE_LIMIT_ERROR':
          statusCode = 429;
          break;
        case 'NETWORK_ERROR':
          statusCode = 502;
          break;
        default:
          statusCode = 500;
      }

      // Log comprehensive error details
      console.error(`❌ Audit workflow failed for ${validatedUrl.toString()}`, {
        userId: user.id,
        errorType: error.type,
        errorMessage: error.message,
        processingTime: workflowResult.metadata.processingTime,
        stepsCompleted: workflowResult.metadata.steps.filter(s => s.success).length,
        totalSteps: workflowResult.metadata.steps.length,
        warnings: workflowResult.metadata.warnings,
        fallbacksUsed: workflowResult.metadata.fallbacksUsed
      });

      return NextResponse.json(
        { 
          success: false, 
          auditId: '', 
          error: userMessage,
          metadata: {
            processingTime: workflowResult.metadata.processingTime,
            steps: workflowResult.metadata.steps,
            performance: workflowResult.metadata.performance,
            warnings: workflowResult.metadata.warnings,
            fallbacksUsed: workflowResult.metadata.fallbacksUsed
          }
        },
        { status: statusCode }
      );
    }

    // Handle workflow success
    console.log(`✅ Audit workflow completed successfully for ${validatedUrl.toString()}`, {
      userId: user.id,
      auditId: workflowResult.auditId,
      processingTime: workflowResult.metadata.processingTime,
      performance: workflowResult.metadata.performance,
      warnings: workflowResult.metadata.warnings.length,
      fallbacksUsed: workflowResult.metadata.fallbacksUsed.length,
      hederaStored: !!workflowResult.hederaTransactionId
    });

    // Return successful response with comprehensive metadata
    const response: AnalyzeResponse = {
      success: true,
      auditId: workflowResult.auditId!,
      report: workflowResult.report,
      summary: workflowResult.summary,
      hederaTransactionId: workflowResult.hederaTransactionId,
      metadata: {
        processingTime: workflowResult.metadata.processingTime,
        steps: workflowResult.metadata.steps,
        performance: workflowResult.metadata.performance,
        warnings: workflowResult.metadata.warnings,
        fallbacksUsed: workflowResult.metadata.fallbacksUsed
      }
    };

    performanceMonitor.endRequest(requestId, 200);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Unexpected error in audit analysis API:', error);

    // Report unexpected errors
    const appError = handleError(error, {
      component: 'AuditAnalyzeAPI',
      action: 'executeWorkflow'
    });
    errorReporter.logError(appError);

    performanceMonitor.endRequest(requestId, 500);

    // Generic error response for unexpected errors
    return NextResponse.json(
      { 
        success: false, 
        auditId: '', 
        error: 'An unexpected error occurred during analysis. Please try again later.' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/audit/analyze - Comprehensive health check for audit workflow
 */
export async function GET() {
  try {
    const health = await workflowService.getWorkflowHealth();
    const statistics = workflowService.getWorkflowStatistics();
    
    if (health.healthy) {
      return NextResponse.json({
        status: 'healthy',
        message: 'Audit workflow is fully operational',
        services: health.services,
        diagnostics: health.diagnostics,
        statistics: {
          totalWorkflows: statistics.totalWorkflowsExecuted,
          successRate: statistics.totalWorkflowsExecuted > 0 
            ? Math.round((statistics.successfulWorkflows / statistics.totalWorkflowsExecuted) * 100) 
            : 100,
          averageProcessingTime: Math.round(statistics.averageProcessingTime),
          serviceReliability: statistics.serviceReliability
        },
        lastHealthCheck: health.lastHealthCheck,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        status: 'degraded',
        message: 'Some audit services are experiencing issues',
        services: health.services,
        issues: health.issues,
        diagnostics: health.diagnostics,
        statistics: {
          totalWorkflows: statistics.totalWorkflowsExecuted,
          successRate: statistics.totalWorkflowsExecuted > 0 
            ? Math.round((statistics.successfulWorkflows / statistics.totalWorkflowsExecuted) * 100) 
            : 0,
          averageProcessingTime: Math.round(statistics.averageProcessingTime),
          serviceReliability: statistics.serviceReliability,
          errorDistribution: statistics.errorDistribution
        },
        lastHealthCheck: health.lastHealthCheck,
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
  } catch (error) {
    console.error('Audit workflow health check failed:', error);
    
    // Report the health check failure
    const appError = handleError(error, {
      component: 'AuditAnalyzeAPI',
      action: 'healthCheck'
    });
    errorReporter.logError(appError);

    return NextResponse.json({
      status: 'unhealthy',
      message: 'Audit workflow health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      fallbackAvailable: true,
      recommendations: [
        'Try again in a few minutes',
        'Check individual service status',
        'Contact support if issues persist'
      ]
    }, { status: 500 });
  }
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to analyze a website.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to analyze a website.' },
    { status: 405 }
  );
}