import { GoogleGenerativeAI } from '@google/generative-ai';
import { VerificationService, PrimarySourceData } from './verification-service';
import { RealTimeMonitor, LiveMetrics } from './real-time-monitor';
import { ScoringRubric, ScoringEvidence } from './scoring-rubric';
import { ConsistencyValidator, ConsistencyReport } from './consistency-validator';

// Types for AI analysis
export interface AnalysisFactors {
  documentationQuality: number;    // 0-100
  transparencyIndicators: number;  // 0-100
  securityDocumentation: number;   // 0-100
  communityEngagement: number;     // 0-100
  technicalImplementation: number; // 0-100
}

export type ProjectType = 'defi' | 'portfolio' | 'business' | 'general';

export interface AnalysisResult {
  factors: AnalysisFactors;
  explanations: Record<keyof AnalysisFactors, string>;
  recommendations: string[];
  risks: string[];
  redFlags: string[];
  positiveIndicators: string[];
  projectType?: ProjectType;
  verification?: PrimarySourceData;
  liveMetrics?: LiveMetrics;
  scoringEvidence?: Record<keyof AnalysisFactors, ScoringEvidence>;
  transparencyReport?: {
    methodology: string;
    dataSource: string[];
    lastVerified: Date;
    nextReview: Date;
    limitations: string[];
  };
}

export interface ExtractedContent {
  url: string;
  title: string;
  description: string;
  mainContent: string;
  documentation: string[];
  teamInfo: string;
  tokenomics: string;
  securityInfo: string;
  socialLinks: string[];
  codeRepositories: string[];
  extractedAt: Date;
  // Enhanced deep crawl data
  deepCrawlData?: {
    teamPageFound: boolean;
    teamMembers: Array<{ name: string; role?: string; linkedin?: string }>;
    bugBountyFound: boolean;
    bugBountyDetails: string;
    governanceFound: boolean;
    governanceDetails: string;
    documentationLinks: string[];
    crawledPages: string[];
  };
  // External verification data
  externalVerification?: {
    linkedInProfiles: Array<{ url: string; name: string; verified: boolean; exists: boolean }>;
    gitHubProfiles: Array<{ url: string; username: string; verified: boolean; publicRepos: number; recentActivity: boolean }>;
    gitHubRepos: Array<{ url: string; name: string; verified: boolean; stars: number; isActive: boolean }>;
    verifiedTeamMembers: number;
    verifiedRepos: number;
    overallTrustScore: number;
  };
  // Social media data
  socialMediaData?: {
    twitter?: { exists: boolean; username: string; followers?: number; verified?: boolean };
    github?: { exists: boolean; name: string; repositories?: number; stars?: number };
    discord?: { exists: boolean; serverName?: string; memberCount?: number; verified?: boolean };
    medium?: { exists: boolean; author?: string; followers?: number };
    reddit?: { exists: boolean; subreddit?: string; members?: number };
    telegram?: { exists: boolean; channelName?: string; members?: number };
    totalFollowers: number;
    totalMembers: number;
    activeChannels: number;
    verifiedChannels: number;
    communityScore: number;
  };
}

/**
 * Fallback analysis patterns for when AI API is unavailable
 * Requirements: 2.1, 7.4
 */
class FallbackAnalysisPatterns {
  private redFlagPatterns: RegExp[];
  private positivePatterns: RegExp[];
  private documentationKeywords: string[];
  private securityKeywords: string[];
  private transparencyKeywords: string[];

  constructor() {
    this.redFlagPatterns = [
      /guaranteed\s+returns?/i,
      /100%\s+safe/i,
      /no\s+risk/i,
      /get\s+rich\s+quick/i,
      /limited\s+time\s+offer/i,
      /act\s+now/i,
      /anonymous\s+team/i,
      /no\s+audit/i,
      /fork\s+of\s+\w+\s+without\s+changes/i,
      /team\s+coming\s+soon/i,
      /audit\s+pending/i,
      /temporary\s+website/i,
      /placeholder\s+content/i,
      /lorem\s+ipsum/i,
      /under\s+construction/i
    ];

    this.positivePatterns = [
      /audit(ed)?\s+by\s+(consensys|trail\s+of\s+bits|openzeppelin|certik|quantstamp)/i,
      /open\s+source/i,
      /github\.com\/[\w-]+\/[\w-]+/i,
      /team\s+(member|profile)/i,
      /linkedin\.com\/in\/[\w-]+/i,
      /security\s+(audit|review)/i,
      /bug\s+bounty/i,
      /immunefi\.com/i,
      /hackerone\.com/i,
      /multisig/i,
      /timelock/i,
      /governance/i,
      /dao/i,
      /decentralized/i,
      /test\s+coverage/i,
      /continuous\s+integration/i,
      /formal\s+verification/i
    ];

    this.documentationKeywords = [
      'documentation', 'docs', 'guide', 'tutorial', 'api', 'whitepaper',
      'technical', 'specification', 'protocol', 'architecture',
      'integration', 'sdk', 'developer', 'getting started',
      'troubleshooting', 'faq', 'changelog', 'version'
    ];

    this.securityKeywords = [
      'audit', 'security', 'multisig', 'timelock', 'bug bounty',
      'penetration test', 'formal verification', 'security review',
      'immunefi', 'hackerone', 'vulnerability', 'disclosure',
      'incident response', 'security fund', 'insurance',
      'risk management', 'threat model'
    ];

    this.transparencyKeywords = [
      'team', 'founder', 'developer', 'advisor', 'linkedin',
      'tokenomics', 'distribution', 'vesting', 'roadmap',
      'treasury', 'governance', 'voting', 'proposal',
      'milestone', 'progress', 'update', 'biography'
    ];
  }

  /**
   * Provides fallback analysis when AI API is unavailable
   */
  analyzeWithPatterns(content: ExtractedContent): AnalysisResult {
    const factors = this.calculatePatternBasedScores(content);
    
    return {
      factors,
      explanations: this.generateFallbackExplanations(factors, content),
      recommendations: this.generateBasicRecommendations(content),
      risks: this.identifyBasicRisks(content),
      redFlags: this.detectRedFlags(content),
      positiveIndicators: this.detectPositiveIndicators(content)
    };
  }

  /**
   * Calculates scores based on pattern matching with consistent baseline
   */
  private calculatePatternBasedScores(content: ExtractedContent): AnalysisFactors {
    const allText = this.getAllText(content).toLowerCase();
    
    // Apply consistent scoring normalization
    const scores = {
      documentationQuality: this.normalizeScore(this.scoreByKeywords(allText, this.documentationKeywords, content.documentation.length), 50),
      transparencyIndicators: this.normalizeScore(this.scoreByKeywords(allText, this.transparencyKeywords, content.teamInfo.length), 40),
      securityDocumentation: this.normalizeScore(this.scoreByKeywords(allText, this.securityKeywords, content.securityInfo.length), 40),
      communityEngagement: this.normalizeScore(content.socialLinks.length * 20, 40),
      technicalImplementation: this.normalizeScore(content.codeRepositories.length * 30 + (allText.includes('github') ? 20 : 0), 40)
    };
    
    // Apply external verification bonuses if available
    if (content.externalVerification) {
      const ev = content.externalVerification;
      if (ev.verifiedTeamMembers > 0) {
        scores.transparencyIndicators = Math.min(100, scores.transparencyIndicators + 20);
      }
      if (ev.verifiedRepos > 0) {
        scores.technicalImplementation = Math.min(100, scores.technicalImplementation + 15);
      }
    }
    
    return scores;
  }
  
  /**
   * Normalizes scores to ensure consistency
   */
  private normalizeScore(rawScore: number, baseline: number): number {
    return Math.max(baseline, Math.min(100, Math.round(rawScore)));
  }

