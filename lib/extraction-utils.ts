/**
 * Utility functions for content extraction testing and debugging
 */

import { ContentExtractionService, ExtractedContent } from './scraper';
import { ContentValidator } from './content-validator';
import { ExtractionErrorHandler, ExtractionError } from './extraction-errors';

export interface ExtractionTestResult {
  success: boolean;
  content?: ExtractedContent;
  error?: ExtractionError;
  duration: number;
  attempts: number;
}

export class ExtractionUtils {
  /**
   * Test content extraction for a URL with detailed reporting
   */
  static async testExtraction(url: string): Promise<ExtractionTestResult> {
    const startTime = Date.now();
    const extractor = new ContentExtractionService();
    
    try {
      const content = await extractor.extractWebsiteContent(url);
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        content,
        duration,
        attempts: content.errors?.length || 1
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const extractionError = error instanceof Error 
        ? ExtractionErrorHandler.classifyError(error, url)
        : error as ExtractionError;
      
      return {
        success: false,
        error: extractionError,
        duration,
        attempts: 3 // Assume max attempts were made
      };
      
    } finally {
      await extractor.close();
    }
  }

  /**
   * Generate a comprehensive extraction report
   */
  static generateExtractionReport(result: ExtractionTestResult, url: string): string {
    const report = [
      `Content Extraction Report`,
      `========================`,
      `URL: ${url}`,
      `Status: ${result.success ? '✅ Success' : '❌ Failed'}`,
      `Duration: ${result.duration}ms`,
      `Attempts: ${result.attempts}`,
      ``
    ];

    if (result.success && result.content) {
      const content = result.content;
      
      report.push(`Extraction Details:`);
      report.push(`- Method: ${content.extractionMethod}`);
      report.push(`- Title: ${content.title.substring(0, 100)}${content.title.length > 100 ? '...' : ''}`);
      report.push(`- Content Length: ${content.contentLength} characters`);
      report.push(`- Documentation Sections: ${content.documentation.length}`);
      report.push(`- Social Links: ${content.socialLinks.length}`);
      report.push(`- Code Repositories: ${content.codeRepositories.length}`);
      report.push(``);

      if (content.validation) {
        report.push(`Content Validation:`);
        report.push(`- Quality: ${content.validation.quality.toUpperCase()}`);
        report.push(`- Score: ${content.validation.score}/100`);
        report.push(`- Valid: ${content.validation.isValid ? 'Yes' : 'No'}`);
        
        if (content.validation.issues.length > 0) {
          report.push(`- Issues: ${content.validation.issues.length}`);
          content.validation.issues.forEach(issue => {
            report.push(`  • ${issue}`);
          });
        }
        report.push(``);
      }

      if (content.errors && content.errors.length > 0) {
        report.push(`Errors Encountered:`);
        content.errors.forEach((error, index) => {
          report.push(`${index + 1}. ${error.type}: ${error.message}`);
        });
        report.push(``);
      }

    } else if (result.error) {
      report.push(`Error Details:`);
      report.push(`- Type: ${result.error.type}`);
      report.push(`- Message: ${result.error.message}`);
      report.push(`- Retryable: ${result.error.retryable ? 'Yes' : 'No'}`);
      report.push(``);
      
      report.push(`User Message:`);
      report.push(result.error.userMessage);
      report.push(``);
      
      if (result.error.suggestedActions.length > 0) {
        report.push(`Suggested Actions:`);
        result.error.suggestedActions.forEach(action => {
          report.push(`- ${action}`);
        });
      }
    }

    return report.join('\n');
  }

  /**
   * Batch test multiple URLs
   */
  static async batchTest(urls: string[]): Promise<Map<string, ExtractionTestResult>> {
    const results = new Map<string, ExtractionTestResult>();
    
    for (const url of urls) {
      console.log(`Testing extraction for: ${url}`);
      const result = await this.testExtraction(url);
      results.set(url, result);
      
      // Add delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return results;
  }

  /**
   * Generate summary statistics for batch test results
   */
  static generateBatchSummary(results: Map<string, ExtractionTestResult>): string {
    const total = results.size;
    const successful = Array.from(results.values()).filter(r => r.success).length;
    const failed = total - successful;
    
    const avgDuration = Array.from(results.values())
      .reduce((sum, r) => sum + r.duration, 0) / total;
    
    const errorTypes = new Map<string, number>();
    results.forEach(result => {
      if (!result.success && result.error) {
        const count = errorTypes.get(result.error.type) || 0;
        errorTypes.set(result.error.type, count + 1);
      }
    });

    const summary = [
      `Batch Extraction Summary`,
      `=======================`,
      `Total URLs: ${total}`,
      `Successful: ${successful} (${((successful / total) * 100).toFixed(1)}%)`,
      `Failed: ${failed} (${((failed / total) * 100).toFixed(1)}%)`,
      `Average Duration: ${avgDuration.toFixed(0)}ms`,
      ``
    ];

    if (errorTypes.size > 0) {
      summary.push(`Error Breakdown:`);
      Array.from(errorTypes.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
          summary.push(`- ${type}: ${count} (${((count / failed) * 100).toFixed(1)}% of failures)`);
        });
    }

    return summary.join('\n');
  }

  /**
   * Validate content quality across multiple extractions
   */
  static analyzeContentQuality(results: Map<string, ExtractionTestResult>): {
    averageScore: number;
    qualityDistribution: Record<string, number>;
    commonIssues: Record<string, number>;
  } {
    const validResults = Array.from(results.values())
      .filter(r => r.success && r.content?.validation);

    if (validResults.length === 0) {
      return {
        averageScore: 0,
        qualityDistribution: {},
        commonIssues: {}
      };
    }

    const scores = validResults.map(r => r.content!.validation!.score);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    const qualityDistribution: Record<string, number> = {};
    const commonIssues: Record<string, number> = {};

    validResults.forEach(result => {
      const validation = result.content!.validation!;
      
      // Count quality levels
      qualityDistribution[validation.quality] = (qualityDistribution[validation.quality] || 0) + 1;
      
      // Count common issues
      validation.issues.forEach(issue => {
        const issueType = issue.split(':')[0]; // Get the issue type before the colon
        commonIssues[issueType] = (commonIssues[issueType] || 0) + 1;
      });
    });

    return {
      averageScore,
      qualityDistribution,
      commonIssues
    };
  }
}