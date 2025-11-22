/**
 * Content validation and quality assessment for extracted website content
 */

import { ExtractedContent } from './scraper';

export interface ContentValidationResult {
  isValid: boolean;
  quality: 'high' | 'medium' | 'low' | 'insufficient';
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
  metrics: ContentMetrics;
}

export interface ContentMetrics {
  totalWordCount: number;
  titleLength: number;
  descriptionLength: number;
  documentationSections: number;
  socialLinksCount: number;
  codeRepositoryCount: number;
  structuredContentRatio: number; // Percentage of structured vs unstructured content
  duplicateContentRatio: number; // Percentage of duplicate/repeated content
}

export class ContentValidator {
  private static readonly MIN_WORD_COUNT = 100;
  private static readonly MIN_TITLE_LENGTH = 5;
  private static readonly MIN_DESCRIPTION_LENGTH = 20;
  private static readonly MIN_DOCUMENTATION_SECTIONS = 0;
  private static readonly MAX_DUPLICATE_RATIO = 0.3; // 30% max duplicate content

  static validateContent(content: ExtractedContent): ContentValidationResult {
    const metrics = this.calculateMetrics(content);
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Validate minimum content requirements
    if (metrics.totalWordCount < this.MIN_WORD_COUNT) {
      issues.push(`Insufficient content: ${metrics.totalWordCount} words (minimum: ${this.MIN_WORD_COUNT})`);
      score -= 30;
      recommendations.push('Request additional documentation URLs or pages');
    }

    if (metrics.titleLength < this.MIN_TITLE_LENGTH) {
      issues.push(`Title too short: ${metrics.titleLength} characters`);
      score -= 10;
      recommendations.push('Verify the website has a proper title tag');
    }

    if (metrics.descriptionLength < this.MIN_DESCRIPTION_LENGTH) {
      issues.push(`Description too short: ${metrics.descriptionLength} characters`);
      score -= 10;
      recommendations.push('Look for meta description or introductory content');
    }

    if (metrics.documentationSections < this.MIN_DOCUMENTATION_SECTIONS) {
      issues.push('No structured documentation sections found');
      score -= 20;
      recommendations.push('Check for documentation, whitepaper, or guide sections');
    }

    // Check for duplicate content
    if (metrics.duplicateContentRatio > this.MAX_DUPLICATE_RATIO) {
      issues.push(`High duplicate content ratio: ${(metrics.duplicateContentRatio * 100).toFixed(1)}%`);
      score -= 15;
      recommendations.push('Content may be auto-generated or low quality');
    }

    // Assess structured content quality
    if (metrics.structuredContentRatio < 0.3) {
      issues.push('Low structured content ratio - mostly unstructured text');
      score -= 10;
      recommendations.push('Look for more specific sections like team, tokenomics, security');
    }

    // Check for essential DeFi project elements
    if (!content.teamInfo || content.teamInfo.length < 100) {
      issues.push('Insufficient team information');
      score -= 15;
      recommendations.push('Look for team/about section with member details');
    }

    if (!content.tokenomics || content.tokenomics.length < 100) {
      issues.push('No tokenomics information found');
      score -= 15;
      recommendations.push('Search for token distribution, supply, or economics information');
    }

    if (metrics.socialLinksCount === 0) {
      issues.push('No social media links found');
      score -= 10;
      recommendations.push('Look for Twitter, Discord, Telegram, or other social links');
    }

    if (metrics.codeRepositoryCount === 0) {
      issues.push('No code repositories found');
      score -= 10;
      recommendations.push('Search for GitHub, GitLab, or other code repository links');
    }

    // Determine quality level
    let quality: 'high' | 'medium' | 'low' | 'insufficient';
    if (score >= 80) {
      quality = 'high';
    } else if (score >= 60) {
      quality = 'medium';
    } else if (score >= 40) {
      quality = 'low';
    } else {
      quality = 'insufficient';
    }

    const isValid = quality !== 'insufficient' || metrics.totalWordCount >= this.MIN_WORD_COUNT;

    return {
      isValid,
      quality,
      score: Math.max(0, score),
      issues,
      recommendations,
      metrics
    };
  }

  private static calculateMetrics(content: ExtractedContent): ContentMetrics {
    // Calculate word counts
    const allText = `${content.title} ${content.description} ${content.mainContent} ${content.teamInfo} ${content.tokenomics} ${content.securityInfo}`;
    const words = allText.split(/\s+/).filter(word => word.length > 0);
    const totalWordCount = words.length;

    // Calculate structured content ratio
    const structuredText = `${content.teamInfo} ${content.tokenomics} ${content.securityInfo}`;
    const structuredWords = structuredText.split(/\s+/).filter(word => word.length > 0).length;
    const structuredContentRatio = totalWordCount > 0 ? structuredWords / totalWordCount : 0;

    // Calculate duplicate content ratio
    const duplicateContentRatio = this.calculateDuplicateRatio(allText);

    return {
      totalWordCount,
      titleLength: content.title.length,
      descriptionLength: content.description.length,
      documentationSections: content.documentation.length,
      socialLinksCount: content.socialLinks.length,
      codeRepositoryCount: content.codeRepositories.length,
      structuredContentRatio,
      duplicateContentRatio
    };
  }

  private static calculateDuplicateRatio(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    if (sentences.length < 2) return 0;

    const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()));
    return 1 - (uniqueSentences.size / sentences.length);
  }

  static generateValidationReport(validation: ContentValidationResult): string {
    const report = [
      `Content Validation Report`,
      `========================`,
      `Status: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}`,
      `Quality: ${validation.quality.toUpperCase()}`,
      `Score: ${validation.score}/100`,
      ``,
      `Metrics:`,
      `- Total words: ${validation.metrics.totalWordCount}`,
      `- Documentation sections: ${validation.metrics.documentationSections}`,
      `- Social links: ${validation.metrics.socialLinksCount}`,
      `- Code repositories: ${validation.metrics.codeRepositoryCount}`,
      `- Structured content: ${(validation.metrics.structuredContentRatio * 100).toFixed(1)}%`,
      ``
    ];

    if (validation.issues.length > 0) {
      report.push(`Issues Found:`);
      validation.issues.forEach(issue => report.push(`- ${issue}`));
      report.push(``);
    }

    if (validation.recommendations.length > 0) {
      report.push(`Recommendations:`);
      validation.recommendations.forEach(rec => report.push(`- ${rec}`));
    }

    return report.join('\n');
  }
}