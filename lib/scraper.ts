import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { getConfig } from './config';
import { ContentValidator, ContentValidationResult } from './content-validator';
import { ExtractionErrorHandler, ExtractionErrorType, ExtractionError } from './extraction-errors';
import { ExternalVerifier, ExternalVerificationResult } from './external-verifier';
import { SocialMediaCrawler, SocialMediaData } from './social-media-crawler';

const config = getConfig();

interface ScrapingConfig {
  timeout: number;
  waitUntil: 'networkidle0' | 'domcontentloaded' | 'load';
  userAgent: string;
  viewport: { width: number; height: number };
  maxRetries: number;
  retryDelay: number;
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
  contentLength: number;
  extractionMethod: 'primary' | 'fallback' | 'minimal';
  validation?: ContentValidationResult;
  errors?: ExtractionError[];
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
  externalVerification?: ExternalVerificationResult;
  // Social media data
  socialMediaData?: SocialMediaData;
}

const DEFAULT_CONFIG: ScrapingConfig = {
  timeout: 30000,
  waitUntil: 'networkidle0',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  viewport: { width: 1920, height: 1080 },
  maxRetries: 3,
  retryDelay: 2000
};

const FALLBACK_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
];

const CONTENT_SELECTORS = {
  title: ['title', 'h1', '[class*="title"]', '[class*="heading"]'],
  description: ['meta[name="description"]', '[class*="description"]', '[class*="intro"]', 'p:first-of-type'],
  documentation: [
    '[class*="doc"]', '[class*="guide"]', '[class*="whitepaper"]', 
    'main', 'article', '[role="main"]', '.content', '#content',
    '[class*="readme"]', '[class*="overview"]'
  ],
  team: [
    '[class*="team"]', '[class*="about"]', '[class*="founder"]', 
    '[class*="member"]', '[class*="leadership"]', '[class*="core"]',
    '[class*="advisor"]', '[class*="developer"]'
  ],
  tokenomics: [
    '[class*="token"]', '[class*="economic"]', '[class*="supply"]',
    '[class*="distribution"]', '[class*="allocation"]', '[class*="reward"]',
    '[class*="staking"]', '[class*="yield"]'
  ],
  security: [
    '[class*="audit"]', '[class*="security"]', '[class*="safe"]',
    '[class*="bug"]', '[class*="bounty"]', '[class*="risk"]',
    '[class*="insurance"]', '[class*="verify"]'
  ],
  social: [
    'a[href*="twitter.com"]', 'a[href*="x.com"]', 'a[href*="discord"]', 
    'a[href*="telegram"]', 'a[href*="github"]', 'a[href*="medium"]',
    'a[href*="linkedin"]', 'a[href*="reddit"]'
  ],
  code: [
    'a[href*="github.com"]', 'a[href*="gitlab.com"]', 'a[href*="bitbucket"]',
    '[class*="code"]', '[class*="repo"]', '[class*="source"]'
  ]
};

export class ContentExtractionService {
  private browser: Browser | null = null;
  private config: ScrapingConfig;

