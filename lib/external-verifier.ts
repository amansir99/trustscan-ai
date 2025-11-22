/**
 * External Source Verifier
 * Verifies team members, GitHub repos, and other external claims
 */

import * as cheerio from 'cheerio';

export interface LinkedInProfile {
  url: string;
  name: string;
  headline?: string;
  verified: boolean;
  exists: boolean;
  error?: string;
}

export interface GitHubProfile {
  url: string;
  username: string;
  exists: boolean;
  publicRepos: number;
  followers: number;
  contributions: number;
  recentActivity: boolean;
  verified: boolean;
  error?: string;
}

export interface GitHubRepo {
  url: string;
  name: string;
  exists: boolean;
  stars: number;
  forks: number;
  lastCommit?: Date;
  isActive: boolean;
  verified: boolean;
  error?: string;
}

export interface ExternalVerificationResult {
  linkedInProfiles: LinkedInProfile[];
  gitHubProfiles: GitHubProfile[];
  gitHubRepos: GitHubRepo[];
  verifiedTeamMembers: number;
  verifiedRepos: number;
  overallTrustScore: number;
}

export class ExternalVerifier {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  /**
   * Verifies all external sources (LinkedIn, GitHub, etc.)
   */
  async verifyExternalSources(
    linkedInUrls: string[],
    gitHubUrls: string[],
    gitHubRepoUrls: string[]
  ): Promise<ExternalVerificationResult> {
    console.log('🔍 Starting external source verification...');
    
    const result: ExternalVerificationResult = {
      linkedInProfiles: [],
      gitHubProfiles: [],
      gitHubRepos: [],
      verifiedTeamMembers: 0,
      verifiedRepos: 0,
      overallTrustScore: 0
    };

    // Verify LinkedIn profiles
    for (const url of linkedInUrls.slice(0, 10)) {
      try {
        const profile = await this.verifyLinkedInProfile(url);
        result.linkedInProfiles.push(profile);
        if (profile.verified) result.verifiedTeamMembers++;
      } catch (error) {
        console.warn(`Failed to verify LinkedIn: ${url}`, error);
      }
    }

    // Verify GitHub profiles
    for (const url of gitHubUrls.slice(0, 10)) {
      try {
        const profile = await this.verifyGitHubProfile(url);
        result.gitHubProfiles.push(profile);
        if (profile.verified) result.verifiedTeamMembers++;
      } catch (error) {
        console.warn(`Failed to verify GitHub profile: ${url}`, error);
      }
    }

    // Verify GitHub repositories
    for (const url of gitHubRepoUrls.slice(0, 10)) {
      try {
        const repo = await this.verifyGitHubRepo(url);
        result.gitHubRepos.push(repo);
        if (repo.verified) result.verifiedRepos++;
      } catch (error) {
        console.warn(`Failed to verify GitHub repo: ${url}`, error);
      }
    }

    // Calculate overall trust score
    result.overallTrustScore = this.calculateTrustScore(result);

    console.log(`✅ External verification complete: ${result.verifiedTeamMembers} team members, ${result.verifiedRepos} repos verified`);
    
    return result;
  }

