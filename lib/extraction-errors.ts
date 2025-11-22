/**
 * Comprehensive error handling for content extraction
 */

export enum ExtractionErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  ACCESS_DENIED = 'ACCESS_DENIED',
  INVALID_URL = 'INVALID_URL',
  CONTENT_TOO_SMALL = 'CONTENT_TOO_SMALL',
  ANTI_BOT_BLOCKED = 'ANTI_BOT_BLOCKED',
  JAVASCRIPT_REQUIRED = 'JAVASCRIPT_REQUIRED',
  RATE_LIMITED = 'RATE_LIMITED',
  BROWSER_ERROR = 'BROWSER_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ExtractionError {
  type: ExtractionErrorType;
  message: string;
  originalError?: Error;
  url?: string;
  retryable: boolean;
  userMessage: string;
  suggestedActions: string[];
  metadata?: Record<string, any>;
}

export class ExtractionErrorHandler {
  static createError(
    type: ExtractionErrorType,
    message: string,
    originalError?: Error,
    url?: string,
    metadata?: Record<string, any>
  ): ExtractionError {
    const errorInfo = this.getErrorInfo(type);
    
    return {
      type,
      message,
      originalError,
      url,
      retryable: errorInfo.retryable,
      userMessage: errorInfo.userMessage,
      suggestedActions: errorInfo.suggestedActions,
      metadata
    };
  }

  static classifyError(error: Error, url?: string): ExtractionError {
    const message = error.message.toLowerCase();
    
    // Network-related errors
    if (message.includes('net::') || message.includes('network') || message.includes('connection')) {
      if (message.includes('timeout') || message.includes('timed out')) {
        return this.createError(ExtractionErrorType.TIMEOUT_ERROR, error.message, error, url);
      }
      return this.createError(ExtractionErrorType.NETWORK_ERROR, error.message, error, url);
    }

    // Access and permission errors
    if (message.includes('403') || message.includes('forbidden') || message.includes('access denied')) {
      return this.createError(ExtractionErrorType.ACCESS_DENIED, error.message, error, url);
    }

    // Rate limiting
    if (message.includes('429') || message.includes('rate limit') || message.includes('too many requests')) {
      return this.createError(ExtractionErrorType.RATE_LIMITED, error.message, error, url);
    }

    // Anti-bot detection
    if (message.includes('cloudflare') || message.includes('bot detected') || message.includes('challenge')) {
      return this.createError(ExtractionErrorType.ANTI_BOT_BLOCKED, error.message, error, url);
    }

    // Browser/Puppeteer errors
    if (message.includes('browser') || message.includes('puppeteer') || message.includes('chrome')) {
      return this.createError(ExtractionErrorType.BROWSER_ERROR, error.message, error, url);
    }

    // URL validation errors
    if (message.includes('invalid url') || message.includes('malformed')) {
      return this.createError(ExtractionErrorType.INVALID_URL, error.message, error, url);
    }

    // Parsing errors
    if (message.includes('parse') || message.includes('cheerio') || message.includes('html')) {
      return this.createError(ExtractionErrorType.PARSING_ERROR, error.message, error, url);
    }

    // Default to unknown error
    return this.createError(ExtractionErrorType.UNKNOWN_ERROR, error.message, error, url);
  }

