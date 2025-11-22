import { NextRequest, NextResponse } from 'next/server'
import { ErrorReporter } from '@/lib/error-handler'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { error, context, environment, frequency } = body

    // Log the error for monitoring
    console.error('Error Report Received:', {
      type: error.type,
      severity: error.severity,
      message: error.message,
      component: error.component,
      userId: error.userId,
      frequency,
      environment: {
        userAgent: environment.userAgent,
        url: environment.url,
        timestamp: environment.timestamp
      }
    })

    // In production, you would send this to external monitoring services
    // Examples: Sentry, DataDog, New Relic, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Sentry
      // Sentry.captureException(new Error(error.message), {
      //   tags: {
      //     errorType: error.type,
      //     severity: error.severity,
      //     component: error.component
      //   },
      //   user: { id: error.userId },
      //   extra: { context, environment, frequency }
      // })

      // Example: Send to custom logging service
      // await logToExternalService({
      //   error,
      //   context,
      //   environment,
      //   frequency
      // })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Error reported successfully' 
    })
  } catch (reportingError) {
    console.error('Failed to process error report:', reportingError)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process error report' 
      },
      { status: 500 }
    )
  }
}

// Health check endpoint for error monitoring
export async function GET() {
  try {
    const reporter = ErrorReporter.getInstance()
    const stats = reporter.getErrorStats()
    const isHealthy = reporter.isSystemHealthy()

    return NextResponse.json({
      healthy: isHealthy,
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { 
        healthy: false, 
        error: 'Failed to get error stats',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}