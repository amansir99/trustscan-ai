/**
 * Comprehensive Analyzer
 * Integrates deep link extraction, DAO recognition, and enhanced scoring
 * for accurate assessment of all project types including mature DAOs like Aave
 */

import { DeepLinkExtractor, DeepExtractionResult } from './deep-link-extractor';
import { AIAnalysisService, AnalysisResult, ExtractedContent } from './ai-analyzer';
import { TrustScoreCalculator, TrustScoreResult, AnalysisInput } from './trust-calculator';
import { EnhancedScoringEngine, EnhancedScoreResult } from './enhanced-scoring';

export interface ComprehensiveAnalysisResult {
  // Standard analysis
  analysis: AnalysisResult;
  trustScore: TrustScoreResult;
  
  // Enhanced deep analysis
  deepExtraction: DeepExtractionResult;
  enhancedScore: EnhancedScoreResult;
  
  // Evidence-based findings
  evidenceLinks: {
    category: string;
    description: string;
    url: string;
    verified: boolean;
  }[];
  
  // DAO recognition
  daoAnalysis: {
    isDAO: boolean;
    governanceModel: 'centralized' | 'dao' | 'hybrid' | 'unknown';
    governanceEvidence: string[];
    adjustedScoring: boolean;
  };
  
  // Maturity assessment
  maturityAssessment: {
    level: 'new' | 'established' | 'mature';
    indicators: string[];
    benchmarkApplied: number;
  };
  
  // Comprehensive metadata
  metadata: {
    totalPagesAnalyzed: number;
    extractionDepth: number;
    analysisTimestamp: Date;
    confidenceLevel: number;
  };
}

export class ComprehensiveAnalyzer {
  private deepExtractor: DeepLinkExtractor;
  private aiAnalyzer: AIAnalysisService;
  private trustCalculator: TrustScoreCalculator;
  private enhancedScoring: EnhancedScoringEngine;

  constructor() {
    this.deepExtractor = new DeepLinkExtractor(2, 3); // Max depth 2, max 3 pages per category
    this.aiAnalyzer = new AIAnalysisService();
    this.trustCalculator = new TrustScoreCalculator();
    this.enhancedScoring = new EnhancedScoringEngine();
  }

  /**
   * Perform comprehensive analysis with deep extraction
   */
  async analyzeProject(url: string): Promise<ComprehensiveAnalysisResult> {
    console.log(`🚀 Starting comprehensive analysis for ${url}`);
    
    // Step 1: Deep extraction
    console.log('📊 Step 1: Deep content extraction...');
    const deepExtraction = await this.deepExtractor.extractDeep(url);
    
    // Step 2: Create enriched content for AI analysis
    console.log('🧠 Step 2: AI analysis with enriched content...');
    const enrichedContent = this.createEnrichedContent(deepExtraction);
    const analysis = await this.aiAnalyzer.analyzeContent(enrichedContent);
    
    // Step 3: Detect DAO characteristics
    console.log('🏛️ Step 3: DAO detection and governance analysis...');
    const daoAnalysis = this.analyzeDAOCharacteristics(deepExtraction, analysis);
    
    // Step 4: Assess project maturity
    console.log('📈 Step 4: Project maturity assessment...');
    const maturityAssessment = this.assessProjectMaturity(deepExtraction, analysis);
    
    // Step 5: Calculate trust score with context
    console.log('🎯 Step 5: Context-aware trust scoring...');
    const trustScore = this.calculateContextAwareTrustScore(
      analysis,
      deepExtraction,
      daoAnalysis,
      maturityAssessment
    );
    
    // Step 6: Generate enhanced score with evidence
    console.log('⭐ Step 6: Enhanced scoring with evidence...');
    const enhancedScore = this.generateEnhancedScore(
      deepExtraction,
      analysis,
      daoAnalysis,
      maturityAssessment
    );
    
    // Step 7: Compile evidence links
    console.log('🔗 Step 7: Compiling evidence links...');
    const evidenceLinks = this.compileEvidenceLinks(deepExtraction);
    
    // Step 8: Adjust red flags for DAO context
    console.log('🔧 Step 8: Adjusting findings for project context...');
    this.adjustFindingsForContext(analysis, daoAnalysis, maturityAssessment, deepExtraction);
    
    console.log('✅ Comprehensive analysis complete!');
    
    return {
      analysis,
      trustScore,
      deepExtraction,
      enhancedScore,
      evidenceLinks,
      daoAnalysis,
      maturityAssessment,
      metadata: {
        totalPagesAnalyzed: deepExtraction.totalPagesAnalyzed,
        extractionDepth: deepExtraction.extractionDepth,
        analysisTimestamp: new Date(),
        confidenceLevel: trustScore.confidence
      }
    };
  }