  /**
   * Scores content based on keyword presence and content length with generous scoring
   */
  private scoreByKeywords(text: string, keywords: string[], contentLength: number): number {
    let score = 40; // Start with baseline score
    
    // Base score from keyword matches
    keywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        score += 8; // More generous per keyword
      }
    });

    // Bonus for content length
    if (contentLength > 500) score += 25;
    else if (contentLength > 200) score += 15;
    else if (contentLength > 50) score += 10;

    return Math.min(100, score);
  }

  /**
   * Detects red flags using enhanced pattern matching with project type awareness
   */
  detectRedFlags(content: ExtractedContent): string[] {
    const allText = this.getAllText(content);
    const redFlags: string[] = [];
    
    // Detect project type
    const projectType = this.detectProjectType(content);
    const isDAO = this.isDAOProject(allText);
    const isMatureProject = this.isMatureProject(allText, content);

    // Language-based red flags with verification methods
    this.redFlagPatterns.forEach(pattern => {
      if (pattern.test(allText)) {
        redFlags.push(`Critical: Suspicious marketing language detected - Verify claims independently`);
      }
    });

    // Apply project-type-specific red flag detection
    if (projectType === 'defi') {
      this.detectDeFiRedFlags(content, allText, isDAO, isMatureProject, redFlags);
    } else if (projectType === 'portfolio') {
      this.detectPortfolioRedFlags(content, allText, redFlags);
    } else {
      this.detectGeneralRedFlags(content, allText, redFlags);
    }

    // Content quality red flags (universal)
    if (allText.toLowerCase().includes('lorem ipsum') || allText.toLowerCase().includes('placeholder')) {
      redFlags.push('Critical: Placeholder content detected - Website appears incomplete');
    }

    return redFlags;
  }

  /**
   * Detects DeFi-specific red flags
   */
  private detectDeFiRedFlags(content: ExtractedContent, allText: string, isDAO: boolean, isMatureProject: boolean, redFlags: string[]): void {
    // Team transparency red flags (ONLY for non-DAO projects)
    if (!isDAO && content.teamInfo.length < 50 && !allText.toLowerCase().includes('governance')) {
      redFlags.push('Moderate: Limited team information - Verify team identity through LinkedIn and professional networks');
    }

    // Technical transparency red flags (relaxed for mature projects)
    if (content.codeRepositories.length === 0 && !allText.toLowerCase().includes('github') && !isMatureProject) {
      redFlags.push('Moderate: No public code repositories found on main page - Check documentation for GitHub links');
    }

    // Security red flags (relaxed for projects claiming audits)
    if (content.securityInfo.length < 50 && 
        !allText.toLowerCase().includes('audit') && 
        !allText.toLowerCase().includes('security')) {
      redFlags.push('High Risk: No security information found - Verify smart contract security through independent auditors');
    }

    // Tokenomics red flags (relaxed for projects mentioning tokenomics)
    if ((!content.tokenomics || content.tokenomics.length < 50) && 
        !allText.toLowerCase().includes('token') &&
        !isMatureProject) {
      redFlags.push('Moderate: Limited tokenomics information - Verify token distribution independently');
    }
  }

  /**
   * Detects portfolio-specific red flags
   */
  private detectPortfolioRedFlags(content: ExtractedContent, allText: string, redFlags: string[]): void {
    // Check for inconsistent dates (future dates as past events)
    const currentYear = new Date().getFullYear();
    const futureYearPattern = new RegExp(`(started|began|completed|launched).*${currentYear + 1}`, 'i');
    if (futureYearPattern.test(allText)) {
      redFlags.push(`⚠ **Inconsistent Dates on Development Journey:** Events listed as occurring in future years (e.g., ${currentYear + 1}). This presents future events as past accomplishments. (Verification Method: Manual review of website content against current calendar year).`);
    }

    // Check for conflicting metrics (0+ projects, 0+ years, etc.)
    if (/0\+\s*(projects|years|clients|technologies)/i.test(allText)) {
      redFlags.push('⚠ **Conflicting Metrics Display:** Statistics showing "0+" values contradict other stated achievements, indicating inconsistency. (Verification Method: Cross-referencing statistics across different sections).');
    }

    // Identity verification
    if (content.teamInfo.length < 50 && !allText.toLowerCase().includes('linkedin')) {
      redFlags.push('⚠ Moderate: Limited personal information - Verify identity through LinkedIn and professional networks');
    }

    // Social presence (less critical for portfolios)
    if (content.socialLinks.length === 0) {
      redFlags.push('⚠ Moderate: No social media links found - Professional profiles help verify credibility');
    }
  }

  /**
   * Detects general website red flags
   */
  private detectGeneralRedFlags(content: ExtractedContent, allText: string, redFlags: string[]): void {
    // Documentation red flags
    if (content.documentation.length === 0 && 
        !allText.toLowerCase().includes('documentation') &&
        !allText.toLowerCase().includes('docs')) {
      redFlags.push('Warning: No technical documentation found - May indicate incomplete project');
    }

    // Social presence red flags
    if (content.socialLinks.length === 0 && 
        !allText.toLowerCase().includes('twitter') &&
        !allText.toLowerCase().includes('discord')) {
      redFlags.push('Warning: No social media presence found - May indicate lack of community engagement');
    }

    // Suspicious patterns
    if (allText.toLowerCase().includes('coming soon') && content.teamInfo.length < 100) {
      redFlags.push('High Risk: "Coming soon" content with limited information - Incomplete project');
    }
  }

  /**
   * Detects project type from content with strict DeFi validation
   * CRITICAL: Only returns 'defi' for authentic blockchain/DeFi projects
   */
  private detectProjectType(content: ExtractedContent): ProjectType {
    const allText = this.getAllText(content).toLowerCase();

    // STRICT DeFi/Blockchain indicators - must have multiple strong signals
    const strongDefiKeywords = [
      'defi', 'decentralized finance', 'blockchain', 'smart contract', 
      'dao', 'dapp', 'web3', 'protocol', 'liquidity pool', 'staking',
      'yield farming', 'tvl', 'total value locked', 'tokenomics',
      'governance token', 'airdrop', 'mainnet', 'testnet', 'consensus',
      'validator', 'node', 'gas fee', 'metamask', 'wallet connect',
      'ethereum', 'solana', 'polygon', 'binance smart chain', 'avalanche',
      'layer 2', 'rollup', 'bridge', 'cross-chain', 'multichain'
    ];
    
    const moderateDefiKeywords = [
      'crypto', 'cryptocurrency', 'token', 'nft', 'mining', 'hash',
      'ledger', 'distributed', 'peer-to-peer', 'consensus mechanism'
    ];

    // Count strong DeFi indicators
    const strongDefiScore = strongDefiKeywords.filter(k => allText.includes(k)).length;
    const moderateDefiScore = moderateDefiKeywords.filter(k => allText.includes(k)).length;
    
    // Check for blockchain-specific URLs or addresses - COMPREHENSIVE
    const hasBlockchainUrls = 
      // Wallet addresses
      /0x[a-fA-F0-9]{40}/.test(allText) || // Ethereum address
      
      // Block explorers (all major chains)
      /etherscan\.io|bscscan\.com|polygonscan\.com|arbiscan\.io|optimistic\.etherscan\.io/.test(allText) ||
      /hedera\.com|hashscan\.io|dragonglass\.me/.test(allText) || // Hedera
      /solscan\.io|explorer\.solana\.com/.test(allText) || // Solana
      /cardanoscan\.io/.test(allText) || // Cardano
      
      // Known DeFi protocols (comprehensive list)
      /uniswap|pancakeswap|sushiswap|curve|aave|compound|maker|saucerswap/.test(allText) ||
      /balancer|yearn|convex|frax|lido|rocket\s*pool/.test(allText) ||
      /1inch|paraswap|matcha|zerion|zapper/.test(allText);

    // Portfolio indicators (anti-DeFi signals) - STRICT
    const portfolioKeywords = ['portfolio', 'freelance', 'hire me', 'contact me for work', 'about me', 'my work', 'resume', 'cv', 'my skills', 'my projects'];
    const portfolioScore = portfolioKeywords.filter(k => allText.includes(k)).length;

    // Business indicators (anti-DeFi signals) - STRICT
    const businessKeywords = ['company', 'our services', 'our products', 'our clients', 'consulting services', 'agency services', 'enterprise solutions'];
    const businessScore = businessKeywords.filter(k => allText.includes(k)).length;

    // VERY RELAXED DEFI DETECTION: Catch ALL DeFi projects
    const isDeFi = (strongDefiScore >= 1) ||  // Even 1 strong keyword is enough
                   (moderateDefiScore >= 2) ||  // Or 2 moderate keywords
                   hasBlockchainUrls;  // Or any blockchain URLs

    // If it has DeFi signals, it's DeFi (unless VERY strong anti-DeFi signals)
    if (isDeFi && portfolioScore < 5 && businessScore < 3) {
      return 'defi';
    }

    // Otherwise, classify as non-DeFi only if clear anti-DeFi signals AND no DeFi signals
    if (portfolioScore >= 5 && strongDefiScore === 0 && moderateDefiScore === 0) return 'portfolio';
    if (businessScore >= 3 && strongDefiScore === 0 && moderateDefiScore === 0) return 'business';
    
    // Default to DeFi if ANY indicators present (maximum leniency)
    if (strongDefiScore > 0 || moderateDefiScore > 0 || hasBlockchainUrls) return 'defi';
    
    return 'general';
  }

  /**
   * Check if project is a DAO
   */
  private isDAOProject(text: string): boolean {
    const textLower = text.toLowerCase();
    return textLower.includes('dao') || 
           textLower.includes('governance token') ||
           textLower.includes('token holders guide') ||
           (textLower.includes('governance') && textLower.includes('voting'));
  }

  /**
   * Check if project is mature/established
   */
  private isMatureProject(text: string, content: ExtractedContent): boolean {
    const textLower = text.toLowerCase();
    return textLower.includes('millions of users') ||
           textLower.includes('billion') ||
           textLower.includes('extensive audits') ||
           textLower.includes('leading protocol') ||
           content.socialLinks.length >= 4 ||
           (textLower.includes('audit') && textLower.includes('security'));
  }

  /**
   * Detects positive indicators using enhanced pattern matching with generous recognition
   */
  detectPositiveIndicators(content: ExtractedContent): string[] {
    const allText = this.getAllText(content);
    const positives: string[] = [];

    // Scale and maturity indicators
    if (/millions?\s+of\s+users/i.test(allText)) {
      positives.push('Exceptional: Millions of users - Proven track record and widespread adoption');
    }

    if (/billion/i.test(allText)) {
      positives.push('Exceptional: Billion-dollar scale - Major protocol with significant TVL');
    }

    // Security-related positive indicators
    if (/extensive\s+audits|multiple\s+audits/i.test(allText)) {
      positives.push('Excellent: Multiple security audits claimed - Comprehensive security review process');
    }

    if (/audit(ed)?\s+by\s+(consensys|trail\s+of\s+bits|openzeppelin|certik|quantstamp|chainsecurity)/i.test(allText)) {
      positives.push('Excellent: Audited by top-tier security firm - Industry-leading security standards');
    }

    if (/bug\s+bounty/i.test(allText)) {
      positives.push('Strong: Active bug bounty program - Ongoing security monitoring and rewards');
    }

    if (/safety\s+module|insurance/i.test(allText)) {
      positives.push('Excellent: Safety module or insurance mechanism - Additional user protection layer');
    }

    if (/multisig|timelock/i.test(allText)) {
      positives.push('Good: Security best practices implemented - Multi-signature or timelock controls');
    }

    // Governance and DAO indicators
    if (/dao|decentralized\s+autonomous/i.test(allText)) {
      positives.push('Excellent: DAO governance model - Decentralized decision-making structure');
    }

    if (/governance.*forum|forum.*governance/i.test(allText)) {
      positives.push('Strong: Public governance forum - Transparent community discussion platform');
    }

    if (/on-?chain\s+governance|token\s+holder.*voting/i.test(allText)) {
      positives.push('Excellent: On-chain governance - Transparent and verifiable decision-making');
    }

    // Technical excellence indicators
    if (/technical\s+paper|whitepaper/i.test(allText)) {
      positives.push('Strong: Technical documentation available - Detailed protocol architecture');
    }

    if (/open\s+source|publicly\s+available.*code/i.test(allText)) {
      positives.push('Excellent: Open source code - Transparent and auditable implementation');
    }

    if (content.codeRepositories.length > 0 || /github\.com/i.test(allText)) {
      positives.push('Good: GitHub repository available - Code transparency and community contributions');
    }

    if (/\d+\+?\s+networks/i.test(allText)) {
      positives.push('Excellent: Multi-chain deployment - Proven scalability and interoperability');
    }

    // Community and ecosystem indicators
    if (content.socialLinks.length >= 4) {
      positives.push('Strong: Multi-platform social presence - Active community engagement');
    }

    if (/partners|integrations|ecosystem/i.test(allText)) {
      positives.push('Good: Ecosystem partnerships - Strong integration and collaboration network');
    }

    if (/developers.*build|build.*developers/i.test(allText)) {
      positives.push('Strong: Developer-focused resources - Comprehensive builder support');
    }

    // Documentation indicators
    if (/documentation|docs/i.test(allText) && /faq/i.test(allText)) {
      positives.push('Good: Comprehensive documentation - Multiple resource types available');
    }

    // Institutional trust indicators
    if (/ceo|institutional|enterprise/i.test(allText)) {
      positives.push('Excellent: Institutional backing or endorsements - Enterprise-grade trust');
    }

    return positives;
  }

  /**
   * Generates basic explanations for fallback analysis
   */
  private generateFallbackExplanations(factors: AnalysisFactors, content: ExtractedContent): Record<keyof AnalysisFactors, string> {
    return {
      documentationQuality: `Pattern-based analysis found ${content.documentation.length} documentation sections. Score: ${factors.documentationQuality}/100`,
      transparencyIndicators: `Team information length: ${content.teamInfo.length} characters. Score: ${factors.transparencyIndicators}/100`,
      securityDocumentation: `Security information length: ${content.securityInfo.length} characters. Score: ${factors.securityDocumentation}/100`,
      communityEngagement: `Found ${content.socialLinks.length} social media links. Score: ${factors.communityEngagement}/100`,
      technicalImplementation: `Found ${content.codeRepositories.length} code repositories. Score: ${factors.technicalImplementation}/100`
    };
  }

  /**
   * Generates enhanced actionable recommendations with specific verification steps
   */
  private generateBasicRecommendations(content: ExtractedContent): string[] {
    const recommendations: string[] = [];

    // Team transparency recommendations
    if (content.teamInfo.length < 200) {
      recommendations.push('Request detailed team bios with LinkedIn profiles and employment history verification');
      recommendations.push('Use template: "Please provide team member backgrounds, previous experience, and LinkedIn profiles for verification"');
    }

    // Security recommendations
    if (content.securityInfo.length < 100) {
      recommendations.push('Verify security audits by checking auditor websites directly (Consensys, Trail of Bits, OpenZeppelin)');
      recommendations.push('Look for active bug bounty programs on Immunefi or HackerOne platforms');
    }

    // Technical implementation recommendations
    if (content.codeRepositories.length === 0) {
      recommendations.push('Verify code availability on GitHub and check commit history for recent activity');
      recommendations.push('Request technical architecture documentation and integration examples');
    }

    // Community verification
    if (content.socialLinks.length < 3) {
      recommendations.push('Cross-verify social media accounts for authenticity and genuine follower engagement');
    }

    // Independent verification steps
    recommendations.push('Use block explorers to verify tokenomics and contract addresses independently');
    recommendations.push('Check community forums (Reddit, Discord) for unbiased user feedback and experiences');
    recommendations.push('Monitor project for 30-60 days to assess team responsiveness and development activity');
    
    // Due diligence tools
    recommendations.push('Use tools like DeFiPulse, CoinGecko, and Messari for additional project verification');

    return recommendations;
  }

  /**
   * Identifies comprehensive risks with impact assessments and monitoring recommendations
   */
  private identifyBasicRisks(content: ExtractedContent): string[] {
    const risks: string[] = [];

    // Team and governance risks
    if (content.teamInfo.length < 100) {
      risks.push('Team transparency risk: Limited team information increases rug pull potential - Monitor team communications');
    }

    // Security risks
    if (content.securityInfo.length < 50) {
      risks.push('Security risk: No audit documentation found - Verify smart contract security independently');
    }

    // Technical risks
    if (content.codeRepositories.length === 0) {
      risks.push('Technical risk: Closed source code prevents security review - Request code availability or audit reports');
    }

    // Community and adoption risks
    if (content.socialLinks.length < 2) {
      risks.push('Adoption risk: Limited community presence may indicate low user engagement');
    }

    // Documentation risks
    if (content.documentation.length < 2) {
      risks.push('Integration risk: Poor documentation may hinder developer adoption and ecosystem growth');
    }

    // Tokenomics risks
    if (!content.tokenomics || content.tokenomics.length < 100) {
      risks.push('Economic risk: Unclear tokenomics may lead to unexpected inflation or value dilution');
    }

    // Analysis limitations
    risks.push('Analysis limitation: Pattern-based assessment requires manual verification for accuracy');
    risks.push('Temporal risk: Project status may change rapidly - Re-evaluate within 30 days');

    return risks;
  }

  /**
   * Combines all text content for analysis
   */
  private getAllText(content: ExtractedContent): string {
    return [
      content.title,
      content.description,
      content.mainContent,
      content.documentation.join(' '),
      content.teamInfo,
      content.tokenomics,
      content.securityInfo
    ].join(' ');
  }
}

