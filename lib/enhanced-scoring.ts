/**
 * Enhanced Scoring System for DeFi Project Audits
 * Implements comprehensive, fair, and accurate scoring for all project types
 * 
 * Key Improvements:
 * 1. Deep link verification and content extraction
 * 2. Adaptive scoring based on project maturity
 * 3. DAO/Decentralized project recognition
 * 4. Audit freshness tracking
 * 5. Partial credit system
 * 6. Multi-dimensional transparency assessment
 */

export interface DeepLinkAnalysis {
  mainSite: string;
  docsPortal?: string;
  githubRepo?: string;
  auditReports: string[];
  teamPages: string[];
  tokenomicsPages: string[];
  securityPages: string[];
  lastUpdated?: Date;
  hasVersioning: boolean;
  hasTimestamps: boolean;
}

export interface AuditVerification {
  auditorName: string;
  auditorReputation: 'top-tier' | 'established' | 'emerging' | 'unknown';
  reportUrl?: string;
  auditDate?: Date;
  daysSinceAudit?: number;
  isFresh: boolean; // < 180 days
  coverageScope: string[];
}

export interface TeamTransparency {
  hasTeamPage: boolean;
  teamMemberCount: number;
  linkedInProfiles: number;
  twitterProfiles: number;
  githubProfiles: number;
  hasLeadershipBios: boolean;
  isDAO: boolean;
  governanceModel?: 'centralized' | 'dao' | 'hybrid';
  transparencyScore: number; // 0-100
  explanation: string;
}

export interface TokenomicsDepth {
  hasSupplyCap: boolean;
  hasAllocationDetails: boolean;
  hasVestingSchedule: boolean;
  hasTreasuryManagement: boolean;
  hasOnChainVerification: boolean;
  hasLiveStats: boolean;
  completenessScore: number; // 0-100
  verificationLinks: string[];
}

export interface SecurityAssessment {
  audits: AuditVerification[];
  hasBugBounty: boolean;
  bugBountyPlatform?: 'immunefi' | 'hackerone' | 'other';
  hasInsuranceFund: boolean;
  hasSafetyModule: boolean;
  hasIncidentResponse: boolean;
  hasRiskDashboard: boolean;
  multiSigUsage: boolean;
  timelockUsage: boolean;
  securityScore: number; // 0-100
}

export interface CommunityMetrics {
  githubActivity: {
    commits: number;
    contributors: number;
    lastCommitDays: number;
    issueResponseTime?: number;
    prMergeRate?: number;
  };
  socialPresence: {
    platforms: string[];
    totalFollowers?: number;
    engagementQuality: 'high' | 'medium' | 'low' | 'unknown';
  };
  developerResources: {
    hasStarterKit: boolean;
    hasSandbox: boolean;
    hasCodeWalkthroughs: boolean;
    hasDeveloperPortal: boolean;
  };
  ecosystemIntegrations: string[];
  communityScore: number; // 0-100
}

export interface DocumentationQuality {
  hasAPIDocumentation: boolean;
  hasIntegrationGuides: boolean;
  hasTroubleshooting: boolean;
  hasFAQ: boolean;
  hasCodeSamples: boolean;
  hasChangelog: boolean;
  hasVersioning: boolean;
  isMultilingual: boolean;
  hasAccessibilityFeatures: boolean;
  lastUpdatedDays?: number;
  completenessScore: number; // 0-100
  freshnessScore: number; // 0-100
}

export interface RoadmapAssessment {
  hasPublicRoadmap: boolean;
  hasTimelines: boolean;
  hasMilestones: boolean;
  hasChangelog: boolean;
  updateFrequency: 'regular' | 'occasional' | 'rare' | 'none';
  roadmapScore: number; // 0-100
}

export interface EnhancedScoreResult {
  overallScore: number; // 0-100
  categoryScores: {
    documentation: number;
    transparency: number;
    security: number;
    community: number;
    technical: number;
  };
  deepAnalysis: {
    deepLinks: DeepLinkAnalysis;
    teamTransparency: TeamTransparency;
    tokenomics: TokenomicsDepth;
    security: SecurityAssessment;
    community: CommunityMetrics;
    documentation: DocumentationQuality;
    roadmap: RoadmapAssessment;
  };
  maturityAdjustment: {
    projectMaturity: 'new' | 'established' | 'mature';
    expectedBenchmark: number;
    actualScore: number;
    isAboveBenchmark: boolean;
  };
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'TRUSTED';
  confidence: number;
  recommendations: string[];
  verificationSteps: string[];
}