  /**
   * Create enriched content combining all extracted pages
   */
  private createEnrichedContent(deepExtraction: DeepExtractionResult): ExtractedContent {
    const mainSite = deepExtraction.mainSite;
    
    // Combine all documentation
    const allDocs = [
      ...mainSite.documentation,
      ...deepExtraction.docsPages.flatMap(p => p.documentation),
      deepExtraction.githubReadme || ''
    ].filter(d => d.length > 0);
    
    // Combine all team info
    const allTeamInfo = [
      mainSite.teamInfo,
      ...deepExtraction.teamPages.map(p => p.teamInfo || p.mainContent),
      deepExtraction.linkedInProfiles.map(p => `${p.name} - ${p.profileUrl}`).join('\n')
    ].filter(t => t.length > 0).join('\n\n');
    
    // Combine all security info
    const allSecurityInfo = [
      mainSite.securityInfo,
      ...deepExtraction.securityPages.map(p => p.securityInfo || p.mainContent),
      ...deepExtraction.auditReports.map(a => 
        `Audit by ${a.auditorName} (${a.status}): ${a.reportUrl}`
      )
    ].filter(s => s.length > 0).join('\n\n');
    
    // Combine all social links
    const allSocialLinks = Array.from(new Set([
      ...mainSite.socialLinks,
      ...deepExtraction.docsPages.flatMap(p => p.socialLinks),
      ...deepExtraction.teamPages.flatMap(p => p.socialLinks)
    ]));
    
    // Combine all code repositories
    const allCodeRepos = Array.from(new Set([
      ...mainSite.codeRepositories,
      ...deepExtraction.docsPages.flatMap(p => p.codeRepositories)
    ]));
    
    return {
      ...mainSite,
      mainContent: deepExtraction.comprehensiveContent,
      documentation: allDocs,
      teamInfo: allTeamInfo,
      securityInfo: allSecurityInfo,
      socialLinks: allSocialLinks,
      codeRepositories: allCodeRepos
    };
  }

  /**
   * Analyze DAO characteristics and governance model
   */
  private analyzeDAOCharacteristics(
    deepExtraction: DeepExtractionResult,
    analysis: AnalysisResult
  ): {
    isDAO: boolean;
    governanceModel: 'centralized' | 'dao' | 'hybrid' | 'unknown';
    governanceEvidence: string[];
    adjustedScoring: boolean;
  } {
    const content = deepExtraction.comprehensiveContent.toLowerCase();
    const governanceEvidence: string[] = [];
    
    // DAO indicators
    const daoIndicators = [
      'dao', 'decentralized autonomous organization',
      'governance token', 'voting power', 'proposal system',
      'on-chain governance', 'community governance',
      'token holder voting', 'governance forum'
    ];
    
    const daoScore = daoIndicators.filter(indicator => 
      content.includes(indicator)
    ).length;
    
    const isDAO = daoScore >= 3;
    
    // Collect governance evidence
    if (content.includes('governance')) {
      governanceEvidence.push('Governance mechanisms mentioned');
    }
    if (content.includes('proposal')) {
      governanceEvidence.push('Proposal system identified');
    }
    if (content.includes('voting')) {
      governanceEvidence.push('Voting system present');
    }
    if (content.includes('multisig')) {
      governanceEvidence.push('Multi-signature controls in place');
    }
    if (deepExtraction.linkedInProfiles.length > 0) {
      governanceEvidence.push(`${deepExtraction.linkedInProfiles.length} team members with LinkedIn profiles`);
    }
    
    // Determine governance model
    let governanceModel: 'centralized' | 'dao' | 'hybrid' | 'unknown' = 'unknown';
    
    if (isDAO && deepExtraction.linkedInProfiles.length > 0) {
      governanceModel = 'hybrid'; // DAO with disclosed team
    } else if (isDAO) {
      governanceModel = 'dao'; // Pure DAO
    } else if (deepExtraction.teamPages.length > 0 || deepExtraction.linkedInProfiles.length > 2) {
      governanceModel = 'centralized'; // Traditional team structure
    }
    
    return {
      isDAO,
      governanceModel,
      governanceEvidence,
      adjustedScoring: isDAO
    };
  }

