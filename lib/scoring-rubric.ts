export interface ScoringCriteria {
  factor: string;
  weight: number;
  maxScore: number;
  criteria: {
    excellent: { min: number; description: string; evidence: string[] };
    good: { min: number; description: string; evidence: string[] };
    fair: { min: number; description: string; evidence: string[] };
    poor: { min: number; description: string; evidence: string[] };
  };
}

export interface ScoringEvidence {
  criterion: string;
  score: number;
  evidence: string[];
  sources: string[];
  confidence: number;
  lastVerified: Date;
}

export class ScoringRubric {
  private readonly rubric: ScoringCriteria[] = [
    {
      factor: 'Documentation Quality',
      weight: 0.25,
      maxScore: 100,
      criteria: {
        excellent: {
          min: 85,
          description: 'Comprehensive, professional documentation with regular updates',
          evidence: [
            'Complete API documentation with examples',
            'User guides and tutorials',
            'Developer onboarding materials',
            'FAQ and troubleshooting guides',
            'Regular updates with timestamps',
            'Multilingual support'
          ]
        },
        good: {
          min: 70,
          description: 'Good documentation covering most essential areas',
          evidence: [
            'API documentation present',
            'Basic user guides available',
            'Some developer resources',
            'Occasional updates'
          ]
        },
        fair: {
          min: 50,
          description: 'Basic documentation with some gaps',
          evidence: [
            'Limited API documentation',
            'Basic user information',
            'Infrequent updates'
          ]
        },
        poor: {
          min: 0,
          description: 'Minimal or outdated documentation',
          evidence: [
            'No API documentation',
            'Outdated information',
            'Placeholder content'
          ]
        }
      }
    },
    {
      factor: 'Transparency Indicators',
      weight: 0.25,
      maxScore: 100,
      criteria: {
        excellent: {
          min: 85,
          description: 'Full transparency with verified team and tokenomics',
          evidence: [
            'Detailed team bios with LinkedIn profiles',
            'Complete tokenomics documentation',
            'Detailed roadmap with milestones',
            'Governance structure clearly defined',
            'Treasury transparency',
            'Regular progress updates'
          ]
        },
        good: {
          min: 70,
          description: 'Good transparency with most information available',
          evidence: [
            'Team information provided',
            'Tokenomics documented',
            'Roadmap available',
            'Some governance information'
          ]
        },
        fair: {
          min: 50,
          description: 'Basic transparency with some missing elements',
          evidence: [
            'Limited team information',
            'Basic tokenomics',
            'High-level roadmap'
          ]
        },
        poor: {
          min: 0,
          description: 'Poor transparency or anonymous team',
          evidence: [
            'Anonymous team',
            'Unclear tokenomics',
            'No roadmap',
            'Lack of governance information'
          ]
        }
      }
    },
    {
      factor: 'Security Documentation',
      weight: 0.25,
      maxScore: 100,
      criteria: {
        excellent: {
          min: 85,
          description: 'Comprehensive security with multiple audits and active programs',
          evidence: [
            'Multiple audits from reputable firms',
            'Active bug bounty program',
            'Security best practices documented',
            'Incident response procedures',
            'Regular security updates',
            'Formal verification where applicable'
          ]
        },
        good: {
          min: 70,
          description: 'Good security practices with audits',
          evidence: [
            'Recent security audit',
            'Bug bounty program',
            'Some security documentation',
            'Multisig or timelock usage'
          ]
        },
        fair: {
          min: 50,
          description: 'Basic security measures',
          evidence: [
            'Older audit available',
            'Basic security practices',
            'Limited security documentation'
          ]
        },
        poor: {
          min: 0,
          description: 'Insufficient security measures',
          evidence: [
            'No audits found',
            'No security documentation',
            'No bug bounty program',
            'Poor security practices'
          ]
        }
      }
    },
    {
      factor: 'Community Engagement',
      weight: 0.15,
      maxScore: 100,
      criteria: {
        excellent: {
          min: 85,
          description: 'Highly active and engaged community across multiple platforms',
          evidence: [
            'Active Discord/Telegram communities',
            'Regular social media engagement',
            'Responsive team communication',
            'Community governance participation',
            'Educational content creation',
            'Developer community support'
          ]
        },
        good: {
          min: 70,
          description: 'Good community engagement with regular activity',
          evidence: [
            'Active social media presence',
            'Community forums available',
            'Regular team updates',
            'Some community participation'
          ]
        },
        fair: {
          min: 50,
          description: 'Moderate community engagement',
          evidence: [
            'Basic social media presence',
            'Occasional updates',
            'Limited community interaction'
          ]
        },
        poor: {
          min: 0,
          description: 'Poor community engagement or inactive channels',
          evidence: [
            'Inactive social media',
            'No community forums',
            'Rare updates',
            'Poor responsiveness'
          ]
        }
      }
    },
    {
      factor: 'Technical Implementation',
      weight: 0.10,
      maxScore: 100,
      criteria: {
        excellent: {
          min: 85,
          description: 'High-quality open source implementation with active development',
          evidence: [
            'Open source code available',
            'Active GitHub with recent commits',
            'High test coverage',
            'Clear architecture documentation',
            'Multiple contributors',
            'CI/CD pipelines',
            'Code quality tools'
          ]
        },
        good: {
          min: 70,
          description: 'Good technical implementation with regular updates',
          evidence: [
            'Code repositories available',
            'Regular development activity',
            'Some test coverage',
            'Basic documentation'
          ]
        },
        fair: {
          min: 50,
          description: 'Basic technical implementation',
          evidence: [
            'Code available but limited activity',
            'Basic testing',
            'Minimal documentation'
          ]
        },
        poor: {
          min: 0,
          description: 'Poor technical implementation or closed source',
          evidence: [
            'No code repositories',
            'Closed source',
            'No testing evidence',
            'Poor code quality'
          ]
        }
      }
    }
  ];

