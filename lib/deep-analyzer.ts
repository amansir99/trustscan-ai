import { GoogleGenerativeAI } from '@google/generative-ai';

interface DeepAnalysisResult {
  documentation: DocumentationAnalysis;
  team: TeamAnalysis;
  security: SecurityAnalysis;
  community: CommunityAnalysis;
  technical: TechnicalAnalysis;
  overallScore: number;
  lastUpdated: string;
}

interface DocumentationAnalysis {
  devPortalQuality: number;
  whitepaperDepth: number;
  apiDocsCompleteness: number;
  tutorialAvailability: number;
  score: number;
}

interface TeamAnalysis {
  publicIdentities: string[];
  linkedInProfiles: number;
  conferenceAppearances: number;
  githubContributions: number;
  score: number;
}

interface SecurityAnalysis {
  auditReports: AuditReport[];
  bugBountyProgram: boolean;
  securityPractices: string[];
  exploitHistory: ExploitRecord[];
  score: number;
}

interface CommunityAnalysis {
  githubStars: number;
  discordMembers: number;
  developerActivity: number;
  governanceParticipation: number;
  score: number;
}

interface TechnicalAnalysis {
  codeQuality: number;
  testCoverage: number;
  deploymentMaturity: number;
  upgradeability: number;
  score: number;
}

interface AuditReport {
  auditor: string;
  date: string;
  url: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ExploitRecord {
  date: string;
  description: string;
  impact: string;
}

export class DeepAnalyzer {
  private gemini: GoogleGenerativeAI;
  
  constructor(apiKey: string) {
    this.gemini = new GoogleGenerativeAI(apiKey);
  }

  async analyzeProtocol(url: string, protocolName: string): Promise<DeepAnalysisResult> {
    const [documentation, team, security, community, technical] = await Promise.all([
      this.analyzeDocumentation(url, protocolName),
      this.analyzeTeam(url, protocolName),
      this.analyzeSecurity(url, protocolName),
      this.analyzeCommunity(url, protocolName),
      this.analyzeTechnical(url, protocolName)
    ]);

    const overallScore = this.calculateOverallScore({
      documentation,
      team,
      security,
      community,
      technical
    });

    return {
      documentation,
      team,
      security,
      community,
      technical,
      overallScore,
      lastUpdated: new Date().toISOString()
    };
  }

  private async analyzeDocumentation(url: string, protocolName: string): Promise<DocumentationAnalysis> {
    const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Analyze ${protocolName} documentation depth by checking:
    1. Developer portal quality at common paths: /docs, /dev, /developers
    2. Whitepaper technical depth and clarity
    3. API documentation completeness
    4. Tutorial and integration guide availability
    
    Base URL: ${url}
    
    Return JSON with scores 0-100 for each category and overall documentation score.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    try {
      return JSON.parse(response);
    } catch {
      return {
        devPortalQuality: 50,
        whitepaperDepth: 50,
        apiDocsCompleteness: 50,
        tutorialAvailability: 50,
        score: 50
      };
    }
  }

  private async analyzeTeam(url: string, protocolName: string): Promise<TeamAnalysis> {
    const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Analyze ${protocolName} team transparency:
    1. Identify public team members and founders
    2. Check for LinkedIn profiles and professional backgrounds
    3. Look for conference appearances and public speaking
    4. Verify GitHub contributions and technical leadership
    
    Protocol: ${protocolName}
    Website: ${url}
    
    Return JSON with team member names, profile counts, and transparency score 0-100.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    try {
      return JSON.parse(response);
    } catch {
      return {
        publicIdentities: [],
        linkedInProfiles: 0,
        conferenceAppearances: 0,
        githubContributions: 0,
        score: 30
      };
    }
  }

  private async analyzeSecurity(url: string, protocolName: string): Promise<SecurityAnalysis> {
    const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Analyze ${protocolName} security practices:
    1. Find audit reports from major firms (Trail of Bits, CertiK, ConsenSys, etc.)
    2. Check for active bug bounty programs (Immunefi, HackerOne)
    3. Review security documentation and incident response
    4. Check exploit history and how issues were handled
    
    Protocol: ${protocolName}
    Website: ${url}
    
    Return JSON with audit details, security score 0-100, and exploit history.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    try {
      return JSON.parse(response);
    } catch {
      return {
        auditReports: [],
        bugBountyProgram: false,
        securityPractices: [],
        exploitHistory: [],
        score: 40
      };
    }
  }

  private async analyzeCommunity(url: string, protocolName: string): Promise<CommunityAnalysis> {
    const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Analyze ${protocolName} community engagement:
    1. GitHub repository activity (stars, forks, recent commits)
    2. Discord/Telegram community size and activity
    3. Developer ecosystem and integration adoption
    4. Governance participation and voting activity
    
    Protocol: ${protocolName}
    Website: ${url}
    
    Return JSON with community metrics and engagement score 0-100.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    try {
      return JSON.parse(response);
    } catch {
      return {
        githubStars: 0,
        discordMembers: 0,
        developerActivity: 0,
        governanceParticipation: 0,
        score: 40
      };
    }
  }

  private async analyzeTechnical(url: string, protocolName: string): Promise<TechnicalAnalysis> {
    const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Analyze ${protocolName} technical implementation:
    1. Code quality and architecture patterns
    2. Test coverage and CI/CD practices
    3. Deployment maturity and multi-chain support
    4. Smart contract upgradeability and governance
    
    Protocol: ${protocolName}
    Website: ${url}
    
    Return JSON with technical metrics and implementation score 0-100.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    try {
      return JSON.parse(response);
    } catch {
      return {
        codeQuality: 50,
        testCoverage: 50,
        deploymentMaturity: 50,
        upgradeability: 50,
        score: 50
      };
    }
  }

  private calculateOverallScore(analysis: {
    documentation: DocumentationAnalysis;
    team: TeamAnalysis;
    security: SecurityAnalysis;
    community: CommunityAnalysis;
    technical: TechnicalAnalysis;
  }): number {
    const weights = {
      documentation: 0.25,
      team: 0.15,
      security: 0.30,
      community: 0.15,
      technical: 0.15
    };

    return Math.round(
      analysis.documentation.score * weights.documentation +
      analysis.team.score * weights.team +
      analysis.security.score * weights.security +
      analysis.community.score * weights.community +
      analysis.technical.score * weights.technical
    );
  }
}