  constructor(customConfig?: Partial<ScrapingConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...customConfig };
  }

  async extractWebsiteContent(url: string): Promise<ExtractedContent> {
    // Validate URL first
    if (!this.isValidUrl(url)) {
      throw ExtractionErrorHandler.createError(
        ExtractionErrorType.INVALID_URL,
        `Invalid URL format: ${url}`,
        undefined,
        url
      );
    }

    let attempt = 0;
    const errors: ExtractionError[] = [];
    let lastError: ExtractionError | null = null;

    while (attempt < this.config.maxRetries) {
      try {
        const content = await this.extractWithFallback(url, attempt);
        
        // Validate extracted content
        const validation = ContentValidator.validateContent(content);
        content.validation = validation;
        content.errors = errors;

        // Accept all content regardless of validation score
        // The AI analyzer will work with whatever content is available
        console.log(`✅ Content extracted. Quality: ${validation.quality}, Score: ${validation.score}`);
        return content;

      } catch (error) {
        const extractionError = error instanceof Error 
          ? ExtractionErrorHandler.classifyError(error, url)
          : error as ExtractionError;
        
        errors.push(extractionError);
        lastError = extractionError;
        
        ExtractionErrorHandler.logError(extractionError);
        
        // Check if we should retry
        if (ExtractionErrorHandler.shouldRetry(extractionError, attempt + 1, this.config.maxRetries)) {
          const delay = ExtractionErrorHandler.getRetryDelay(extractionError, attempt + 1);
          console.warn(`Extraction attempt ${attempt + 1} failed for ${url}, retrying in ${delay}ms...`);
          await this.delay(delay);
        } else {
          break;
        }
      }
      
      attempt++;
    }

    // All attempts failed, throw the last error
    if (lastError) {
      throw lastError;
    } else {
      throw ExtractionErrorHandler.createError(
        ExtractionErrorType.UNKNOWN_ERROR,
        `Failed to extract content after ${this.config.maxRetries} attempts`,
        undefined,
        url
      );
    }
  }

  async extractWithFallback(url: string, attempt: number = 0): Promise<ExtractedContent> {
    try {
      // Try primary extraction method
      return await this.extractStructuredContent(url, 'primary', attempt);
    } catch (error) {
      console.warn(`Primary extraction failed for ${url}, trying fallback method...`);
      
      try {
        // Try fallback with different settings
        return await this.extractStructuredContent(url, 'fallback', attempt);
      } catch (fallbackError) {
        console.warn(`Fallback extraction failed for ${url}, using minimal extraction...`);
        
        try {
          // Last resort: minimal extraction
          return await this.extractMinimalContent(url);
        } catch (minimalError) {
          // If even minimal extraction fails, classify and throw the most relevant error
          const primaryError = ExtractionErrorHandler.classifyError(error as Error, url);
          const fallbackErr = ExtractionErrorHandler.classifyError(fallbackError as Error, url);
          
          // Throw the more specific error (not network-related if possible)
          if (primaryError.type !== ExtractionErrorType.NETWORK_ERROR) {
            throw primaryError;
          } else if (fallbackErr.type !== ExtractionErrorType.NETWORK_ERROR) {
            throw fallbackErr;
          } else {
            throw primaryError; // Both are network errors, throw the first one
          }
        }
      }
    }
  }

  private async extractStructuredContent(
    url: string, 
    method: 'primary' | 'fallback', 
    attempt: number
  ): Promise<ExtractedContent> {
    const page = await this.getPage(method, attempt);
    
    try {
      // Navigate to the page
      await this.navigateToPage(page, url, method);
      
      // Handle potential anti-bot measures
      await this.handleAntiBot(page);
      
      // Wait for dynamic content to load
      await this.waitForContent(page, method);
      
      // Extract content
      const html = await page.content();
      const $ = cheerio.load(html);
      
      // Parse main content
      const content = this.parseContent($, url, method);
      
      // ENHANCED: Perform deep crawl for critical DeFi information
      if (method === 'primary') {
        try {
          console.log('🔍 Starting deep crawl for additional DeFi information...');
          const deepCrawlData = await this.performDeepCrawl(page, url, $);
          content.deepCrawlData = deepCrawlData;
          
          // Enhance main content with deep crawl findings
          if (deepCrawlData.teamMembers.length > 0) {
            const teamText = deepCrawlData.teamMembers
              .map(m => `${m.name}${m.role ? ` (${m.role})` : ''}${m.linkedin ? ` - LinkedIn: ${m.linkedin}` : ''}`)
              .join('; ');
            content.teamInfo += `\n\nTeam Members Found: ${teamText}`;
          }
          
          if (deepCrawlData.bugBountyFound) {
            content.securityInfo += `\n\nBug Bounty Program: ${deepCrawlData.bugBountyDetails}`;
          }
          
          if (deepCrawlData.governanceFound) {
            content.teamInfo += `\n\nDAO Governance: ${deepCrawlData.governanceDetails}`;
          }
          
          console.log(`✅ Deep crawl complete: ${deepCrawlData.crawledPages.length} pages analyzed`);
          
          // CRITICAL: Verify external sources (LinkedIn, GitHub, etc.)
          try {
            console.log('🔐 Starting external source verification...');
            const externalVerifier = new ExternalVerifier();
            
            // Collect all LinkedIn and GitHub URLs
            const linkedInUrls = deepCrawlData.teamMembers
              .map(m => m.linkedin)
              .filter((url): url is string => !!url);
            
            const gitHubProfileUrls = content.socialLinks
              .filter(url => url.includes('github.com') && !url.includes('/repos/'));
            
            const gitHubRepoUrls = content.codeRepositories
              .filter(url => url.includes('github.com'));
            
            // Verify all external sources
            const externalVerification = await externalVerifier.verifyExternalSources(
              linkedInUrls,
              gitHubProfileUrls,
              gitHubRepoUrls
            );
            
            content.externalVerification = externalVerification;
            
            // Add verification summary to content
            const verificationSummary = externalVerifier.generateVerificationSummary(externalVerification);
            content.teamInfo += `\n\n${verificationSummary}`;
            
            console.log(`✅ External verification complete: ${externalVerification.verifiedTeamMembers} team members verified, ${externalVerification.verifiedRepos} repos verified`);
          } catch (verificationError) {
            console.warn('⚠️ External verification failed, continuing without it:', verificationError);
            // Don't fail if external verification fails
          }
          
          // CRITICAL: Crawl social media for community engagement data
          try {
            console.log('🌐 Starting social media crawl...');
            const socialMediaCrawler = new SocialMediaCrawler();
            
            // Crawl all social media links
            const socialMediaData = await socialMediaCrawler.crawlSocialMedia(content.socialLinks);
            content.socialMediaData = socialMediaData;
            
            // Add social media summary to content
            const socialSummary = socialMediaCrawler.generateSummary(socialMediaData);
            content.mainContent += `\n\n${socialSummary}`;
            
            console.log(`✅ Social media crawl complete: ${socialMediaData.activeChannels} channels, ${socialMediaData.totalFollowers + socialMediaData.totalMembers} total community`);
          } catch (socialError) {
            console.warn('⚠️ Social media crawl failed, continuing without it:', socialError);
            // Don't fail if social media crawl fails
          }
        } catch (deepCrawlError) {
          console.warn('⚠️ Deep crawl failed, continuing with main content:', deepCrawlError);
          // Don't fail the entire extraction if deep crawl fails
        }
      }
      
      return content;
      
    } finally {
      await page.close();
    }
  }

  /**
   * Performs deep crawl to find team pages, bug bounty, governance, and documentation
   */
  private async performDeepCrawl(page: Page, baseUrl: string, $: cheerio.CheerioAPI): Promise<{
    teamPageFound: boolean;
    teamMembers: Array<{ name: string; role?: string; linkedin?: string }>;
    bugBountyFound: boolean;
    bugBountyDetails: string;
    governanceFound: boolean;
    governanceDetails: string;
    documentationLinks: string[];
    crawledPages: string[];
  }> {
    const result = {
      teamPageFound: false,
      teamMembers: [] as Array<{ name: string; role?: string; linkedin?: string }>,
      bugBountyFound: false,
      bugBountyDetails: '',
      governanceFound: false,
      governanceDetails: '',
      documentationLinks: [] as string[],
      crawledPages: [] as string[]
    };

    // FIRST: Check main page for team/security/governance info
    console.log('🔍 Checking main page for team/security/governance info...');
    const mainPageTeam = this.extractTeamInfo($);
    if (mainPageTeam.members.length > 0) {
      result.teamPageFound = true;
      result.teamMembers.push(...mainPageTeam.members);
      console.log(`  👥 Found ${mainPageTeam.members.length} team members on main page`);
    }
    
    const mainPageSecurity = this.extractSecurityInfo($);
    if (mainPageSecurity.hasBugBounty) {
      result.bugBountyFound = true;
      result.bugBountyDetails = mainPageSecurity.bugBountyDetails;
      console.log(`  🔒 Found bug bounty info on main page`);
    }
    
    const mainPageGov = this.extractGovernanceInfo($);
    if (mainPageGov.hasGovernance) {
      result.governanceFound = true;
      result.governanceDetails = mainPageGov.details;
      console.log(`  🗳️  Found governance info on main page`);
    }

    // Discover important links from main page
    const importantLinks = this.discoverImportantLinks($, baseUrl);
    console.log(`📋 Found ${importantLinks.length} important links to crawl`);

    // Crawl each important page (limit to 10 to be more thorough)
    const linksToCrawl = importantLinks.slice(0, 10);
    
    for (const link of linksToCrawl) {
      try {
        console.log(`  🔗 Crawling: ${link.url}`);
        const response = await page.goto(link.url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        
        // Check if page exists (not 404)
        if (!response || response.status() === 404) {
          console.log(`  ❌ Page not found (404): ${link.url}`);
          continue;
        }
        
        if (response.status() >= 400) {
          console.log(`  ❌ HTTP ${response.status()}: ${link.url}`);
          continue;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Brief wait
        
        const pageHtml = await page.content();
        const page$ = cheerio.load(pageHtml);
        
        result.crawledPages.push(link.url);
        console.log(`  ✅ Successfully crawled: ${link.url}`);
        
        // Extract information based on page type
        if (link.type === 'team') {
          const teamData = this.extractTeamInfo(page$);
          if (teamData.members.length > 0) {
            result.teamPageFound = true;
            result.teamMembers.push(...teamData.members);
            console.log(`  👥 Found ${teamData.members.length} team members`);
          }
        } else if (link.type === 'security') {
          const securityData = this.extractSecurityInfo(page$);
          if (securityData.hasBugBounty) {
            result.bugBountyFound = true;
            result.bugBountyDetails = securityData.bugBountyDetails;
            console.log(`  🔒 Found bug bounty program`);
          }
        } else if (link.type === 'governance') {
          const govData = this.extractGovernanceInfo(page$);
          if (govData.hasGovernance) {
            result.governanceFound = true;
            result.governanceDetails = govData.details;
            console.log(`  🗳️  Found governance system`);
          }
        } else if (link.type === 'docs') {
          result.documentationLinks.push(link.url);
          console.log(`  📚 Found documentation page`);
        }
      } catch (error) {
        console.warn(`  ⚠️ Failed to crawl ${link.url}:`, error instanceof Error ? error.message : error);
        // Continue with other links
      }
    }

    return result;
  }

  /**
   * Discovers important links from the main page
   */
  private discoverImportantLinks($: cheerio.CheerioAPI, baseUrl: string): Array<{ url: string; type: 'team' | 'security' | 'governance' | 'docs' }> {
    const links: Array<{ url: string; type: 'team' | 'security' | 'governance' | 'docs' }> = [];
    const baseUrlObj = new URL(baseUrl);
    const seenUrls = new Set<string>();

    // Team page patterns - MORE AGGRESSIVE
    const teamPatterns = [
      /\/team/i, /\/about/i, /\/contributors/i, /\/people/i, /\/founders/i, /\/leadership/i,
      /team/i, /about/i, /contributor/i, /founder/i, /member/i, /staff/i, /core/i
    ];
    
    // Security/Bug bounty patterns - MORE AGGRESSIVE
    const securityPatterns = [
      /\/security/i, /\/bug-bounty/i, /\/responsible-disclosure/i, /\/audits/i, /\/safety/i,
      /security/i, /bug/i, /bounty/i, /audit/i, /safe/i, /disclosure/i
    ];
    
    // Governance patterns - MORE AGGRESSIVE
    const governancePatterns = [
      /\/governance/i, /\/dao/i, /\/vote/i, /\/proposals/i, /\/forum/i,
      /governance/i, /dao/i, /vote/i, /proposal/i, /govern/i, /community/i
    ];
    
    // Documentation patterns - MORE AGGRESSIVE
    const docsPatterns = [
      /\/docs/i, /\/documentation/i, /\/whitepaper/i, /\/guide/i, /\/wiki/i,
      /docs/i, /documentation/i, /whitepaper/i, /guide/i, /help/i, /faq/i, /learn/i
    ];

    console.log(`🔍 Scanning for important links on ${baseUrl}...`);

    // Extract all links
    let totalLinks = 0;
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;
      totalLinks++;

      try {
        // Resolve relative URLs
        const fullUrl = new URL(href, baseUrl);
        
        // Allow same domain AND common subdomains (docs.example.com)
        const isSameDomain = fullUrl.hostname === baseUrlObj.hostname ||
                            fullUrl.hostname.endsWith(`.${baseUrlObj.hostname}`) ||
                            baseUrlObj.hostname.endsWith(`.${fullUrl.hostname}`);
        
        if (!isSameDomain) return;
        
        // Avoid duplicates
        const urlKey = fullUrl.pathname;
        if (seenUrls.has(urlKey)) return;
        seenUrls.add(urlKey);

        const urlStr = fullUrl.toString();
        const text = $(element).text().toLowerCase();
        const combined = urlStr + ' ' + text;

        // Categorize link
        if (teamPatterns.some(p => p.test(combined))) {
          links.push({ url: urlStr, type: 'team' });
          console.log(`  📋 Found team link: ${urlStr}`);
        } else if (securityPatterns.some(p => p.test(combined))) {
          links.push({ url: urlStr, type: 'security' });
          console.log(`  🔒 Found security link: ${urlStr}`);
        } else if (governancePatterns.some(p => p.test(combined))) {
          links.push({ url: urlStr, type: 'governance' });
          console.log(`  🗳️  Found governance link: ${urlStr}`);
        } else if (docsPatterns.some(p => p.test(combined))) {
          links.push({ url: urlStr, type: 'docs' });
          console.log(`  📚 Found docs link: ${urlStr}`);
        }
      } catch (error) {
        // Invalid URL, skip
      }
    });

    console.log(`📊 Scanned ${totalLinks} total links, found ${links.length} important links`);

    // If no links found, try common URL patterns
    if (links.length === 0) {
      console.log('⚠️  No links found via scraping, trying common URL patterns...');
      const commonPaths = [
        { path: '/team', type: 'team' as const },
        { path: '/about', type: 'team' as const },
        { path: '/contributors', type: 'team' as const },
        { path: '/security', type: 'security' as const },
        { path: '/bug-bounty', type: 'security' as const },
        { path: '/audits', type: 'security' as const },
        { path: '/governance', type: 'governance' as const },
        { path: '/dao', type: 'governance' as const },
        { path: '/vote', type: 'governance' as const },
        { path: '/docs', type: 'docs' as const },
        { path: '/documentation', type: 'docs' as const }
      ];

      for (const { path, type } of commonPaths) {
        const url = `${baseUrlObj.protocol}//${baseUrlObj.hostname}${path}`;
        links.push({ url, type });
        console.log(`  🔗 Trying common path: ${url}`);
      }
    }

    // Prioritize: team > security > governance > docs
    return [
      ...links.filter(l => l.type === 'team'),
      ...links.filter(l => l.type === 'security'),
      ...links.filter(l => l.type === 'governance'),
      ...links.filter(l => l.type === 'docs')
    ];
  }

  /**
   * Extracts team information from a page - AGGRESSIVE EXTRACTION
   */
  private extractTeamInfo($: cheerio.CheerioAPI): { members: Array<{ name: string; role?: string; linkedin?: string }> } {
    const members: Array<{ name: string; role?: string; linkedin?: string }> = [];
    const seenNames = new Set<string>();
    
    // Look for team member cards/sections
    const teamSelectors = [
      '[class*="team-member"]', '[class*="member-card"]', '[class*="person"]',
      '[class*="founder"]', '[class*="contributor"]', '[class*="staff"]',
      '[class*="team"]', '[class*="about"]', '[class*="core"]'
    ];

    teamSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const $el = $(element);
        
        // Extract name
        const name = $el.find('[class*="name"], h2, h3, h4, h5, strong, b').first().text().trim();
        
        // Extract role/title
        const role = $el.find('[class*="role"], [class*="title"], [class*="position"], p, span').first().text().trim();
        
        // Extract LinkedIn
        const linkedinLink = $el.find('a[href*="linkedin.com"]').attr('href');
        
        if (name && name.length > 2 && name.length < 100 && !seenNames.has(name.toLowerCase())) {
          seenNames.add(name.toLowerCase());
          members.push({
            name,
            role: role && role.length < 200 && role !== name ? role : undefined,
            linkedin: linkedinLink
          });
        }
      });
    });

    // Check for simple lists under team headings
    if (members.length === 0) {
      $('h1, h2, h3, h4').each((_, heading) => {
        const headingText = $(heading).text().toLowerCase();
        if (headingText.includes('team') || headingText.includes('founder') || 
            headingText.includes('contributor') || headingText.includes('about') ||
            headingText.includes('core') || headingText.includes('leadership')) {
          // Get next sibling elements
          $(heading).nextAll().slice(0, 15).each((_, sibling) => {
            const text = $(sibling).text().trim();
            const linkedinLink = $(sibling).find('a[href*="linkedin.com"]').attr('href');
            
            if (text && text.length > 2 && text.length < 200) {
              // Try to parse "Name - Role" format
              const parts = text.split(/[-–—|]/);
              if (parts.length >= 2) {
                const name = parts[0].trim();
                if (!seenNames.has(name.toLowerCase())) {
                  seenNames.add(name.toLowerCase());
                  members.push({
                    name,
                    role: parts[1].trim(),
                    linkedin: linkedinLink
                  });
                }
              } else if (text.length < 100 && !seenNames.has(text.toLowerCase())) {
                seenNames.add(text.toLowerCase());
                members.push({
                  name: text,
                  linkedin: linkedinLink
                });
              }
            }
          });
        }
      });
    }

    // Look for LinkedIn links anywhere on the page
    if (members.length === 0) {
      $('a[href*="linkedin.com/in/"]').each((_, element) => {
        const $el = $(element);
        const linkedinLink = $el.attr('href');
        const text = $el.text().trim() || $el.closest('div, section').find('h1, h2, h3, h4, strong').first().text().trim();
        
        if (text && text.length > 2 && text.length < 100 && !seenNames.has(text.toLowerCase())) {
          seenNames.add(text.toLowerCase());
          members.push({
            name: text,
            linkedin: linkedinLink
          });
        }
      });
    }

    return { members: members.slice(0, 20) }; // Limit to 20 members
  }

  /**
   * Extracts security/bug bounty information
   */
  private extractSecurityInfo($: cheerio.CheerioAPI): { hasBugBounty: boolean; bugBountyDetails: string } {
    const pageText = $('body').text().toLowerCase();
    
    // Check for bug bounty indicators
    const hasBugBounty = pageText.includes('bug bounty') || 
                         pageText.includes('responsible disclosure') ||
                         pageText.includes('security reward') ||
                         pageText.includes('vulnerability report');

    let details = '';
    if (hasBugBounty) {
      // Extract relevant paragraphs
      $('p, div, section').each((_, element) => {
        const text = $(element).text();
        if (text.toLowerCase().includes('bug bounty') || 
            text.toLowerCase().includes('responsible disclosure') ||
            text.toLowerCase().includes('security reward')) {
          details += text.trim() + ' ';
        }
      });
      details = details.slice(0, 500); // Limit length
    }

    return { hasBugBounty, bugBountyDetails: details.trim() };
  }

  /**
   * Extracts governance/DAO information
   */
  private extractGovernanceInfo($: cheerio.CheerioAPI): { hasGovernance: boolean; details: string } {
    const pageText = $('body').text().toLowerCase();
    
    // Check for governance indicators
    const hasGovernance = pageText.includes('governance') || 
                          pageText.includes('dao') ||
                          pageText.includes('voting') ||
                          pageText.includes('proposal') ||
                          pageText.includes('token holder');

    let details = '';
    if (hasGovernance) {
      // Extract relevant sections
      $('p, div, section, article').each((_, element) => {
        const text = $(element).text();
        if (text.toLowerCase().includes('governance') || 
            text.toLowerCase().includes('dao') ||
            text.toLowerCase().includes('voting power') ||
            text.toLowerCase().includes('proposal')) {
          details += text.trim() + ' ';
        }
      });
      details = details.slice(0, 500); // Limit length
    }

    return { hasGovernance, details: details.trim() };
  }

  private async extractMinimalContent(url: string): Promise<ExtractedContent> {
    // Fallback to basic HTTP request if Puppeteer fails completely
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 403) {
          throw ExtractionErrorHandler.createError(
            ExtractionErrorType.ACCESS_DENIED,
            `HTTP 403: Access forbidden`,
            undefined,
            url
          );
        } else if (response.status === 429) {
          throw ExtractionErrorHandler.createError(
            ExtractionErrorType.RATE_LIMITED,
            `HTTP 429: Too many requests`,
            undefined,
            url
          );
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const html = await response.text();
      
      if (html.length < 100) {
        throw ExtractionErrorHandler.createError(
          ExtractionErrorType.CONTENT_TOO_SMALL,
          'Received minimal HTML content',
          undefined,
          url
        );
      }

      const $ = cheerio.load(html);
      return this.parseContent($, url, 'minimal');
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw ExtractionErrorHandler.createError(
          ExtractionErrorType.TIMEOUT_ERROR,
          'Request timed out during minimal extraction',
          error as Error,
          url
        );
      }
      
      // If it's already an ExtractionError, re-throw it
      if (error && typeof error === 'object' && 'type' in error) {
        throw error;
      }
      
      // For any other error, classify it
      throw ExtractionErrorHandler.classifyError(error as Error, url);
    }
  }

  private async getPage(method: 'primary' | 'fallback', attempt: number): Promise<Page> {
    if (!this.browser) {
      this.browser = await this.launchBrowser(method);
    }

    const page = await this.browser.newPage();
    
    // Configure page based on method and attempt
    const userAgent = method === 'fallback' ? this.getRandomUserAgent() : this.config.userAgent;
    await page.setUserAgent(userAgent);
    await page.setViewport(this.config.viewport);
    
    // Set additional headers to appear more human-like
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    });

    return page;
  }

  private async launchBrowser(method: 'primary' | 'fallback'): Promise<Browser> {
    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ];

    if (method === 'fallback') {
      // More stealth options for fallback
      args.push(
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--disable-extensions'
      );
    }

    return await puppeteer.launch({
      headless: true,
      args,
      timeout: 30000
    });
  }

  private async navigateToPage(page: Page, url: string, method: 'primary' | 'fallback'): Promise<void> {
    const waitUntil = method === 'primary' ? 'networkidle0' : 'domcontentloaded';
    const timeout = method === 'primary' ? this.config.timeout : 15000;

    await page.goto(url, { 
      waitUntil, 
      timeout 
    });
  }

  private async handleAntiBot(page: Page): Promise<void> {
    try {
      // Check for common anti-bot indicators
      const indicators = await page.evaluate(() => {
        const body = document.body;
        if (!body) return { blocked: false };

        const text = body.innerText.toLowerCase();
        const blocked = text.includes('cloudflare') || 
                       text.includes('checking your browser') ||
                       text.includes('ddos protection') ||
                       text.includes('access denied') ||
                       text.includes('bot detected');

        return { blocked, text: text.substring(0, 500) };
      });

      if (indicators.blocked) {
        console.log('Anti-bot protection detected, waiting...');
        
        // Wait for potential redirect or challenge completion
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Try to click through any challenge buttons
        const challengeSelectors = [
          'input[type="checkbox"]',
          'button[type="submit"]',
          '.cf-browser-verification',
          '#challenge-form button'
        ];

        for (const selector of challengeSelectors) {
          try {
            await page.click(selector);
            await new Promise(resolve => setTimeout(resolve, 3000));
            break;
          } catch {
            // Continue to next selector
          }
        }
      }
    } catch (error) {
      console.warn('Anti-bot handling failed:', error instanceof Error ? error.message : error);
      // Continue anyway
    }
  }

  private async waitForContent(page: Page, method: 'primary' | 'fallback'): Promise<void> {
    if (method === 'primary') {
      // Wait for dynamic content to load
      try {
        await page.waitForFunction(
          () => document.body && document.body.innerText.length > 100,
          { timeout: 10000 }
        );
      } catch {
        // Continue if timeout
      }
    }

    // Additional wait for JavaScript-heavy sites
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  private parseContent($: cheerio.CheerioAPI, url: string, method: 'primary' | 'fallback' | 'minimal'): ExtractedContent {
    // Extract title
    const title = this.extractBySelectors($, CONTENT_SELECTORS.title).slice(0, 200) || 'No title found';
    
    // Extract description
    const description = this.extractBySelectors($, CONTENT_SELECTORS.description).slice(0, 500) || '';
    
    // Extract structured content
    const documentation = this.extractMultipleBySelectors($, CONTENT_SELECTORS.documentation);
    const teamInfo = this.extractBySelectors($, CONTENT_SELECTORS.team).slice(0, 2000);
    const tokenomics = this.extractBySelectors($, CONTENT_SELECTORS.tokenomics).slice(0, 2000);
    const securityInfo = this.extractBySelectors($, CONTENT_SELECTORS.security).slice(0, 2000);
    
    // Extract links
    const socialLinks = this.extractLinks($, CONTENT_SELECTORS.social);
    const codeRepositories = this.extractLinks($, CONTENT_SELECTORS.code);
    
    // Extract main content as fallback
    let mainContent = '';
    if (documentation.length === 0 || documentation.join('').length < 200) {
      mainContent = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000);
    } else {
      mainContent = documentation.join('\n\n').slice(0, 5000);
    }

    const totalContent = `${title} ${description} ${mainContent} ${teamInfo} ${tokenomics} ${securityInfo}`;

    return {
      url,
      title,
      description,
      mainContent,
      documentation,
      teamInfo,
      tokenomics,
      securityInfo,
      socialLinks,
      codeRepositories,
      extractedAt: new Date(),
      contentLength: totalContent.length,
      extractionMethod: method
    };
  }

  private extractBySelectors($: cheerio.CheerioAPI, selectors: string[]): string {
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text().trim();
        if (text.length > 10) {
          return text;
        }
      }
    }
    return '';
  }

  private extractMultipleBySelectors($: cheerio.CheerioAPI, selectors: string[]): string[] {
    const results: string[] = [];
    
    for (const selector of selectors) {
      $(selector).each((_, element) => {
        const text = $(element).text().trim();
        if (text.length > 50 && !results.some(existing => existing.includes(text.substring(0, 100)))) {
          results.push(text);
        }
      });
    }
    
    return results.slice(0, 10); // Limit to prevent excessive data
  }

  private extractLinks($: cheerio.CheerioAPI, selectors: string[]): string[] {
    const links: string[] = [];
    
    for (const selector of selectors) {
      $(selector).each((_, element) => {
        const href = $(element).attr('href');
        if (href && !links.includes(href)) {
          links.push(href);
        }
      });
    }
    
    return links.slice(0, 20); // Limit number of links
  }

  private getRandomUserAgent(): string {
    return FALLBACK_USER_AGENTS[Math.floor(Math.random() * FALLBACK_USER_AGENTS.length)];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Backward compatibility function
export async function scrapeWebsite(url: string): Promise<string> {
  const extractor = new ContentExtractionService();
  
  try {
    const content = await extractor.extractWebsiteContent(url);
    return `${content.title}\n${content.description}\n${content.mainContent}`.slice(0, 10000);
  } finally {
    await extractor.close();
  }
}