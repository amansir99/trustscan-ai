/**
 * Consistency Validator for TrustScan AI Reports
 * Ensures reliable and consistent scoring across different analysis methods
 */

import { AnalysisResult, AnalysisFactors } from './ai-analyzer';
import { ExtractedContent } from './ai-analyzer';

export interface ConsistencyReport {
  isConsistent: boolean;
  score: number; // 0-100 consistency score
  issues: string[];
  adjustments: AnalysisFactors;
  confidence: 'high' | 'medium' | 'low';
}

export class ConsistencyValidator {
  private readonly SCORE_VARIANCE_THRESHOLD = 25; // Max allowed variance between methods
  private readonly MIN_CONFIDENCE_THRESHOLD = 70;

  /**
   * Validates consistency between AI analysis and fallback pattern analysis
   */
  validateConsistency(
    aiResult: AnalysisResult | null,
    patternResult: AnalysisResult,
    content: ExtractedContent
  ): ConsistencyReport {
    const issues: string[] = [];
    let consistencyScore = 100;
    let adjustments: AnalysisFactors = { ...patternResult.factors };

    // If AI analysis failed, use pattern analysis with confidence adjustment
    if (!aiResult) {
      return {
        isConsistent: true,
        score: 85, // Pattern-only analysis gets 85% consistency
        issues: ['AI analysis unavailable - using pattern-based analysis'],
        adjustments: this.adjustPatternScores(patternResult.factors, content),
        confidence: 'medium'
      };
    }

    // Compare scores between AI and pattern analysis
    const scoreComparison = this.compareScores(aiResult.factors, patternResult.factors);
    consistencyScore -= scoreComparison.variance;
    issues.push(...scoreComparison.issues);

    // Validate against content quality indicators
    const contentValidation = this.validateAgainstContent(aiResult.factors, content);
    consistencyScore -= contentValidation.penalty;
    issues.push(...contentValidation.issues);

    // Apply consistency adjustments
    adjustments = this.applyConsistencyAdjustments(aiResult.factors, patternResult.factors, content);

    // Determine confidence level
    const confidence = this.determineConfidence(consistencyScore, issues.length, content);

    return {
      isConsistent: consistencyScore >= this.MIN_CONFIDENCE_THRESHOLD,
      score: Math.max(0, consistencyScore),
      issues,
      adjustments,
      confidence
    };
  }

  /**
   * Compares scores between AI and pattern analysis
   */
  private compareScores(aiScores: AnalysisFactors, patternScores: AnalysisFactors): {
    variance: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let totalVariance = 0;
    let comparisons = 0;

    Object.keys(aiScores).forEach(key => {
      const factor = key as keyof AnalysisFactors;
      const aiScore = aiScores[factor];
      const patternScore = patternScores[factor];
      const variance = Math.abs(aiScore - patternScore);

      if (variance > this.SCORE_VARIANCE_THRESHOLD) {
        issues.push(`High variance in ${factor}: AI=${aiScore}, Pattern=${patternScore} (diff: ${variance})`);
        totalVariance += variance;
      }
      comparisons++;
    });

    return {
      variance: comparisons > 0 ? (totalVariance / comparisons) * 0.5 : 0, // Scale down impact
      issues
    };
  }

  /**
   * Validates scores against actual content quality
   */
  private validateAgainstContent(scores: AnalysisFactors, content: ExtractedContent): {
    penalty: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let penalty = 0;

    // Check documentation score vs actual content
    if (scores.documentationQuality > 80 && content.documentation.length < 3) {
      issues.push('High documentation score but limited documentation sections found');
      penalty += 10;
    }

    // Check transparency score vs team info
    if (scores.transparencyIndicators > 80 && content.teamInfo.length < 100) {
      issues.push('High transparency score but limited team information');
      penalty += 10;
    }

    // Check security score vs security content
    if (scores.securityDocumentation > 80 && content.securityInfo.length < 50) {
      issues.push('High security score but limited security information');
      penalty += 10;
    }

    // Check community score vs social links
    if (scores.communityEngagement > 80 && content.socialLinks.length < 3) {
      issues.push('High community score but limited social media presence');
      penalty += 10;
    }

    // Check technical score vs repositories
    if (scores.technicalImplementation > 80 && content.codeRepositories.length === 0) {
      issues.push('High technical score but no code repositories found');
      penalty += 10;
    }

    return { penalty, issues };
  }

  /**
   * Applies consistency adjustments to create reliable final scores
   */
  private applyConsistencyAdjustments(
    aiScores: AnalysisFactors,
    patternScores: AnalysisFactors,
    content: ExtractedContent
  ): AnalysisFactors {
    const adjustments: AnalysisFactors = {} as AnalysisFactors;

    Object.keys(aiScores).forEach(key => {
      const factor = key as keyof AnalysisFactors;
      const aiScore = aiScores[factor];
      const patternScore = patternScores[factor];

      // Trust AI scores when available - only use pattern as validation
      // If variance is small (<15 points), use AI score directly
      // If variance is large, use weighted average favoring AI (80% AI, 20% pattern)
      const variance = Math.abs(aiScore - patternScore);
      
      if (variance < 15) {
        adjustments[factor] = aiScore;
      } else {
        adjustments[factor] = Math.round(aiScore * 0.8 + patternScore * 0.2);
      }
    });

    // Apply content-based adjustments
    return this.adjustForContentQuality(adjustments, content);
  }