export class EnhancedScoringEngine {
  /**
   * Calculate documentation score with deep analysis
   */
  calculateDocumentationScore(docs: DocumentationQuality): number {
    let score = 0;
    
    // Core documentation (40 points)
    if (docs.hasAPIDocumentation) score += 10;
    if (docs.hasIntegrationGuides) score += 10;
    if (docs.hasTroubleshooting) score += 8;
    if (docs.hasFAQ) score += 6;
    if (docs.hasCodeSamples) score += 6;
    
    // Maintenance indicators (30 points)
    if (docs.hasChangelog) score += 10;
    if (docs.hasVersioning) score += 10;
    if (docs.lastUpdatedDays !== undefined) {
      if (docs.lastUpdatedDays < 30) score += 10;
      else if (docs.lastUpdatedDays < 90) score += 7;
      else if (docs.lastUpdatedDays < 180) score += 4;
    }
    
    // Accessibility & reach (30 points)
    if (docs.isMultilingual) score += 15;
    if (docs.hasAccessibilityFeatures) score += 15;
    
    return Math.min(100, score);
  }

  /**
   * Calculate transparency score with DAO recognition
   */
  calculateTransparencyScore(team: TeamTransparency, tokenomics: TokenomicsDepth, roadmap: RoadmapAssessment): number {
    let score = 0;
    
    // Team transparency (40 points) - adjusted for DAOs
    if (team.isDAO) {
      // DAOs get partial credit for decentralization
      score += 20; // Base credit for being DAO
      if (team.governanceModel === 'dao') score += 10;
      if (team.hasLeadershipBios) score += 5; // Partial credit for any disclosed leadership
      if (team.linkedInProfiles > 0) score += 5; // Bonus for any team disclosure
    } else {
      // Traditional projects need full team disclosure
      if (team.hasTeamPage) score += 10;
      if (team.teamMemberCount >= 5) score += 10;
      else if (team.teamMemberCount >= 3) score += 7;
      else if (team.teamMemberCount >= 1) score += 4;
      
      if (team.linkedInProfiles >= 3) score += 10;
      else if (team.linkedInProfiles >= 1) score += 5;
      
      if (team.hasLeadershipBios) score += 10;
    }
    
    // Tokenomics transparency (35 points)
    if (tokenomics.hasSupplyCap) score += 7;
    if (tokenomics.hasAllocationDetails) score += 8;
    if (tokenomics.hasVestingSchedule) score += 8;
    if (tokenomics.hasTreasuryManagement) score += 6;
    if (tokenomics.hasOnChainVerification) score += 6;
    
    // Roadmap transparency (25 points)
    if (roadmap.hasPublicRoadmap) score += 10;
    if (roadmap.hasTimelines) score += 8;
    if (roadmap.hasMilestones) score += 7;
    
    return Math.min(100, score);
  }

