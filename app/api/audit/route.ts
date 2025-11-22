import { NextRequest, NextResponse } from 'next/server'
import { ContentExtractionService } from '@/lib/scraper'
import { AIAnalysisService } from '@/lib/ai-analyzer'
import { TrustScoreCalculator } from '@/lib/trust-calculator'
import { ReportGenerator } from '@/lib/report-generator'
import { ReportPersistenceService } from '@/lib/report-persistence-supabase'
import { getTokenFromRequest, verifyToken, validateEmail } from '@/lib/auth'
import { getHederaService, type AuditData } from '@/lib/hedera'
import { UsageTracker } from '@/lib/usage-tracker'
import { RateLimiters, withRateLimit, globalRequestQueue } from '@/lib/rate-limiter'
import { Caches, CacheKeyGenerator, withCache } from '@/lib/cache'
import { performanceMonitor } from '@/lib/performance-monitor'
import { reportCache } from '@/lib/report-cache'

// Utility functions
async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorMessage))
    }, timeoutMs)

    operation()
      .then(result => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch(error => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  baseDelay: number
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      if (attempt === maxRetries) {
        throw lastError
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

// Service instances
const extractionService = new ContentExtractionService()
const analysisService = new AIAnalysisService()
const scoreCalculator = new TrustScoreCalculator()
const reportGenerator = new ReportGenerator()
const persistenceService = new ReportPersistenceService()

// Request/Response interfaces for type safety
interface AnalyzeRequest {
  url: string;
  options?: {
    storeOnHedera?: boolean;
    detailedAnalysis?: boolean;
    forceRefresh?: boolean;
  };
}

interface AnalyzeResponse {
  success: boolean;
  auditId: string;
  report?: any;
  summary?: any;
  hederaTransactionId?: string;
  error?: string;
}

/**
 * POST /api/audit/analyze - Main audit analysis endpoint
 * Requirements: 1.1, 2.1, 3.1, 4.1, 7.1, 7.2
 * 
 * Integrates content extraction, AI analysis, and scoring services
 * with proper error handling, rate limiting, caching, and performance monitoring
 */
export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  // Start performance monitoring
  const requestId = performanceMonitor.startRequest(request)
  
  try {
    // Apply rate limiting first
    return await withRateLimit(RateLimiters.audit)(request, async (req: NextRequest) => {
      // Check if we should queue the request during high load
      const queueStats = globalRequestQueue.getStats()
      if (queueStats.queueLength > 50) {
        return globalRequestQueue.enqueue(req, auditHandler, 1) // High priority for audit requests
      }
      
      return auditHandler(req)
    })
  } finally {
    // End performance monitoring
    performanceMonitor.endRequest(requestId, 200)
  }
}

/**
 * Main audit handler with caching and optimization
 */
async function auditHandler(request: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  const startTime = Date.now()
  let auditId: string | undefined
  
  try {
    // Parse and validate request body
    const body = await parseRequestBody(request)
    const { url, options = {} } = body

    // Authenticate user
    const authenticatedUser = await authenticateRequest(request)
    const user = authenticatedUser || { id: 'anonymous', email: 'anonymous@trustscan.ai' }

    // Validate URL format and accessibility
    const urlValidation = validateUrl(url)
    if (!urlValidation.valid) {
      return NextResponse.json({ 
        success: false, 
        error: urlValidation.error,
        auditId: '' 
      }, { status: 400 })
    }

    // Check usage limits for authenticated users
    if (user.id !== 'anonymous') {
      try {
        const canAudit = await UsageTracker.canUserAudit(user.id)
        if (!canAudit.allowed) {
          return NextResponse.json({
            success: false,
            error: canAudit.reason || 'Monthly audit limit reached. Please upgrade your subscription to continue.',
            auditId: '',
            stats: canAudit.stats
          }, { status: 429 })
        }
      } catch (error) {
        console.error('Error checking usage limits:', error)
        // Continue with audit if usage check fails
      }
    }

    // Check cache for existing audit results
    const cacheKey = CacheKeyGenerator.auditResult(url, options)
    const cachedResult = Caches.auditResults.get(cacheKey)
    
    if (cachedResult && !options.forceRefresh) {
      console.log(`Cache hit for audit: ${url}`)
      
      // Still track usage for cached results (if authenticated)
      if (user.id !== 'anonymous') {
        await UsageTracker.incrementUserAuditCount(user.id)
      }
      
      return NextResponse.json({
        success: true,
        ...cachedResult,
        cached: true,
        cacheTimestamp: Date.now()
      })
    }

    // Step 1: Extract website content with optimized timeout and caching
    console.log(`Starting content extraction for ${url}`)
    const extractedContent = await withTimeout(
      async () => {
        const contentCacheKey = CacheKeyGenerator.contentExtraction(url)
        const cachedContent = Caches.contentExtraction.get(contentCacheKey)
        
        if (cachedContent) {
          console.log(`Cache hit for content extraction: ${url}`)
          return cachedContent
        }
        
        const content = await extractionService.extractWebsiteContent(url)
        
        // Cache content extraction results
        Caches.contentExtraction.set(contentCacheKey, content, 15 * 60 * 1000) // 15 minutes
        
        return content
      },
      45000, // Reduced to 45 seconds for better UX
      'Content extraction timed out'
    )
    console.log(`Content extraction completed: ${extractedContent.contentLength} characters`)

    // Step 2: Analyze content with AI (with caching and improved retry logic)
    console.log('Starting AI analysis')
    const analysisCacheKey = CacheKeyGenerator.aiAnalysis(url, extractedContent.contentLength)
    let analysis = Caches.aiAnalysis?.get(analysisCacheKey)
    
    if (!analysis) {
      analysis = await retryWithBackoff(
        () => analysisService.analyzeContent(extractedContent),
        2, // Reduced to 2 attempts for faster fallback
        1500 // Reduced base delay
      )
      
      // Cache AI analysis results for 10 minutes
      if (Caches.aiAnalysis) {
        Caches.aiAnalysis.set(analysisCacheKey, analysis, 10 * 60 * 1000)
      }
    } else {
      console.log('Cache hit for AI analysis')
    }
    console.log('AI analysis completed')

    // Step 3: Calculate trust score
    console.log('Calculating trust score')
    const analysisInput = {
      factors: analysis.factors,
      redFlags: analysis.redFlags,
      positiveIndicators: analysis.positiveIndicators,
      contentCompleteness: Math.min(100, (extractedContent.mainContent.length / 1000) * 100),
      extractedContentLength: extractedContent.mainContent.length
    }
    const trustScore = scoreCalculator.calculateTrustScore(analysisInput)
    console.log(`Trust score calculated: ${trustScore.finalScore}`)

    // Step 4: Generate comprehensive report
    console.log('Generating audit report')
    const auditReport = reportGenerator.generateFullReport(
      analysis,
      trustScore,
      extractedContent,
      user.id
    )
    auditId = auditReport.id

    // Step 5: Submit to Hedera if requested (async, don't block response)
    let hederaTransactionId: string | undefined
    let hederaStorageStatus: any = null
    if (options.storeOnHedera) {
      try {
        console.log('Submitting to Hedera blockchain')
        const hederaService = getHederaService()
        
        const auditData: AuditData = {
          id: auditReport.id,
          url: auditReport.url,
          trustScore: auditReport.trustScore.finalScore,
          riskLevel: auditReport.trustScore.riskLevel,
          userId: user.id,
          timestamp: new Date()
        }
        
        const hederaResult = await withTimeout(
          () => hederaService.storeAuditHash(auditData, true),
          15000, // 15 second timeout for Hedera
          'Hedera submission timed out'
        )
        
        hederaTransactionId = hederaResult.transactionId
        hederaStorageStatus = hederaService.getStorageStatus(hederaTransactionId)
        auditReport.hederaTransactionId = hederaTransactionId
        
        console.log(`Hedera submission successful: ${hederaTransactionId}`)
      } catch (error) {
        console.error('Hedera submission failed:', error)
        // Continue without Hedera storage - don't fail the entire request
      }
    }

    // Step 6: Generate report ID (no database storage)
    console.log('Generating report ID (database storage disabled)')
    console.log(`Report generated with ID: ${auditReport.id}`)

    // Step 7: Track usage (if authenticated)
    if (user.id !== 'anonymous') {
      try {
        await UsageTracker.incrementUserAuditCount(user.id)
        console.log(`✅ Usage tracked for user: ${user.id}`)
      } catch (error) {
        console.error('Failed to track usage:', error)
        // Continue without failing the request
      }
    }

    // Step 8: Generate response with full report data for direct display
    const processingTime = Date.now() - startTime
    console.log(`Audit completed in ${processingTime}ms`)

    // Always generate detailed report for direct display
    const detailedReport = reportGenerator.generateDetailedReport(auditReport)
    const summaryReport = reportGenerator.generateSummaryReport(auditReport)
    
    const responseData = {
      success: true,
      auditId: auditReport.id,
      report: detailedReport,
      summary: summaryReport,
      fullAuditData: {
        id: auditReport.id,
        url: auditReport.url,
        created_at: new Date().toISOString(),
        trust_score: auditReport.trustScore.finalScore,
        analysis_data: {
          factors: analysis.factors,
          explanations: analysis.explanations || {},
          recommendations: analysis.recommendations || [],
          risks: analysis.redFlags || [],
          positiveIndicators: analysis.positiveIndicators || []
        },
        hedera_transaction_id: hederaTransactionId,
        blockchain_status: {
          stored: !!hederaTransactionId,
          network: 'testnet',
          verifiable: false
        }
      },
      hederaTransactionId,
      hederaStorageStatus,
      processingTime,
      stored: false
    }
    
    // Cache the reports
    console.log(`Caching report with ID: ${auditReport.id}`)
    reportCache.set(auditReport.id, detailedReport, summaryReport)
    console.log(`Report cached successfully: ${auditReport.id}`)

    // Cache the successful result
    Caches.auditResults.set(cacheKey, responseData, 30 * 60 * 1000) // 30 minutes

    return NextResponse.json(responseData)

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`Audit API error after ${processingTime}ms:`, error)

    // Log error details for debugging
    if (auditId) {
      console.error(`Failed audit ID: ${auditId}`)
    }

    // Return appropriate error response based on error type
    return handleAuditError(error, auditId)
  }
}

/**
 * Parses and validates the request body
 */
async function parseRequestBody(request: NextRequest): Promise<AnalyzeRequest> {
  try {
    const body = await request.json()
    
    if (!body || typeof body !== 'object') {
      throw new Error('Invalid request body format')
    }

    return body as AnalyzeRequest
  } catch (error) {
    throw new Error('Invalid JSON in request body')
  }
}

/**
 * Authenticates the request and returns user info
 */
async function authenticateRequest(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) {
    return null
  }

  const user = await verifyToken(token)
  if (!user) {
    return null
  }

  // Validate email format as additional security check
  if (!validateEmail(user.email)) {
    console.warn(`Invalid email format in token: ${user.email}`)
    return null
  }

  return user
}