  /**
   * Adjusts pattern-only scores for better accuracy
   */
  private adjustPatternScores(scores: AnalysisFactors, content: ExtractedContent): AnalysisFactors {
    const adjusted = { ...scores };

    // Boost scores if external verification data is available
    if (content.externalVerification) {
      const ev = content.externalVerification;
      
      if (ev.verifiedTeamMembers > 0) {
        adjusted.transparencyIndicators = Math.min(100, adjusted.transparencyIndicators + 15);
      }
      
      if (ev.verifiedRepos > 0) {
        adjusted.technicalImplementation = Math.min(100, adjusted.technicalImplementation + 15);
      }
    }

    // Boost scores if social media data shows strong community
    if (content.socialMediaData) {
      const sm = content.socialMediaData;
      
      if (sm.totalFollowers + sm.totalMembers > 50000) {
        adjusted.communityEngagement = Math.min(100, adjusted.communityEngagement + 20);
      }
    }

    // Apply content quality adjustments
    return this.adjustForContentQuality(adjusted, content);
  }

  /**
   * Adjusts scores based on actual content quality indicators
   */
  private adjustForContentQuality(scores: AnalysisFactors, content: ExtractedContent): AnalysisFactors {
    const adjusted = { ...scores };

    // Documentation quality adjustments
    if (content.documentation.length >= 5) {
      adjusted.documentationQuality = Math.min(100, adjusted.documentationQuality + 10);
    } else if (content.documentation.length === 0) {
      adjusted.documentationQuality = Math.max(0, adjusted.documentationQuality - 20);
    }

    // Team transparency adjustments
    if (content.teamInfo.length > 500) {
      adjusted.transparencyIndicators = Math.min(100, adjusted.transparencyIndicators + 10);
    } else if (content.teamInfo.length < 50) {
      adjusted.transparencyIndicators = Math.max(0, adjusted.transparencyIndicators - 15);
    }

    // Security documentation adjustments
    if (content.securityInfo.length > 200) {
      adjusted.securityDocumentation = Math.min(100, adjusted.securityDocumentation + 10);
    } else if (content.securityInfo.length === 0) {
      adjusted.securityDocumentation = Math.max(0, adjusted.securityDocumentation - 20);
    }

    // Community engagement adjustments
    if (content.socialLinks.length >= 5) {
      adjusted.communityEngagement = Math.min(100, adjusted.communityEngagement + 10);
    } else if (content.socialLinks.length === 0) {
      adjusted.communityEngagement = Math.max(0, adjusted.communityEngagement - 25);
    }

    // Technical implementation adjustments
    if (content.codeRepositories.length >= 2) {
      adjusted.technicalImplementation = Math.min(100, adjusted.technicalImplementation + 15);
    } else if (content.codeRepositories.length === 0) {
      adjusted.technicalImplementation = Math.max(0, adjusted.technicalImplementation - 20);
    }

    return adjusted;
  }

  /**
   * Determines confidence level based on various factors
   */
  private determineConfidence(
    consistencyScore: number,
    issueCount: number,
    content: ExtractedContent
  ): 'high' | 'medium' | 'low' {
    // High confidence criteria
    if (consistencyScore >= 90 && issueCount <= 1 && content.mainContent.length > 2000) {
      return 'high';
    }

    // Low confidence criteria
    if (consistencyScore < 70 || issueCount > 5 || content.mainContent.length < 500) {
      return 'low';
    }

    // Medium confidence (default)
    return 'medium';
  }

  /**
   * Generates a consistency report summary
   */
  generateConsistencyReport(report: ConsistencyReport): string {
    const confidenceEmoji = {
      high: '🟢',
      medium: '🟡', 
      low: '🔴'
    };

    let summary = `${confidenceEmoji[report.confidence]} Consistency Score: ${report.score}/100 (${report.confidence} confidence)\n\n`;

    if (report.issues.length > 0) {
      summary += `⚠️ Consistency Issues:\n${report.issues.map(issue => `• ${issue}`).join('\n')}\n\n`;
    }

    summary += `📊 Final Adjusted Scores:\n`;
    summary += `• Documentation Quality: ${report.adjustments.documentationQuality}/100\n`;
    summary += `• Transparency Indicators: ${report.adjustments.transparencyIndicators}/100\n`;
    summary += `• Security Documentation: ${report.adjustments.securityDocumentation}/100\n`;
    summary += `• Community Engagement: ${report.adjustments.communityEngagement}/100\n`;
    summary += `• Technical Implementation: ${report.adjustments.technicalImplementation}/100\n`;

    return summary;
  }
}