  /**
   * Gets the complete scoring rubric
   */
  getRubric(): ScoringCriteria[] {
    return this.rubric;
  }

  /**
   * Calculates score based on evidence and rubric
   */
  calculateScore(factor: string, evidence: ScoringEvidence): {
    score: number;
    grade: string;
    justification: string;
    improvements: string[];
  } {
    const criteria = this.rubric.find(r => r.factor === factor);
    if (!criteria) {
      throw new Error(`Unknown factor: ${factor}`);
    }

    let grade = 'poor';
    let score = evidence.score;

    // Determine grade based on score
    if (score >= criteria.criteria.excellent.min) {
      grade = 'excellent';
    } else if (score >= criteria.criteria.good.min) {
      grade = 'good';
    } else if (score >= criteria.criteria.fair.min) {
      grade = 'fair';
    }

    // Generate justification
    const gradeInfo = criteria.criteria[grade as keyof typeof criteria.criteria];
    const justification = `${gradeInfo.description}. Evidence: ${evidence.evidence.join(', ')}`;

    // Generate improvement suggestions
    const improvements = this.generateImprovements(factor, grade, evidence);

    return {
      score,
      grade,
      justification,
      improvements
    };
  }

  /**
   * Generates improvement suggestions based on current grade
   */
  private generateImprovements(factor: string, currentGrade: string, evidence: ScoringEvidence): string[] {
    const improvements: string[] = [];
    const criteria = this.rubric.find(r => r.factor === factor);
    
    if (!criteria) return improvements;

    // Suggest improvements to reach next grade level
    if (currentGrade === 'poor') {
      improvements.push(...criteria.criteria.fair.evidence.map(e => `Add: ${e}`));
    } else if (currentGrade === 'fair') {
      improvements.push(...criteria.criteria.good.evidence.map(e => `Improve: ${e}`));
    } else if (currentGrade === 'good') {
      improvements.push(...criteria.criteria.excellent.evidence.map(e => `Enhance: ${e}`));
    }

    return improvements.slice(0, 3); // Limit to top 3 suggestions
  }

  /**
   * Validates evidence against rubric criteria
   */
  validateEvidence(factor: string, evidence: string[]): {
    valid: boolean;
    missing: string[];
    suggestions: string[];
  } {
    const criteria = this.rubric.find(r => r.factor === factor);
    if (!criteria) {
      return { valid: false, missing: [], suggestions: [] };
    }

    const allRequiredEvidence = [
      ...criteria.criteria.excellent.evidence,
      ...criteria.criteria.good.evidence,
      ...criteria.criteria.fair.evidence
    ];

    const missing = allRequiredEvidence.filter(required => 
      !evidence.some(provided => 
        provided.toLowerCase().includes(required.toLowerCase().split(' ')[0])
      )
    );

    const suggestions = missing.slice(0, 5).map(item => 
      `Consider adding evidence for: ${item}`
    );

    return {
      valid: missing.length < allRequiredEvidence.length * 0.5,
      missing,
      suggestions
    };
  }

  /**
   * Gets scoring transparency report
   */
  getTransparencyReport(): {
    methodology: string;
    weights: { factor: string; weight: number }[];
    criteria: ScoringCriteria[];
    lastUpdated: Date;
  } {
    return {
      methodology: 'Weighted scoring system based on verifiable evidence from primary sources',
      weights: this.rubric.map(r => ({ factor: r.factor, weight: r.weight })),
      criteria: this.rubric,
      lastUpdated: new Date()
    };
  }
}