/**
 * Simple in-memory cache for generated reports
 */

interface CachedReport {
  report: any;
  summary: any;
  timestamp: number;
  expiresAt: number;
}

class ReportCache {
  private cache = new Map<string, CachedReport>();
  private readonly TTL = 24 * 60 * 60 * 1000; // 24 hours

  set(auditId: string, report: any, summary: any): void {
    const now = Date.now();
    this.cache.set(auditId, {
      report,
      summary,
      timestamp: now,
      expiresAt: now + this.TTL
    });
    
    // Clean up expired entries
    this.cleanup();
  }

  get(auditId: string): { report: any; summary: any } | null {
    const cached = this.cache.get(auditId);
    
    if (!cached) {
      return null;
    }
    
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(auditId);
      return null;
    }
    
    return {
      report: cached.report,
      summary: cached.summary
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    this.cache.forEach((value, key) => {
      if (now > value.expiresAt) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

export const reportCache = new ReportCache();