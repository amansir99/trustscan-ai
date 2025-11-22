// Error handling utilities for the application

export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SCRAPING_ERROR = 'SCRAPING_ERROR',
  AI_ANALYSIS_ERROR = 'AI_ANALYSIS_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  HEDERA_ERROR = 'HEDERA_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  API_ERROR = 'API_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface AppError {
  type: ErrorType
  message: string
  details?: any
  code?: string | number
  retryable: boolean
  userMessage: string
  suggestions?: string[]
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  component?: string
  userId?: string
  sessionId?: string
  requestId?: string
}

export interface ErrorContext {
  url?: string
  userId?: string
  userAgent?: string
  component?: string
  action?: string
  metadata?: Record<string, any>
}

// Error classification based on HTTP status codes and error patterns
export function classifyError(error: any): ErrorType {
  // Handle null/undefined errors
  if (!error) {
    return ErrorType.UNKNOWN_ERROR
  }

  // Network errors
  if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
    return ErrorType.NETWORK_ERROR
  }

  // HTTP status code based classification
  if (error.status || error.response?.status) {
    const status = error.status || error.response?.status
    
    if (status === 400) return ErrorType.VALIDATION_ERROR
    if (status === 401) return ErrorType.AUTHENTICATION_ERROR
    if (status === 403) return ErrorType.AUTHORIZATION_ERROR
    if (status === 408 || status === 504) return ErrorType.TIMEOUT_ERROR
    if (status === 429) return ErrorType.RATE_LIMIT_ERROR
    if (status >= 400 && status < 500) return ErrorType.CLIENT_ERROR
    if (status >= 500) return ErrorType.SERVER_ERROR
  }

  // Component-specific error classification
  const message = error.message?.toLowerCase() || ''
  const stack = error.stack?.toLowerCase() || ''
  
  // Scraping-related errors
  if (message.includes('puppeteer') || message.includes('browser') || message.includes('scraping') ||
      stack.includes('scraper.ts') || message.includes('anti-bot') || message.includes('cloudflare')) {
    return ErrorType.SCRAPING_ERROR
  }

  // AI/Gemini API errors
  if (message.includes('gemini') || message.includes('ai analysis') || message.includes('openai') ||
      stack.includes('ai-analyzer') || message.includes('model') || message.includes('generation')) {
    return ErrorType.AI_ANALYSIS_ERROR
  }

  // Database errors
  if (message.includes('database') || message.includes('sql') || message.includes('connection pool') ||
      message.includes('postgres') || message.includes('neon') || stack.includes('database.ts')) {
    return ErrorType.DATABASE_ERROR
  }

  // Hedera blockchain errors
  if (message.includes('hedera') || message.includes('hbar') || message.includes('consensus service') ||
      message.includes('hashgraph') || stack.includes('hedera.ts')) {
    return ErrorType.HEDERA_ERROR
  }

  // Message-based classification
  if (message.includes('timeout')) return ErrorType.TIMEOUT_ERROR
  if (message.includes('network') || message.includes('connection')) return ErrorType.NETWORK_ERROR
  if (message.includes('unauthorized') || message.includes('authentication')) return ErrorType.AUTHENTICATION_ERROR
  if (message.includes('forbidden') || message.includes('permission')) return ErrorType.AUTHORIZATION_ERROR
  if (message.includes('rate limit') || message.includes('too many requests')) return ErrorType.RATE_LIMIT_ERROR
  if (message.includes('validation') || message.includes('invalid')) return ErrorType.VALIDATION_ERROR

  return ErrorType.UNKNOWN_ERROR
}

