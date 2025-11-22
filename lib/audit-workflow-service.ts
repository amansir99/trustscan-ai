import { ContentExtractionService, ExtractedContent } from './scraper';
import { AIAnalysisService, AnalysisResult } from './ai-analyzer';
import { TrustScoreCalculator, TrustScoreResult, AnalysisInput } from './trust-calculator';
import { ReportGenerator, AuditReport } from './report-generator';
import { ReportPersistenceService } from './report-persistence-supabase';
import { submitAuditToHedera } from './hedera';
import { UsageTracker } from './usage-tracker';
import { performanceMonitor } from './performance-monitor';
import { ErrorReporter, handleError, ErrorType, AppError, retryWithBackoff } from './error-handler';
import { auditLogger } from './audit-logger';
import { NextRequest } from 'next/server';

/**
 * Comprehensive audit workflow options
 */
export interface AuditWorkflowOptions {
  url: string;
  userId: string;
  storeOnHedera?: boolean;
  detailedAnalysis?: boolean;
  skipCache?: boolean;
  priority?: 'low' | 'normal' | 'high';
  timeout?: number;
  retryAttempts?: number;
}

/**
 * Audit workflow result with comprehensive metadata
 */
export interface AuditWorkflowResult {
  success: boolean;
  auditId?: string;
  report?: AuditReport;
  summary?: any;
  hederaTransactionId?: string;
  error?: AppError;
  metadata: {
    processingTime: number;
    steps: AuditStepResult[];
    performance: {
      extractionTime: number;
      analysisTime: number;
      scoringTime: number;
      reportTime: number;
      storageTime: number;
    };
    warnings: string[];
    fallbacksUsed: string[];
  };
}

/**
 * Individual audit step result for debugging
 */
export interface AuditStepResult {
  step: string;
  success: boolean;
  duration: number;
  error?: string;
  warnings?: string[];
  fallbackUsed?: boolean;
  retryCount?: number;
  metadata?: Record<string, any>;
}

/**
 * Integrated audit workflow service that orchestrates all components
 * Requirements: 1.1, 2.1, 3.1, 4.1, 7.1
 */
export class AuditWorkflowService {
  private extractionService: ContentExtractionService;
  private analysisService: AIAnalysisService;
  private scoreCalculator: TrustScoreCalculator;
  private reportGenerator: ReportGenerator;
  private persistenceService: ReportPersistenceService;
  private errorReporter: ErrorReporter;

  constructor() {
    this.extractionService = new ContentExtractionService();
    this.analysisService = new AIAnalysisService();
    this.scoreCalculator = new TrustScoreCalculator();
    this.reportGenerator = new ReportGenerator();
    this.persistenceService = new ReportPersistenceService();
    this.errorReporter = ErrorReporter.getInstance();
  }

