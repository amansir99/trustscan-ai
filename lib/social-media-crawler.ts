/**
 * Social Media Crawler
 * Extracts detailed information from social media platforms
 */

import * as cheerio from 'cheerio';

export interface TwitterProfile {
  url: string;
  username: string;
  exists: boolean;
  followers?: number;
  following?: number;
  tweets?: number;
  verified?: boolean;
  bio?: string;
  recentActivity?: boolean;
  error?: string;
}

export interface GitHubOrganization {
  url: string;
  name: string;
  exists: boolean;
  repositories?: number;
  members?: number;
  stars?: number;
  description?: string;
  verified?: boolean;
  error?: string;
}

export interface DiscordInvite {
  url: string;
  exists: boolean;
  serverName?: string;
  memberCount?: number;
  onlineCount?: number;
  verified?: boolean;
  error?: string;
}

export interface MediumProfile {
  url: string;
  exists: boolean;
  author?: string;
  followers?: number;
  articles?: number;
  recentActivity?: boolean;
  error?: string;
}

export interface RedditCommunity {
  url: string;
  exists: boolean;
  subreddit?: string;
  members?: number;
  online?: number;
  description?: string;
  recentActivity?: boolean;
  error?: string;
}

export interface TelegramChannel {
  url: string;
  exists: boolean;
  channelName?: string;
  members?: number;
  description?: string;
  error?: string;
}

export interface SocialMediaData {
  twitter?: TwitterProfile;
  github?: GitHubOrganization;
  discord?: DiscordInvite;
  medium?: MediumProfile;
  reddit?: RedditCommunity;
  telegram?: TelegramChannel;
  totalFollowers: number;
  totalMembers: number;
  activeChannels: number;
  verifiedChannels: number;
  communityScore: number;
}

export class SocialMediaCrawler {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  /**
   * Crawls all social media links and extracts detailed information
   */
  async crawlSocialMedia(socialLinks: string[]): Promise<SocialMediaData> {
    console.log('🌐 Starting social media crawl...');
    
    const result: SocialMediaData = {
      totalFollowers: 0,
      totalMembers: 0,
      activeChannels: 0,
      verifiedChannels: 0,
      communityScore: 0
    };

    // Categorize social links
    const twitterLinks = socialLinks.filter(url => url.includes('twitter.com') || url.includes('x.com'));
    const githubLinks = socialLinks.filter(url => url.includes('github.com') && !url.includes('/repos/'));
    const discordLinks = socialLinks.filter(url => url.includes('discord.gg') || url.includes('discord.com/invite'));
    const mediumLinks = socialLinks.filter(url => url.includes('medium.com'));
    const redditLinks = socialLinks.filter(url => url.includes('reddit.com/r/'));
    const telegramLinks = socialLinks.filter(url => url.includes('t.me') || url.includes('telegram.me'));

    // Crawl all platforms in PARALLEL for speed
    const crawlPromises: Promise<void>[] = [];

    // Crawl Twitter/X
    if (twitterLinks.length > 0) {
      crawlPromises.push(
        this.crawlTwitter(twitterLinks[0])
          .then(twitter => {
            result.twitter = twitter;
            if (twitter.exists) {
              result.activeChannels++;
              if (twitter.verified) result.verifiedChannels++;
              result.totalFollowers += twitter.followers || 0;
            }
          })
          .catch(error => console.warn('Failed to crawl Twitter:', error))
      );
    }

    // Crawl GitHub
    if (githubLinks.length > 0) {
      crawlPromises.push(
        this.crawlGitHub(githubLinks[0])
          .then(github => {
            result.github = github;
            if (github.exists) {
              result.activeChannels++;
              if (github.verified) result.verifiedChannels++;
              result.totalFollowers += github.stars || 0;
            }
          })
          .catch(error => console.warn('Failed to crawl GitHub:', error))
      );
    }

    // Crawl Discord
    if (discordLinks.length > 0) {
      crawlPromises.push(
        this.crawlDiscord(discordLinks[0])
          .then(discord => {
            result.discord = discord;
            if (discord.exists) {
              result.activeChannels++;
              if (discord.verified) result.verifiedChannels++;
              result.totalMembers += discord.memberCount || 0;
            }
          })
          .catch(error => console.warn('Failed to crawl Discord:', error))
      );
    }

    // Crawl Medium
    if (mediumLinks.length > 0) {
      crawlPromises.push(
        this.crawlMedium(mediumLinks[0])
          .then(medium => {
            result.medium = medium;
            if (medium.exists) {
              result.activeChannels++;
              result.totalFollowers += medium.followers || 0;
            }
          })
          .catch(error => console.warn('Failed to crawl Medium:', error))
      );
    }

    // Crawl Reddit
    if (redditLinks.length > 0) {
      crawlPromises.push(
        this.crawlReddit(redditLinks[0])
          .then(reddit => {
            result.reddit = reddit;
            if (reddit.exists) {
              result.activeChannels++;
              result.totalMembers += reddit.members || 0;
            }
          })
          .catch(error => console.warn('Failed to crawl Reddit:', error))
      );
    }

    // Crawl Telegram
    if (telegramLinks.length > 0) {
      crawlPromises.push(
        this.crawlTelegram(telegramLinks[0])
          .then(telegram => {
            result.telegram = telegram;
            if (telegram.exists) {
              result.activeChannels++;
              result.totalMembers += telegram.members || 0;
            }
          })
          .catch(error => console.warn('Failed to crawl Telegram:', error))
      );
    }

    // Wait for all crawls to complete in parallel
    await Promise.all(crawlPromises);

    // Calculate community score
    result.communityScore = this.calculateCommunityScore(result);

    console.log(`✅ Social media crawl complete: ${result.activeChannels} active channels, ${result.totalFollowers + result.totalMembers} total community`);

    return result;
  }