// Generate user-friendly error messages and suggestions
export function createAppError(error: any, context?: ErrorContext): AppError {
  // Handle null/undefined errors
  if (!error) {
    error = { message: 'Unknown error occurred' }
  }
  
  const type = classifyError(error)
  const timestamp = new Date()
  
  const errorConfigs = {
    [ErrorType.VALIDATION_ERROR]: {
      userMessage: 'Please check your input and try again',
      retryable: true,
      severity: 'medium' as const,
      suggestions: [
        'Verify all required fields are filled correctly',
        'Check that URLs start with http:// or https://',
        'Ensure email addresses are in valid format'
      ]
    },
    [ErrorType.SCRAPING_ERROR]: {
      userMessage: 'Unable to extract content from the website',
      retryable: true,
      severity: 'medium' as const,
      suggestions: [
        'Try a different page from the same project',
        'Check if the website is accessible in your browser',
        'Look for alternative documentation sources',
        'The website may have anti-bot protection'
      ]
    },
    [ErrorType.AI_ANALYSIS_ERROR]: {
      userMessage: 'AI analysis service is temporarily unavailable',
      retryable: true,
      severity: 'high' as const,
      suggestions: [
        'Please try again in a few moments',
        'The AI service may be experiencing high demand',
        'Check our status page for service updates'
      ]
    },
    [ErrorType.DATABASE_ERROR]: {
      userMessage: 'Database service is temporarily unavailable',
      retryable: true,
      severity: 'critical' as const,
      suggestions: [
        'Please try again in a few minutes',
        'Your data is safe and will be restored shortly',
        'Contact support if the issue persists'
      ]
    },
    [ErrorType.HEDERA_ERROR]: {
      userMessage: 'Blockchain storage is temporarily unavailable',
      retryable: true,
      severity: 'low' as const,
      suggestions: [
        'Your audit will continue without blockchain storage',
        'Blockchain features will be restored shortly',
        'You can re-audit later to store on blockchain'
      ]
    },
    [ErrorType.NETWORK_ERROR]: {
      userMessage: 'Unable to connect to our servers',
      retryable: true,
      severity: 'medium' as const,
      suggestions: [
        'Check your internet connection',
        'Try refreshing the page',
        'Disable any VPN or proxy temporarily'
      ]
    },
    [ErrorType.API_ERROR]: {
      userMessage: 'Our service is temporarily unavailable',
      retryable: true,
      severity: 'high' as const,
      suggestions: [
        'Please try again in a few moments',
        'Check our status page for updates',
        'Contact support if the issue persists'
      ]
    },
    [ErrorType.AUTHENTICATION_ERROR]: {
      userMessage: 'Please log in to continue',
      retryable: false,
      severity: 'medium' as const,
      suggestions: [
        'Sign in with your account credentials',
        'Reset your password if you forgot it',
        'Create a new account if you don\'t have one'
      ]
    },
    [ErrorType.AUTHORIZATION_ERROR]: {
      userMessage: 'You don\'t have permission to perform this action',
      retryable: false,
      severity: 'medium' as const,
      suggestions: [
        'Upgrade your subscription plan',
        'Contact support for access',
        'Check if you\'re signed in to the correct account'
      ]
    },
    [ErrorType.RATE_LIMIT_ERROR]: {
      userMessage: 'You\'ve made too many requests. Please wait before trying again',
      retryable: true,
      severity: 'low' as const,
      suggestions: [
        'Wait a few minutes before retrying',
        'Upgrade to a higher plan for increased limits',
        'Spread out your requests over time'
      ]
    },
    [ErrorType.TIMEOUT_ERROR]: {
      userMessage: 'The request took too long to complete',
      retryable: true,
      severity: 'medium' as const,
      suggestions: [
        'Try again with a simpler request',
        'Check your internet connection speed',
        'The website might be slow to respond'
      ]
    },
    [ErrorType.SERVER_ERROR]: {
      userMessage: 'Our servers are experiencing issues',
      retryable: true,
      severity: 'high' as const,
      suggestions: [
        'Please try again in a few minutes',
        'Our team has been notified of the issue',
        'Check our status page for updates'
      ]
    },
    [ErrorType.CLIENT_ERROR]: {
      userMessage: 'There was a problem with your request',
      retryable: false,
      severity: 'medium' as const,
      suggestions: [
        'Check your input and try again',
        'Refresh the page and retry',
        'Contact support if the problem continues'
      ]
    },
    [ErrorType.UNKNOWN_ERROR]: {
      userMessage: 'An unexpected error occurred',
      retryable: true,
      severity: 'medium' as const,
      suggestions: [
        'Please try again',
        'Refresh the page if the issue persists',
        'Contact support with details of what you were doing'
      ]
    }
  }

  const config = errorConfigs[type]
  
  return {
    type,
    message: error.message || 'Unknown error occurred',
    details: error,
    code: error.status || error.code,
    retryable: config.retryable,
    userMessage: config.userMessage,
    suggestions: config.suggestions,
    severity: config.severity,
    timestamp,
    component: context?.component,
    userId: context?.userId,
    sessionId: context?.metadata?.sessionId,
    requestId: context?.metadata?.requestId
  }
}