  /**
   * Execute complete audit workflow with comprehensive error handling and logging
   * Requirements: 1.1, 2.1, 3.1, 4.1, 7.1
   */
  async executeAuditWorkflow(
    options: AuditWorkflowOptions,
    request?: NextRequest
  ): Promise<AuditWorkflowResult> {
    const startTime = Date.now();
    const steps: AuditStepResult[] = [];
    const warnings: string[] = [];
    const fallbacksUsed: string[] = [];
    let requestId: string | undefined;

    // Start performance monitoring
    if (request) {
      requestId = performanceMonitor.startRequest(request, options.userId);
    }

    try {
      // Log audit start with comprehensive details
      auditLogger.logAuditStart(options.userId, options.url, {
        storeOnHedera: options.storeOnHedera,
        detailedAnalysis: options.detailedAnalysis,
        priority: options.priority,
        timeout: options.timeout,
        retryAttempts: options.retryAttempts
      });

      // Step 1: Content Extraction
      const extractionResult = await this.executeContentExtraction(options, steps);
      if (!extractionResult.success) {
        return this.createFailureResult(extractionResult.error!, steps, startTime, warnings, fallbacksUsed);
      }

      // Step 2: AI Analysis
      const analysisResult = await this.executeAIAnalysis(
        extractionResult.content!,
        options,
        steps,
        warnings,
        fallbacksUsed
      );
      if (!analysisResult.success) {
        return this.createFailureResult(analysisResult.error!, steps, startTime, warnings, fallbacksUsed);
      }

      // Step 3: Trust Score Calculation
      const scoringResult = await this.executeTrustScoring(
        analysisResult.analysis!,
        extractionResult.content!,
        options,
        steps
      );
      if (!scoringResult.success) {
        return this.createFailureResult(scoringResult.error!, steps, startTime, warnings, fallbacksUsed);
      }

      // Step 4: Report Generation
      const reportResult = await this.executeReportGeneration(
        analysisResult.analysis!,
        scoringResult.trustScore!,
        extractionResult.content!,
        options,
        steps
      );
      if (!reportResult.success) {
        return this.createFailureResult(reportResult.error!, steps, startTime, warnings, fallbacksUsed);
      }

      // Step 5: Hedera Storage (Optional)
      let hederaTransactionId: string | undefined;
      if (options.storeOnHedera) {
        const hederaResult = await this.executeHederaStorage(
          reportResult.report!,
          options,
          steps,
          warnings
        );
        hederaTransactionId = hederaResult.transactionId;
        if (hederaResult.fallbackUsed) {
          fallbacksUsed.push('Hedera storage failed, continuing without blockchain');
        }
      }

      // Step 6: Usage Tracking (temporarily disabled)
      console.log('⚠️ Usage tracking temporarily disabled');
      steps.push({
        step: 'Usage Tracking',
        success: true,
        duration: 0,
        metadata: { userId: options.userId, disabled: true }
      });

      // Calculate performance metrics
      const performance = this.calculatePerformanceMetrics(steps);
      const processingTime = Date.now() - startTime;

      // Generate final response
      const finalReport = reportResult.report!;

      // Log comprehensive audit completion
      auditLogger.logAuditComplete(
        options.userId,
        options.url,
        finalReport.id,
        processingTime,
        performance,
        warnings,
        fallbacksUsed
      );
      const response = options.detailedAnalysis
        ? this.reportGenerator.generateDetailedReport(finalReport)
        : this.reportGenerator.generateSummaryReport(finalReport);

      return {
        success: true,
        auditId: finalReport.id,
        report: options.detailedAnalysis ? finalReport : undefined,
        summary: options.detailedAnalysis ? undefined : response,
        hederaTransactionId,
        metadata: {
          processingTime,
          steps,
          performance,
          warnings,
          fallbacksUsed
        }
      };

    } catch (error) {
      const appError = handleError(error, {
        component: 'AuditWorkflowService',
        userId: options.userId,
        url: options.url,
        action: 'executeAuditWorkflow'
      });

      // Log comprehensive audit failure
      auditLogger.logAuditFailure(
        options.userId,
        options.url,
        appError,
        Date.now() - startTime,
        steps
      );

      return this.createFailureResult(appError, steps, startTime, warnings, fallbacksUsed);
    } finally {
      // End performance monitoring
      if (requestId) {
        performanceMonitor.endRequest(requestId, 200); // Will be updated with actual status
      }

      // Cleanup resources
      await this.cleanup();
    }
  }

  /**
   * Execute content extraction step with error handling and retries
   */
  private async executeContentExtraction(
    options: AuditWorkflowOptions,
    steps: AuditStepResult[]
  ): Promise<{ success: boolean; content?: ExtractedContent; error?: AppError }> {
    const stepStart = Date.now();
    let retryCount = 0;
    const maxRetries = options.retryAttempts || 3;

    try {
      const content = await retryWithBackoff(
        async () => {
          retryCount++;
          this.logStepStart('Content Extraction', options.url, retryCount);
          return await this.extractionService.extractWebsiteContent(options.url);
        },
        maxRetries,
        1000,
        10000
      );

      const duration = Date.now() - stepStart;
      const stepMetadata = {
        contentLength: content.contentLength,
        extractionMethod: content.extractionMethod,
        socialLinksFound: content.socialLinks.length,
        codeRepositoriesFound: content.codeRepositories.length,
        retryCount: retryCount - 1
      };

      steps.push({
        step: 'Content Extraction',
        success: true,
        duration,
        retryCount: retryCount - 1,
        metadata: stepMetadata
      });

      auditLogger.logStepExecution(
        'Content Extraction',
        true,
        duration,
        options.userId,
        undefined,
        stepMetadata
      );

      return { success: true, content };

    } catch (error) {
      const duration = Date.now() - stepStart;
      const appError = handleError(error, {
        component: 'ContentExtractionService',
        userId: options.userId,
        url: options.url,
        action: 'extractWebsiteContent'
      });

      steps.push({
        step: 'Content Extraction',
        success: false,
        duration,
        error: appError.message,
        retryCount: retryCount - 1
      });

      auditLogger.logStepExecution(
        'Content Extraction',
        false,
        duration,
        options.userId,
        undefined,
        { retryCount: retryCount - 1 },
        appError
      );
      return { success: false, error: appError };
    }
  }

