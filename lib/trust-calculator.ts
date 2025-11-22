import { TrustFactors } from '@/types';

export interface TrustScoreWeights {
  documentationQuality: 0.25;
  transparencyIndicators: 0.20;
  securityDocumentation: 0.20;
  communityEngagement: 0.15;
  technicalImplementation: 0.20;
}

export interface ScoreAdjustment {
  factor: string;
  adjustment: number;
  reason: string;
  type: 'penalty' | 'bonus' | 'cap';
  severity?: 'minor' | 'moderate' | 'critical';
  category?: 'red_flag' | 'positive_indicator' | 'critical_cap' | 'base_calculation';
}

export interface TrustScoreResult {
  finalScore: number;           // 0-100
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'TRUSTED';
  confidence: number;           // 0-100
  breakdown: TrustFactors;
  adjustments: ScoreAdjustment[];
  baseScore: number;
  redFlags: string[];
  positiveIndicators: string[];
}

export interface AnalysisInput {
  factors: TrustFactors;
  redFlags: string[];
  positiveIndicators: string[];
  contentCompleteness: number; // 0-100, based on amount of content extracted
  extractedContentLength: number;
  projectType?: 'defi' | 'portfolio' | 'business' | 'general'; // Type of project being analyzed
  projectMaturity?: 'new' | 'established' | 'mature'; // Project age/maturity level
  tvl?: number; // Total Value Locked (if available)
  isDAO?: boolean; // Whether project is DAO-governed
  auditFreshness?: number; // Days since last audit
  githubActivity?: {
    commits: number;
    contributors: number;
    lastCommit: Date;
  };
}

export class TrustScoreCalculator {
  private readonly weights: TrustScoreWeights = {
    documentationQuality: 0.25,
    transparencyIndicators: 0.20,
    securityDocumentation: 0.20,
    communityEngagement: 0.15,
    technicalImplementation: 0.20
  };

  private readonly criticalRedFlags = [
    'no team information',
    'anonymous team',
    'no audit reports',
    'suspicious tokenomics',
    'no source code',
    'unrealistic promises',
    'ponzi scheme indicators',
    'rug pull warning signs',
    'fake partnerships',
    'copied whitepaper',
    'exit scam indicators',
    'honeypot contract',
    'unlimited minting',
    'no liquidity lock',
    'fake social media followers',
    'plagiarized content',
    'unverified smart contracts',
    'missing legal compliance'
  ];

  // DAO/Decentralized project patterns that should NOT be penalized
  private readonly daoPatterns = [
    'dao',
    'decentralized governance',
    'community-governed',
    'token holder voting',
    'on-chain governance',
    'decentralized protocol'
  ];

  // Reputable audit firms for verification
  private readonly reputableAuditors = [
    'consensys',
    'trail of bits',
    'openzeppelin',
    'certik',
    'quantstamp',
    'chainsecurity',
    'ackee',
    'oxorio',
    'certora',
    'abdk',
    'peckshield',
    'slowmist',
    'hacken'
  ];

  calculateTrustScore(analysis: AnalysisInput): TrustScoreResult {
    const adjustments: ScoreAdjustment[] = [];
    
    // Calculate base weighted score
    const baseScore = this.applyWeightedScoring(analysis.factors);
    
    // Apply red flag penalties
    const { scoreAfterPenalties, penaltyAdjustments } = this.applyRedFlagPenalties(
      baseScore, 
      analysis.redFlags
    );
    adjustments.push(...penaltyAdjustments);

    // Apply positive indicator bonuses
    const { scoreAfterBonuses, bonusAdjustments } = this.applyPositiveIndicatorBonuses(
      scoreAfterPenalties,
      analysis.positiveIndicators
    );
    adjustments.push(...bonusAdjustments);

    // Check for critical red flags that cap the score
    const { finalScore, capAdjustments } = this.applyCriticalRedFlagCaps(
      scoreAfterBonuses,
      analysis.redFlags
    );
    adjustments.push(...capAdjustments);

    // Calculate confidence level
    const confidence = this.calculateConfidenceLevel(analysis);

    // Determine risk level
    const riskLevel = this.determineRiskLevel(finalScore);

    // Ensure final score doesn't exceed 100 and is properly rounded
    const cappedFinalScore = Math.min(100, Math.max(0, finalScore));
    
    return {
      finalScore: Math.round(cappedFinalScore),
      riskLevel,
      confidence: Math.round(confidence),
      breakdown: analysis.factors,
      adjustments,
      baseScore: Math.round(baseScore),
      redFlags: analysis.redFlags,
      positiveIndicators: analysis.positiveIndicators
    };
  }

