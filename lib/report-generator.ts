import { AnalysisResult, ExtractedContent } from './ai-analyzer';
import { TrustScoreResult } from './trust-calculator';

export interface AuditReport {
  id: string;
  url: string;
  projectName: string;
  trustScore: TrustScoreResult;
  analysis: AnalysisResult;
  extractedContent: ExtractedContent;
  generatedAt: Date;
  reportVersion: string;
  userId?: string;
  hederaTransactionId?: string;
  blockchainStatus?: {
    stored: boolean;
    transactionId?: string;
    network: string;
    verifiable: boolean;
  };
}

export interface ReportSummary {
  trustScore: number;
  riskLevel: string;
  keyFindings: string[];
  criticalIssues: string[];
  recommendations: string[];
  confidence: number;
  scoreBreakdown: {
    documentation: number;
    transparency: number;
    security: number;
    community: number;
    technical: number;
  };
}

export interface DetailedReportSection {
  title: string;
  score: number;
  maxScore: number;
  explanation: string;
  findings: string[];
  recommendations: string[];
  riskFactors: string[];
}

export interface FormattedReport {
  summary: ReportSummary;
  sections: DetailedReportSection[];
  riskAssessment: {
    overallRisk: string;
    riskFactors: string[];
    mitigationStrategies: string[];
  };
  recommendations: {
    forInvestors: string[];
    forProject: string[];
  };
  metadata: {
    analysisDate: Date;
    reportVersion: string;
    confidenceLevel: number;
    dataCompleteness: number;
  };
}

