import { ExtractedContent } from './ai-analyzer';

export interface VerificationResult {
  verified: boolean;
  source: string;
  lastChecked: Date;
  confidence: number;
  evidence: string[];
}

export interface PrimarySourceData {
  documentation: VerificationResult;
  audits: VerificationResult;
  governance: VerificationResult;
  community: VerificationResult;
  technical: VerificationResult;
}

export class VerificationService {
  private readonly AUDIT_FIRMS = [
    'consensys.net', 'trailofbits.com', 'openzeppelin.com', 
    'certik.com', 'quantstamp.com', 'chainsecurity.com'
  ];

  private readonly BUG_BOUNTY_PLATFORMS = [
    'immunefi.com', 'hackerone.com', 'bugcrowd.com'
  ];

  /**
   * Verifies project data against primary sources
   */
  async verifyPrimarySources(content: ExtractedContent): Promise<PrimarySourceData> {
    const results = await Promise.allSettled([
      this.verifyDocumentation(content),
      this.verifyAudits(content),
      this.verifyGovernance(content),
      this.verifyCommunity(content),
      this.verifyTechnical(content)
    ]);

    return {
      documentation: this.getResult(results[0]),
      audits: this.getResult(results[1]),
      governance: this.getResult(results[2]),
      community: this.getResult(results[3]),
      technical: this.getResult(results[4])
    };
  }

  /**
   * Verifies documentation completeness and quality
   */
  private async verifyDocumentation(content: ExtractedContent): Promise<VerificationResult> {
    const evidence: string[] = [];
    let confidence = 0;

    // Check for official documentation domains
    const docPatterns = [
      /docs\.[^\/\s]+/gi,
      /[^\/\s]+\.gitbook\.io/gi,
      /github\.com\/[^\/]+\/[^\/]+\/wiki/gi
    ];

    docPatterns.forEach(pattern => {
      const matches = content.mainContent.match(pattern);
      if (matches) {
        evidence.push(`Official docs found: ${matches[0]}`);
        confidence += 25;
      }
    });

    // Check documentation sections
    const requiredSections = ['api', 'integration', 'guide', 'tutorial', 'faq'];
    requiredSections.forEach(section => {
      if (content.documentation.some(doc => doc.toLowerCase().includes(section))) {
        evidence.push(`${section} documentation present`);
        confidence += 10;
      }
    });

    return {
      verified: confidence > 50,
      source: 'Primary documentation analysis',
      lastChecked: new Date(),
      confidence: Math.min(100, confidence),
      evidence
    };
  }

  /**
   * Verifies security audits from reputable firms
   */
  private async verifyAudits(content: ExtractedContent): Promise<VerificationResult> {
    const evidence: string[] = [];
    let confidence = 0;

    // Check for audit firm mentions
    this.AUDIT_FIRMS.forEach(firm => {
      if (content.securityInfo.toLowerCase().includes(firm.split('.')[0])) {
        evidence.push(`Audit by ${firm} mentioned`);
        confidence += 20;
      }
    });

    // Check for audit report patterns
    const auditPatterns = [
      /audit.*report.*pdf/gi,
      /security.*review.*\d{4}/gi,
      /audit.*completed.*\d{4}/gi
    ];

    auditPatterns.forEach(pattern => {
      if (pattern.test(content.securityInfo)) {
        evidence.push('Audit report documentation found');
        confidence += 15;
      }
    });

    // Check for bug bounty programs
    this.BUG_BOUNTY_PLATFORMS.forEach(platform => {
      if (content.securityInfo.toLowerCase().includes(platform.split('.')[0])) {
        evidence.push(`Bug bounty on ${platform} found`);
        confidence += 10;
      }
    });

    return {
      verified: confidence > 30,
      source: 'Security audit verification',
      lastChecked: new Date(),
      confidence: Math.min(100, confidence),
      evidence
    };
  }