// Error logging and reporting
export class ErrorReporter {
  private static instance: ErrorReporter
  private errors: AppError[] = []
  private maxErrors = 1000
  private errorCounts: Map<string, number> = new Map()
  private lastReportTime: Map<string, number> = new Map()
  private reportThrottleMs = 60000 // 1 minute throttle for duplicate errors

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter()
    }
    return ErrorReporter.instance
  }

  logError(error: AppError, context?: ErrorContext) {
    // Add to local error log
    this.errors.unshift(error)
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors)
    }

    // Track error frequency
    const errorKey = `${error.type}:${error.message}`
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1)

    // Enhanced logging based on severity
    this.logBySeverity(error, context)

    // Report to external service (throttled)
    if (this.shouldReport(error, errorKey)) {
      this.reportToService(error, context)
      this.lastReportTime.set(errorKey, Date.now())
    }
  }

  private logBySeverity(error: AppError, context?: ErrorContext) {
    const logData = {
      type: error.type,
      message: error.message,
      severity: error.severity,
      component: error.component,
      userId: error.userId,
      timestamp: error.timestamp,
      context
    }

    switch (error.severity) {
      case 'critical':
        console.error('🚨 CRITICAL ERROR:', logData)
        break
      case 'high':
        console.error('❌ HIGH SEVERITY:', logData)
        break
      case 'medium':
        console.warn('⚠️ MEDIUM SEVERITY:', logData)
        break
      case 'low':
        if (process.env.NODE_ENV === 'development') {
          console.info('ℹ️ LOW SEVERITY:', logData)
        }
        break
    }
  }

  private shouldReport(error: AppError, errorKey: string): boolean {
    // Always report critical errors
    if (error.severity === 'critical') return true
    
    // Report high severity errors immediately
    if (error.severity === 'high') return true
    
    // Throttle medium and low severity errors
    const lastReport = this.lastReportTime.get(errorKey) || 0
    const now = Date.now()
    
    return now - lastReport > this.reportThrottleMs
  }

  private async reportToService(error: AppError, context?: ErrorContext) {
    try {
      // In production, send to error monitoring service
      if (process.env.NODE_ENV === 'production') {
        const payload = {
          error: {
            type: error.type,
            message: error.message,
            severity: error.severity,
            component: error.component,
            userId: error.userId,
            sessionId: error.sessionId,
            requestId: error.requestId,
            timestamp: error.timestamp,
            retryable: error.retryable,
            code: error.code
          },
          context,
          environment: {
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
            url: typeof window !== 'undefined' ? window.location.href : context?.url,
            timestamp: new Date().toISOString()
          },
          frequency: this.errorCounts.get(`${error.type}:${error.message}`) || 1
        }

        // Send to error reporting endpoint (only in browser context)
        if (typeof window !== 'undefined') {
          await fetch('/api/errors/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }).catch(err => {
            // Fallback logging if reporting fails
            console.error('Failed to report error to service:', err)
          })
        } else {
          // Server-side: just log the error details
          console.error('Server-side error report:', payload)
        }
      }
    } catch (reportingError) {
      console.error('Error reporting failed:', reportingError)
    }
  }

  getRecentErrors(limit = 10): AppError[] {
    return this.errors.slice(0, limit)
  }

  getErrorsByType(type: ErrorType, limit = 10): AppError[] {
    return this.errors.filter(error => error.type === type).slice(0, limit)
  }

  getErrorsBySeverity(severity: AppError['severity'], limit = 10): AppError[] {
    return this.errors.filter(error => error.severity === severity).slice(0, limit)
  }

  getErrorStats(): {
    total: number
    byType: Record<string, number>
    bySeverity: Record<string, number>
    recentCount: number
  } {
    const byType: Record<string, number> = {}
    const bySeverity: Record<string, number> = {}
    const oneHourAgo = Date.now() - 3600000

    this.errors.forEach(error => {
      byType[error.type] = (byType[error.type] || 0) + 1
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1
    })

    const recentCount = this.errors.filter(
      error => error.timestamp.getTime() > oneHourAgo
    ).length

    return {
      total: this.errors.length,
      byType,
      bySeverity,
      recentCount
    }
  }

  clearErrors() {
    this.errors = []
    this.errorCounts.clear()
    this.lastReportTime.clear()
  }

  // Health check method
  isSystemHealthy(): boolean {
    const stats = this.getErrorStats()
    const criticalErrors = stats.bySeverity.critical || 0
    const recentErrors = stats.recentCount
    
    // System is unhealthy if there are critical errors or too many recent errors
    return criticalErrors === 0 && recentErrors < 10
  }
}

// Global error handler function
export function handleError(error: any, context?: ErrorContext): AppError {
  const appError = createAppError(error, context)
  ErrorReporter.getInstance().logError(appError, context)
  return appError
}

// Retry utility with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
  maxDelay = 10000
): Promise<T> {
  let lastError: any
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries) {
        throw error
      }

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      )
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

// Async error boundary for handling promise rejections
export function withAsyncErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: Partial<ErrorContext>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      const appError = handleError(error, context)
      throw appError
    }
  }
}