  private applyWeightedScoring(factors: TrustFactors): number {
    return (
      factors.documentationQuality * this.weights.documentationQuality +
      factors.transparencyIndicators * this.weights.transparencyIndicators +
      factors.securityDocumentation * this.weights.securityDocumentation +
      factors.communityEngagement * this.weights.communityEngagement +
      factors.technicalImplementation * this.weights.technicalImplementation
    );
  }

  private applyRedFlagPenalties(
    score: number, 
    redFlags: string[]
  ): { scoreAfterPenalties: number; penaltyAdjustments: ScoreAdjustment[] } {
    const adjustments: ScoreAdjustment[] = [];
    let adjustedScore = score;

    for (const redFlag of redFlags) {
      const { penalty, severity } = this.calculateRedFlagPenalty(redFlag);
      if (penalty > 0) {
        adjustedScore -= penalty;
        adjustments.push({
          factor: 'Red Flag',
          adjustment: -penalty,
          reason: `${severity.charAt(0).toUpperCase() + severity.slice(1)} penalty for: ${redFlag}`,
          type: 'penalty',
          severity,
          category: 'red_flag'
        });
      }
    }

    return {
      scoreAfterPenalties: Math.max(0, adjustedScore),
      penaltyAdjustments: adjustments
    };
  }

  private applyPositiveIndicatorBonuses(
    score: number,
    positiveIndicators: string[]
  ): { scoreAfterBonuses: number; bonusAdjustments: ScoreAdjustment[] } {
    const adjustments: ScoreAdjustment[] = [];
    let adjustedScore = score;
    let totalBonus = 0;

    for (const indicator of positiveIndicators) {
      const { bonus, severity } = this.calculatePositiveIndicatorBonus(indicator);
      if (bonus > 0) {
        totalBonus += bonus;
        adjustments.push({
          factor: 'Positive Indicator',
          adjustment: bonus,
          reason: `${severity.charAt(0).toUpperCase() + severity.slice(1)} bonus for: ${indicator}`,
          type: 'bonus',
          severity,
          category: 'positive_indicator'
        });
      }
    }

    // Cap total bonus at 5 points to prevent inflating scores beyond weighted calculation
    const cappedBonus = Math.min(totalBonus, 5);
    adjustedScore += cappedBonus;

    return {
      scoreAfterBonuses: adjustedScore,
      bonusAdjustments: adjustments
    };
  }

  private applyCriticalRedFlagCaps(
    score: number,
    redFlags: string[]
  ): { finalScore: number; capAdjustments: ScoreAdjustment[] } {
    const adjustments: ScoreAdjustment[] = [];
    let finalScore = score;

    // Identify which critical red flags are present
    const presentCriticalFlags = redFlags.filter(flag => 
      this.criticalRedFlags.some(critical => 
        flag.toLowerCase().includes(critical.toLowerCase())
      )
    );

    // Apply score cap if any critical red flags are detected (Requirement 3.6)
    if (presentCriticalFlags.length > 0 && finalScore > 40) {
      const originalScore = finalScore;
      finalScore = 40;
      
      adjustments.push({
        factor: 'Critical Red Flag Cap',
        adjustment: finalScore - originalScore,
        reason: `Score capped at 40 due to critical red flags: ${presentCriticalFlags.join(', ')}`,
        type: 'cap',
        severity: 'critical',
        category: 'critical_cap'
      });
    }

    return { finalScore, capAdjustments: adjustments };
  }

