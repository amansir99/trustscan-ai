interface SourceValidation {
  url: string;
  isValid: boolean;
  lastChecked: string;
  contentHash: string;
  sourceType: 'audit' | 'documentation' | 'github' | 'team' | 'governance';
}

interface ValidationResult {
  validSources: SourceValidation[];
  invalidSources: SourceValidation[];
  confidence: number;
}

export class SourceValidator {
  private cache = new Map<string, SourceValidation>();

  async validateSources(urls: string[]): Promise<ValidationResult> {
    const validations = await Promise.all(
      urls.map(url => this.validateSource(url))
    );

    const validSources = validations.filter(v => v.isValid);
    const invalidSources = validations.filter(v => !v.isValid);
    
    const confidence = validSources.length / validations.length * 100;

    return { validSources, invalidSources, confidence };
  }

  private async validateSource(url: string): Promise<SourceValidation> {
    const cached = this.cache.get(url);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const validation: SourceValidation = {
        url,
        isValid: response.ok,
        lastChecked: new Date().toISOString(),
        contentHash: response.headers.get('etag') || '',
        sourceType: this.detectSourceType(url)
      };

      this.cache.set(url, validation);
      return validation;
    } catch {
      const validation: SourceValidation = {
        url,
        isValid: false,
        lastChecked: new Date().toISOString(),
        contentHash: '',
        sourceType: this.detectSourceType(url)
      };
      
      this.cache.set(url, validation);
      return validation;
    }
  }

  private detectSourceType(url: string): SourceValidation['sourceType'] {
    if (url.includes('github.com')) return 'github';
    if (url.includes('audit') || url.includes('certik') || url.includes('trail')) return 'audit';
    if (url.includes('docs') || url.includes('dev')) return 'documentation';
    if (url.includes('governance') || url.includes('vote')) return 'governance';
    return 'team';
  }

  private isCacheValid(validation: SourceValidation): boolean {
    const cacheAge = Date.now() - new Date(validation.lastChecked).getTime();
    return cacheAge < 3600000; // 1 hour cache
  }
}