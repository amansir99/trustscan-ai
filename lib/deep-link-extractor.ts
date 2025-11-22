/**
 * Deep Link Extractor
 * Follows and analyzes subpages, documentation portals, and external resources
 * for comprehensive project assessment
 */

import { ContentExtractionService, ExtractedContent } from './scraper';

export interface DeepExtractionResult {
  mainSite: ExtractedContent;
  docsPages: ExtractedContent[];
  teamPages: ExtractedContent[];
  securityPages: ExtractedContent[];
  githubReadme?: string;
  auditReports: AuditReportInfo[];
  linkedInProfiles: LinkedInProfile[];
  comprehensiveContent: string;
  extractionDepth: number;
  totalPagesAnalyzed: number;
}

export interface AuditReportInfo {
  auditorName: string;
  reportUrl: string;
  auditDate?: Date;
  findings?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  status: 'verified' | 'unverified' | 'pending';
}

export interface LinkedInProfile {
  name: string;
  profileUrl: string;
  title?: string;
  verified: boolean;
}

export class DeepLinkExtractor {
  private extractor: ContentExtractionService;
  private maxDepth: number;
  private maxPagesPerCategory: number;
  
  // Known audit firm domains for verification
  private readonly auditFirmDomains = [
    'consensys.net',
    'trailofbits.com',
    'openzeppelin.com',
    'certik.com',
    'quantstamp.com',
    'chainsecurity.com',
    'ackee.xyz',
    'oxorio.io',
    'certora.com',
    'abdk.consulting',
    'peckshield.com',
    'slowmist.com',
    'hacken.io'
  ];

  constructor(maxDepth: number = 2, maxPagesPerCategory: number = 3) {
    this.extractor = new ContentExtractionService();
    this.maxDepth = maxDepth;
    this.maxPagesPerCategory = maxPagesPerCategory;
  }

  /**
   * Perform deep extraction following relevant links
   */
  async extractDeep(mainUrl: string): Promise<DeepExtractionResult> {
    console.log(`🔍 Starting deep extraction for ${mainUrl}`);
    
    // Extract main site
    const mainSite = await this.extractor.extractWebsiteContent(mainUrl);
    
    // Identify and categorize links
    const categorizedLinks = this.categorizeLinks(mainSite, mainUrl);
    
    // Extract documentation pages
    const docsPages = await this.extractPages(categorizedLinks.docs, 'documentation');
    
    // Extract team pages
    const teamPages = await this.extractPages(categorizedLinks.team, 'team');
    
    // Extract security/audit pages
    const securityPages = await this.extractPages(categorizedLinks.security, 'security');
    
    // Extract GitHub README if available
    const githubReadme = await this.extractGitHubReadme(categorizedLinks.github);
    
    // Identify and verify audit reports
    const auditReports = await this.identifyAuditReports(mainSite, securityPages);
    
    // Extract LinkedIn profiles
    const linkedInProfiles = this.extractLinkedInProfiles(mainSite, teamPages);
    
    // Combine all content
    const comprehensiveContent = this.combineContent(
      mainSite,
      docsPages,
      teamPages,
      securityPages,
      githubReadme
    );
    
    const totalPages = 1 + docsPages.length + teamPages.length + securityPages.length;
    
    console.log(`✅ Deep extraction complete: ${totalPages} pages analyzed`);
    
    return {
      mainSite,
      docsPages,
      teamPages,
      securityPages,
      githubReadme,
      auditReports,
      linkedInProfiles,
      comprehensiveContent,
      extractionDepth: this.maxDepth,
      totalPagesAnalyzed: totalPages
    };
  }