  /**
   * Assess project maturity level
   */
  private assessProjectMaturity(
    deepExtraction: DeepExtractionResult,
    analysis: AnalysisResult
  ): {
    level: 'new' | 'established' | 'mature';
    indicators: string[];
    benchmarkApplied: number;
  } {
    const indicators: string[] = [];
    let maturityScore = 0;
    
    // Audit history (mature projects have multiple audits)
    if (deepExtraction.auditReports.length >= 3) {
      maturityScore += 30;
      indicators.push(`${deepExtraction.auditReports.length} security audits completed`);
    } else if (deepExtraction.auditReports.length >= 1) {
      maturityScore += 15;
      indicators.push(`${deepExtraction.auditReports.length} security audit(s) completed`);
    }
    
    // Documentation depth
    if (deepExtraction.docsPages.length >= 3) {
      maturityScore += 20;
      indicators.push('Comprehensive documentation portal');
    } else if (deepExtraction.docsPages.length >= 1) {
      maturityScore += 10;
      indicators.push('Documentation available');
    }
    
    // Community presence
    if (deepExtraction.mainSite.socialLinks.length >= 5) {
      maturityScore += 15;
      indicators.push('Strong multi-platform community presence');
    } else if (deepExtraction.mainSite.socialLinks.length >= 3) {
      maturityScore += 8;
      indicators.push('Active community presence');
    }
    
    // Code repository activity
    if (deepExtraction.githubReadme && deepExtraction.githubReadme.length > 1000) {
      maturityScore += 15;
      indicators.push('Detailed GitHub repository');
    }
    
    // Security infrastructure
    if (deepExtraction.securityPages.length >= 2) {
      maturityScore += 10;
      indicators.push('Dedicated security documentation');
    }
    
    // Team transparency
    if (deepExtraction.linkedInProfiles.length >= 5) {
      maturityScore += 10;
      indicators.push('Transparent team with professional profiles');
    }
    
    // Determine maturity level
    let level: 'new' | 'established' | 'mature';
    let benchmark: number;
    
    if (maturityScore >= 70) {
      level = 'mature';
      benchmark = 75;
      indicators.push('Mature project with comprehensive infrastructure');
    } else if (maturityScore >= 35) {
      level = 'established';
      benchmark = 60;
      indicators.push('Established project with solid foundation');
    } else {
      level = 'new';
      benchmark = 40;
      indicators.push('New or early-stage project');
    }
    
    return {
      level,
      indicators,
      benchmarkApplied: benchmark
    };
  }

  /**
   * Calculate context-aware trust score
   */
  private calculateContextAwareTrustScore(
    analysis: AnalysisResult,
    deepExtraction: DeepExtractionResult,
    daoAnalysis: any,
    maturityAssessment: any
  ): TrustScoreResult {
    const analysisInput: AnalysisInput = {
      factors: analysis.factors,
      redFlags: analysis.redFlags,
      positiveIndicators: analysis.positiveIndicators,
      contentCompleteness: 100,
      extractedContentLength: deepExtraction.comprehensiveContent.length,
      projectMaturity: maturityAssessment.level,
      isDAO: daoAnalysis.isDAO
    };
    
    return this.trustCalculator.calculateTrustScore(analysisInput);
  }