  private calculateRedFlagPenalty(redFlag: string): { penalty: number; severity: 'minor' | 'moderate' | 'critical' } {
    const flagLower = redFlag.toLowerCase();
    
    // Critical red flags (higher penalties)
    if (this.criticalRedFlags.some(critical => flagLower.includes(critical))) {
      return { penalty: 15, severity: 'critical' }; // 15 point penalty for critical issues
    }
    
    // Check for portfolio-specific issues (lower penalties)
    if (flagLower.includes('inconsistent dates') || flagLower.includes('conflicting metrics')) {
      return { penalty: 10, severity: 'moderate' }; // 10 point penalty for data inconsistencies
    }
    
    // Moderate red flags
    const moderateFlags = [
      'limited documentation',
      'unclear tokenomics',
      'small community',
      'new project',
      'unverified contracts',
      'incomplete information',
      'missing roadmap',
      'limited social presence',
      'limited personal information',
      'limited team information'
    ];
    
    if (moderateFlags.some(moderate => flagLower.includes(moderate))) {
      return { penalty: 8, severity: 'moderate' }; // 8 point penalty for moderate issues
    }
    
    // Minor red flags
    return { penalty: 3, severity: 'minor' }; // 3 point penalty for minor issues
  }

  private calculatePositiveIndicatorBonus(indicator: string): { bonus: number; severity: 'minor' | 'moderate' | 'critical' } {
    const indicatorLower = indicator.toLowerCase();
    
    // High-value positive indicators - reduced bonus since base scores are already high
    const highValueIndicators = [
      'multiple audits',
      'established team',
      'open source',
      'active development',
      'strong community',
      'transparent governance',
      'verified contracts',
      'liquidity locked',
      'doxxed team',
      'regulatory compliance'
    ];
    
    if (highValueIndicators.some(high => indicatorLower.includes(high))) {
      return { bonus: 1, severity: 'critical' }; // Reduced from 5 to 1
    }
    
    // Standard positive indicators - minimal bonus
    const standardIndicators = [
      'documentation available',
      'team identified',
      'audit completed',
      'active social media',
      'github repository',
      'whitepaper available',
      'roadmap published',
      'community engagement'
    ];
    
    if (standardIndicators.some(standard => indicatorLower.includes(standard))) {
      return { bonus: 0.5, severity: 'moderate' }; // Reduced from 2 to 0.5
    }
    
    return { bonus: 0, severity: 'minor' };
  }

  private calculateConfidenceLevel(analysis: AnalysisInput): number {
    let confidence = 50; // Base confidence
    
    // Content completeness factor (0-30 points)
    confidence += (analysis.contentCompleteness / 100) * 30;
    
    // Content length factor (0-20 points)
    const lengthScore = Math.min(20, (analysis.extractedContentLength / 5000) * 20);
    confidence += lengthScore;
    
    // Factor completeness (all factors should be > 0 for high confidence)
    const factorValues = Object.values(analysis.factors);
    const nonZeroFactors = factorValues.filter(value => value > 0).length;
    const factorCompleteness = (nonZeroFactors / factorValues.length) * 100;
    
    // Adjust confidence based on factor completeness
    if (factorCompleteness === 100) {
      confidence += 0; // No penalty for complete analysis
    } else if (factorCompleteness >= 80) {
      confidence -= 5; // Small penalty for mostly complete
    } else if (factorCompleteness >= 60) {
      confidence -= 15; // Moderate penalty for incomplete
    } else {
      confidence -= 30; // Large penalty for very incomplete
    }
    
    return Math.min(100, Math.max(0, confidence));
  }

  private determineRiskLevel(score: number): 'HIGH' | 'MEDIUM' | 'LOW' | 'TRUSTED' {
    // Risk level determination based on requirements 3.2-3.5
    if (score < 30) {
      return 'HIGH';    // Below 30: High Risk with red indicators
    } else if (score < 60) {
      return 'MEDIUM';  // 30-60: Medium Risk with yellow indicators
    } else if (score < 80) {
      return 'LOW';     // 60-80: Low Risk with green indicators
    } else {
      return 'TRUSTED'; // Above 80: Trusted with blue indicators
    }
  }