/**
 * ReportGenerator class that combines analysis results and trust scores
 * to create comprehensive audit reports
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export class ReportGenerator {
  private readonly reportVersion = '1.0.0';

  /**
   * Generates a complete audit report combining all analysis components
   * Requirements: 4.1, 4.2, 4.3
   */
  generateFullReport(
    analysis: AnalysisResult,
    trustScore: TrustScoreResult,
    extractedContent: ExtractedContent,
    userId?: string,
    hederaTransactionId?: string
  ): AuditReport {
    const reportId = this.generateReportId();
    const projectName = this.extractProjectName(extractedContent);

    return {
      id: reportId,
      url: extractedContent.url,
      projectName,
      trustScore,
      analysis,
      extractedContent,
      generatedAt: new Date(),
      reportVersion: this.reportVersion,
      userId,
      hederaTransactionId
    };
  }

  /**
   * Generates a summary report for quick overview display
   * Requirements: 4.4, 4.5
   */
  generateSummaryReport(report: AuditReport): ReportSummary {
    const keyFindings = this.extractKeyFindings(report.analysis, report.trustScore);
    const criticalIssues = this.identifyCriticalIssues(report.analysis, report.trustScore);
    const prioritizedRecommendations = this.prioritizeRecommendations(report.analysis.recommendations);

    return {
      trustScore: report.trustScore.finalScore,
      riskLevel: report.trustScore.riskLevel,
      keyFindings,
      criticalIssues,
      recommendations: prioritizedRecommendations.slice(0, 5), // Top 5 recommendations
      confidence: report.trustScore.confidence,
      scoreBreakdown: {
        documentation: report.analysis.factors.documentationQuality,
        transparency: report.analysis.factors.transparencyIndicators,
        security: report.analysis.factors.securityDocumentation,
        community: report.analysis.factors.communityEngagement,
        technical: report.analysis.factors.technicalImplementation
      }
    };
  }

  /**
   * Generates a detailed formatted report with structured sections
   * Requirements: 4.1, 4.2, 4.3, 4.4
   */
  generateDetailedReport(report: AuditReport): FormattedReport {
    const summary = this.generateSummaryReport(report);
    const sections = this.createDetailedSections(report);
    const riskAssessment = this.generateRiskAssessment(report);
    const recommendations = this.categorizeRecommendations(report.analysis.recommendations);
    const metadata = this.generateMetadata(report);

    return {
      summary,
      sections,
      riskAssessment,
      recommendations,
      metadata
    };
  }

  /**
   * Formats findings with specific risks and recommendations
   * Requirements: 4.2, 4.3
   */
  private formatFindings(analysis: AnalysisResult): string[] {
    const findings: string[] = [];

    // Add positive findings
    analysis.positiveIndicators.forEach(indicator => {
      findings.push(`✓ ${indicator}`);
    });

    // Add risk findings
    analysis.risks.forEach(risk => {
      findings.push(`⚠ ${risk}`);
    });

    // Add red flag findings
    analysis.redFlags.forEach(redFlag => {
      findings.push(`🚨 ${redFlag}`);
    });

    return findings;
  }

  /**
   * Prioritizes recommendations based on impact and urgency
   * Requirements: 4.4, 4.5
   */
  private prioritizeRecommendations(recommendations: string[]): string[] {
    // Define priority keywords for sorting
    const highPriorityKeywords = [
      'security', 'audit', 'vulnerability', 'risk', 'scam', 'fraud',
      'team', 'transparency', 'verify', 'avoid', 'warning'
    ];

    const mediumPriorityKeywords = [
      'documentation', 'community', 'roadmap', 'tokenomics',
      'governance', 'development', 'update', 'improve'
    ];

    // Sort recommendations by priority
    return recommendations.sort((a, b) => {
      const aScore = this.calculateRecommendationPriority(a, highPriorityKeywords, mediumPriorityKeywords);
      const bScore = this.calculateRecommendationPriority(b, highPriorityKeywords, mediumPriorityKeywords);
      return bScore - aScore; // Higher score first
    });
  }

  /**
   * Calculates priority score for a recommendation
   */
  private calculateRecommendationPriority(
    recommendation: string,
    highPriorityKeywords: string[],
    mediumPriorityKeywords: string[]
  ): number {
    const text = recommendation.toLowerCase();
    let score = 0;

    // High priority keywords
    highPriorityKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 3;
      }
    });

    // Medium priority keywords
    mediumPriorityKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 1;
      }
    });

    return score;
  }

  /**
   * Extracts key findings from analysis and trust score
   */
  private extractKeyFindings(analysis: AnalysisResult, trustScore: TrustScoreResult): string[] {
    const findings: string[] = [];

    // Add score-based findings
    if (trustScore.finalScore >= 80) {
      findings.push('Strong overall trust indicators identified');
    } else if (trustScore.finalScore >= 60) {
      findings.push('Generally positive trust signals with some concerns');
    } else if (trustScore.finalScore >= 30) {
      findings.push('Mixed trust signals requiring careful evaluation');
    } else {
      findings.push('Significant trust concerns identified');
    }

    // Add factor-specific findings
    const factors = analysis.factors;
    if (factors.securityDocumentation >= 80) {
      findings.push('Comprehensive security documentation available');
    } else if (factors.securityDocumentation < 30) {
      findings.push('Limited security information provided');
    }

    if (factors.transparencyIndicators >= 80) {
      findings.push('High level of transparency in project details');
    } else if (factors.transparencyIndicators < 30) {
      findings.push('Lack of transparency in team and project information');
    }

    // Add red flag findings
    if (analysis.redFlags.length > 0) {
      findings.push(`${analysis.redFlags.length} red flag(s) detected`);
    }

    // Add positive indicator findings
    if (analysis.positiveIndicators.length >= 3) {
      findings.push(`${analysis.positiveIndicators.length} positive indicators found`);
    }

    return findings.slice(0, 6); // Limit to 6 key findings
  }

  /**
   * Identifies critical issues that require immediate attention
   */
  private identifyCriticalIssues(analysis: AnalysisResult, trustScore: TrustScoreResult): string[] {
    const criticalIssues: string[] = [];

    // Critical red flags
    analysis.redFlags.forEach(redFlag => {
      if (this.isCriticalRedFlag(redFlag)) {
        criticalIssues.push(redFlag);
      }
    });

    // Score-based critical issues
    if (trustScore.finalScore < 30) {
      criticalIssues.push('Overall trust score indicates high risk');
    }

    // Factor-specific critical issues
    if (analysis.factors.securityDocumentation < 20) {
      criticalIssues.push('Severe lack of security documentation');
    }

    if (analysis.factors.transparencyIndicators < 20) {
      criticalIssues.push('Extremely poor transparency indicators');
    }

    // Check for score caps due to critical issues
    const criticalCaps = trustScore.adjustments.filter(
      adj => adj.type === 'cap' && adj.severity === 'critical'
    );
    if (criticalCaps.length > 0) {
      criticalIssues.push('Score capped due to critical security concerns');
    }

    return criticalIssues;
  }

  /**
   * Determines if a red flag is critical
   */
  private isCriticalRedFlag(redFlag: string): boolean {
    const criticalKeywords = [
      'scam', 'fraud', 'ponzi', 'rug pull', 'exit scam',
      'honeypot', 'anonymous team', 'no audit', 'fake'
    ];

    return criticalKeywords.some(keyword => 
      redFlag.toLowerCase().includes(keyword)
    );
  }

  /**
   * Creates detailed sections for comprehensive reporting
   */
  private createDetailedSections(report: AuditReport): DetailedReportSection[] {
    const sections: DetailedReportSection[] = [];

    // Documentation Quality Section
    sections.push({
      title: 'Documentation Quality',
      score: report.analysis.factors.documentationQuality,
      maxScore: 100,
      explanation: report.analysis.explanations.documentationQuality,
      findings: this.extractSectionFindings(report, 'documentation'),
      recommendations: this.extractSectionRecommendations(report, 'documentation'),
      riskFactors: this.extractSectionRisks(report, 'documentation')
    });

    // Transparency Section
    sections.push({
      title: 'Transparency Indicators',
      score: report.analysis.factors.transparencyIndicators,
      maxScore: 100,
      explanation: report.analysis.explanations.transparencyIndicators,
      findings: this.extractSectionFindings(report, 'transparency'),
      recommendations: this.extractSectionRecommendations(report, 'transparency'),
      riskFactors: this.extractSectionRisks(report, 'transparency')
    });

    // Security Section
    sections.push({
      title: 'Security Documentation',
      score: report.analysis.factors.securityDocumentation,
      maxScore: 100,
      explanation: report.analysis.explanations.securityDocumentation,
      findings: this.extractSectionFindings(report, 'security'),
      recommendations: this.extractSectionRecommendations(report, 'security'),
      riskFactors: this.extractSectionRisks(report, 'security')
    });

    // Community Section
    sections.push({
      title: 'Community Engagement',
      score: report.analysis.factors.communityEngagement,
      maxScore: 100,
      explanation: report.analysis.explanations.communityEngagement,
      findings: this.extractSectionFindings(report, 'community'),
      recommendations: this.extractSectionRecommendations(report, 'community'),
      riskFactors: this.extractSectionRisks(report, 'community')
    });

    // Technical Section
    sections.push({
      title: 'Technical Implementation',
      score: report.analysis.factors.technicalImplementation,
      maxScore: 100,
      explanation: report.analysis.explanations.technicalImplementation,
      findings: this.extractSectionFindings(report, 'technical'),
      recommendations: this.extractSectionRecommendations(report, 'technical'),
      riskFactors: this.extractSectionRisks(report, 'technical')
    });

    return sections;
  }

  /**
   * Extracts section-specific findings
   */
  private extractSectionFindings(report: AuditReport, section: string): string[] {
    const findings: string[] = [];
    const sectionKeywords = this.getSectionKeywords(section);

    // Filter positive indicators for this section
    report.analysis.positiveIndicators.forEach(indicator => {
      if (sectionKeywords.some(keyword => indicator.toLowerCase().includes(keyword))) {
        findings.push(`✓ ${indicator}`);
      }
    });

    // Filter risks for this section
    report.analysis.risks.forEach(risk => {
      if (sectionKeywords.some(keyword => risk.toLowerCase().includes(keyword))) {
        findings.push(`⚠ ${risk}`);
      }
    });

    return findings;
  }

  /**
   * Extracts section-specific recommendations
   */
  private extractSectionRecommendations(report: AuditReport, section: string): string[] {
    const sectionKeywords = this.getSectionKeywords(section);

    return report.analysis.recommendations.filter(recommendation =>
      sectionKeywords.some(keyword => recommendation.toLowerCase().includes(keyword))
    );
  }

  /**
   * Extracts section-specific risk factors
   */
  private extractSectionRisks(report: AuditReport, section: string): string[] {
    const sectionKeywords = this.getSectionKeywords(section);

    return report.analysis.redFlags.filter(redFlag =>
      sectionKeywords.some(keyword => redFlag.toLowerCase().includes(keyword))
    );
  }

  /**
   * Gets keywords associated with each section
   */
  private getSectionKeywords(section: string): string[] {
    const keywordMap: Record<string, string[]> = {
      documentation: ['documentation', 'docs', 'guide', 'manual', 'whitepaper', 'api'],
      transparency: ['team', 'founder', 'transparency', 'tokenomics', 'roadmap', 'governance'],
      security: ['security', 'audit', 'vulnerability', 'multisig', 'timelock', 'bug bounty'],
      community: ['community', 'social', 'discord', 'telegram', 'twitter', 'engagement'],
      technical: ['technical', 'code', 'github', 'development', 'architecture', 'implementation']
    };

    return keywordMap[section] || [];
  }

  /**
   * Generates comprehensive risk assessment
   */
  private generateRiskAssessment(report: AuditReport): {
    overallRisk: string;
    riskFactors: string[];
    mitigationStrategies: string[];
  } {
    const riskLevel = report.trustScore.riskLevel;
    const riskFactors = [...report.analysis.risks, ...report.analysis.redFlags];
    const mitigationStrategies = this.generateMitigationStrategies(report);

    return {
      overallRisk: this.getRiskDescription(riskLevel),
      riskFactors,
      mitigationStrategies
    };
  }

  /**
   * Gets detailed risk description
   */
  private getRiskDescription(riskLevel: string): string {
    const descriptions: Record<string, string> = {
      HIGH: 'High risk of financial loss. Multiple critical concerns identified. Investment not recommended.',
      MEDIUM: 'Moderate risk present. Thorough due diligence required before any investment decision.',
      LOW: 'Low risk with minor concerns. Generally safe but monitor ongoing developments.',
      TRUSTED: 'Strong trust indicators present. Low probability of malicious activity.'
    };

    return descriptions[riskLevel] || 'Risk level could not be determined.';
  }

  /**
   * Generates mitigation strategies based on identified risks
   */
  private generateMitigationStrategies(report: AuditReport): string[] {
    const strategies: string[] = [];

    // General strategies based on risk level
    if (report.trustScore.riskLevel === 'HIGH') {
      strategies.push('Avoid investment until critical issues are resolved');
      strategies.push('Wait for independent security audits');
      strategies.push('Monitor project for significant improvements');
    } else if (report.trustScore.riskLevel === 'MEDIUM') {
      strategies.push('Limit investment to amount you can afford to lose');
      strategies.push('Monitor project developments closely');
      strategies.push('Verify team credentials independently');
    }

    // Specific strategies based on low scores
    if (report.analysis.factors.securityDocumentation < 50) {
      strategies.push('Request security audit reports before investing');
      strategies.push('Verify smart contract security independently');
    }

    if (report.analysis.factors.transparencyIndicators < 50) {
      strategies.push('Research team backgrounds through multiple sources');
      strategies.push('Verify claimed partnerships and advisors');
    }

    // Add general best practices
    strategies.push('Never invest more than you can afford to lose');
    strategies.push('Diversify investments across multiple projects');
    strategies.push('Stay updated on project developments');

    return strategies;
  }

  /**
   * Categorizes recommendations for different audiences
   */
  private categorizeRecommendations(recommendations: string[]): {
    forInvestors: string[];
    forProject: string[];
  } {
    const forInvestors: string[] = [];
    const forProject: string[] = [];

    const investorKeywords = ['verify', 'research', 'check', 'monitor', 'avoid', 'wait', 'invest'];
    const projectKeywords = ['improve', 'add', 'publish', 'provide', 'update', 'implement', 'create'];

    recommendations.forEach(recommendation => {
      const text = recommendation.toLowerCase();
      
      if (investorKeywords.some(keyword => text.includes(keyword))) {
        forInvestors.push(recommendation);
      } else if (projectKeywords.some(keyword => text.includes(keyword))) {
        forProject.push(recommendation);
      } else {
        // Default to investor recommendations
        forInvestors.push(recommendation);
      }
    });

    return { forInvestors, forProject };
  }

  /**
   * Generates report metadata
   */
  private generateMetadata(report: AuditReport): {
    analysisDate: Date;
    reportVersion: string;
    confidenceLevel: number;
    dataCompleteness: number;
  } {
    const dataCompleteness = this.calculateDataCompleteness(report.extractedContent);

    return {
      analysisDate: report.generatedAt,
      reportVersion: report.reportVersion,
      confidenceLevel: report.trustScore.confidence,
      dataCompleteness
    };
  }

  /**
   * Calculates data completeness based on extracted content
   */
  private calculateDataCompleteness(content: ExtractedContent): number {
    let completeness = 0;
    const maxPoints = 100;

    // Check various content fields
    if (content.title && content.title.length > 0) completeness += 10;
    if (content.description && content.description.length > 50) completeness += 15;
    if (content.mainContent && content.mainContent.length > 200) completeness += 20;
    if (content.documentation && content.documentation.length > 0) completeness += 15;
    if (content.teamInfo && content.teamInfo.length > 50) completeness += 15;
    if (content.tokenomics && content.tokenomics.length > 50) completeness += 10;
    if (content.securityInfo && content.securityInfo.length > 50) completeness += 10;
    if (content.socialLinks && content.socialLinks.length > 0) completeness += 3;
    if (content.codeRepositories && content.codeRepositories.length > 0) completeness += 2;

    return Math.min(maxPoints, completeness);
  }

  /**
   * Generates unique report ID
   */
  private generateReportId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `audit_${timestamp}_${randomStr}`;
  }

  /**
   * Extracts project name from content
   */
  private extractProjectName(content: ExtractedContent): string {
    if (content.title && content.title.length > 0) {
      return content.title.substring(0, 100); // Limit length
    }

    // Try to extract from URL
    try {
      const url = new URL(content.url);
      const hostname = url.hostname.replace('www.', '');
      return hostname.split('.')[0];
    } catch {
      return 'Unknown Project';
    }
  }

  /**
   * Exports report data for premium users
   * Requirements: 6.2, 6.3, 6.4
   */
  exportReport(report: AuditReport, format: 'json' | 'summary' = 'json'): string {
    if (format === 'summary') {
      const summary = this.generateSummaryReport(report);
      return JSON.stringify(summary, null, 2);
    }

    // Full report export
    const detailedReport = this.generateDetailedReport(report);
    return JSON.stringify(detailedReport, null, 2);
  }

  /**
   * Validates report structure for consistency
   */
  validateReport(report: AuditReport): boolean {
    try {
      return !!(
        report.id &&
        report.url &&
        report.projectName &&
        report.trustScore &&
        report.analysis &&
        report.extractedContent &&
        report.generatedAt &&
        report.reportVersion
      );
    } catch {
      return false;
    }
  }
}