  /**
   * Generate enhanced score with detailed evidence
   */
  private generateEnhancedScore(
    deepExtraction: DeepExtractionResult,
    analysis: AnalysisResult,
    daoAnalysis: any,
    maturityAssessment: any
  ): EnhancedScoreResult {
    // Build comprehensive analysis structures
    const documentation = {
      hasAPIDocumentation: this.hasAPIDocumentation(deepExtraction),
      hasIntegrationGuides: this.hasIntegrationGuides(deepExtraction),
      hasTroubleshooting: this.hasTroubleshooting(deepExtraction),
      hasFAQ: this.hasFAQ(deepExtraction),
      hasCodeSamples: this.hasCodeSamples(deepExtraction),
      hasChangelog: this.hasChangelog(deepExtraction),
      hasVersioning: this.hasVersioning(deepExtraction),
      isMultilingual: false, // TODO: Implement language detection
      hasAccessibilityFeatures: false, // TODO: Implement accessibility check
      completenessScore: analysis.factors.documentationQuality,
      freshnessScore: 70 // TODO: Implement freshness calculation
    };
    
    const teamTransparency = {
      hasTeamPage: deepExtraction.teamPages.length > 0,
      teamMemberCount: deepExtraction.linkedInProfiles.length,
      linkedInProfiles: deepExtraction.linkedInProfiles.length,
      twitterProfiles: 0, // TODO: Extract from social links
      githubProfiles: 0, // TODO: Extract from code repos
      hasLeadershipBios: deepExtraction.teamPages.some(p => p.teamInfo.length > 200),
      isDAO: daoAnalysis.isDAO,
      governanceModel: daoAnalysis.governanceModel,
      transparencyScore: analysis.factors.transparencyIndicators,
      explanation: daoAnalysis.isDAO 
        ? 'DAO-governed project with decentralized decision-making'
        : 'Traditional team structure'
    };
    
    const tokenomics = {
      hasSupplyCap: deepExtraction.mainSite.tokenomics.toLowerCase().includes('supply'),
      hasAllocationDetails: deepExtraction.mainSite.tokenomics.toLowerCase().includes('allocation'),
      hasVestingSchedule: deepExtraction.mainSite.tokenomics.toLowerCase().includes('vesting'),
      hasTreasuryManagement: deepExtraction.mainSite.tokenomics.toLowerCase().includes('treasury'),
      hasOnChainVerification: false, // TODO: Implement on-chain verification
      hasLiveStats: false, // TODO: Check for live stats
      completenessScore: deepExtraction.mainSite.tokenomics.length > 200 ? 70 : 30,
      verificationLinks: []
    };
    
    const security = {
      audits: deepExtraction.auditReports.map(audit => ({
        auditorName: audit.auditorName,
        auditorReputation: this.getAuditorReputation(audit.auditorName),
        reportUrl: audit.reportUrl,
        auditDate: audit.auditDate,
        isFresh: audit.auditDate ? this.isAuditFresh(audit.auditDate) : false,
        coverageScope: []
      })),
      hasBugBounty: deepExtraction.comprehensiveContent.toLowerCase().includes('bug bounty'),
      bugBountyPlatform: this.detectBugBountyPlatform(deepExtraction.comprehensiveContent),
      hasInsuranceFund: deepExtraction.comprehensiveContent.toLowerCase().includes('insurance'),
      hasSafetyModule: deepExtraction.comprehensiveContent.toLowerCase().includes('safety module'),
      hasIncidentResponse: deepExtraction.securityPages.length > 0,
      hasRiskDashboard: false,
      multiSigUsage: deepExtraction.comprehensiveContent.toLowerCase().includes('multisig'),
      timelockUsage: deepExtraction.comprehensiveContent.toLowerCase().includes('timelock'),
      securityScore: analysis.factors.securityDocumentation
    };
    
    const community = {
      githubActivity: {
        commits: 0, // TODO: Fetch from GitHub API
        contributors: 0,
        lastCommitDays: 30,
        issueResponseTime: undefined,
        prMergeRate: undefined
      },
      socialPresence: {
        platforms: deepExtraction.mainSite.socialLinks,
        totalFollowers: undefined,
        engagementQuality: 'unknown' as const
      },
      developerResources: {
        hasStarterKit: false,
        hasSandbox: false,
        hasCodeWalkthroughs: false,
        hasDeveloperPortal: deepExtraction.docsPages.length > 0
      },
      ecosystemIntegrations: [],
      communityScore: analysis.factors.communityEngagement
    };
    
    const roadmap = {
      hasPublicRoadmap: deepExtraction.comprehensiveContent.toLowerCase().includes('roadmap'),
      hasTimelines: false,
      hasMilestones: false,
      hasChangelog: this.hasChangelog(deepExtraction),
      updateFrequency: 'none' as const,
      roadmapScore: 50
    };
    
    // Calculate category scores
    const categoryScores = {
      documentation: this.enhancedScoring.calculateDocumentationScore(documentation),
      transparency: this.enhancedScoring.calculateTransparencyScore(teamTransparency, tokenomics, roadmap),
      security: this.enhancedScoring.calculateSecurityScore(security),
      community: this.enhancedScoring.calculateCommunityScore(community),
      technical: analysis.factors.technicalImplementation
    };
    
    const overallScore = Math.round(
      (categoryScores.documentation * 0.25 +
       categoryScores.transparency * 0.20 +
       categoryScores.security * 0.25 +
       categoryScores.community * 0.15 +
       categoryScores.technical * 0.15)
    );
    
    const maturityAdjustment = this.enhancedScoring.applyMaturityAdjustment(
      overallScore,
      maturityAssessment.level
    );
    
    const result: EnhancedScoreResult = {
      overallScore: maturityAdjustment.adjustedScore,
      categoryScores,
      deepAnalysis: {
        deepLinks: {
          mainSite: deepExtraction.mainSite.url,
          docsPortal: deepExtraction.docsPages[0]?.url,
          githubRepo: deepExtraction.mainSite.codeRepositories[0],
          auditReports: deepExtraction.auditReports.map(a => a.reportUrl),
          teamPages: deepExtraction.teamPages.map(p => p.url),
          tokenomicsPages: [],
          securityPages: deepExtraction.securityPages.map(p => p.url),
          hasVersioning: documentation.hasVersioning,
          hasTimestamps: false
        },
        teamTransparency,
        tokenomics,
        security,
        community,
        documentation,
        roadmap
      },
      maturityAdjustment: {
        projectMaturity: maturityAssessment.level,
        expectedBenchmark: maturityAssessment.benchmarkApplied,
        actualScore: maturityAdjustment.adjustedScore,
        isAboveBenchmark: maturityAdjustment.adjustedScore >= maturityAssessment.benchmarkApplied
      },
      riskLevel: this.determineRiskLevel(maturityAdjustment.adjustedScore),
      confidence: 85,
      recommendations: [],
      verificationSteps: []
    };
    
    // Generate recommendations and verification steps
    result.recommendations = this.enhancedScoring.generateRecommendations(result);
    result.verificationSteps = this.enhancedScoring.generateVerificationSteps(result);
    
    return result;
  }