  /**
   * Verifies a LinkedIn profile exists and extracts basic info
   */
  private async verifyLinkedInProfile(url: string): Promise<LinkedInProfile> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: AbortSignal.timeout(10000)
      });

      const exists = response.ok;
      const html = exists ? await response.text() : '';
      const $ = cheerio.load(html);

      // Extract name from title or meta tags
      const title = $('title').text();
      const name = title.split('|')[0].trim() || title.split('-')[0].trim();
      
      // Extract headline
      const headline = $('meta[property="og:description"]').attr('content') || 
                      $('meta[name="description"]').attr('content') || '';

      return {
        url,
        name,
        headline: headline.slice(0, 200),
        verified: exists && name.length > 0,
        exists
      };
    } catch (error) {
      return {
        url,
        name: '',
        verified: false,
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verifies a GitHub profile using GitHub API
   */
  private async verifyGitHubProfile(url: string): Promise<GitHubProfile> {
    try {
      // Extract username from URL
      const match = url.match(/github\.com\/([^\/]+)/);
      if (!match) {
        throw new Error('Invalid GitHub URL');
      }
      const username = match[1];

      // Use GitHub API (no auth required for public data)
      const apiUrl = `https://api.github.com/users/${username}`;
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/vnd.github.v3+json'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        return {
          url,
          username,
          exists: false,
          publicRepos: 0,
          followers: 0,
          contributions: 0,
          recentActivity: false,
          verified: false,
          error: `HTTP ${response.status}`
        };
      }

      const data = await response.json();

      // Check for recent activity (updated_at within last 6 months)
      const lastUpdate = new Date(data.updated_at);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const recentActivity = lastUpdate > sixMonthsAgo;

      return {
        url,
        username,
        exists: true,
        publicRepos: data.public_repos || 0,
        followers: data.followers || 0,
        contributions: 0, // Would need GitHub GraphQL API for this
        recentActivity,
        verified: true
      };
    } catch (error) {
      return {
        url,
        username: '',
        exists: false,
        publicRepos: 0,
        followers: 0,
        contributions: 0,
        recentActivity: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verifies a GitHub repository using GitHub API
   */
  private async verifyGitHubRepo(url: string): Promise<GitHubRepo> {
    try {
      // Extract owner and repo from URL
      const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        throw new Error('Invalid GitHub repo URL');
      }
      const [, owner, repo] = match;
      const repoName = repo.replace(/\.git$/, '');

      // Use GitHub API
      const apiUrl = `https://api.github.com/repos/${owner}/${repoName}`;
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/vnd.github.v3+json'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        return {
          url,
          name: repoName,
          exists: false,
          stars: 0,
          forks: 0,
          isActive: false,
          verified: false,
          error: `HTTP ${response.status}`
        };
      }

      const data = await response.json();

      // Check if repo is active (pushed within last 3 months)
      const lastPush = new Date(data.pushed_at);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const isActive = lastPush > threeMonthsAgo;

      return {
        url,
        name: data.name,
        exists: true,
        stars: data.stargazers_count || 0,
        forks: data.forks_count || 0,
        lastCommit: new Date(data.pushed_at),
        isActive,
        verified: true
      };
    } catch (error) {
      return {
        url,
        name: '',
        exists: false,
        stars: 0,
        forks: 0,
        isActive: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Calculates overall trust score based on verification results
   */
  private calculateTrustScore(result: ExternalVerificationResult): number {
    let score = 0;
    let maxScore = 0;

    // LinkedIn profiles (40 points max)
    maxScore += 40;
    if (result.linkedInProfiles.length > 0) {
      const verifiedRatio = result.verifiedTeamMembers / result.linkedInProfiles.length;
      score += verifiedRatio * 40;
    }

    // GitHub profiles (30 points max)
    maxScore += 30;
    if (result.gitHubProfiles.length > 0) {
      const activeProfiles = result.gitHubProfiles.filter(p => p.recentActivity).length;
      const activeRatio = activeProfiles / result.gitHubProfiles.length;
      score += activeRatio * 30;
    }

    // GitHub repos (30 points max)
    maxScore += 30;
    if (result.gitHubRepos.length > 0) {
      const activeRepos = result.gitHubRepos.filter(r => r.isActive).length;
      const activeRatio = activeRepos / result.gitHubRepos.length;
      score += activeRatio * 30;
    }

    return Math.round((score / maxScore) * 100) || 0;
  }

  /**
   * Generates a human-readable verification summary
   */
  generateVerificationSummary(result: ExternalVerificationResult): string {
    const lines: string[] = [];

    lines.push('EXTERNAL SOURCE VERIFICATION:');
    lines.push('');

    // LinkedIn summary
    if (result.linkedInProfiles.length > 0) {
      lines.push(`LinkedIn Profiles: ${result.verifiedTeamMembers}/${result.linkedInProfiles.length} verified`);
      result.linkedInProfiles.forEach(profile => {
        if (profile.verified) {
          lines.push(`  ✅ ${profile.name} - ${profile.headline || 'Profile exists'}`);
        } else {
          lines.push(`  ❌ ${profile.url} - Not found or inaccessible`);
        }
      });
      lines.push('');
    }

    // GitHub profiles summary
    if (result.gitHubProfiles.length > 0) {
      lines.push(`GitHub Profiles: ${result.gitHubProfiles.filter(p => p.verified).length}/${result.gitHubProfiles.length} verified`);
      result.gitHubProfiles.forEach(profile => {
        if (profile.verified) {
          lines.push(`  ✅ ${profile.username} - ${profile.publicRepos} repos, ${profile.followers} followers${profile.recentActivity ? ' (Active)' : ' (Inactive)'}`);
        } else {
          lines.push(`  ❌ ${profile.url} - Not found`);
        }
      });
      lines.push('');
    }

    // GitHub repos summary
    if (result.gitHubRepos.length > 0) {
      lines.push(`GitHub Repositories: ${result.verifiedRepos}/${result.gitHubRepos.length} verified`);
      result.gitHubRepos.forEach(repo => {
        if (repo.verified) {
          lines.push(`  ✅ ${repo.name} - ${repo.stars} stars, ${repo.forks} forks${repo.isActive ? ' (Active)' : ' (Inactive)'}`);
        } else {
          lines.push(`  ❌ ${repo.url} - Not found`);
        }
      });
      lines.push('');
    }

    lines.push(`Overall Verification Score: ${result.overallTrustScore}/100`);

    return lines.join('\n');
  }
}