  private static getErrorInfo(type: ExtractionErrorType): {
    retryable: boolean;
    userMessage: string;
    suggestedActions: string[];
  } {
    switch (type) {
      case ExtractionErrorType.NETWORK_ERROR:
        return {
          retryable: true,
          userMessage: 'Unable to connect to the website. This may be a temporary network issue.',
          suggestedActions: [
            'Check if the website URL is correct',
            'Try again in a few minutes',
            'Verify the website is accessible from your browser'
          ]
        };

      case ExtractionErrorType.TIMEOUT_ERROR:
        return {
          retryable: true,
          userMessage: 'The website took too long to respond. It may be slow or overloaded.',
          suggestedActions: [
            'Try again with a simpler page from the same domain',
            'Check if the website loads quickly in your browser',
            'The site may be experiencing high traffic'
          ]
        };

      case ExtractionErrorType.ACCESS_DENIED:
        return {
          retryable: false,
          userMessage: 'Access to this website is restricted. The site may block automated access.',
          suggestedActions: [
            'Try a different page from the same domain',
            'Check if the website requires login or registration',
            'Look for publicly accessible documentation or whitepaper'
          ]
        };

      case ExtractionErrorType.ANTI_BOT_BLOCKED:
        return {
          retryable: true,
          userMessage: 'The website has anti-bot protection that prevented content extraction.',
          suggestedActions: [
            'Try again in a few minutes',
            'Look for alternative documentation sources',
            'Check the project\'s GitHub or official documentation'
          ]
        };

      case ExtractionErrorType.RATE_LIMITED:
        return {
          retryable: true,
          userMessage: 'Too many requests to this website. Please wait before trying again.',
          suggestedActions: [
            'Wait a few minutes before retrying',
            'Try analyzing a different project first',
            'Check if the website has API documentation'
          ]
        };

      case ExtractionErrorType.CONTENT_TOO_SMALL:
        return {
          retryable: false,
          userMessage: 'The website doesn\'t contain enough content for a comprehensive analysis.',
          suggestedActions: [
            'Try the project\'s documentation or whitepaper URL',
            'Look for more detailed pages like /docs or /about',
            'Check if the project has a GitHub repository with README'
          ]
        };

      case ExtractionErrorType.JAVASCRIPT_REQUIRED:
        return {
          retryable: true,
          userMessage: 'This website requires JavaScript to load content properly.',
          suggestedActions: [
            'The system will automatically retry with enhanced JavaScript support',
            'Try a direct link to documentation if available',
            'Look for static content pages'
          ]
        };

      case ExtractionErrorType.INVALID_URL:
        return {
          retryable: false,
          userMessage: 'The provided URL is not valid or properly formatted.',
          suggestedActions: [
            'Check that the URL starts with http:// or https://',
            'Verify the domain name is spelled correctly',
            'Make sure the URL is complete and accessible'
          ]
        };

      case ExtractionErrorType.BROWSER_ERROR:
        return {
          retryable: true,
          userMessage: 'There was a technical issue with the browser engine.',
          suggestedActions: [
            'This is usually temporary - try again',
            'The system will automatically retry with different settings',
            'If the issue persists, try a different project'
          ]
        };

      case ExtractionErrorType.PARSING_ERROR:
        return {
          retryable: true,
          userMessage: 'Unable to parse the website content properly.',
          suggestedActions: [
            'The website may have unusual formatting',
            'Try a different page from the same project',
            'Look for simpler documentation pages'
          ]
        };

      default:
        return {
          retryable: true,
          userMessage: 'An unexpected error occurred during content extraction.',
          suggestedActions: [
            'Try again in a few minutes',
            'Check if the website is accessible in your browser',
            'Contact support if the issue persists'
          ]
        };
    }
  }

  static shouldRetry(error: ExtractionError, attemptNumber: number, maxAttempts: number): boolean {
    if (attemptNumber >= maxAttempts) return false;
    if (!error.retryable) return false;

    // Special retry logic for specific error types
    switch (error.type) {
      case ExtractionErrorType.RATE_LIMITED:
        return attemptNumber < 2; // Only retry once for rate limiting
      
      case ExtractionErrorType.ANTI_BOT_BLOCKED:
        return attemptNumber < 2; // Only retry once for anti-bot
      
      case ExtractionErrorType.TIMEOUT_ERROR:
        return attemptNumber < maxAttempts; // Retry all attempts for timeouts
      
      default:
        return true;
    }
  }

  static getRetryDelay(error: ExtractionError, attemptNumber: number): number {
    const baseDelay = 2000; // 2 seconds base delay
    
    switch (error.type) {
      case ExtractionErrorType.RATE_LIMITED:
        return baseDelay * 5 * attemptNumber; // Longer delay for rate limiting
      
      case ExtractionErrorType.ANTI_BOT_BLOCKED:
        return baseDelay * 3 * attemptNumber; // Moderate delay for anti-bot
      
      case ExtractionErrorType.NETWORK_ERROR:
      case ExtractionErrorType.TIMEOUT_ERROR:
        return baseDelay * attemptNumber; // Standard exponential backoff
      
      default:
        return baseDelay * attemptNumber;
    }
  }

  static formatErrorForUser(error: ExtractionError): string {
    let message = `❌ ${error.userMessage}\n\n`;
    
    if (error.suggestedActions.length > 0) {
      message += `💡 Suggested actions:\n`;
      error.suggestedActions.forEach(action => {
        message += `   • ${action}\n`;
      });
    }

    if (error.url) {
      message += `\n🔗 URL: ${error.url}`;
    }

    return message;
  }

  static logError(error: ExtractionError): void {
    console.error(`[ExtractionError] ${error.type}: ${error.message}`, {
      url: error.url,
      retryable: error.retryable,
      originalError: error.originalError?.stack,
      metadata: error.metadata
    });
  }
}