  /**
   * Crawls Twitter/X profile
   */
  private async crawlTwitter(url: string): Promise<TwitterProfile> {
    try {
      // Extract username
      const match = url.match(/(?:twitter\.com|x\.com)\/([^\/\?]+)/);
      if (!match) throw new Error('Invalid Twitter URL');
      const username = match[1];

      console.log(`  🐦 Crawling Twitter: @${username}`);

      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        return {
          url,
          username,
          exists: false,
          error: `HTTP ${response.status}`
        };
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract metrics from meta tags and page content
      const followers = this.extractNumber(html, /(\d+(?:,\d+)*(?:\.\d+)?[KMB]?)\s*Followers/i);
      const following = this.extractNumber(html, /(\d+(?:,\d+)*(?:\.\d+)?[KMB]?)\s*Following/i);
      const tweets = this.extractNumber(html, /(\d+(?:,\d+)*(?:\.\d+)?[KMB]?)\s*(?:Tweets|Posts)/i);
      
      const bio = $('meta[property="og:description"]').attr('content') || 
                  $('meta[name="description"]').attr('content') || '';

      const verified = html.includes('Verified account') || html.includes('verified-badge');

      return {
        url,
        username,
        exists: true,
        followers,
        following,
        tweets,
        verified,
        bio: bio.slice(0, 200),
        recentActivity: true // Assume active if profile exists
      };
    } catch (error) {
      return {
        url,
        username: '',
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Crawls GitHub organization using API
   */
  private async crawlGitHub(url: string): Promise<GitHubOrganization> {
    try {
      // Extract org name
      const match = url.match(/github\.com\/([^\/\?]+)/);
      if (!match) throw new Error('Invalid GitHub URL');
      const orgName = match[1];

      console.log(`  🐙 Crawling GitHub: ${orgName}`);

      // Try organization API first
      let apiUrl = `https://api.github.com/orgs/${orgName}`;
      let response = await fetch(apiUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/vnd.github.v3+json'
        },
        signal: AbortSignal.timeout(10000)
      });

      // If not an org, try user API
      if (!response.ok) {
        apiUrl = `https://api.github.com/users/${orgName}`;
        response = await fetch(apiUrl, {
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'application/vnd.github.v3+json'
          },
          signal: AbortSignal.timeout(10000)
        });
      }

      if (!response.ok) {
        return {
          url,
          name: orgName,
          exists: false,
          error: `HTTP ${response.status}`
        };
      }

      const data = await response.json();

      // Get repositories count
      const reposUrl = data.repos_url;
      const reposResponse = await fetch(reposUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/vnd.github.v3+json'
        },
        signal: AbortSignal.timeout(10000)
      });

      let totalStars = 0;
      if (reposResponse.ok) {
        const repos = await reposResponse.json();
        totalStars = repos.reduce((sum: number, repo: any) => sum + (repo.stargazers_count || 0), 0);
      }