export class AIAnalysisService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private fallbackPatterns: FallbackAnalysisPatterns;
  private verificationService: VerificationService;
  private realTimeMonitor: RealTimeMonitor;
  private scoringRubric: ScoringRubric;
  private consistencyValidator: ConsistencyValidator;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    this.fallbackPatterns = new FallbackAnalysisPatterns();
    this.verificationService = new VerificationService();
    this.realTimeMonitor = new RealTimeMonitor();
    this.scoringRubric = new ScoringRubric();
    this.consistencyValidator = new ConsistencyValidator();
  }

  /**
   * Detects project type from content with strict DeFi validation
   * CRITICAL: Only returns 'defi' for authentic blockchain/DeFi projects
   */
  private detectProjectType(content: ExtractedContent): ProjectType {
    const allText = [
      content.title,
      content.description,
      content.mainContent,
      content.documentation.join(' '),
      content.teamInfo,
      content.tokenomics,
      content.securityInfo
    ].join(' ').toLowerCase();

    // DeFi/Blockchain indicators - COMPREHENSIVE for maximum detection
    const strongDefiKeywords = [
      // Core DeFi terms
      'defi', 'decentralized finance', 'blockchain', 'smart contract', 
      'dao', 'dapp', 'web3', 'protocol', 'liquidity pool', 'staking',
      'yield farming', 'tvl', 'total value locked', 'tokenomics',
      'governance token', 'airdrop', 'mainnet', 'testnet', 'consensus',
      'validator', 'node', 'gas fee', 'metamask', 'wallet connect',
      
      // Major blockchains
      'ethereum', 'solana', 'polygon', 'binance smart chain', 'avalanche',
      'hedera', 'hashgraph', 'hbar', 'cardano', 'polkadot', 'cosmos',
      'arbitrum', 'optimism', 'base', 'zksync', 'fantom', 'near',
      
      // DeFi activities
      'dex', 'swap', 'liquidity', 'pool', 'farm', 'stake', 'lend',
      'borrow', 'mint', 'burn', 'trade', 'trading', 'exchange',
      
      // Technical terms
      'layer 2', 'rollup', 'bridge', 'cross-chain', 'multichain',
      'audit', 'contract', 'wallet', 'amm', 'automated market maker',
      
      // Security & Governance
      'multisig', 'timelock', 'governance', 'voting', 'proposal',
      'treasury', 'vesting', 'emission', 'reward', 'incentive'
    ];
    
    const moderateDefiKeywords = [
      // Crypto general
      'crypto', 'cryptocurrency', 'token', 'nft', 'mining', 'hash',
      'ledger', 'distributed', 'peer-to-peer', 'consensus mechanism',
      
      // Trading & Markets
      'exchange', 'market', 'price', 'volume', 'pair', 'slippage',
      'order book', 'limit order', 'market order', 'chart', 'candle',
      
      // DeFi concepts
      'apr', 'apy', 'impermanent loss', 'flash loan', 'oracle',
      'collateral', 'liquidation', 'leverage', 'margin', 'derivative',
      
      // Web3 terms
      'decentralized', 'trustless', 'permissionless', 'censorship resistant',
      'self-custody', 'non-custodial', 'peer to peer'
    ];

    // Count strong DeFi indicators
    const strongDefiScore = strongDefiKeywords.filter(k => allText.includes(k)).length;
    const moderateDefiScore = moderateDefiKeywords.filter(k => allText.includes(k)).length;
    
    // Check for blockchain-specific URLs or addresses - COMPREHENSIVE
    const hasBlockchainUrls = 
      // Wallet addresses
      /0x[a-fA-F0-9]{40}/.test(allText) || // Ethereum address
      
      // Block explorers (all major chains)
      /etherscan\.io|bscscan\.com|polygonscan\.com|arbiscan\.io|optimistic\.etherscan\.io/.test(allText) ||
      /hedera\.com|hashscan\.io|dragonglass\.me/.test(allText) || // Hedera
      /solscan\.io|explorer\.solana\.com/.test(allText) || // Solana
      /cardanoscan\.io/.test(allText) || // Cardano
      
      // Known DeFi protocols (comprehensive list)
      /uniswap|pancakeswap|sushiswap|curve|aave|compound|maker|saucerswap/.test(allText) ||
      /balancer|yearn|convex|frax|lido|rocket\s*pool/.test(allText) ||
      /1inch|paraswap|matcha|zerion|zapper/.test(allText);

    // Portfolio indicators (anti-DeFi signals) - STRICT
    const portfolioKeywords = ['portfolio', 'freelance', 'hire me', 'contact me for work', 'about me', 'my work', 'resume', 'cv', 'my skills', 'my projects'];
    const portfolioScore = portfolioKeywords.filter(k => allText.includes(k)).length;

    // Business indicators (anti-DeFi signals) - STRICT
    const businessKeywords = ['company', 'our services', 'our products', 'our clients', 'consulting services', 'agency services', 'enterprise solutions'];
    const businessScore = businessKeywords.filter(k => allText.includes(k)).length;

    // VERY RELAXED DEFI DETECTION: Catch ALL DeFi projects
    const isDeFi = (strongDefiScore >= 1) ||  // Even 1 strong keyword is enough
                   (moderateDefiScore >= 2) ||  // Or 2 moderate keywords
                   hasBlockchainUrls;  // Or any blockchain URLs

    // If it has DeFi signals, it's DeFi (unless VERY strong anti-DeFi signals)
    if (isDeFi && portfolioScore < 5 && businessScore < 3) {
      console.log(`✅ DeFi project detected: ${strongDefiScore} strong keywords, ${moderateDefiScore} moderate keywords, blockchain URLs: ${hasBlockchainUrls}`);
      return 'defi';
    }

    // Otherwise, classify as non-DeFi only if clear anti-DeFi signals AND no DeFi signals
    if (portfolioScore >= 5 && strongDefiScore === 0 && moderateDefiScore === 0) {
      console.log(`❌ Portfolio website detected: ${portfolioScore} portfolio keywords`);
      return 'portfolio';
    }
    
    if (businessScore >= 3 && strongDefiScore === 0 && moderateDefiScore === 0) {
      console.log(`❌ Business website detected: ${businessScore} business keywords`);
      return 'business';
    }
    
    // Default to DeFi if ANY indicators present (maximum leniency)
    if (strongDefiScore > 0 || moderateDefiScore > 0 || hasBlockchainUrls) {
      console.log(`✅ DeFi project detected (benefit of doubt): ${strongDefiScore} strong, ${moderateDefiScore} moderate, blockchain URLs: ${hasBlockchainUrls}`);
      return 'defi';
    }
    
    console.log(`❌ General website detected: No DeFi indicators found`);
    return 'general';
  }

  /**
   * Analyzes extracted website content using Google Gemini API with fallback support
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 7.4
   * 
   * NEW APPROACH: Analyze EVERYTHING first, then determine project type at the END
   */
  async analyzeContent(content: ExtractedContent): Promise<AnalysisResult> {
    let aiResult: AnalysisResult | null = null;
    let patternResult: AnalysisResult;
    
    try {
      console.log(`🔍 Starting full analysis (project type will be determined after analysis)...`);
      
      // Build analysis prompt (analyze as if it's DeFi to get all data)
      const prompt = this.buildAnalysisPrompt(content, 'defi');
      const response = await this.callGeminiAPI(prompt);
      const parsedResult = this.parseGeminiResponse(response);
      
      if (!this.validateAnalysisResult(parsedResult)) {
        throw new Error('Invalid analysis result structure');
      }

      // Post-process and enhance the result
      aiResult = this.processAnalysisResult(parsedResult, content);
      
    } catch (error) {
      console.error('AI Analysis error, falling back to pattern analysis:', error);
      aiResult = null;
    }
    
    // Always generate pattern-based analysis for consistency validation
    patternResult = this.fallbackPatterns.analyzeWithPatterns(content);
    
    // Validate consistency between AI and pattern analysis
    const consistencyReport = this.consistencyValidator.validateConsistency(aiResult, patternResult, content);
    console.log(`📊 Consistency validation: ${consistencyReport.score}/100 (${consistencyReport.confidence} confidence)`);
    
    // Use consistency-validated scores with AI explanations (never use pattern explanations)
    const finalResult: AnalysisResult = {
      factors: consistencyReport.adjustments,
      explanations: aiResult?.explanations || this.generateDetailedExplanations(consistencyReport.adjustments, content),
      recommendations: [...(aiResult?.recommendations || []), ...(patternResult.recommendations || [])].slice(0, 10),
      risks: [...(aiResult?.risks || []), ...(patternResult.risks || [])].slice(0, 8),
      redFlags: [...(aiResult?.redFlags || []), ...(patternResult.redFlags || [])].slice(0, 6),
      positiveIndicators: [...(aiResult?.positiveIndicators || []), ...(patternResult.positiveIndicators || [])].slice(0, 8)
    };
    
    // Add consistency report to explanations
    if (consistencyReport.issues.length > 0) {
      Object.keys(finalResult.explanations).forEach(key => {
        const factor = key as keyof typeof finalResult.explanations;
        finalResult.explanations[factor] += ` [Consistency: ${consistencyReport.confidence}]`;
      });
    }
    
    // NOW detect project type AFTER full analysis
    const projectType = this.detectProjectType(content);
    finalResult.projectType = projectType;
    
    // If NOT DeFi, convert to rejection result but KEEP all the analysis data
    if (projectType !== 'defi') {
      console.log(`❌ Non-DeFi project detected (${projectType}) AFTER full analysis. Converting to rejection.`);
      return this.convertToNonDeFiRejection(finalResult, projectType, content);
    }
    
    console.log(`✅ DeFi project confirmed after full analysis.`);
    return finalResult;
  }

  /**
   * Converts a full analysis result to a non-DeFi rejection (preserving analysis data)
   */
  private convertToNonDeFiRejection(analysisResult: AnalysisResult, projectType: ProjectType, content: ExtractedContent): AnalysisResult {
    const projectTypeLabel = projectType === 'portfolio' ? 'Personal Portfolio' :
                            projectType === 'business' ? 'Business/Company Website' :
                            'General Website';
    
    // KEEP the original analysis but set scores to 0
    return {
      factors: {
        documentationQuality: 0,
        transparencyIndicators: 0,
        securityDocumentation: 0,
        communityEngagement: 0,
        technicalImplementation: 0
      },
      explanations: {
        documentationQuality: `This is a ${projectTypeLabel}, not a DeFi/blockchain project. TrustScan AI is specifically designed to audit DeFi protocols, blockchain projects, and cryptocurrency platforms.`,
        transparencyIndicators: `No DeFi/blockchain indicators found. This tool only evaluates decentralized finance projects, smart contracts, DAOs, and blockchain protocols.`,
        securityDocumentation: `Not applicable - this is not a DeFi project. TrustScan AI focuses on smart contract audits, tokenomics, and blockchain security.`,
        communityEngagement: `Not applicable - this is not a blockchain project. We evaluate crypto communities, token holders, and DeFi governance.`,
        technicalImplementation: `Not applicable - this is not a DeFi protocol. We assess smart contracts, blockchain infrastructure, and decentralized applications.`
      },
      recommendations: [
        '⚠️ **This is not a DeFi/blockchain project** - TrustScan AI is designed exclusively for auditing decentralized finance protocols, blockchain projects, and cryptocurrency platforms.',
        '🔍 **What we look for**: Smart contracts, tokenomics, DAOs, DeFi protocols, NFT projects, blockchain infrastructure, Web3 applications, and cryptocurrency platforms.',
        '📋 **To use this tool**: Please provide a URL to a DeFi project, blockchain protocol, cryptocurrency platform, or Web3 application.',
        `📊 **Detected project type**: ${projectTypeLabel} - This type of website is outside our scope of analysis.`,
        '',
        '📝 **Analysis Summary**: We performed a full analysis including deep crawl, external verification, and social media analysis. Based on the complete data, this website does not appear to be a DeFi or blockchain project.'
      ],
      risks: [
        `❌ **Not a DeFi Project**: After comprehensive analysis (including deep crawl and external verification), this website (${content.url}) is classified as: ${projectTypeLabel}.`,
        '⚠️ **Scope Limitation**: TrustScan AI only evaluates decentralized finance projects and blockchain protocols.',
        '🎯 **Target Projects**: DeFi protocols (Uniswap, Aave, Compound), DAOs, NFT platforms, blockchain networks, Web3 dApps, and cryptocurrency exchanges.'
      ],
      // PRESERVE original red flags and positive indicators from analysis
      redFlags: analysisResult.redFlags || [],
      positiveIndicators: analysisResult.positiveIndicators || [],
      projectType
    };
  }

  /**
   * Post-processes AI analysis results for enhanced accuracy and completeness
   * Requirements: 2.1, 7.4
   */
  private processAnalysisResult(result: AnalysisResult, content: ExtractedContent): AnalysisResult {
    // Validate and sanitize all fields
    const processedResult: AnalysisResult = {
      factors: this.validateAndSanitizeFactors(result.factors),
      explanations: this.validateExplanations(result.explanations),
      recommendations: this.validateStringArray(result.recommendations, 'recommendations'),
      risks: this.validateStringArray(result.risks, 'risks'),
      redFlags: this.validateStringArray(result.redFlags, 'redFlags'),
      positiveIndicators: this.validateStringArray(result.positiveIndicators, 'positiveIndicators')
    };

    // Enhance with additional pattern-based checks
    this.enhanceWithPatternAnalysis(processedResult, content);

    return processedResult;
  }

  /**
   * Validates and sanitizes factor scores
   */
  private validateAndSanitizeFactors(factors: AnalysisFactors): AnalysisFactors {
    const sanitized: AnalysisFactors = {
      documentationQuality: this.sanitizeScore(factors.documentationQuality),
      transparencyIndicators: this.sanitizeScore(factors.transparencyIndicators),
      securityDocumentation: this.sanitizeScore(factors.securityDocumentation),
      communityEngagement: this.sanitizeScore(factors.communityEngagement),
      technicalImplementation: this.sanitizeScore(factors.technicalImplementation)
    };

    return sanitized;
  }

  /**
   * Sanitizes individual scores to ensure they're within valid range
   */
  private sanitizeScore(score: number): number {
    if (typeof score !== 'number' || isNaN(score)) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Validates explanations object
   */
  private validateExplanations(explanations: Record<keyof AnalysisFactors, string>): Record<keyof AnalysisFactors, string> {
    const validated: Record<keyof AnalysisFactors, string> = {
      documentationQuality: this.validateString(explanations.documentationQuality, 'No explanation provided for documentation quality.'),
      transparencyIndicators: this.validateString(explanations.transparencyIndicators, 'No explanation provided for transparency indicators.'),
      securityDocumentation: this.validateString(explanations.securityDocumentation, 'No explanation provided for security documentation.'),
      communityEngagement: this.validateString(explanations.communityEngagement, 'No explanation provided for community engagement.'),
      technicalImplementation: this.validateString(explanations.technicalImplementation, 'No explanation provided for technical implementation.')
    };

    return validated;
  }

  /**
   * Validates string arrays and ensures they contain meaningful content
   */
  private validateStringArray(arr: string[], fieldName: string): string[] {
    if (!Array.isArray(arr)) {
      return [];
    }

    return arr
      .filter(item => typeof item === 'string' && item.trim().length > 0)
      .map(item => item.trim())
      .slice(0, 10); // Limit to 10 items max
  }

  /**
   * Validates individual strings
   */
  private validateString(str: string, fallback: string): string {
    if (typeof str !== 'string' || str.trim().length === 0) {
      return fallback;
    }
    return str.trim();
  }

  /**
   * Enhances AI results with additional pattern-based analysis
   */
  private enhanceWithPatternAnalysis(result: AnalysisResult, content: ExtractedContent): void {
    // Add pattern-based red flags
    const patternRedFlags = this.fallbackPatterns.detectRedFlags(content);
    const combinedRedFlags = result.redFlags.concat(patternRedFlags);
    result.redFlags = Array.from(new Set(combinedRedFlags));

    // Add pattern-based positive indicators
    const patternPositives = this.fallbackPatterns.detectPositiveIndicators(content);
    const combinedPositives = result.positiveIndicators.concat(patternPositives);
    result.positiveIndicators = Array.from(new Set(combinedPositives));

    // Adjust scores based on critical patterns
    if (patternRedFlags.length > 0) {
      // Reduce scores if critical red flags are detected
      Object.keys(result.factors).forEach(key => {
        const factor = key as keyof AnalysisFactors;
        result.factors[factor] = Math.max(0, result.factors[factor] - (patternRedFlags.length * 10));
      });
    }
  }

  /**
   * Gets base prompt description based on project type
   */
  private getBasePromptForProjectType(projectType: ProjectType): string {
    switch (projectType) {
      case 'defi':
        return 'You are an expert DeFi security analyst specializing in comprehensive blockchain project assessment.';
      case 'portfolio':
        return 'You are an expert web analyst specializing in evaluating personal portfolio websites and professional profiles.';
      case 'business':
        return 'You are an expert business analyst specializing in evaluating company websites and business credibility.';
      default:
        return 'You are an expert web analyst specializing in comprehensive website assessment.';
    }
  }

  /**
   * Gets documentation criteria based on project type
   */
  private getDocumentationCriteriaForProjectType(projectType: ProjectType): string {
    if (projectType === 'defi') {
      return `GENEROUS SCORING FOR ESTABLISHED PROJECTS:
   - Base score: Start at 60 points if documentation sections exist
   - For mature projects with multiple doc sections: Start at 75 points
   - Technical completeness: "Documentation" + "Technical Paper" + "Developers" = comprehensive (25pts)
   - Professional presentation: Polished website + market position = top-tier (15pts)
   - Update frequency: Active project with recent updates = maintained (10pts)
   - Developer experience: "Developers" + "Build" + "FAQ" + "Help & Support" = excellent (15pts)
   - IMPORTANT: For established protocols, comprehensive doc sections = 90+ score`;
    } else if (projectType === 'portfolio') {
      return `PORTFOLIO-SPECIFIC CRITERIA:
   - Base score: Start at 60 points for professional presentation
   - About/Bio section: Clear introduction and background (20pts)
   - Skills section: Listed technologies and expertise (15pts)
   - Projects/Work showcase: Examples with descriptions (20pts)
   - Services offered: Clear description of what they do (15pts)
   - Contact information: Multiple ways to reach (10pts)
   - Blog/Articles: Technical writing or insights (10pts)
   - FAQ section: Common questions answered (10pts)
   - IMPORTANT: Well-structured portfolio with clear sections = 85-95 points`;
    } else {
      return `GENERAL WEBSITE CRITERIA:
   - Base score: Start at 50 points for basic content
   - Clear purpose and description (20pts)
   - Organized content structure (20pts)
   - Help/Support resources (20pts)
   - Professional presentation (20pts)
   - Regular updates (20pts)`;
    }
  }

  /**
   * Gets transparency criteria based on project type
   */
  private getTransparencyCriteriaForProjectType(projectType: ProjectType): string {
    if (projectType === 'defi') {
      return `FAVOR DAO GOVERNANCE & VERIFIED TEAM INFO:
   - Base score: Start at 50 points for any governance/team information
   - For DAOs with explicit governance: Start at 75 points automatically
   - DAO governance excellence: Forum + on-chain voting + AIPs + token holder control = 95 points
   - Token utility: Clearly defined governance + staking utility = 20pts
   - Financial transparency: Safety Module + risk management = 15pts
   - CRITICAL: If deep crawl found team members with LinkedIn profiles = 80-95 points
   - CRITICAL: If deep crawl found DAO governance system = 85-95 points
   - IMPORTANT: High-TVL DAOs with transparent governance = 90+ score
   - IMPORTANT: Named team members with verifiable LinkedIn = 85+ score`;
    } else if (projectType === 'portfolio') {
      return `PERSONAL IDENTITY TRANSPARENCY:
   - Base score: Start at 60 points for clear identity
   - Full name and photo (20pts)
   - Location/City mentioned (10pts)
   - Professional role/title clearly stated (15pts)
   - LinkedIn profile linked and verified (20pts)
   - GitHub profile with activity (15pts)
   - Twitter/X or other social profiles (10pts)
   - Work history or experience timeline (10pts)
   - IMPORTANT: Clear personal identity with verified social profiles = 90+ points`;
    } else {
      return `BUSINESS TRANSPARENCY:
   - Base score: Start at 50 points for basic information
   - Company/team information (25pts)
   - Contact details and location (20pts)
   - Social media presence (20pts)
   - About/history section (20pts)
   - Leadership or team bios (15pts)`;
    }
  }

  /**
   * Gets security criteria based on project type
   */
  private getSecurityCriteriaForProjectType(projectType: ProjectType): string {
    if (projectType === 'defi') {
      return `TRUST ESTABLISHED PROTOCOLS & VERIFIED SECURITY:
   - Base score: Start at 40 points if security is mentioned
   - For mature protocols with security claims: Start at 70 points
   - Audit claims: "Multiple audits by world's leading security firms" = 50pts
   - Bug bounty: Active bug bounty program with rewards = 20pts
   - Security infrastructure: Safety Module + governance-controlled upgrades = 20pts
   - CRITICAL: If deep crawl found active bug bounty program = 85-95 points
   - CRITICAL: If audits by Hacken, Omniscia, Trail of Bits, etc. = 80-90 points
   - IMPORTANT: Established protocols with "extensive audits" claim = 85-90 score minimum
   - IMPORTANT: Bug bounty program found on dedicated page = 90+ score`;
    } else if (projectType === 'portfolio') {
      return `PORTFOLIO SECURITY (NOT blockchain security):
   - Base score: Start at 60 points for professional website
   - HTTPS/SSL certificate (20pts)
   - Privacy-focused development mentioned (15pts)
   - Secure contact forms (10pts)
   - No suspicious external links (10pts)
   - Professional hosting (Vercel, Netlify, etc.) (10pts)
   - Privacy policy or data handling statement (15pts)
   - Ethical practices mentioned (10pts)
   - IMPORTANT: Portfolio sites don't need audits - score based on web security best practices = 80-90 points for good practices`;
    } else {
      return `GENERAL WEB SECURITY:
   - Base score: Start at 50 points for HTTPS
   - SSL certificate (20pts)
   - Privacy policy (20pts)
   - Secure payment processing if applicable (20pts)
   - Data protection measures (20pts)
   - Terms of service (20pts)`;
    }
  }

  /**
   * Gets community criteria based on project type
   */
  private getCommunityCriteriaForProjectType(projectType: ProjectType): string {
    if (projectType === 'defi') {
      return `SCALE = PROVEN ENGAGEMENT:
   - Base score: Start at 50 points for any social presence
   - For projects with "millions of users": Start at 70 points automatically
   - Scale indicators: "Millions of users" + "$56B+ TVL" = exceptional engagement (25pts)
   - Institutional trust: CEO testimonials from major entities = 15pts
   - Social presence: X, Discord, GitHub, LinkedIn = 10pts
   - IMPORTANT: Projects with "millions of users" and institutional backing = 85+ score`;
    } else if (projectType === 'portfolio') {
      return `PROFESSIONAL NETWORK & TESTIMONIALS:
   - Base score: Start at 60 points for social presence
   - LinkedIn profile with connections (20pts)
   - GitHub with repositories and activity (20pts)
   - Twitter/X presence (10pts)
   - Client testimonials or reviews (20pts)
   - Project metrics (projects completed, clients served) (15pts)
   - Blog readers or community following (10pts)
   - Professional network visibility (5pts)
   - IMPORTANT: Active social profiles + testimonials = 85-90 points (NOT millions of users needed)`;
    } else {
      return `BUSINESS COMMUNITY:
   - Base score: Start at 50 points for social presence
   - Multiple social media platforms (20pts)
   - Customer reviews/testimonials (25pts)
   - Active engagement (20pts)
   - Community size indicators (20pts)
   - Partnerships or collaborations (15pts)`;
    }
  }

  /**
   * Gets verification checks based on project type
   */
  private getVerificationChecksForProjectType(projectType: ProjectType): string {
    if (projectType === 'defi') {
      return `- Cross-reference team members on LinkedIn and verify employment history
- Validate audit reports by checking auditor websites directly
- Verify GitHub repository authenticity and recent activity
- Check for suspicious patterns: copied content, fake social media followers
- Validate tokenomics math and distribution claims`;
    } else if (projectType === 'portfolio') {
      return `- Verify LinkedIn profile authenticity and connections
- Check GitHub for actual code contributions and activity
- Cross-reference testimonials with company websites if possible
- Verify claimed project metrics and experience timeline
- Check for date inconsistencies (future dates as past events)
- Validate social media profiles are genuine and active`;
    } else {
      return `- Verify company registration and business details
- Check team member profiles on LinkedIn
- Validate customer testimonials and reviews
- Verify partnerships and claimed associations
- Check for consistent information across platforms`;
    }
  }

  /**
   * Gets technical criteria based on project type
   */
  private getTechnicalCriteriaForProjectType(projectType: ProjectType): string {
    if (projectType === 'defi') {
      return `SCALE = PROVEN QUALITY:
   - Base score: Start at 50 points if code repository mentioned
   - For multi-chain protocols: Start at 70 points automatically
   - Open source: "Publicly available and auditable" + GitHub links = 25pts
   - Technical documentation: Technical Paper (V3 paper) = 20pts
   - Proven scalability: "12+ networks" + "tens of billions of dollars" = 20pts
   - IMPORTANT: Multi-chain protocols managing billions = 85+ score for proven technical excellence`;
    } else if (projectType === 'portfolio') {
      return `PORTFOLIO TECHNICAL QUALITY:
   - Base score: Start at 60 points for modern website
   - Website built with modern tech (Next.js, React, etc.) (20pts)
   - Fast loading and responsive design (15pts)
   - GitHub repository with projects (20pts)
   - Code examples or demos showcased (15pts)
   - Technical skills clearly listed (15pts)
   - Clean, professional UI/UX (10pts)
   - Mobile-friendly design (5pts)
   - IMPORTANT: Modern tech stack + GitHub + good UX = 85-90 points (NOT blockchain required)`;
    } else {
      return `GENERAL TECHNICAL QUALITY:
   - Base score: Start at 50 points for functional website
   - Modern web technologies (20pts)
   - Responsive design (20pts)
   - Good performance (20pts)
   - Professional design (20pts)
   - Accessibility features (20pts)`;
    }
  }

  /**
   * Gets scoring guidance based on project type
   */
  private getScoringGuidanceForProjectType(projectType: ProjectType): string {
    switch (projectType) {
      case 'defi':
        return `- For DAO/Decentralized projects: Don't penalize for lack of traditional team pages if governance is transparent
- For mature/high-TVL projects: Apply higher standards and expect comprehensive documentation
- For new projects: Focus on fundamentals and team credibility
- Security audits and tokenomics are CRITICAL for DeFi projects
- Use partial credit: Award points for partial completion rather than binary 0/100 scoring`;
      
      case 'portfolio':
        return `- This is a PERSONAL PORTFOLIO website - NOT a DeFi/blockchain project
- DO NOT penalize for lack of tokenomics, audits, or DAO governance (these are NOT applicable)
- Focus on: Professional presentation, skills showcase, project examples, contact information
- Transparency = Clear identity, location, social profiles (LinkedIn, GitHub), work history
- Security = Privacy policy, secure contact forms, professional hosting
- Community = Social media presence, testimonials, client feedback
- Technical = Website quality, performance, responsive design, code examples/GitHub
- Documentation = Clear service descriptions, FAQ, blog/articles, case studies
- IMPORTANT: Score based on portfolio website standards, NOT blockchain standards`;
      
      case 'business':
        return `- This is a BUSINESS/COMPANY website - NOT a DeFi project
- DO NOT penalize for lack of blockchain-specific features
- Focus on: Company information, services/products, team, contact details, credentials
- Transparency = Company registration, team bios, physical address, clear pricing
- Security = SSL certificate, privacy policy, data protection, secure payments
- Community = Customer reviews, social proof, partnerships, case studies
- Technical = Website quality, professional design, functionality
- Documentation = Service descriptions, terms of service, support resources`;
      
      default:
        return `- Analyze based on general website quality and trustworthiness
- Apply appropriate criteria based on website purpose
- Use partial credit: Award points for partial completion`;
    }
  }

  /**
   * Builds comprehensive analysis prompt for Gemini API with project-type-specific criteria
   */
  private buildAnalysisPrompt(content: ExtractedContent, projectType: ProjectType): string {
    const basePrompt = this.getBasePromptForProjectType(projectType);
    
    // Build deep crawl summary if available
    let deepCrawlSummary = '';
    if (content.deepCrawlData) {
      const dc = content.deepCrawlData;
      deepCrawlSummary = `

DEEP CRAWL FINDINGS (Enhanced Analysis):
- Pages Crawled: ${dc.crawledPages.length} additional pages analyzed
- Team Page Found: ${dc.teamPageFound ? 'YES' : 'NO'}
- Team Members Identified: ${dc.teamMembers.length} members
${dc.teamMembers.length > 0 ? `  Team: ${dc.teamMembers.map((m: { name: string; role?: string; linkedin?: string }) => `${m.name}${m.role ? ` (${m.role})` : ''}${m.linkedin ? ' [LinkedIn verified]' : ''}`).join('; ')}` : ''}
- Bug Bounty Program: ${dc.bugBountyFound ? 'YES - Active bug bounty program found' : 'NO'}
${dc.bugBountyFound ? `  Details: ${dc.bugBountyDetails.slice(0, 200)}` : ''}
- DAO Governance: ${dc.governanceFound ? 'YES - Governance system found' : 'NO'}
${dc.governanceFound ? `  Details: ${dc.governanceDetails.slice(0, 200)}` : ''}
- Documentation Links: ${dc.documentationLinks.length} additional doc pages found

IMPORTANT: Use this deep crawl data to INCREASE scores for transparency, security, and governance.
- If team members are found with LinkedIn profiles, transparency score should be 75-90+
- If bug bounty program exists, security score should be 80-95+
- If DAO governance exists, transparency score should be 80-95+`;
    }
    
    // Build external verification summary if available
    let externalVerificationSummary = '';
    if (content.externalVerification) {
      const ev = content.externalVerification;
      externalVerificationSummary = `

EXTERNAL SOURCE VERIFICATION (100% Genuine Data):
- Overall Verification Score: ${ev.overallTrustScore}/100
- LinkedIn Profiles Verified: ${ev.verifiedTeamMembers}/${ev.linkedInProfiles.length}
${ev.linkedInProfiles.map(p => `  ${p.verified ? '✅' : '❌'} ${p.name || p.url} - ${p.verified ? 'VERIFIED & EXISTS' : 'NOT FOUND'}`).join('\n')}
- GitHub Profiles Verified: ${ev.gitHubProfiles.filter(p => p.verified).length}/${ev.gitHubProfiles.length}
${ev.gitHubProfiles.map(p => `  ${p.verified ? '✅' : '❌'} ${p.username} - ${p.verified ? `${p.publicRepos} repos, ${p.recentActivity ? 'ACTIVE' : 'INACTIVE'}` : 'NOT FOUND'}`).join('\n')}
- GitHub Repositories Verified: ${ev.verifiedRepos}/${ev.gitHubRepos.length}
${ev.gitHubRepos.map(r => `  ${r.verified ? '✅' : '❌'} ${r.name} - ${r.verified ? `${r.stars} stars, ${r.isActive ? 'ACTIVE' : 'INACTIVE'}` : 'NOT FOUND'}`).join('\n')}

CRITICAL SCORING ADJUSTMENTS BASED ON EXTERNAL VERIFICATION:
- If LinkedIn profiles are VERIFIED (✅), transparency score MUST be 85-95+
- If GitHub profiles are VERIFIED and ACTIVE, technical score MUST be 85-95+
- If GitHub repos are VERIFIED and ACTIVE, technical score MUST be 90-95+
- If verification score is 80+, overall trust should be HIGH
- DO NOT penalize for "limited team information" if external verification confirms team exists
- DO NOT flag "no team information" if LinkedIn profiles are verified
- DO NOT flag "no bug bounty" if deep crawl found one`;
    }
    
    // Build social media summary if available
    let socialMediaSummary = '';
    if (content.socialMediaData) {
      const sm = content.socialMediaData;
      socialMediaSummary = `

SOCIAL MEDIA COMMUNITY DATA (Real Engagement Metrics):
- Community Score: ${sm.communityScore}/100
- Active Channels: ${sm.activeChannels} platforms
- Verified Channels: ${sm.verifiedChannels} verified
- Total Community: ${(sm.totalFollowers + sm.totalMembers).toLocaleString()} followers/members

${sm.twitter ? `Twitter/X: ${sm.twitter.exists ? '✅ ACTIVE' : '❌ NOT FOUND'}
${sm.twitter.exists ? `  @${sm.twitter.username} - ${sm.twitter.followers?.toLocaleString() || 'N/A'} followers${sm.twitter.verified ? ' (VERIFIED)' : ''}` : ''}` : ''}

${sm.github ? `GitHub: ${sm.github.exists ? '✅ ACTIVE' : '❌ NOT FOUND'}
${sm.github.exists ? `  ${sm.github.name} - ${sm.github.repositories || 0} repos, ${sm.github.stars?.toLocaleString() || 0} stars` : ''}` : ''}

${sm.discord ? `Discord: ${sm.discord.exists ? '✅ ACTIVE' : '❌ NOT FOUND'}
${sm.discord.exists ? `  ${sm.discord.serverName} - ${sm.discord.memberCount?.toLocaleString() || 'N/A'} members${sm.discord.verified ? ' (VERIFIED)' : ''}` : ''}` : ''}

${sm.medium ? `Medium: ${sm.medium.exists ? '✅ ACTIVE' : '❌ NOT FOUND'}
${sm.medium.exists ? `  ${sm.medium.author} - ${sm.medium.followers?.toLocaleString() || 'N/A'} followers` : ''}` : ''}

${sm.reddit ? `Reddit: ${sm.reddit.exists ? '✅ ACTIVE' : '❌ NOT FOUND'}
${sm.reddit.exists ? `  r/${sm.reddit.subreddit} - ${sm.reddit.members?.toLocaleString() || 'N/A'} members` : ''}` : ''}

${sm.telegram ? `Telegram: ${sm.telegram.exists ? '✅ ACTIVE' : '❌ NOT FOUND'}
${sm.telegram.exists ? `  ${sm.telegram.channelName} - ${sm.telegram.members?.toLocaleString() || 'N/A'} members` : ''}` : ''}

CRITICAL SCORING ADJUSTMENTS BASED ON SOCIAL MEDIA:
- If total community > 100K, community engagement score MUST be 90-95+
- If total community > 50K, community engagement score MUST be 85-90+
- If total community > 10K, community engagement score MUST be 75-85+
- If Discord has 10K+ members, community score MUST be 85+
- If Twitter has 50K+ followers, community score MUST be 85+
- If multiple verified channels, community score MUST be 90+
- DO NOT flag "small community" if social media shows large following`;
    }
    
    return `
${basePrompt}

PROJECT TYPE: ${projectType.toUpperCase()}

IMPORTANT: Apply scoring criteria specific to this project type:
${this.getScoringGuidanceForProjectType(projectType)}

PROJECT INFORMATION:
- URL: ${content.url}
- Title: ${content.title}
- Description: ${content.description}

CONTENT TO ANALYZE:
Main Content: ${content.mainContent}
Documentation: ${content.documentation.join('\n')}
Team Information: ${content.teamInfo}
Tokenomics: ${content.tokenomics}
Security Information: ${content.securityInfo}
Social Links: ${content.socialLinks.join(', ')}
Code Repositories: ${content.codeRepositories.join(', ')}
${deepCrawlSummary}
${externalVerificationSummary}
${socialMediaSummary}

ENHANCED ANALYSIS REQUIREMENTS:

1. DOCUMENTATION QUALITY (0-100 points) - ${this.getDocumentationCriteriaForProjectType(projectType)}

2. TRANSPARENCY INDICATORS (0-100 points) - ${this.getTransparencyCriteriaForProjectType(projectType)}

3. SECURITY DOCUMENTATION (0-100 points) - ${this.getSecurityCriteriaForProjectType(projectType)}

4. COMMUNITY ENGAGEMENT (0-100 points) - ${this.getCommunityCriteriaForProjectType(projectType)}

5. TECHNICAL IMPLEMENTATION (0-100 points) - ${this.getTechnicalCriteriaForProjectType(projectType)}

CRITICAL VERIFICATION CHECKS (adjust based on project type):
${this.getVerificationChecksForProjectType(projectType)}

ACTIONABLE RECOMMENDATIONS:
- Provide specific template requests for missing information
- Suggest independent verification steps for users
- Recommend specific tools for further due diligence
- Include timeline expectations for improvements

Return your analysis in this EXACT JSON format (no additional text):
{
  "factors": {
    "documentationQuality": [0-100 number],
    "transparencyIndicators": [0-100 number],
    "securityDocumentation": [0-100 number],
    "communityEngagement": [0-100 number],
    "technicalImplementation": [0-100 number]
  },
  "explanations": {
    "documentationQuality": "[detailed explanation with specific findings and verification results]",
    "transparencyIndicators": "[detailed explanation with team verification and transparency assessment]",
    "securityDocumentation": "[detailed explanation with audit verification and security practice analysis]",
    "communityEngagement": "[detailed explanation with engagement metrics and community health assessment]",
    "technicalImplementation": "[detailed explanation with code quality and architecture assessment]"
  },
  "recommendations": [
    "[specific actionable recommendation with template or tool suggestion]",
    "[independent verification step with specific instructions]",
    "[improvement suggestion with timeline expectation]"
  ],
  "risks": [
    "[specific risk with impact assessment]",
    "[technical risk with mitigation suggestion]",
    "[governance risk with monitoring recommendation]"
  ],
  "redFlags": [
    "[critical red flag with verification method]",
    "[suspicious pattern with evidence]"
  ],
  "positiveIndicators": [
    "[verified positive indicator with evidence]",
    "[strong trust signal with verification method]",
    "[competitive advantage with supporting data]"
  ]
}
`;
  }

  /**
   * Calls Gemini API with retry logic and error handling
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    const maxRetries = 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown API error');
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    throw new Error(`Gemini API failed after ${maxRetries} attempts: ${lastError!.message}`);
  }

  /**
   * Parses and validates Gemini API response with enhanced error handling
   */
  private parseGeminiResponse(response: string): AnalysisResult {
    try {
      // Clean response and extract JSON with multiple fallback strategies
      let jsonStr = this.extractJsonFromResponse(response);
      
      if (!jsonStr) {
        throw new Error('No valid JSON found in Gemini response');
      }

      // Attempt to fix common JSON issues
      jsonStr = this.sanitizeJsonString(jsonStr);
      
      const parsed = JSON.parse(jsonStr);
      
      // Validate and repair the parsed result
      return this.validateAndRepairParsedResult(parsed);
      
    } catch (error) {
      console.error('Gemini response parsing failed:', error);
      console.error('Raw response (first 500 chars):', response.substring(0, 500));
      throw new Error(`Failed to parse Gemini response: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
  }

  /**
   * Extracts JSON from response with multiple strategies
   */
  private extractJsonFromResponse(response: string): string | null {
    // Strategy 1: Find complete JSON object
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
    
    // Strategy 2: Find JSON between code blocks
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }
    
    // Strategy 3: Look for JSON starting with specific structure
    const structuredMatch = response.match(/\{\s*"factors"[\s\S]*\}/);
    if (structuredMatch) {
      return structuredMatch[0];
    }
    
    return null;
  }

  /**
   * Sanitizes JSON string to fix common issues
   */
  private sanitizeJsonString(jsonStr: string): string {
    let cleaned = jsonStr
      // Fix trailing commas before closing braces/brackets
      .replace(/,\s*([}\]])/g, '$1')
      // Fix missing quotes around property names
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
      // Remove any trailing text after the final closing brace
      .replace(/\}(?!.*\})[\s\S]*$/, '}')
      // Fix unescaped newlines in strings
      .replace(/"([^"]*?)\n([^"]*?)"/g, '"$1 $2"')
      // Fix unescaped quotes in string values (but not property names)
      .replace(/:\s*"([^"]*)'([^"]*)"/g, ': "$1\'$2"');
    
    // Additional pass to fix nested quote issues
    try {
      // Try parsing to detect issues
      JSON.parse(cleaned);
      return cleaned;
    } catch (e) {
      // If still failing, try more aggressive cleaning
      cleaned = cleaned
        // Remove HTML entities
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#39;/g, "'")
        // Fix double commas
        .replace(/,,+/g, ',')
        // Fix spaces in property names
        .replace(/"([^"]+)\s+([^"]+)"\s*:/g, '"$1_$2":')
        // Ensure proper closing
        .trim();
      
      // If doesn't end with }, add it
      if (!cleaned.endsWith('}')) {
        cleaned += '}';
      }
      
      return cleaned;
    }
  }

  /**
   * Validates and repairs parsed result structure
   */
  private validateAndRepairParsedResult(parsed: any): AnalysisResult {
    // Ensure all scores are within valid range
    if (parsed.factors) {
      Object.keys(parsed.factors).forEach(key => {
        const score = parsed.factors[key];
        if (typeof score !== 'number' || score < 0 || score > 100) {
          parsed.factors[key] = Math.max(0, Math.min(100, Number(score) || 0));
        }
      });
    }
    
    // Ensure all required arrays exist
    const requiredArrays = ['recommendations', 'risks', 'redFlags', 'positiveIndicators'];
    requiredArrays.forEach(arrayName => {
      if (!Array.isArray(parsed[arrayName])) {
        parsed[arrayName] = [];
      }
    });
    
    // Ensure explanations object exists
    if (!parsed.explanations || typeof parsed.explanations !== 'object') {
      parsed.explanations = {
        documentationQuality: 'Analysis completed with fallback method',
        transparencyIndicators: 'Analysis completed with fallback method',
        securityDocumentation: 'Analysis completed with fallback method',
        communityEngagement: 'Analysis completed with fallback method',
        technicalImplementation: 'Analysis completed with fallback method'
      };
    }
    
    return parsed as AnalysisResult;
  }

  /**
   * Validates that analysis result contains all required fields
   * Requirements: 2.1, 7.4
   */
  private validateAnalysisResult(result: any): result is AnalysisResult {
    try {
      if (!result || typeof result !== 'object') {
        return false;
      }

      // Check factors object
      if (!result.factors || typeof result.factors !== 'object') {
        return false;
      }

      const requiredFactors: (keyof AnalysisFactors)[] = [
        'documentationQuality',
        'transparencyIndicators', 
        'securityDocumentation',
        'communityEngagement',
        'technicalImplementation'
      ];

      for (const factor of requiredFactors) {
        const score = result.factors[factor];
        if (typeof score !== 'number' || score < 0 || score > 100) {
          return false;
        }
      }

      // Check explanations object
      if (!result.explanations || typeof result.explanations !== 'object') {
        return false;
      }

      for (const factor of requiredFactors) {
        if (typeof result.explanations[factor] !== 'string') {
          return false;
        }
      }

      // Check arrays
      const requiredArrays = ['recommendations', 'risks', 'redFlags', 'positiveIndicators'];
      for (const arrayName of requiredArrays) {
        if (!Array.isArray(result[arrayName])) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  }

  /**
   * Creates a comprehensive analysis result with all required fields
   * Used as a template for ensuring completeness
   */
  static createEmptyAnalysisResult(): AnalysisResult {
    return {
      factors: {
        documentationQuality: 0,
        transparencyIndicators: 0,
        securityDocumentation: 0,
        communityEngagement: 0,
        technicalImplementation: 0
      },
      explanations: {
        documentationQuality: '',
        transparencyIndicators: '',
        securityDocumentation: '',
        communityEngagement: '',
        technicalImplementation: ''
      },
      recommendations: [],
      risks: [],
      redFlags: [],
      positiveIndicators: []
    };
  }

  /**
   * Validates and repairs analysis result structure
   * Ensures all required fields are present with valid values
   */
  static validateAndRepairResult(result: Partial<AnalysisResult>): AnalysisResult {
    const template = AIAnalysisService.createEmptyAnalysisResult();
    
    return {
      factors: {
        documentationQuality: AIAnalysisService.sanitizeScore(result.factors?.documentationQuality),
        transparencyIndicators: AIAnalysisService.sanitizeScore(result.factors?.transparencyIndicators),
        securityDocumentation: AIAnalysisService.sanitizeScore(result.factors?.securityDocumentation),
        communityEngagement: AIAnalysisService.sanitizeScore(result.factors?.communityEngagement),
        technicalImplementation: AIAnalysisService.sanitizeScore(result.factors?.technicalImplementation)
      },
      explanations: {
        documentationQuality: result.explanations?.documentationQuality || template.explanations.documentationQuality,
        transparencyIndicators: result.explanations?.transparencyIndicators || template.explanations.transparencyIndicators,
        securityDocumentation: result.explanations?.securityDocumentation || template.explanations.securityDocumentation,
        communityEngagement: result.explanations?.communityEngagement || template.explanations.communityEngagement,
        technicalImplementation: result.explanations?.technicalImplementation || template.explanations.technicalImplementation
      },
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : template.recommendations,
      risks: Array.isArray(result.risks) ? result.risks : template.risks,
      redFlags: Array.isArray(result.redFlags) ? result.redFlags : template.redFlags,
      positiveIndicators: Array.isArray(result.positiveIndicators) ? result.positiveIndicators : template.positiveIndicators
    };
  }

  /**
   * Static method to sanitize scores
   */
  private static sanitizeScore(score: number | undefined): number {
    if (typeof score !== 'number' || isNaN(score)) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Generates detailed explanations based on scores and content
   */
  private generateDetailedExplanations(factors: AnalysisFactors, content: ExtractedContent): Record<keyof AnalysisFactors, string> {
    return {
      documentationQuality: this.explainDocumentation(factors.documentationQuality, content),
      transparencyIndicators: this.explainTransparency(factors.transparencyIndicators, content),
      securityDocumentation: this.explainSecurity(factors.securityDocumentation, content),
      communityEngagement: this.explainCommunity(factors.communityEngagement, content),
      technicalImplementation: this.explainTechnical(factors.technicalImplementation, content)
    };
  }

  private explainDocumentation(score: number, content: ExtractedContent): string {
    const sections = content.documentation.length;
    const quality = score >= 80 ? 'comprehensive' : score >= 60 ? 'adequate' : score >= 40 ? 'limited' : 'insufficient';
    return `Documentation quality is ${quality} with ${sections} section(s) identified. ${score >= 80 ? 'Multiple documentation resources including technical papers, guides, and developer resources demonstrate strong commitment to transparency.' : score >= 60 ? 'Basic documentation is present but could be expanded with more technical details and examples.' : 'Limited documentation may hinder developer adoption and user understanding.'}`;
  }

  private explainTransparency(score: number, content: ExtractedContent): string {
    const teamLength = content.teamInfo.length;
    const quality = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'moderate' : 'poor';
    
    if (content.externalVerification && content.externalVerification.verifiedTeamMembers > 0) {
      return `Transparency is ${quality} with ${content.externalVerification.verifiedTeamMembers} verified team member(s). External verification confirms team authenticity through LinkedIn profiles and professional networks.`;
    }
    
    if (content.deepCrawlData?.governanceFound) {
      return `Transparency is ${quality} with decentralized governance system in place. ${content.deepCrawlData.governanceDetails.slice(0, 150)}...`;
    }
    
    return `Transparency indicators are ${quality} with ${teamLength} characters of team information. ${score >= 80 ? 'Comprehensive team details, governance structure, and tokenomics provide strong transparency.' : score >= 60 ? 'Basic team and project information is available but could be more detailed.' : 'Limited transparency may raise concerns about project legitimacy.'}`;
  }

  private explainSecurity(score: number, content: ExtractedContent): string {
    const secLength = content.securityInfo.length;
    const quality = score >= 80 ? 'strong' : score >= 60 ? 'adequate' : score >= 40 ? 'basic' : 'weak';
    
    if (content.deepCrawlData?.bugBountyFound) {
      return `Security practices are ${quality} with active bug bounty program. ${content.deepCrawlData.bugBountyDetails.slice(0, 150)}... This demonstrates ongoing commitment to security.`;
    }
    
    return `Security documentation is ${quality} with ${secLength} characters of security information. ${score >= 80 ? 'Multiple security audits, bug bounty programs, and comprehensive security practices demonstrate strong security posture.' : score >= 60 ? 'Basic security measures are documented but additional audits would strengthen confidence.' : 'Limited security information requires independent verification before investment.'}`;
  }

  private explainCommunity(score: number, content: ExtractedContent): string {
    const socialCount = content.socialLinks.length;
    const quality = score >= 80 ? 'exceptional' : score >= 60 ? 'strong' : score >= 40 ? 'moderate' : 'limited';
    
    if (content.socialMediaData) {
      const total = content.socialMediaData.totalFollowers + content.socialMediaData.totalMembers;
      return `Community engagement is ${quality} with ${socialCount} active platform(s) and ${total.toLocaleString()} total followers/members. ${score >= 80 ? 'Large, active community across multiple platforms indicates strong user adoption and engagement.' : 'Growing community presence suggests increasing adoption.'}`;
    }
    
    return `Community engagement is ${quality} with ${socialCount} social media platform(s). ${score >= 80 ? 'Strong multi-platform presence with active community engagement.' : score >= 60 ? 'Decent social media presence but could expand to more platforms.' : 'Limited community presence may indicate early stage or low adoption.'}`;
  }

  private explainTechnical(score: number, content: ExtractedContent): string {
    const repoCount = content.codeRepositories.length;
    const quality = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'basic' : 'limited';
    
    if (content.externalVerification && content.externalVerification.verifiedRepos > 0) {
      return `Technical implementation is ${quality} with ${content.externalVerification.verifiedRepos} verified repository(ies). External verification confirms active development with recent commits and contributions.`;
    }
    
    return `Technical implementation is ${quality} with ${repoCount} code repository(ies) identified. ${score >= 80 ? 'Open source code, active development, and multi-chain deployment demonstrate strong technical capabilities.' : score >= 60 ? 'Code repositories are available but more transparency in development activity would be beneficial.' : 'Limited technical transparency requires independent code review.'}`;
  }
}