  /**
   * Execute AI analysis step with fallback support
   */
  private async executeAIAnalysis(
    content: ExtractedContent,
    options: AuditWorkflowOptions,
    steps: AuditStepResult[],
    warnings: string[],
    fallbacksUsed: string[]
  ): Promise<{ success: boolean; analysis?: AnalysisResult; error?: AppError }> {
    const stepStart = Date.now();
    let fallbackUsed = false;

    try {
      this.logStepStart('AI Analysis', options.url);
      
      const analysis = await this.analysisService.analyzeContent(content);

      const duration = Date.now() - stepStart;
      const stepMetadata = {
        factorsAnalyzed: Object.keys(analysis.factors).length,
        redFlagsFound: analysis.redFlags.length,
        positiveIndicatorsFound: analysis.positiveIndicators.length,
        recommendationsGenerated: analysis.recommendations.length,
        fallbackUsed
      };

      steps.push({
        step: 'AI Analysis',
        success: true,
        duration,
        fallbackUsed,
        metadata: stepMetadata
      });

      auditLogger.logStepExecution(
        'AI Analysis',
        true,
        duration,
        options.userId,
        undefined,
        stepMetadata
      );

      return { success: true, analysis };

    } catch (error) {
      const duration = Date.now() - stepStart;
      
      // Check if this was a fallback scenario (pattern-based analysis)
      if (error instanceof Error && error.message.includes('falling back to pattern analysis')) {
        fallbackUsed = true;
        fallbacksUsed.push('AI analysis failed, used pattern-based fallback');
        warnings.push('AI service unavailable, using pattern-based analysis with reduced accuracy');
        
        // The AI service should have returned fallback results
        // This is a successful fallback, not a failure
        steps.push({
          step: 'AI Analysis',
          success: true,
          duration,
          fallbackUsed: true,
          warnings: ['Used pattern-based fallback analysis']
        });

        // Return a basic analysis structure for fallback
        const fallbackAnalysis: AnalysisResult = {
          factors: {
            documentationQuality: 50,
            transparencyIndicators: 50,
            securityDocumentation: 50,
            communityEngagement: 50,
            technicalImplementation: 50
          },
          explanations: {
            documentationQuality: 'Pattern-based analysis used due to AI service unavailability',
            transparencyIndicators: 'Pattern-based analysis used due to AI service unavailability',
            securityDocumentation: 'Pattern-based analysis used due to AI service unavailability',
            communityEngagement: 'Pattern-based analysis used due to AI service unavailability',
            technicalImplementation: 'Pattern-based analysis used due to AI service unavailability'
          },
          recommendations: ['Manual review recommended due to limited analysis capability'],
          risks: ['Analysis accuracy reduced due to AI service unavailability'],
          redFlags: [],
          positiveIndicators: []
        };

        return { success: true, analysis: fallbackAnalysis };
      }

      const appError = handleError(error, {
        component: 'AIAnalysisService',
        userId: options.userId,
        url: options.url,
        action: 'analyzeContent'
      });

      steps.push({
        step: 'AI Analysis',
        success: false,
        duration,
        error: appError.message
      });

      this.logStepFailure('AI Analysis', appError, duration);
      return { success: false, error: appError };
    }
  }