  /**
   * Compile evidence links from deep extraction
   */
  private compileEvidenceLinks(deepExtraction: DeepExtractionResult): Array<{
    category: string;
    description: string;
    url: string;
    verified: boolean;
  }> {
    const links: Array<{category: string; description: string; url: string; verified: boolean}> = [];
    
    // Documentation links
    deepExtraction.docsPages.forEach(page => {
      links.push({
        category: 'Documentation',
        description: page.title || 'Documentation page',
        url: page.url,
        verified: true
      });
    });
    
    // Team links
    deepExtraction.teamPages.forEach(page => {
      links.push({
        category: 'Team',
        description: page.title || 'Team information',
        url: page.url,
        verified: true
      });
    });
    
    deepExtraction.linkedInProfiles.forEach(profile => {
      links.push({
        category: 'Team',
        description: `${profile.name} - LinkedIn Profile`,
        url: profile.profileUrl,
        verified: profile.verified
      });
    });
    
    // Security links
    deepExtraction.securityPages.forEach(page => {
      links.push({
        category: 'Security',
        description: page.title || 'Security information',
        url: page.url,
        verified: true
      });
    });
    
    deepExtraction.auditReports.forEach(audit => {
      if (audit.reportUrl) {
        links.push({
          category: 'Security',
          description: `${audit.auditorName} Audit Report`,
          url: audit.reportUrl,
          verified: audit.status === 'verified'
        });
      }
    });
    
    // Code repository links
    deepExtraction.mainSite.codeRepositories.forEach(repo => {
      links.push({
        category: 'Technical',
        description: 'Code Repository',
        url: repo,
        verified: true
      });
    });
    
    return links;
  }