  /**
   * Get detailed risk level information including color indicators and descriptions
   * Based on requirements 3.2-3.5 for risk classification
   */
  getRiskLevelDetails(score: number): {
    level: 'HIGH' | 'MEDIUM' | 'LOW' | 'TRUSTED';
    color: string;
    indicator: string;
    description: string;
    scoreRange: string;
  } {
    const riskLevel = this.determineRiskLevel(score);
    
    switch (riskLevel) {
      case 'HIGH':
        return {
          level: 'HIGH',
          color: 'red',
          indicator: 'red',
          description: 'Significant trust concerns identified. High risk of loss.',
          scoreRange: '0-29'
        };
      case 'MEDIUM':
        return {
          level: 'MEDIUM',
          color: 'yellow',
          indicator: 'yellow',
          description: 'Moderate risk factors present. Proceed with caution.',
          scoreRange: '30-59'
        };
      case 'LOW':
        return {
          level: 'LOW',
          color: 'green',
          indicator: 'green',
          description: 'Generally trustworthy with minor concerns.',
          scoreRange: '60-79'
        };
      case 'TRUSTED':
        return {
          level: 'TRUSTED',
          color: 'blue',
          indicator: 'blue',
          description: 'Strong indicators of trustworthiness and reliability.',
          scoreRange: '80-100'
        };
    }
  }

  /**
   * Get a summary of score adjustments for transparency
   * Provides detailed breakdown of how the final score was calculated
   */
  getAdjustmentsSummary(adjustments: ScoreAdjustment[]): {
    totalPenalties: number;
    totalBonuses: number;
    totalCaps: number;
    criticalAdjustments: ScoreAdjustment[];
    moderateAdjustments: ScoreAdjustment[];
    minorAdjustments: ScoreAdjustment[];
    summary: string;
  } {
    const penalties = adjustments.filter(adj => adj.type === 'penalty');
    const bonuses = adjustments.filter(adj => adj.type === 'bonus');
    const caps = adjustments.filter(adj => adj.type === 'cap');

    const totalPenalties = penalties.reduce((sum, adj) => sum + Math.abs(adj.adjustment), 0);
    const totalBonuses = bonuses.reduce((sum, adj) => sum + adj.adjustment, 0);
    const totalCaps = caps.reduce((sum, adj) => sum + adj.adjustment, 0);

    const criticalAdjustments = adjustments.filter(adj => adj.severity === 'critical');
    const moderateAdjustments = adjustments.filter(adj => adj.severity === 'moderate');
    const minorAdjustments = adjustments.filter(adj => adj.severity === 'minor');

    let summary = `Applied ${adjustments.length} score adjustments: `;
    if (totalPenalties > 0) summary += `-${totalPenalties} penalties, `;
    if (totalBonuses > 0) summary += `+${totalBonuses} bonuses, `;
    if (totalCaps < 0) summary += `${totalCaps} caps, `;
    summary = summary.replace(/, $/, '');

    return {
      totalPenalties,
      totalBonuses,
      totalCaps,
      criticalAdjustments,
      moderateAdjustments,
      minorAdjustments,
      summary
    };
  }
}

// Legacy function for backward compatibility
export function calculateTrustScore(factors: TrustFactors): number {
  const calculator = new TrustScoreCalculator();
  const analysis: AnalysisInput = {
    factors,
    redFlags: [],
    positiveIndicators: [],
    contentCompleteness: 100,
    extractedContentLength: 1000
  };
  
  return calculator.calculateTrustScore(analysis).finalScore;
}

export function getTrustLevel(score: number): {
  level: string;
  color: string;
  description: string;
} {
  if (score >= 80) {
    return {
      level: 'Trusted',
      color: 'text-blue-600',
      description: 'Strong indicators of trustworthiness'
    };
  } else if (score >= 60) {
    return {
      level: 'Low Risk',
      color: 'text-green-600',
      description: 'Generally trustworthy with minor concerns'
    };
  } else if (score >= 30) {
    return {
      level: 'Medium Risk',
      color: 'text-yellow-600',
      description: 'Moderate risk factors present'
    };
  } else {
    return {
      level: 'High Risk',
      color: 'text-red-600',
      description: 'Significant trust concerns identified'
    };
  }
}