  /**
   * Verifies governance structure and transparency
   */
  private async verifyGovernance(content: ExtractedContent): Promise<VerificationResult> {
    const evidence: string[] = [];
    let confidence = 0;

    // Check for governance platforms
    const governancePatterns = [
      /snapshot\.org/gi,
      /forum\.[^\/\s]+/gi,
      /governance\.[^\/\s]+/gi,
      /vote\.[^\/\s]+/gi
    ];

    governancePatterns.forEach(pattern => {
      const matches = content.mainContent.match(pattern);
      if (matches) {
        evidence.push(`Governance platform: ${matches[0]}`);
        confidence += 20;
      }
    });

    // Check for DAO indicators
    const daoKeywords = ['dao', 'governance', 'voting', 'proposal', 'delegate'];
    daoKeywords.forEach(keyword => {
      if (content.mainContent.toLowerCase().includes(keyword)) {
        confidence += 5;
      }
    });

    if (confidence > 25) {
      evidence.push('DAO governance structure detected');
    }

    return {
      verified: confidence > 20,
      source: 'Governance structure analysis',
      lastChecked: new Date(),
      confidence: Math.min(100, confidence),
      evidence
    };
  }

  /**
   * Verifies community engagement and authenticity
   */
  private async verifyCommunity(content: ExtractedContent): Promise<VerificationResult> {
    const evidence: string[] = [];
    let confidence = 0;

    // Verify social media presence
    const socialPlatforms = ['twitter.com', 'discord.gg', 't.me', 'reddit.com'];
    socialPlatforms.forEach(platform => {
      if (content.socialLinks.some(link => link.includes(platform))) {
        evidence.push(`Official ${platform.split('.')[0]} presence`);
        confidence += 15;
      }
    });

    // Check community size indicators
    if (content.socialLinks.length >= 3) {
      evidence.push('Multiple social channels maintained');
      confidence += 10;
    }

    if (content.socialLinks.length >= 5) {
      evidence.push('Comprehensive social media strategy');
      confidence += 10;
    }

    return {
      verified: confidence > 25,
      source: 'Community engagement analysis',
      lastChecked: new Date(),
      confidence: Math.min(100, confidence),
      evidence
    };
  }

  /**
   * Verifies technical implementation and code quality
   */
  private async verifyTechnical(content: ExtractedContent): Promise<VerificationResult> {
    const evidence: string[] = [];
    let confidence = 0;

    // Check for GitHub repositories
    if (content.codeRepositories.length > 0) {
      evidence.push(`${content.codeRepositories.length} code repositories found`);
      confidence += 30;
    }

    // Check for technical indicators
    const techKeywords = ['open source', 'github', 'smart contract', 'protocol'];
    techKeywords.forEach(keyword => {
      if (content.mainContent.toLowerCase().includes(keyword)) {
        confidence += 5;
      }
    });

    // Check for development practices
    const devPractices = ['test coverage', 'ci/cd', 'continuous integration'];
    devPractices.forEach(practice => {
      if (content.mainContent.toLowerCase().includes(practice)) {
        evidence.push(`Development practice: ${practice}`);
        confidence += 10;
      }
    });

    return {
      verified: confidence > 35,
      source: 'Technical implementation analysis',
      lastChecked: new Date(),
      confidence: Math.min(100, confidence),
      evidence
    };
  }

  /**
   * Helper to extract result from Promise.allSettled
   */
  private getResult(result: PromiseSettledResult<VerificationResult>): VerificationResult {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    
    return {
      verified: false,
      source: 'Verification failed',
      lastChecked: new Date(),
      confidence: 0,
      evidence: [`Error: ${result.reason}`]
    };
  }

  /**
   * Cross-validates data with external sources
   */
  async crossValidateWithAggregators(projectUrl: string): Promise<{
    defiLlama: boolean;
    coinGecko: boolean;
    messari: boolean;
    confidence: number;
  }> {
    // Placeholder for external API integration
    // In production, integrate with DeFiLlama, CoinGecko, Messari APIs
    
    return {
      defiLlama: false,
      coinGecko: false,
      messari: false,
      confidence: 0
    };
  }
}