// Error recovery strategies
export interface RecoveryStrategy {
  canRecover: (error: AppError) => boolean
  recover: (error: AppError) => Promise<void> | void
}

export class ErrorRecoveryManager {
  private strategies: RecoveryStrategy[] = []

  addStrategy(strategy: RecoveryStrategy) {
    this.strategies.push(strategy)
  }

  async attemptRecovery(error: AppError): Promise<boolean> {
    for (const strategy of this.strategies) {
      if (strategy.canRecover(error)) {
        try {
          await strategy.recover(error)
          return true
        } catch (recoveryError) {
          console.warn('Recovery strategy failed:', recoveryError)
        }
      }
    }
    return false
  }
}

// Default recovery strategies
export const defaultRecoveryStrategies: RecoveryStrategy[] = [
  // Retry strategy for retryable errors
  {
    canRecover: (error) => error.retryable && error.type !== ErrorType.RATE_LIMIT_ERROR,
    recover: async (error) => {
      console.log('Attempting retry for:', error.type)
    }
  },
  
  // Authentication recovery
  {
    canRecover: (error) => error.type === ErrorType.AUTHENTICATION_ERROR,
    recover: async (error) => {
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  },
  
  // Rate limit recovery
  {
    canRecover: (error) => error.type === ErrorType.RATE_LIMIT_ERROR,
    recover: async (error) => {
      console.log('Rate limited, suggesting user wait')
    }
  },

  // Database error recovery
  {
    canRecover: (error) => error.type === ErrorType.DATABASE_ERROR,
    recover: async (error) => {
      // Attempt to reconnect or use cached data
      console.log('Database error, attempting recovery')
    }
  },

  // AI Analysis error recovery
  {
    canRecover: (error) => error.type === ErrorType.AI_ANALYSIS_ERROR,
    recover: async (error) => {
      // Fallback to simpler analysis or cached results
      console.log('AI analysis failed, using fallback method')
    }
  },

  // Scraping error recovery
  {
    canRecover: (error) => error.type === ErrorType.SCRAPING_ERROR,
    recover: async (error) => {
      // Try alternative scraping methods or cached content
      console.log('Scraping failed, trying alternative method')
    }
  },

  // Hedera error recovery
  {
    canRecover: (error) => error.type === ErrorType.HEDERA_ERROR,
    recover: async (error) => {
      // Continue without blockchain storage
      console.log('Hedera error, continuing without blockchain storage')
    }
  }
]

// Enhanced fallback strategies
export interface FallbackStrategy {
  errorType: ErrorType
  fallback: () => Promise<any> | any
  description: string
}

export const fallbackStrategies: FallbackStrategy[] = [
  {
    errorType: ErrorType.AI_ANALYSIS_ERROR,
    fallback: async () => {
      // Return basic analysis structure when AI fails
      return {
        trustScore: 50,
        riskLevel: 'medium',
        analysis: 'AI analysis temporarily unavailable. Basic assessment provided.',
        recommendations: ['Manual review recommended', 'Try again later for detailed analysis']
      }
    },
    description: 'Provide basic trust assessment when AI analysis fails'
  },
  
  {
    errorType: ErrorType.DATABASE_ERROR,
    fallback: async () => {
      // Use local storage or memory cache
      if (typeof window !== 'undefined' && window.localStorage) {
        return JSON.parse(localStorage.getItem('fallback_data') || '{}')
      }
      return {}
    },
    description: 'Use local storage when database is unavailable'
  },
  
  {
    errorType: ErrorType.SCRAPING_ERROR,
    fallback: async () => {
      // Return cached content or prompt for manual input
      return {
        content: '',
        source: 'manual',
        message: 'Content extraction failed. Please provide project information manually.'
      }
    },
    description: 'Prompt for manual input when scraping fails'
  },
  
  {
    errorType: ErrorType.HEDERA_ERROR,
    fallback: async () => {
      // Continue without blockchain storage
      return {
        stored: false,
        message: 'Report saved locally. Blockchain storage will be attempted later.'
      }
    },
    description: 'Save locally when blockchain storage fails'
  }
]

// Circuit breaker pattern for preventing cascading failures
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  
  constructor(
    private threshold = 5,
    private timeout = 60000, // 1 minute
    private resetTimeout = 30000 // 30 seconds
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open')
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failures = 0
    this.state = 'closed'
  }

  private onFailure() {
    this.failures++
    this.lastFailureTime = Date.now()
    
    if (this.failures >= this.threshold) {
      this.state = 'open'
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    }
  }
}