      return {
        url,
        name: data.name || data.login,
        exists: true,
        repositories: data.public_repos || 0,
        members: data.followers || 0,
        stars: totalStars,
        description: data.bio || data.description || '',
        verified: true
      };
    } catch (error) {
      return {
        url,
        name: '',
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Crawls Discord invite
   */
  private async crawlDiscord(url: string): Promise<DiscordInvite> {
    try {
      // Extract invite code
      const match = url.match(/(?:discord\.gg|discord\.com\/invite)\/([^\/\?]+)/);
      if (!match) throw new Error('Invalid Discord URL');
      const inviteCode = match[1];

      console.log(`  💬 Crawling Discord: ${inviteCode}`);

      // Use Discord API to get invite info
      const apiUrl = `https://discord.com/api/v10/invites/${inviteCode}?with_counts=true`;
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': this.userAgent,
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        return {
          url,
          exists: false,
          error: `HTTP ${response.status}`
        };
      }

      const data = await response.json();

      return {
        url,
        exists: true,
        serverName: data.guild?.name || 'Unknown',
        memberCount: data.approximate_member_count || 0,
        onlineCount: data.approximate_presence_count || 0,
        verified: data.guild?.verified || false
      };
    } catch (error) {
      return {
        url,
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Crawls Medium profile
   */
  private async crawlMedium(url: string): Promise<MediumProfile> {
    try {
      console.log(`  📝 Crawling Medium: ${url}`);

      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        return {
          url,
          exists: false,
          error: `HTTP ${response.status}`
        };
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const author = $('meta[property="og:title"]').attr('content') || 
                    $('meta[name="author"]').attr('content') || '';
      
      const followers = this.extractNumber(html, /(\d+(?:,\d+)*(?:\.\d+)?[KMB]?)\s*Followers/i);
      const articles = this.extractNumber(html, /(\d+(?:,\d+)*)\s*(?:stories|articles)/i);

      return {
        url,
        exists: true,
        author: author.slice(0, 100),
        followers,
        articles,
        recentActivity: true
      };
    } catch (error) {
      return {
        url,
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Crawls Reddit community
   */
  private async crawlReddit(url: string): Promise<RedditCommunity> {
    try {
      // Extract subreddit name
      const match = url.match(/reddit\.com\/r\/([^\/\?]+)/);
      if (!match) throw new Error('Invalid Reddit URL');
      const subreddit = match[1];

      console.log(`  🤖 Crawling Reddit: r/${subreddit}`);

      // Use Reddit JSON API
      const apiUrl = `https://www.reddit.com/r/${subreddit}/about.json`;
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': this.userAgent,
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        return {
          url,
          exists: false,
          subreddit,
          error: `HTTP ${response.status}`
        };
      }

      const data = await response.json();
      const subData = data.data;

      return {
        url,
        exists: true,
        subreddit,
        members: subData.subscribers || 0,
        online: subData.active_user_count || 0,
        description: subData.public_description || '',
        recentActivity: true
      };
    } catch (error) {
      return {
        url,
        exists: false,
        subreddit: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Crawls Telegram channel
   */
  private async crawlTelegram(url: string): Promise<TelegramChannel> {
    try {
      console.log(`  ✈️  Crawling Telegram: ${url}`);

      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        return {
          url,
          exists: false,
          error: `HTTP ${response.status}`
        };
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const channelName = $('meta[property="og:title"]').attr('content') || 
                         $('.tgme_page_title').text().trim() || '';
      
      const description = $('meta[property="og:description"]').attr('content') || 
                         $('.tgme_page_description').text().trim() || '';
      
      const members = this.extractNumber(html, /(\d+(?:,\d+)*(?:\.\d+)?[KMB]?)\s*(?:members|subscribers)/i);

      return {
        url,
        exists: true,
        channelName: channelName.slice(0, 100),
        members,
        description: description.slice(0, 200)
      };
    } catch (error) {
      return {
        url,
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Extracts numbers from text (handles K, M, B suffixes)
   */
  private extractNumber(text: string, pattern: RegExp): number | undefined {
    const match = text.match(pattern);
    if (!match || !match[1]) return undefined;

    let numStr = match[1].replace(/,/g, '');
    let multiplier = 1;

    if (numStr.endsWith('K')) {
      multiplier = 1000;
      numStr = numStr.slice(0, -1);
    } else if (numStr.endsWith('M')) {
      multiplier = 1000000;
      numStr = numStr.slice(0, -1);
    } else if (numStr.endsWith('B')) {
      multiplier = 1000000000;
      numStr = numStr.slice(0, -1);
    }

    const num = parseFloat(numStr);
    return isNaN(num) ? undefined : Math.round(num * multiplier);
  }

  /**
   * Calculates community engagement score
   */
  private calculateCommunityScore(data: SocialMediaData): number {
    let score = 0;

    // Active channels (30 points)
    score += Math.min(30, data.activeChannels * 6);

    // Verified channels (20 points)
    score += Math.min(20, data.verifiedChannels * 10);

    // Total followers/members (50 points)
    const totalCommunity = data.totalFollowers + data.totalMembers;
    if (totalCommunity >= 100000) score += 50;
    else if (totalCommunity >= 50000) score += 40;
    else if (totalCommunity >= 10000) score += 30;
    else if (totalCommunity >= 5000) score += 20;
    else if (totalCommunity >= 1000) score += 10;

    return Math.min(100, score);
  }

  /**
   * Generates human-readable summary
   */
  generateSummary(data: SocialMediaData): string {
    const lines: string[] = [];

    lines.push('SOCIAL MEDIA ANALYSIS:');
    lines.push('');

    if (data.twitter) {
      lines.push(`Twitter/X: ${data.twitter.exists ? '✅ ACTIVE' : '❌ NOT FOUND'}`);
      if (data.twitter.exists) {
        lines.push(`  @${data.twitter.username}`);
        if (data.twitter.followers) lines.push(`  Followers: ${data.twitter.followers.toLocaleString()}`);
        if (data.twitter.tweets) lines.push(`  Tweets: ${data.twitter.tweets.toLocaleString()}`);
        if (data.twitter.verified) lines.push(`  ✅ Verified Account`);
      }
      lines.push('');
    }

    if (data.github) {
      lines.push(`GitHub: ${data.github.exists ? '✅ ACTIVE' : '❌ NOT FOUND'}`);
      if (data.github.exists) {
        lines.push(`  ${data.github.name}`);
        if (data.github.repositories) lines.push(`  Repositories: ${data.github.repositories}`);
        if (data.github.stars) lines.push(`  Total Stars: ${data.github.stars.toLocaleString()}`);
      }
      lines.push('');
    }

    if (data.discord) {
      lines.push(`Discord: ${data.discord.exists ? '✅ ACTIVE' : '❌ NOT FOUND'}`);
      if (data.discord.exists) {
        if (data.discord.serverName) lines.push(`  Server: ${data.discord.serverName}`);
        if (data.discord.memberCount) lines.push(`  Members: ${data.discord.memberCount.toLocaleString()}`);
        if (data.discord.onlineCount) lines.push(`  Online: ${data.discord.onlineCount.toLocaleString()}`);
        if (data.discord.verified) lines.push(`  ✅ Verified Server`);
      }
      lines.push('');
    }

    if (data.medium) {
      lines.push(`Medium: ${data.medium.exists ? '✅ ACTIVE' : '❌ NOT FOUND'}`);
      if (data.medium.exists) {
        if (data.medium.author) lines.push(`  Author: ${data.medium.author}`);
        if (data.medium.followers) lines.push(`  Followers: ${data.medium.followers.toLocaleString()}`);
        if (data.medium.articles) lines.push(`  Articles: ${data.medium.articles}`);
      }
      lines.push('');
    }

    if (data.reddit) {
      lines.push(`Reddit: ${data.reddit.exists ? '✅ ACTIVE' : '❌ NOT FOUND'}`);
      if (data.reddit.exists) {
        if (data.reddit.subreddit) lines.push(`  r/${data.reddit.subreddit}`);
        if (data.reddit.members) lines.push(`  Members: ${data.reddit.members.toLocaleString()}`);
        if (data.reddit.online) lines.push(`  Online: ${data.reddit.online.toLocaleString()}`);
      }
      lines.push('');
    }

    if (data.telegram) {
      lines.push(`Telegram: ${data.telegram.exists ? '✅ ACTIVE' : '❌ NOT FOUND'}`);
      if (data.telegram.exists) {
        if (data.telegram.channelName) lines.push(`  Channel: ${data.telegram.channelName}`);
        if (data.telegram.members) lines.push(`  Members: ${data.telegram.members.toLocaleString()}`);
      }
      lines.push('');
    }

    lines.push(`Total Community: ${(data.totalFollowers + data.totalMembers).toLocaleString()}`);
    lines.push(`Active Channels: ${data.activeChannels}`);
    lines.push(`Verified Channels: ${data.verifiedChannels}`);
    lines.push(`Community Score: ${data.communityScore}/100`);

    return lines.join('\n');
  }
}