  /**
   * Categorize links found on main site
   */
  private categorizeLinks(content: ExtractedContent, baseUrl: string): {
    docs: string[];
    team: string[];
    security: string[];
    github: string[];
    social: string[];
  } {
    const allLinks = [
      ...content.socialLinks,
      ...content.codeRepositories,
      ...this.extractLinksFromText(content.mainContent),
      ...this.extractLinksFromText(content.documentation.join(' '))
    ];
    
    const uniqueLinks = Array.from(new Set(allLinks));
    const baseDomain = new URL(baseUrl).hostname;
    
    const categorized = {
      docs: [] as string[],
      team: [] as string[],
      security: [] as string[],
      github: [] as string[],
      social: [] as string[]
    };
    
    for (const link of uniqueLinks) {
      try {
        const url = new URL(link, baseUrl);
        const path = url.pathname.toLowerCase();
        const hostname = url.hostname.toLowerCase();
        
        // Documentation links
        if (
          path.includes('/docs') ||
          path.includes('/documentation') ||
          path.includes('/guide') ||
          path.includes('/api') ||
          path.includes('/whitepaper') ||
          hostname.includes('docs.')
        ) {
          categorized.docs.push(url.href);
        }
        
        // Team/About links
        else if (
          path.includes('/team') ||
          path.includes('/about') ||
          path.includes('/people') ||
          path.includes('/leadership') ||
          path.includes('/founders')
        ) {
          categorized.team.push(url.href);
        }
        
        // Security/Audit links
        else if (
          path.includes('/security') ||
          path.includes('/audit') ||
          path.includes('/bug-bounty') ||
          path.includes('/safety')
        ) {
          categorized.security.push(url.href);
        }
        
        // GitHub links
        else if (hostname.includes('github.com')) {
          categorized.github.push(url.href);
        }
        
        // Social links
        else if (
          hostname.includes('twitter.com') ||
          hostname.includes('x.com') ||
          hostname.includes('linkedin.com') ||
          hostname.includes('discord') ||
          hostname.includes('telegram')
        ) {
          categorized.social.push(url.href);
        }
      } catch (error) {
        // Invalid URL, skip
        continue;
      }
    }
    
    // Limit to max pages per category
    return {
      docs: categorized.docs.slice(0, this.maxPagesPerCategory),
      team: categorized.team.slice(0, this.maxPagesPerCategory),
      security: categorized.security.slice(0, this.maxPagesPerCategory),
      github: categorized.github.slice(0, 2),
      social: categorized.social
    };
  }

  /**
   * Extract pages from a list of URLs
   */
  private async extractPages(urls: string[], category: string): Promise<ExtractedContent[]> {
    const results: ExtractedContent[] = [];
    
    for (const url of urls) {
      try {
        console.log(`  📄 Extracting ${category} page: ${url}`);
        const content = await this.extractor.extractWebsiteContent(url);
        results.push(content);
        
        // Small delay to avoid rate limiting
        await this.delay(1000);
      } catch (error) {
        console.warn(`  ⚠️ Failed to extract ${url}:`, error instanceof Error ? error.message : error);
        continue;
      }
    }
    
    return results;
  }

  /**
   * Extract GitHub README content
   */
  private async extractGitHubReadme(githubUrls: string[]): Promise<string | undefined> {
    if (githubUrls.length === 0) return undefined;
    
    for (const url of githubUrls) {
      try {
        // Convert GitHub URL to raw README URL
        const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) continue;
        
        const [, owner, repo] = match;
        const readmeUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`;
        
        console.log(`  📄 Fetching GitHub README: ${readmeUrl}`);
        
        const response = await fetch(readmeUrl);
        if (response.ok) {
          return await response.text();
        }
        
        // Try master branch if main doesn't exist
        const masterUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/README.md`;
        const masterResponse = await fetch(masterUrl);
        if (masterResponse.ok) {
          return await masterResponse.text();
        }
      } catch (error) {
        console.warn(`  ⚠️ Failed to fetch GitHub README:`, error);
        continue;
      }
    }
    