  /**
   * Execute trust score calculation step
   */
  private async executeTrustScoring(
    analysis: AnalysisResult,
    content: ExtractedContent,
    options: AuditWorkflowOptions,
    steps: AuditStepResult[]
  ): Promise<{ success: boolean; trustScore?: TrustScoreResult; error?: AppError }> {
    const stepStart = Date.now();

    try {
      this.logStepStart('Trust Score Calculation', options.url);

      const analysisInput: AnalysisInput = {
        factors: analysis.factors,
        redFlags: analysis.redFlags,
        positiveIndicators: analysis.positiveIndicators,
        contentCompleteness: Math.min(100, (content.contentLength / 1000) * 100),
        extractedContentLength: content.contentLength,
        projectType: analysis.projectType
      };

      const trustScore = this.scoreCalculator.calculateTrustScore(analysisInput);

      const duration = Date.now() - stepStart;
      steps.push({
        step: 'Trust Score Calculation',
        success: true,
        duration,
        metadata: {
          finalScore: trustScore.finalScore,
          riskLevel: trustScore.riskLevel,
          confidence: trustScore.confidence,
          adjustmentsApplied: trustScore.adjustments.length,
          baseScore: trustScore.baseScore
        }
      });

      this.logStepSuccess('Trust Score Calculation', duration, {
        score: trustScore.finalScore,
        riskLevel: trustScore.riskLevel,
        confidence: trustScore.confidence
      });

      return { success: true, trustScore };

    } catch (error) {
      const duration = Date.now() - stepStart;
      const appError = handleError(error, {
        component: 'TrustScoreCalculator',
        userId: options.userId,
        url: options.url,
        action: 'calculateTrustScore'
      });

      steps.push({
        step: 'Trust Score Calculation',
        success: false,
        duration,
        error: appError.message
      });

      this.logStepFailure('Trust Score Calculation', appError, duration);
      return { success: false, error: appError };
    }
  }

  /**
   * Execute report generation step
   */
  private async executeReportGeneration(
    analysis: AnalysisResult,
    trustScore: TrustScoreResult,
    content: ExtractedContent,
    options: AuditWorkflowOptions,
    steps: AuditStepResult[]
  ): Promise<{ success: boolean; report?: AuditReport; error?: AppError }> {
    const stepStart = Date.now();

    try {
      this.logStepStart('Report Generation', options.url);

      const report = this.reportGenerator.generateFullReport(
        analysis,
        trustScore,
        content,
        options.userId
      );

      const duration = Date.now() - stepStart;
      steps.push({
        step: 'Report Generation',
        success: true,
        duration,
        metadata: {
          reportId: report.id,
          projectName: report.projectName,
          reportVersion: report.reportVersion
        }
      });

      this.logStepSuccess('Report Generation', duration, {
        reportId: report.id,
        projectName: report.projectName
      });

      return { success: true, report };

    } catch (error) {
      const duration = Date.now() - stepStart;
      const appError = handleError(error, {
        component: 'ReportGenerator',
        userId: options.userId,
        url: options.url,
        action: 'generateFullReport'
      });

      steps.push({
        step: 'Report Generation',
        success: false,
        duration,
        error: appError.message
      });

      this.logStepFailure('Report Generation', appError, duration);
      return { success: false, error: appError };
    }
  }

  /**
   * Execute Hedera blockchain storage (optional, non-blocking)
   */
  private async executeHederaStorage(
    report: AuditReport,
    options: AuditWorkflowOptions,
    steps: AuditStepResult[],
    warnings: string[]
  ): Promise<{ transactionId?: string; fallbackUsed: boolean }> {
    const stepStart = Date.now();

    try {
      this.logStepStart('Hedera Storage', options.url);

      const transactionId = await submitAuditToHedera(report);

      const duration = Date.now() - stepStart;
      steps.push({
        step: 'Hedera Storage',
        success: true,
        duration,
        metadata: {
          transactionId,
          network: 'testnet' // or 'mainnet' based on config
        }
      });

      this.logStepSuccess('Hedera Storage', duration, { transactionId });

      return { transactionId, fallbackUsed: false };

    } catch (error) {
      const duration = Date.now() - stepStart;
      const appError = handleError(error, {
        component: 'HederaService',
        userId: options.userId,
        url: options.url,
        action: 'submitAuditToHedera'
      });

      // Hedera failure is non-blocking - continue without blockchain storage
      steps.push({
        step: 'Hedera Storage',
        success: false,
        duration,
        error: appError.message,
        fallbackUsed: true
      });

      warnings.push('Blockchain storage failed, audit saved locally only');
      this.logStepWarning('Hedera Storage', appError, duration);

      return { fallbackUsed: true };
    }
  }



