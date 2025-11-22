import { getUserById, incrementUserAudits, resetMonthlyAudits, trackUsage as trackUsageDb } from './database'
import { SubscriptionManager } from './subscription-manager'
import { getSupabaseClient } from './db-supabase'

export interface UsageStats {
  auditsThisMonth: number
  auditLimit: number
  remainingAudits: number
  resetDate: Date
  subscriptionTier: string
}

export interface UsageTrackingResult {
  success: boolean
  error?: string
  newCount?: number
}

/**
 * Enhanced usage tracker with monthly limits and automatic reset
 */
export class UsageTracker {
  
  /**
   * Track user action and update usage counters
   */
  static async trackUsage(
    userId: string, 
    action: string, 
    metadata: any = {}
  ): Promise<void> {
    try {
      await trackUsageDb(userId, action, metadata)
    } catch (error) {
      console.error('Failed to track usage:', error)
    }
  }

  /**
   * Track audit creation and increment counter
   */
  static async trackAuditUsage(userId: string, auditId: string): Promise<UsageTrackingResult> {
    try {
      // Check if user needs monthly reset
      await this.checkAndResetMonthlyUsage(userId)
      
      // Check if user can perform audit
      const canAudit = await SubscriptionManager.canUserAudit(userId)
      if (!canAudit.allowed) {
        return {
          success: false,
          error: canAudit.reason
        }
      }

      // Increment audit counter
      const newCount = await incrementUserAudits(userId)
      
      // Track the usage
      await this.trackUsage(userId, 'audit_created', { auditId })

      return {
        success: true,
        newCount
      }
    } catch (error) {
      console.error('Failed to track audit usage:', error)
      return {
        success: false,
        error: 'Failed to track usage'
      }
    }
  }

  /**
   * Increment user audit count without storing audit (for temporary audits)
   */
  static async incrementUserAuditCount(userId: string): Promise<UsageTrackingResult> {
    try {
      // Check if user needs monthly reset
      await this.checkAndResetMonthlyUsage(userId)
      
      // Increment audit counter
      const newCount = await incrementUserAudits(userId)
      
      // Track the usage
      await this.trackUsage(userId, 'audit_generated', { temporary: true })

      return {
        success: true,
        newCount
      }
    } catch (error) {
      console.error('Failed to increment audit count:', error)
      return {
        success: false,
        error: 'Failed to track usage'
      }
    }
  }

  /**
   * Get user's current usage statistics
   */
  static async getUserUsageStats(userId: string): Promise<UsageStats | null> {
    try {
      const user = await getUserById(userId)
      if (!user) {
        return null
      }

      // Check if user needs monthly reset
      await this.checkAndResetMonthlyUsage(userId)
      
      // Get fresh user data after potential reset
      const freshUser = await getUserById(userId)
      if (!freshUser) {
        return null
      }

      const subscriptionStatus = await SubscriptionManager.getUserSubscriptionStatus(userId)
      if (!subscriptionStatus) {
        return null
      }

      const auditLimit = subscriptionStatus.auditsLimit
      const auditsThisMonth = freshUser.audits_this_month || 0
      const remainingAudits = auditLimit === -1 ? -1 : Math.max(0, auditLimit - auditsThisMonth)
      
      // Calculate next reset date (first day of next month)
      const now = new Date()
      const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1)

      return {
        auditsThisMonth,
        auditLimit,
        remainingAudits,
        resetDate: nextReset,
        subscriptionTier: subscriptionStatus.tier
      }
    } catch (error) {
      console.error('Failed to get usage stats:', error)
      return null
    }
  }

  /**
   * Check if user can perform an audit
   */
  static async canUserAudit(userId: string): Promise<{ allowed: boolean; reason?: string; stats?: UsageStats }> {
    try {
      const stats = await this.getUserUsageStats(userId)
      if (!stats) {
        return { allowed: false, reason: 'Unable to determine usage statistics' }
      }

      // Unlimited plans
      if (stats.auditLimit === -1) {
        return { allowed: true, stats }
      }

      // Check monthly limit
      if (stats.auditsThisMonth >= stats.auditLimit) {
        return { 
          allowed: false, 
          reason: `Monthly audit limit reached (${stats.auditLimit}). Upgrade your plan for unlimited audits.`,
          stats
        }
      }

      return { allowed: true, stats }
    } catch (error) {
      console.error('Error checking audit permission:', error)
      return { allowed: false, reason: 'Error checking usage limits' }
    }
  }

  /**
   * Check if user needs monthly reset and perform it
   */
  static async checkAndResetMonthlyUsage(userId: string): Promise<boolean> {
    try {
      const user = await getUserById(userId)
      if (!user) {
        return false
      }

      const now = new Date()
      const lastReset = user.last_audit_reset ? new Date(user.last_audit_reset) : new Date(0)
      
      // Check if it's been more than a month since last reset
      const monthsSinceReset = (now.getFullYear() - lastReset.getFullYear()) * 12 + 
                              (now.getMonth() - lastReset.getMonth())
      
      if (monthsSinceReset >= 1) {
        await resetMonthlyAudits(userId)
        return true
      }

      return false
    } catch (error) {
      console.error('Error checking monthly reset:', error)
      return false
    }
  }

  /**
   * Get usage history for a user
   */
  static async getUserUsageHistory(
    userId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<any[]> {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('usage_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting usage history:', error)
      return []
    }
  }

  /**
   * Get usage analytics for admin dashboard
   */
  static async getUsageAnalytics(days: number = 30): Promise<any> {
    try {
      const supabase = getSupabaseClient()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      
      const { data, error } = await supabase
        .from('usage_logs')
        .select('created_at, action')
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Group by date and action
      const grouped: any = {}
      data?.forEach((log: any) => {
        const date = new Date(log.created_at).toISOString().split('T')[0]
        const key = `${date}_${log.action}`
        grouped[key] = (grouped[key] || 0) + 1
      })
      
      return Object.entries(grouped).map(([key, count]) => {
        const [date, action] = key.split('_')
        return { date, action, count }
      })
    } catch (error) {
      console.error('Error getting usage analytics:', error)
      return []
    }
  }

  /**
   * Reset all users' monthly counters (for cron job)
   */
  static async resetAllMonthlyCounters(): Promise<void> {
    try {
      const supabase = getSupabaseClient()
      const firstOfMonth = new Date()
      firstOfMonth.setDate(1)
      firstOfMonth.setHours(0, 0, 0, 0)
      
      const { error } = await supabase
        .from('users')
        .update({ 
          audits_this_month: 0, 
          last_audit_reset: new Date().toISOString().split('T')[0]
        })
        .lt('last_audit_reset', firstOfMonth.toISOString().split('T')[0])
      
      if (error) throw error
      console.log('All monthly counters reset successfully')
    } catch (error) {
      console.error('Error resetting all monthly counters:', error)
    }
  }
}

// Legacy functions for backward compatibility
export async function trackUsage(userId: string, action: string, metadata: any = {}) {
  return UsageTracker.trackUsage(userId, action, metadata)
}

export async function checkUsageLimit(userId: string) {
  const result = await UsageTracker.canUserAudit(userId)
  return result.allowed
}