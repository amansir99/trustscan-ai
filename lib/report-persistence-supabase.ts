import { getSupabaseClient } from './db-supabase';
import { AuditReport } from './report-generator';

export interface AuditHistoryFilter {
  dateRange?: {
    start: Date;
    end: Date;
  };
  riskLevel?: string[];
  minScore?: number;
  maxScore?: number;
  projectName?: string;
  url?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface AuditHistoryResult {
  audits: AuditReport[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ExportOptions {
  format: 'json' | 'summary';
  includeContent?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Service for persisting and retrieving audit reports using Supabase
 */
export class ReportPersistenceService {
  
  /**
   * Stores a complete audit report in the database
   */
  async storeAuditReport(report: AuditReport): Promise<string> {
    try {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('audits')
        .insert({
          id: report.id,
          user_id: report.userId,
          url: report.url,
          project_name: report.projectName,
          trust_score: report.trustScore.finalScore,
          risk_level: report.trustScore.riskLevel,
          confidence_score: report.trustScore.confidence,
          analysis_data: {
            factors: report.analysis.factors,
            explanations: report.analysis.explanations,
            recommendations: report.analysis.recommendations,
            risks: report.analysis.risks,
            redFlags: report.analysis.redFlags,
            positiveIndicators: report.analysis.positiveIndicators,
            trustScoreBreakdown: report.trustScore.breakdown,
            adjustments: report.trustScore.adjustments,
            baseScore: report.trustScore.baseScore
          },
          extracted_content: {
            url: report.extractedContent.url,
            title: report.extractedContent.title,
            description: report.extractedContent.description,
            mainContent: report.extractedContent.mainContent,
            documentation: report.extractedContent.documentation,
            teamInfo: report.extractedContent.teamInfo,
            tokenomics: report.extractedContent.tokenomics,
            securityInfo: report.extractedContent.securityInfo,
            socialLinks: report.extractedContent.socialLinks,
            codeRepositories: report.extractedContent.codeRepositories,
            extractedAt: report.extractedContent.extractedAt.toISOString()
          },
          hedera_transaction_id: report.hederaTransactionId || null,
          created_at: report.generatedAt.toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing audit report:', error);
        throw new Error(`Failed to store audit report: ${error.message}`);
      }

      console.log(`✅ Audit report stored successfully: ${report.id}`);
      return report.id;
    } catch (error) {
      console.error('Error in storeAuditReport:', error);
      throw error;
    }
  }

  /**
   * Retrieves audit history with filtering and pagination
   */
  async getAuditHistory(
    userId: string,
    filter: AuditHistoryFilter = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<AuditHistoryResult> {
    try {
      const supabase = getSupabaseClient();
      const offset = (pagination.page - 1) * pagination.limit;

      // Build query
      let query = supabase
        .from('audits')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // Apply filters
      if (filter.dateRange) {
        query = query
          .gte('created_at', filter.dateRange.start.toISOString())
          .lte('created_at', filter.dateRange.end.toISOString());
      }

      if (filter.riskLevel && filter.riskLevel.length > 0) {
        query = query.in('risk_level', filter.riskLevel);
      }

      if (filter.minScore !== undefined) {
        query = query.gte('trust_score', filter.minScore);
      }

      if (filter.maxScore !== undefined) {
        query = query.lte('trust_score', filter.maxScore);
      }

      if (filter.projectName) {
        query = query.ilike('project_name', `%${filter.projectName}%`);
      }

      if (filter.url) {
        query = query.ilike('url', `%${filter.url}%`);
      }

      // Execute query with pagination
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + pagination.limit - 1);

      if (error) throw error;

      const total = count || 0;
      const totalPages = Math.ceil(total / pagination.limit);

      // Convert database rows to AuditReport objects
      const audits = (data || []).map((row: any) => this.convertRowToAuditReport(row));

      return {
        audits,
        pagination: {
          total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages
        }
      };
    } catch (error) {
      console.error('Error retrieving audit history:', error);
      throw new Error('Failed to retrieve audit history');
    }
  }

  /**
   * Retrieves a specific audit report by ID
   */
  async getAuditById(auditId: string, userId?: string): Promise<AuditReport | null> {
    try {
      const supabase = getSupabaseClient();
      
      let query = supabase
        .from('audits')
        .select('*')
        .eq('id', auditId);

      // If userId is provided, ensure the audit belongs to the user
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`Audit not found: ${auditId}`);
          return null;
        }
        throw error;
      }

      if (!data) {
        return null;
      }

      return this.convertRowToAuditReport(data);
    } catch (error) {
      console.error('Error retrieving audit report:', error);
      throw new Error('Failed to retrieve audit report');
    }
  }

  /**
   * Deletes an audit report
   */
  async deleteAuditReport(auditId: string, userId: string): Promise<boolean> {
    try {
      const supabase = getSupabaseClient();
      
      const { error } = await supabase
        .from('audits')
        .delete()
        .eq('id', auditId)
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      console.error('Error deleting audit report:', error);
      throw new Error('Failed to delete audit report');
    }
  }

  /**
   * Gets audit statistics for a user
   */
  async getAuditStatistics(userId: string): Promise<{
    totalAudits: number;
    auditsThisMonth: number;
    averageTrustScore: number;
    riskDistribution: Record<string, number>;
    recentActivity: Array<{
      date: string;
      count: number;
    }>;
  }> {
    try {
      const supabase = getSupabaseClient();

      // Get total audits
      const { count: totalAudits } = await supabase
        .from('audits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get audits this month
      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      firstOfMonth.setHours(0, 0, 0, 0);

      const { count: auditsThisMonth } = await supabase
        .from('audits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', firstOfMonth.toISOString());

      // Get average trust score
      const { data: scoreData } = await supabase
        .from('audits')
        .select('trust_score')
        .eq('user_id', userId);

      const averageTrustScore = scoreData && scoreData.length > 0
        ? Math.round(scoreData.reduce((sum, row) => sum + row.trust_score, 0) / scoreData.length)
        : 0;

      // Get risk distribution
      const { data: riskData } = await supabase
        .from('audits')
        .select('risk_level')
        .eq('user_id', userId);

      const riskDistribution: Record<string, number> = {};
      riskData?.forEach((row: any) => {
        riskDistribution[row.risk_level] = (riskDistribution[row.risk_level] || 0) + 1;
      });

      // Get recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: activityData } = await supabase
        .from('audits')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      // Group by date
      const activityMap: Record<string, number> = {};
      activityData?.forEach((row: any) => {
        const date = new Date(row.created_at).toISOString().split('T')[0];
        activityMap[date] = (activityMap[date] || 0) + 1;
      });

      const recentActivity = Object.entries(activityMap).map(([date, count]) => ({
        date,
        count
      }));

      return {
        totalAudits: totalAudits || 0,
        auditsThisMonth: auditsThisMonth || 0,
        averageTrustScore,
        riskDistribution,
        recentActivity
      };
    } catch (error) {
      console.error('Error getting audit statistics:', error);
      throw new Error('Failed to retrieve audit statistics');
    }
  }

  /**
   * Searches audit reports by project name or URL
   */
  async searchAuditReports(
    userId: string,
    searchTerm: string,
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<AuditHistoryResult> {
    try {
      const supabase = getSupabaseClient();
      const offset = (pagination.page - 1) * pagination.limit;

      const { data, error, count } = await supabase
        .from('audits')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .or(`project_name.ilike.%${searchTerm}%,url.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .range(offset, offset + pagination.limit - 1);

      if (error) throw error;

      const total = count || 0;
      const totalPages = Math.ceil(total / pagination.limit);

      const audits = (data || []).map((row: any) => this.convertRowToAuditReport(row));

      return {
        audits,
        pagination: {
          total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages
        }
      };
    } catch (error) {
      console.error('Error searching audit reports:', error);
      throw new Error('Failed to search audit reports');
    }
  }

  /**
   * Exports audit reports for premium users
   */
  async exportAuditReports(
    userId: string,
    options: ExportOptions = { format: 'json' }
  ): Promise<string> {
    try {
      const filter: AuditHistoryFilter = {};
      if (options.dateRange) {
        filter.dateRange = options.dateRange;
      }

      // Get all matching audits (no pagination for export)
      const { audits } = await this.getAuditHistory(userId, filter, { page: 1, limit: 1000 });

      if (options.format === 'summary') {
        // Export summary format
        const summaries = audits.map(audit => ({
          id: audit.id,
          url: audit.url,
          projectName: audit.projectName,
          trustScore: audit.trustScore.finalScore,
          riskLevel: audit.trustScore.riskLevel,
          confidence: audit.trustScore.confidence,
          createdAt: audit.generatedAt,
          keyFindings: audit.analysis.redFlags.concat(audit.analysis.positiveIndicators).slice(0, 5)
        }));

        return JSON.stringify({
          exportDate: new Date().toISOString(),
          totalReports: summaries.length,
          reports: summaries
        }, null, 2);
      } else {
        // Export full format
        const exportData = audits.map(audit => {
          const exportAudit: any = {
            id: audit.id,
            url: audit.url,
            projectName: audit.projectName,
            trustScore: audit.trustScore,
            analysis: audit.analysis,
            generatedAt: audit.generatedAt,
            reportVersion: audit.reportVersion
          };

          if (options.includeContent) {
            exportAudit.extractedContent = audit.extractedContent;
          }

          if (audit.hederaTransactionId) {
            exportAudit.hederaTransactionId = audit.hederaTransactionId;
          }

          return exportAudit;
        });

        return JSON.stringify({
          exportDate: new Date().toISOString(),
          totalReports: exportData.length,
          format: 'full',
          includeContent: options.includeContent || false,
          reports: exportData
        }, null, 2);
      }
    } catch (error) {
      console.error('Error exporting audit reports:', error);
      throw new Error('Failed to export audit reports');
    }
  }

  /**
   * Health check for the persistence service
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    latency: number;
    issues: string[];
  }> {
    const startTime = Date.now();
    const issues: string[] = [];
    let healthy = true;

    try {
      const supabase = getSupabaseClient();
      
      // Test basic connectivity
      const { error } = await supabase.from('users').select('id').limit(1);
      
      if (error) {
        healthy = false;
        issues.push(`Database query failed: ${error.message}`);
      }

      const latency = Date.now() - startTime;

      if (latency > 5000) {
        healthy = false;
        issues.push(`High database latency: ${latency}ms`);
      }

      return {
        healthy,
        latency,
        issues
      };

    } catch (error) {
      const latency = Date.now() - startTime;
      
      return {
        healthy: false,
        latency,
        issues: [`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Converts database row to AuditReport object
   */
  private convertRowToAuditReport(row: any): AuditReport {
    const analysisData = typeof row.analysis_data === 'string' 
      ? JSON.parse(row.analysis_data) 
      : row.analysis_data;
    
    const extractedContent = typeof row.extracted_content === 'string'
      ? JSON.parse(row.extracted_content)
      : row.extracted_content;

    return {
      id: row.id,
      url: row.url,
      projectName: row.project_name || 'Unknown Project',
      trustScore: {
        finalScore: row.trust_score,
        riskLevel: row.risk_level as 'HIGH' | 'MEDIUM' | 'LOW' | 'TRUSTED',
        confidence: row.confidence_score || 0,
        breakdown: analysisData.trustScoreBreakdown || analysisData.factors,
        adjustments: analysisData.adjustments || [],
        baseScore: analysisData.baseScore || row.trust_score,
        redFlags: analysisData.redFlags || [],
        positiveIndicators: analysisData.positiveIndicators || []
      },
      analysis: {
        factors: analysisData.factors,
        explanations: analysisData.explanations,
        recommendations: analysisData.recommendations || [],
        risks: analysisData.risks || [],
        redFlags: analysisData.redFlags || [],
        positiveIndicators: analysisData.positiveIndicators || []
      },
      extractedContent: {
        url: extractedContent.url,
        title: extractedContent.title || '',
        description: extractedContent.description || '',
        mainContent: extractedContent.mainContent || '',
        documentation: extractedContent.documentation || [],
        teamInfo: extractedContent.teamInfo || '',
        tokenomics: extractedContent.tokenomics || '',
        securityInfo: extractedContent.securityInfo || '',
        socialLinks: extractedContent.socialLinks || [],
        codeRepositories: extractedContent.codeRepositories || [],
        extractedAt: new Date(extractedContent.extractedAt)
      },
      generatedAt: new Date(row.created_at),
      reportVersion: '1.0.0',
      userId: row.user_id,
      hederaTransactionId: row.hedera_transaction_id || undefined,
      blockchainStatus: row.hedera_transaction_id ? {
        stored: true,
        transactionId: row.hedera_transaction_id,
        network: 'testnet',
        verifiable: !row.hedera_transaction_id.startsWith('mock_')
      } : undefined
    };
  }
}