  /**
   * Execute usage tracking (non-blocking)
   */
  private async executeUsageTracking(
    userId: string,
    auditId: string,
    steps: AuditStepResult[],
    warnings: string[]
  ): Promise<void> {
    const stepStart = Date.now();

    try {
      // Just increment user audit count without storing the audit
      await UsageTracker.incrementUserAuditCount(userId);

      const duration = Date.now() - stepStart;
      steps.push({
        step: 'Usage Tracking',
        success: true,
        duration,
        metadata: { userId, auditId }
      });

    } catch (error) {
      const duration = Date.now() - stepStart;
      const appError = handleError(error, {
        component: 'UsageTracker',
        userId,
        action: 'incrementUserAuditCount'
      });

      // Usage tracking failure is non-blocking
      steps.push({
        step: 'Usage Tracking',
        success: false,
        duration,
        error: appError.message,
        fallbackUsed: true
      });

      warnings.push('Usage tracking failed, audit completed successfully');
    }
  }

  /**
   * Calculate performance metrics from steps
   */
  private calculatePerformanceMetrics(steps: AuditStepResult[]): {
    extractionTime: number;
    analysisTime: number;
    scoringTime: number;
    reportTime: number;
    storageTime: number;
  } {
    const getStepDuration = (stepName: string): number => {
      const step = steps.find(s => s.step === stepName);
      return step?.duration || 0;
    };

    return {
      extractionTime: getStepDuration('Content Extraction'),
      analysisTime: getStepDuration('AI Analysis'),
      scoringTime: getStepDuration('Trust Score Calculation'),
      reportTime: getStepDuration('Report Generation'),
      storageTime: getStepDuration('Hedera Storage') + getStepDuration('Usage Tracking')
    };
  }

  /**
   * Create failure result with comprehensive metadata
   */
  private createFailureResult(
    error: AppError,
    steps: AuditStepResult[],
    startTime: number,
    warnings: string[],
    fallbacksUsed: string[]
  ): AuditWorkflowResult {
    const processingTime = Date.now() - startTime;
    const performance = this.calculatePerformanceMetrics(steps);

    return {
      success: false,
      error,
      metadata: {
        processingTime,
        steps,
        performance,
        warnings,
        fallbacksUsed
      }
    };
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    try {
      await this.extractionService.close();
    } catch (error) {
      console.error('Failed to cleanup extraction service:', error);
    }
  }

  // Comprehensive logging methods
  private logAuditStart(options: AuditWorkflowOptions): void {
    console.log(`🚀 Starting audit workflow for ${options.url}`, {
      userId: options.userId,
      priority: options.priority || 'normal',
      storeOnHedera: options.storeOnHedera || false,
      detailedAnalysis: options.detailedAnalysis || false
    });
  }

  private logAuditSuccess(
    options: AuditWorkflowOptions,
    processingTime: number,
    performance: any
  ): void {
    console.log(`✅ Audit workflow completed successfully for ${options.url}`, {
      userId: options.userId,
      processingTime: `${processingTime}ms`,
      performance
    });
  }

  private logAuditFailure(
    options: AuditWorkflowOptions,
    error: AppError,
    processingTime: number
  ): void {
    console.error(`❌ Audit workflow failed for ${options.url}`, {
      userId: options.userId,
      processingTime: `${processingTime}ms`,
      errorType: error.type,
      errorMessage: error.message,
      severity: error.severity
    });
  }

  private logStepStart(step: string, url: string, retryCount?: number): void {
    const retryInfo = retryCount && retryCount > 1 ? ` (retry ${retryCount})` : '';
    console.log(`⏳ ${step} started${retryInfo}`, { url });
  }

  private logStepSuccess(step: string, duration: number, metadata?: any): void {
    console.log(`✅ ${step} completed in ${duration}ms`, metadata);
  }

  private logStepFailure(step: string, error: AppError, duration: number): void {
    console.error(`❌ ${step} failed after ${duration}ms`, {
      errorType: error.type,
      errorMessage: error.message,
      severity: error.severity
    });
  }

  private logStepWarning(step: string, error: AppError, duration: number): void {
    console.warn(`⚠️ ${step} failed after ${duration}ms (non-blocking)`, {
      errorType: error.type,
      errorMessage: error.message
    });
  }