  /**
   * Adjust findings based on project context (DAO, maturity, etc.)
   */
  private adjustFindingsForContext(
    analysis: AnalysisResult,
    daoAnalysis: any,
    maturityAssessment: any,
    deepExtraction: DeepExtractionResult
  ): void {
    // Remove inappropriate red flags for DAOs
    if (daoAnalysis.isDAO) {
      analysis.redFlags = analysis.redFlags.filter(flag => {
        const flagLower = flag.toLowerCase();
        // Don't flag "anonymous team" or "no team" for DAOs
        if (flagLower.includes('anonymous team') || flagLower.includes('no team')) {
          // Add explanation instead
          analysis.positiveIndicators.push(
            `DAO governance model: Decentralized decision-making through ${daoAnalysis.governanceEvidence.join(', ')}`
          );
          return false;
        }
        return true;
      });
    }
    
    // Add context to recommendations
    if (daoAnalysis.isDAO) {
      analysis.recommendations = analysis.recommendations.map(rec => {
        if (rec.toLowerCase().includes('team')) {
          return rec + ' (Note: DAO governance model may intentionally de-emphasize individual team members)';
        }
        return rec;
      });
    }
    
    // Add evidence-based positive indicators
    if (deepExtraction.auditReports.length > 0) {
      analysis.positiveIndicators.push(
        `✅ ${deepExtraction.auditReports.length} audit report(s) found: ${deepExtraction.auditReports.map(a => a.auditorName).join(', ')}`
      );
    }
    
    if (deepExtraction.linkedInProfiles.length > 0) {
      analysis.positiveIndicators.push(
        `✅ ${deepExtraction.linkedInProfiles.length} team member(s) with LinkedIn profiles verified`
      );
    }
    
    if (deepExtraction.docsPages.length > 0) {
      analysis.positiveIndicators.push(
        `✅ ${deepExtraction.docsPages.length} documentation page(s) found and analyzed`
      );
    }
  }

  // Helper methods
  private hasAPIDocumentation(extraction: DeepExtractionResult): boolean {
    return extraction.comprehensiveContent.toLowerCase().includes('api');
  }

  private hasIntegrationGuides(extraction: DeepExtractionResult): boolean {
    return extraction.comprehensiveContent.toLowerCase().includes('integration');
  }

  private hasTroubleshooting(extraction: DeepExtractionResult): boolean {
    return extraction.comprehensiveContent.toLowerCase().includes('troubleshoot');
  }

  private hasFAQ(extraction: DeepExtractionResult): boolean {
    return extraction.comprehensiveContent.toLowerCase().includes('faq');
  }

  private hasCodeSamples(extraction: DeepExtractionResult): boolean {
    return extraction.comprehensiveContent.includes('```') || 
           extraction.comprehensiveContent.toLowerCase().includes('code example');
  }

  private hasChangelog(extraction: DeepExtractionResult): boolean {
    return extraction.comprehensiveContent.toLowerCase().includes('changelog');
  }

  private hasVersioning(extraction: DeepExtractionResult): boolean {
    return /v\d+\.\d+/.test(extraction.comprehensiveContent);
  }

  private getAuditorReputation(auditorName: string): 'top-tier' | 'established' | 'emerging' | 'unknown' {
    const topTier = ['consensys', 'trail of bits', 'openzeppelin', 'certik', 'quantstamp'];
    const established = ['chainsecurity', 'peckshield', 'slowmist', 'hacken'];
    
    const nameLower = auditorName.toLowerCase();
    if (topTier.some(t => nameLower.includes(t))) return 'top-tier';
    if (established.some(e => nameLower.includes(e))) return 'established';
    return 'unknown';
  }

  private isAuditFresh(auditDate: Date): boolean {
    const daysSince = (Date.now() - auditDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince < 180; // Fresh if less than 6 months old
  }

  private detectBugBountyPlatform(content: string): 'immunefi' | 'hackerone' | 'other' | undefined {
    const contentLower = content.toLowerCase();
    if (contentLower.includes('immunefi')) return 'immunefi';
    if (contentLower.includes('hackerone')) return 'hackerone';
    if (contentLower.includes('bug bounty')) return 'other';
    return undefined;
  }

  private determineRiskLevel(score: number): 'HIGH' | 'MEDIUM' | 'LOW' | 'TRUSTED' {
    if (score >= 80) return 'TRUSTED';
    if (score >= 60) return 'LOW';
    if (score >= 30) return 'MEDIUM';
    return 'HIGH';
  }

  async close(): Promise<void> {
    await this.deepExtractor.close();
  }
}