    return undefined;
  }

  /**
   * Identify and verify audit reports
   */
  private async identifyAuditReports(
    mainSite: ExtractedContent,
    securityPages: ExtractedContent[]
  ): Promise<AuditReportInfo[]> {
    const reports: AuditReportInfo[] = [];
    const allContent = [mainSite, ...securityPages];
    
    for (const content of allContent) {
      const text = `${content.mainContent} ${content.securityInfo}`.toLowerCase();
      
      // Look for audit firm mentions
      const auditPatterns = [
        /audit(?:ed)?\s+by\s+([a-z\s]+)/gi,
        /([a-z\s]+)\s+audit\s+report/gi,
        /security\s+audit:\s+([a-z\s]+)/gi
      ];
      
      for (const pattern of auditPatterns) {
        const matches = Array.from(text.matchAll(pattern));
        for (const match of matches) {
          const auditorName = match[1].trim();
          
          // Check if it's a known auditor
          const isKnownAuditor = this.auditFirmDomains.some(domain =>
            auditorName.toLowerCase().includes(domain.split('.')[0])
          );
          
          if (isKnownAuditor || auditorName.length > 3) {
            // Look for associated URL
            const reportUrl = this.findAuditReportUrl(content, auditorName);
            
            reports.push({
              auditorName,
              reportUrl: reportUrl || '',
              status: isKnownAuditor ? 'verified' : 'unverified'
            });
          }
        }
      }
    }
    
    // Remove duplicates
    const uniqueReports = reports.filter((report, index, self) =>
      index === self.findIndex(r => r.auditorName === report.auditorName)
    );
    
    return uniqueReports;
  }

  /**
   * Find audit report URL associated with auditor name
   */
  private findAuditReportUrl(content: ExtractedContent, auditorName: string): string | undefined {
    const links = this.extractLinksFromText(content.mainContent + content.securityInfo);
    
    // Look for PDF or report links near the auditor name
    for (const link of links) {
      if (
        link.toLowerCase().includes('audit') ||
        link.toLowerCase().includes('report') ||
        link.toLowerCase().includes('.pdf') ||
        this.auditFirmDomains.some(domain => link.includes(domain))
      ) {
        return link;
      }
    }
    
    return undefined;
  }

  /**
   * Extract LinkedIn profiles from content
   */
  private extractLinkedInProfiles(
    mainSite: ExtractedContent,
    teamPages: ExtractedContent[]
  ): LinkedInProfile[] {
    const profiles: LinkedInProfile[] = [];
    const allContent = [mainSite, ...teamPages];
    
    for (const content of allContent) {
      const text = content.mainContent + content.teamInfo;
      const links = this.extractLinksFromText(text);
      
      for (const link of links) {
        if (link.includes('linkedin.com/in/')) {
          const match = link.match(/linkedin\.com\/in\/([^\/\?]+)/);
          if (match) {
            const username = match[1];
            
            // Try to find associated name
            const nameMatch = text.match(new RegExp(`([A-Z][a-z]+\\s+[A-Z][a-z]+).*?${username}`, 'i'));
            const name = nameMatch ? nameMatch[1] : username;
            
            profiles.push({
              name,
              profileUrl: link,
              verified: true // Assume LinkedIn links are verified
            });
          }
        }
      }
    }
    
    // Remove duplicates
    return profiles.filter((profile, index, self) =>
      index === self.findIndex(p => p.profileUrl === profile.profileUrl)
    );
  }

  /**
   * Extract links from text content
   */
  private extractLinksFromText(text: string): string[] {
    const urlPattern = /https?:\/\/[^\s<>"]+/g;
    const matches = text.match(urlPattern);
    return matches || [];
  }

  /**
   * Combine all extracted content into comprehensive text
   */
  private combineContent(
    mainSite: ExtractedContent,
    docsPages: ExtractedContent[],
    teamPages: ExtractedContent[],
    securityPages: ExtractedContent[],
    githubReadme?: string
  ): string {
    const sections: string[] = [];
    
    // Main site
    sections.push('=== MAIN SITE ===');
    sections.push(mainSite.title);
    sections.push(mainSite.description);
    sections.push(mainSite.mainContent);
    
    // Documentation
    if (docsPages.length > 0) {
      sections.push('\n=== DOCUMENTATION ===');
      docsPages.forEach(page => {
        sections.push(page.title);
        sections.push(page.mainContent);
      });
    }
    
    // Team information
    if (teamPages.length > 0) {
      sections.push('\n=== TEAM INFORMATION ===');
      teamPages.forEach(page => {
        sections.push(page.title);
        sections.push(page.teamInfo || page.mainContent);
      });
    }
    
    // Security information
    if (securityPages.length > 0) {
      sections.push('\n=== SECURITY & AUDITS ===');
      securityPages.forEach(page => {
        sections.push(page.title);
        sections.push(page.securityInfo || page.mainContent);
      });
    }
    
    // GitHub README
    if (githubReadme) {
      sections.push('\n=== GITHUB README ===');
      sections.push(githubReadme);
    }
    
    return sections.join('\n\n');
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup
   */
  async close(): Promise<void> {
    await this.extractor.close();
  }
}