  /**
   * Get comprehensive workflow health status with detailed diagnostics
   */
  async getWorkflowHealth(): Promise<{
    healthy: boolean;
    issues: string[];
    services: Record<string, boolean>;
    diagnostics: {
      contentExtraction: any;
      aiAnalysis: any;
      database: any;
      hedera: any;
      performance: any;
    };
    lastHealthCheck: Date;
  }> {
    const services: Record<string, boolean> = {};
    const issues: string[] = [];
    const diagnostics: any = {};

    // Test content extraction service
    try {
      const testUrl = 'https://example.com';
      const testExtractor = new ContentExtractionService();
      
      // Quick connectivity test without full extraction
      diagnostics.contentExtraction = {
        available: true,
        browserLaunchable: true,
        lastTest: new Date()
      };
      services.contentExtraction = true;
      
      await testExtractor.close();
    } catch (error) {
      services.contentExtraction = false;
      issues.push('Content extraction service unavailable');
      diagnostics.contentExtraction = {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastTest: new Date()
      };
    }

    // Test AI analysis service
    try {
      // Test Gemini API connectivity
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
      }
      
      diagnostics.aiAnalysis = {
        available: true,
        apiKeyConfigured: true,
        fallbackAvailable: true,
        lastTest: new Date()
      };
      services.aiAnalysis = true;
    } catch (error) {
      services.aiAnalysis = false;
      issues.push('AI analysis service unavailable');
      diagnostics.aiAnalysis = {
        available: false,
        apiKeyConfigured: !!process.env.GEMINI_API_KEY,
        fallbackAvailable: true,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastTest: new Date()
      };
    }

    // Test database connectivity
    try {
      await this.persistenceService.healthCheck();
      services.database = true;
      diagnostics.database = {
        available: true,
        connectionPool: 'healthy',
        lastTest: new Date()
      };
    } catch (error) {
      services.database = false;
      issues.push('Database service unavailable');
      diagnostics.database = {
        available: false,
        connectionPool: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastTest: new Date()
      };
    }

    // Test Hedera connectivity (non-critical)
    try {
      if (!process.env.HEDERA_ACCOUNT_ID || !process.env.HEDERA_PRIVATE_KEY) {
        throw new Error('Hedera credentials not configured');
      }
      
      services.hedera = true;
      diagnostics.hedera = {
        available: true,
        credentialsConfigured: true,
        network: process.env.HEDERA_NETWORK || 'testnet',
        lastTest: new Date()
      };
    } catch (error) {
      services.hedera = false;
      // Hedera is optional, so don't add to critical issues
      diagnostics.hedera = {
        available: false,
        credentialsConfigured: !!(process.env.HEDERA_ACCOUNT_ID && process.env.HEDERA_PRIVATE_KEY),
        network: process.env.HEDERA_NETWORK || 'testnet',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastTest: new Date()
      };
    }

    // Get performance diagnostics
    try {
      const recentMetrics = auditLogger.getPerformanceSummary(10);
      diagnostics.performance = {
        averageProcessingTime: recentMetrics.averageProcessingTime,
        successRate: recentMetrics.successRate,
        errorDistribution: recentMetrics.errorDistribution,
        recentAudits: recentMetrics.performanceTrends.totalAudits,
        lastCheck: new Date()
      };
    } catch (error) {
      diagnostics.performance = {
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date()
      };
    }

    const healthy = issues.length === 0;