  /**
   * Calculate security score with audit freshness
   */
  calculateSecurityScore(security: SecurityAssessment): number {
    let score = 0;
    
    // Audit quality (50 points)
    if (security.audits.length === 0) {
      score += 0; // No audits = 0 points
    } else {
      const topTierAudits = security.audits.filter(a => a.auditorReputation === 'top-tier').length;
      const establishedAudits = security.audits.filter(a => a.auditorReputation === 'established').length;
      
      // Multiple audits from top firms
      if (topTierAudits >= 2) score += 50;
      else if (topTierAudits >= 1) score += 40;
      else if (establishedAudits >= 2) score += 35;
      else if (establishedAudits >= 1) score += 25;
      else score += 15; // At least some audit
      
      // Audit freshness bonus/penalty
      const freshAudits = security.audits.filter(a => a.isFresh).length;
      if (freshAudits > 0 && topTierAudits > 0) {
        score += 10; // Bonus for fresh top-tier audits
      } else if (security.audits.every(a => !a.isFresh)) {
        score -= 10; // Penalty for all outdated audits
      }
    }
    
    // Bug bounty program (20 points)
    if (security.hasBugBounty) {
      if (security.bugBountyPlatform === 'immunefi') score += 20;
      else if (security.bugBountyPlatform === 'hackerone') score += 18;
      else score += 15;
    }
    
    // Safety mechanisms (30 points)
    if (security.hasInsuranceFund || security.hasSafetyModule) score += 10;
    if (security.multiSigUsage) score += 8;
    if (security.timelockUsage) score += 7;
    if (security.hasIncidentResponse) score += 5;
    
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate community score with GitHub activity
   */
  calculateCommunityScore(community: CommunityMetrics): number {
    let score = 0;
    
    // GitHub activity (40 points)
    if (community.githubActivity.commits > 100) score += 15;
    else if (community.githubActivity.commits > 50) score += 12;
    else if (community.githubActivity.commits > 10) score += 8;
    else if (community.githubActivity.commits > 0) score += 4;
    
    if (community.githubActivity.contributors >= 10) score += 10;
    else if (community.githubActivity.contributors >= 5) score += 7;
    else if (community.githubActivity.contributors >= 2) score += 4;
    
    if (community.githubActivity.lastCommitDays < 7) score += 10;
    else if (community.githubActivity.lastCommitDays < 30) score += 7;
    else if (community.githubActivity.lastCommitDays < 90) score += 4;
    
    if (community.githubActivity.issueResponseTime && community.githubActivity.issueResponseTime < 48) {
      score += 5; // Responsive to issues
    }
    
    // Social presence (30 points)
    if (community.socialPresence.platforms.length >= 5) score += 15;
    else if (community.socialPresence.platforms.length >= 3) score += 10;
    else if (community.socialPresence.platforms.length >= 1) score += 5;
    
    if (community.socialPresence.engagementQuality === 'high') score += 15;
    else if (community.socialPresence.engagementQuality === 'medium') score += 10;
    else if (community.socialPresence.engagementQuality === 'low') score += 5;
    
    // Developer resources (20 points)
    if (community.developerResources.hasDeveloperPortal) score += 8;
    if (community.developerResources.hasStarterKit) score += 6;
    if (community.developerResources.hasSandbox) score += 3;
    if (community.developerResources.hasCodeWalkthroughs) score += 3;
    
    // Ecosystem integrations (10 points)
    if (community.ecosystemIntegrations.length >= 5) score += 10;
    else if (community.ecosystemIntegrations.length >= 3) score += 7;
    else if (community.ecosystemIntegrations.length >= 1) score += 4;
    
    return Math.min(100, score);
  }

  /**
   * Apply maturity-based adjustments
   */
  applyMaturityAdjustment(
    baseScore: number,
    maturity: 'new' | 'established' | 'mature',
    tvl?: number
  ): { adjustedScore: number; benchmark: number; explanation: string } {
    let benchmark = 50; // Default benchmark
    let adjustment = 0;
    let explanation = '';
    
    switch (maturity) {
      case 'new':
        benchmark = 40; // Lower expectations for new projects
        explanation = 'New project: Lower benchmark applied. Focus on fundamentals and team credibility.';
        // Don't penalize for missing advanced features
        if (baseScore >= 40) {
          adjustment = 5; // Small bonus for exceeding new project expectations
        }
        break;
        
      case 'established':
        benchmark = 60; // Standard expectations
        explanation = 'Established project: Standard benchmark applied. Expected to have core documentation and audits.';
        break;
        
      case 'mature':
        benchmark = 75; // High expectations for mature projects
        explanation = 'Mature project: High benchmark applied. Expected to have comprehensive documentation, multiple audits, and strong community.';
        // Higher standards for mature projects
        if (tvl && tvl > 100000000) { // $100M+ TVL
          benchmark = 80;
          explanation += ' High TVL requires exceptional standards.';
        }
        if (baseScore < benchmark) {
          adjustment = -5; // Penalty for not meeting mature project standards
        }
        break;
    }
    
    return {
      adjustedScore: Math.min(100, Math.max(0, baseScore + adjustment)),
      benchmark,
      explanation
    };
  }

  /**
   * Generate verification steps for users
   */
  generateVerificationSteps(analysis: EnhancedScoreResult): string[] {
    const steps: string[] = [];
    
    // Team verification
    if (analysis.deepAnalysis.teamTransparency.linkedInProfiles === 0 && !analysis.deepAnalysis.teamTransparency.isDAO) {
      steps.push('🔍 Verify team members on LinkedIn - Search for founder names and validate employment history');
    }
    
    // Audit verification
    if (analysis.deepAnalysis.security.audits.length > 0) {
      analysis.deepAnalysis.security.audits.forEach(audit => {
        steps.push(`🔍 Verify ${audit.auditorName} audit - Visit auditor website directly and confirm report authenticity`);
      });
    } else {
      steps.push('⚠️ No audits found - Request audit reports or proceed with extreme caution');
    }
    
    // Code verification
    if (analysis.deepAnalysis.deepLinks.githubRepo) {
      steps.push('🔍 Check GitHub activity - Verify recent commits, contributor diversity, and issue responses');
    } else {
      steps.push('⚠️ No GitHub repository - Request code repository or audit reports for verification');
    }
    
    // Tokenomics verification
    if (!analysis.deepAnalysis.tokenomics.hasOnChainVerification) {
      steps.push('🔍 Verify tokenomics on-chain - Use block explorers (Etherscan, etc.) to confirm supply and distribution');
    }
    
    // Community verification
    steps.push('🔍 Check community sentiment - Review Reddit, Discord, and Twitter for unbiased user feedback');
    
    // Bug bounty verification
    if (analysis.deepAnalysis.security.hasBugBounty) {
      steps.push(`🔍 Verify bug bounty program - Check ${analysis.deepAnalysis.security.bugBountyPlatform || 'platform'} for active program`);
    }
    
    // General due diligence
    steps.push('🔍 Monitor for 30-60 days - Assess team responsiveness and development activity over time');
    steps.push('🔍 Use third-party tools - Cross-reference with DeFiPulse, CoinGecko, Messari for additional data');
    
    return steps;
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(analysis: EnhancedScoreResult): string[] {
    const recommendations: string[] = [];
    
    // Documentation recommendations
    if (analysis.categoryScores.documentation < 60) {
      recommendations.push('📚 Improve documentation: Add API docs, integration guides, and code examples');
      if (!analysis.deepAnalysis.documentation.hasChangelog) {
        recommendations.push('📚 Add changelog: Document version history and breaking changes');
      }
    }
    
    // Transparency recommendations
    if (analysis.categoryScores.transparency < 60 && !analysis.deepAnalysis.teamTransparency.isDAO) {
      recommendations.push('👥 Enhance team transparency: Add detailed team bios with LinkedIn profiles');
      recommendations.push('💰 Clarify tokenomics: Provide detailed allocation, vesting schedules, and treasury management');
    }
    
    // Security recommendations
    if (analysis.categoryScores.security < 70) {
      if (analysis.deepAnalysis.security.audits.length === 0) {
        recommendations.push('🔒 Get security audit: Engage reputable auditors (Consensys, Trail of Bits, OpenZeppelin)');
      } else if (analysis.deepAnalysis.security.audits.every(a => !a.isFresh)) {
        recommendations.push('🔒 Update security audit: Last audit is outdated, consider re-audit after recent changes');
      }
      
      if (!analysis.deepAnalysis.security.hasBugBounty) {
        recommendations.push('🐛 Launch bug bounty: Set up program on Immunefi or HackerOne');
      }
    }
    
    // Community recommendations
    if (analysis.categoryScores.community < 60) {
      if (analysis.deepAnalysis.community.githubActivity.lastCommitDays > 30) {
        recommendations.push('💻 Increase development activity: More frequent commits and community engagement');
      }
      if (!analysis.deepAnalysis.community.developerResources.hasDeveloperPortal) {
        recommendations.push('🛠️ Create developer portal: Add starter kits, sandboxes, and integration examples');
      }
    }
    
    // Roadmap recommendations
    if (!analysis.deepAnalysis.roadmap.hasPublicRoadmap) {
      recommendations.push('🗺️ Publish roadmap: Share timeline, milestones, and development plans');
    }
    
    return recommendations;
  }
}