/**
 * Validates URL format and basic accessibility
 */
function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required and must be a string' }
  }

  if (url.length > 2048) {
    return { valid: false, error: 'URL is too long (maximum 2048 characters)' }
  }

  try {
    const urlObj = new URL(url)
    
    // Check protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'URL must use HTTP or HTTPS protocol' }
    }

    // Check for localhost/private IPs (security measure)
    const hostname = urlObj.hostname.toLowerCase()
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')) {
      return { valid: false, error: 'Private/local URLs are not allowed' }
    }

    // Check for suspicious patterns
    if (hostname.includes('..') || hostname.includes('//')) {
      return { valid: false, error: 'Invalid URL format detected' }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' }
  }
}

/**
 * Handles different types of errors and returns appropriate responses
 */
function handleAuditError(error: unknown, auditId?: string): NextResponse<AnalyzeResponse> {
  const baseResponse = {
    success: false,
    auditId: auditId || ''
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out')) {
      return NextResponse.json({
        ...baseResponse,
        error: 'Website analysis timed out. The site may be slow to respond. Please try again.'
      }, { status: 408 })
    }

    // Access denied errors
    if (message.includes('access denied') || 
        message.includes('403') || 
        message.includes('forbidden')) {
      return NextResponse.json({
        ...baseResponse,
        error: 'Website access denied. The site may be blocking automated analysis or require authentication.'
      }, { status: 403 })
    }

    // Not found errors
    if (message.includes('not found') || 
        message.includes('404') || 
        message.includes('enotfound')) {
      return NextResponse.json({
        ...baseResponse,
        error: 'Website not found. Please check the URL and try again.'
      }, { status: 404 })
    }

    // Rate limiting errors
    if (message.includes('rate limit') || 
        message.includes('429') || 
        message.includes('too many requests')) {
      return NextResponse.json({
        ...baseResponse,
        error: 'Rate limit exceeded. Please wait a moment before trying again.'
      }, { status: 429 })
    }

    // Network errors
    if (message.includes('network') || 
        message.includes('connection') || 
        message.includes('econnrefused')) {
      return NextResponse.json({
        ...baseResponse,
        error: 'Network error occurred. Please check your connection and try again.'
      }, { status: 503 })
    }

    // Content extraction errors
    if (message.includes('content too small') || 
        message.includes('insufficient content')) {
      return NextResponse.json({
        ...baseResponse,
        error: 'Insufficient content found on the website. Please ensure the URL points to a valid DeFi project page.'
      }, { status: 422 })
    }

    // AI analysis errors
    if (message.includes('gemini') || 
        message.includes('ai analysis') || 
        message.includes('analysis failed')) {
      return NextResponse.json({
        ...baseResponse,
        error: 'AI analysis service temporarily unavailable. Please try again in a few minutes.'
      }, { status: 503 })
    }

    // Database errors
    if (message.includes('database') || 
        message.includes('connection pool') || 
        message.includes('query failed')) {
      return NextResponse.json({
        ...baseResponse,
        error: 'Database service temporarily unavailable. Please try again later.'
      }, { status: 503 })
    }

    // Validation errors
    if (message.includes('validation') || 
        message.includes('invalid') || 
        message.includes('required')) {
      return NextResponse.json({
        ...baseResponse,
        error: error.message
      }, { status: 400 })
    }

    // Generic error with message
    return NextResponse.json({
      ...baseResponse,
      error: `Analysis failed: ${error.message}`
    }, { status: 500 })
  }

  // Unknown error type
  return NextResponse.json({
    ...baseResponse,
    error: 'An unexpected error occurred during analysis. Please try again later.'
  }, { status: 500 })
}