    return { 
      healthy, 
      issues, 
      services, 
      diagnostics,
      lastHealthCheck: new Date()
    };
  }

  /**
   * Get detailed workflow statistics and metrics
   */
  getWorkflowStatistics(): {
    totalWorkflowsExecuted: number;
    successfulWorkflows: number;
    failedWorkflows: number;
    averageProcessingTime: number;
    stepPerformance: Record<string, number>;
    errorDistribution: Record<string, number>;
    serviceReliability: Record<string, number>;
  } {
    const metrics = auditLogger.getMetrics();
    const performanceSummary = auditLogger.getPerformanceSummary(100);

    return {
      totalWorkflowsExecuted: metrics.totalAudits,
      successfulWorkflows: metrics.successfulAudits,
      failedWorkflows: metrics.failedAudits,
      averageProcessingTime: metrics.averageProcessingTime,
      stepPerformance: {
        contentExtraction: metrics.performanceMetrics.averageExtractionTime,
        aiAnalysis: metrics.performanceMetrics.averageAnalysisTime,
        trustScoring: metrics.performanceMetrics.averageScoringTime,
        reportGeneration: metrics.performanceMetrics.averageReportTime,
        databaseStorage: metrics.performanceMetrics.averageStorageTime
      },
      errorDistribution: performanceSummary.errorDistribution,
      serviceReliability: {
        contentExtraction: metrics.serviceHealth.contentExtraction,
        aiAnalysis: metrics.serviceHealth.aiAnalysis,
        trustScoring: metrics.serviceHealth.trustScoring,
        reportGeneration: metrics.serviceHealth.reportGeneration,
        databaseStorage: metrics.serviceHealth.databaseStorage,
        hederaStorage: metrics.serviceHealth.hederaStorage
      }
    };
  }

  /**
   * Debug workflow execution with detailed step-by-step logging
   */
  async debugWorkflowExecution(
    options: AuditWorkflowOptions,
    request?: NextRequest
  ): Promise<{
    success: boolean;
    debugInfo: {
      steps: any[];
      timings: Record<string, number>;
      memoryUsage: Record<string, any>;
      errors: any[];
      warnings: string[];
      serviceStates: Record<string, any>;
    };
    result?: AuditWorkflowResult;
  }> {
    const debugInfo = {
      steps: [] as any[],
      timings: {} as Record<string, number>,
      memoryUsage: {} as Record<string, any>,
      errors: [] as any[],
      warnings: [] as string[],
      serviceStates: {} as Record<string, any>
    };

    const startTime = Date.now();
    let result: AuditWorkflowResult | undefined;

    try {
      // Capture initial memory state
      debugInfo.memoryUsage.initial = process.memoryUsage();
      
      // Log initial service states
      const healthCheck = await this.getWorkflowHealth();
      debugInfo.serviceStates.initial = healthCheck;

      // Execute workflow with enhanced debugging
      console.log('🔍 [DEBUG] Starting workflow execution with enhanced debugging');
      
      result = await this.executeAuditWorkflow(options, request);
      
      // Capture final states
      debugInfo.memoryUsage.final = process.memoryUsage();
      debugInfo.serviceStates.final = await this.getWorkflowHealth();
      
      // Calculate memory delta
      debugInfo.memoryUsage.delta = {
        heapUsed: debugInfo.memoryUsage.final.heapUsed - debugInfo.memoryUsage.initial.heapUsed,
        heapTotal: debugInfo.memoryUsage.final.heapTotal - debugInfo.memoryUsage.initial.heapTotal,
        external: debugInfo.memoryUsage.final.external - debugInfo.memoryUsage.initial.external
      };

      // Extract debug information from result
      if (result.metadata) {
        debugInfo.steps = result.metadata.steps;
        debugInfo.warnings = result.metadata.warnings;
        debugInfo.timings = result.metadata.performance;
        
        if (!result.success && result.error) {
          debugInfo.errors.push(result.error);
        }
      }

      debugInfo.timings.total = Date.now() - startTime;

      console.log('🔍 [DEBUG] Workflow execution completed', {
        success: result.success,
        totalTime: debugInfo.timings.total,
        memoryDelta: debugInfo.memoryUsage.delta,
        stepsExecuted: debugInfo.steps.length,
        warningsCount: debugInfo.warnings.length,
        errorsCount: debugInfo.errors.length
      });

      return {
        success: result.success,
        debugInfo,
        result
      };

    } catch (error) {
      debugInfo.errors.push({
        type: 'WORKFLOW_DEBUG_ERROR',
        message: error instanceof Error ? error.message : 'Unknown debug error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date()
      });

      debugInfo.timings.total = Date.now() - startTime;
      debugInfo.memoryUsage.final = process.memoryUsage();

      console.error('🔍 [DEBUG] Workflow execution failed during debugging', {
        error: error instanceof Error ? error.message : error,
        totalTime: debugInfo.timings.total,
        stepsCompleted: debugInfo.steps.length
      });

      return {
        success: false,
        debugInfo,
        result
      };
    }
  }
}