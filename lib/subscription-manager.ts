import { getUserById, updateUserSubscription } from './database'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export interface SubscriptionPlan {
  id: string
  name: string
  displayName: string
  price: number
  auditsPerMonth: number
  features: string[]
  popular?: boolean
}

export interface SubscriptionStatus {
  tier: string
  status: 'active' | 'expired' | 'cancelled'
  expiresAt?: Date
  auditsUsed: number
  auditsLimit: number
  canUpgrade: boolean
  canDowngrade: boolean
}

// Define subscription plans
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'free',
    displayName: 'Free',
    price: 0,
    auditsPerMonth: 3,
    features: [
      '3 audits per month',
      'Basic trust scoring',
      'Standard reports',
      'Community support'
    ]
  },
  pro: {
    id: 'pro',
    name: 'pro',
    displayName: 'Pro',
    price: 29,
    auditsPerMonth: -1, // Unlimited
    features: [
      'Unlimited audits',
      'Advanced analytics',
      'Detailed reports',
      'Export functionality',
      'Priority support',
      'Hedera blockchain storage'
    ],
    popular: true
  },
  max: {
    id: 'max',
    name: 'max',
    displayName: 'Max',
    price: 99,
    auditsPerMonth: 1000,
    features: [
      'Everything in Pro',
      'API access',
      'Custom integrations',
      'Dedicated support',
      'Advanced security features',
      'Custom reporting'
    ]
  }
}

export class SubscriptionManager {
  
  /**
   * Get subscription plan details
   */
  static getPlan(planId: string): SubscriptionPlan | null {
    return SUBSCRIPTION_PLANS[planId] || null
  }

  /**
   * Get all available plans
   */
  static getAllPlans(): SubscriptionPlan[] {
    return Object.values(SUBSCRIPTION_PLANS)
  }

  /**
   * Get user's current subscription status
   */
  static async getUserSubscriptionStatus(userId: string): Promise<SubscriptionStatus | null> {
    try {
      const user = await getUserById(userId)
      if (!user) {
        return null
      }

      const now = new Date()
      const tier = user.subscription_tier || 'free'
      const expiresAt = user.subscription_expires ? new Date(user.subscription_expires) : undefined
      
      // Check if subscription has expired
      const isExpired = expiresAt && expiresAt < now
      const currentTier = isExpired ? 'free' : tier
      
      const plan = this.getPlan(currentTier)
      if (!plan) {
        return null
      }

      return {
        tier: currentTier,
        status: isExpired ? 'expired' : 'active',
        expiresAt: expiresAt,
        auditsUsed: user.audits_this_month || 0,
        auditsLimit: plan.auditsPerMonth,
        canUpgrade: currentTier !== 'max',
        canDowngrade: currentTier !== 'free'
      }
    } catch (error) {
      console.error('Error getting subscription status:', error)
      return null
    }
  }

  /**
   * Check if user can perform an audit based on their subscription
   */
  static async canUserAudit(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const status = await this.getUserSubscriptionStatus(userId)
      if (!status) {
        return { allowed: false, reason: 'Unable to determine subscription status' }
      }

      // Unlimited plans
      if (status.auditsLimit === -1) {
        return { allowed: true }
      }

      // Check monthly limit
      if (status.auditsUsed >= status.auditsLimit) {
        return { 
          allowed: false, 
          reason: `Monthly audit limit reached (${status.auditsLimit}). Upgrade your plan for unlimited audits.` 
        }
      }

      return { allowed: true }
    } catch (error) {
      console.error('Error checking audit permission:', error)
      return { allowed: false, reason: 'Error checking subscription status' }
    }
  }

  /**
   * Upgrade user subscription
   */
  static async upgradeSubscription(
    userId: string, 
    newTier: string, 
    durationMonths: number = 1
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const plan = this.getPlan(newTier)
      if (!plan) {
        return { success: false, error: 'Invalid subscription plan' }
      }

      const user = await getUserById(userId)
      if (!user) {
        return { success: false, error: 'User not found' }
      }

      const currentTier = user.subscription_tier || 'free'
      
      // Validate upgrade path
      if (!this.isValidUpgrade(currentTier, newTier)) {
        return { success: false, error: 'Invalid upgrade path' }
      }

      // Calculate expiration date
      const now = new Date()
      const expiresAt = new Date(now.getTime() + (durationMonths * 30 * 24 * 60 * 60 * 1000))

      // Update user subscription
      const updatedUser = await updateUserSubscription(userId, {
        subscription_tier: newTier,
        audit_limit: plan.auditsPerMonth,
        subscription_expires: expiresAt
      })
      if (!updatedUser) {
        return { success: false, error: 'Failed to update subscription' }
      }

      // Create subscription record
      await this.createSubscriptionRecord(userId, newTier, expiresAt)

      return { success: true }
    } catch (error) {
      console.error('Error upgrading subscription:', error)
      return { success: false, error: 'Failed to upgrade subscription' }
    }
  }

  /**
   * Downgrade user subscription
   */
  static async downgradeSubscription(
    userId: string, 
    newTier: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const plan = this.getPlan(newTier)
      if (!plan) {
        return { success: false, error: 'Invalid subscription plan' }
      }

      const user = await getUserById(userId)
      if (!user) {
        return { success: false, error: 'User not found' }
      }

      const currentTier = user.subscription_tier || 'free'
      
      // Validate downgrade path
      if (!this.isValidDowngrade(currentTier, newTier)) {
        return { success: false, error: 'Invalid downgrade path' }
      }

      // For downgrades, we typically let the current subscription expire
      // and set the new tier to take effect at expiration
      const expiresAt = newTier === 'free' ? null : user.subscription_expires

      // Update user subscription
      const updatedUser = await updateUserSubscription(userId, {
        subscription_tier: newTier,
        audit_limit: plan.auditsPerMonth,
        subscription_expires: expiresAt
      })
      if (!updatedUser) {
        return { success: false, error: 'Failed to update subscription' }
      }

      return { success: true }
    } catch (error) {
      console.error('Error downgrading subscription:', error)
      return { success: false, error: 'Failed to downgrade subscription' }
    }
  }

  /**
   * Cancel user subscription (downgrade to free at expiration)
   */
  static async cancelSubscription(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await getUserById(userId)
      if (!user) {
        return { success: false, error: 'User not found' }
      }

      // Mark subscription as cancelled but let it run until expiration
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', userId)
        .eq('status', 'active')

      return { success: true }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      return { success: false, error: 'Failed to cancel subscription' }
    }
  }

  /**
   * Reset monthly audit counter for all users (called by cron job)
   */
  static async resetMonthlyAudits(): Promise<void> {
    try {
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      
      await supabase
        .from('users')
        .update({ 
          audits_this_month: 0, 
          last_audit_reset: new Date().toISOString().split('T')[0]
        })
        .lt('last_audit_reset', oneMonthAgo.toISOString().split('T')[0])
      console.log('Monthly audit counters reset successfully')
    } catch (error) {
      console.error('Error resetting monthly audits:', error)
    }
  }

  /**
   * Check and expire subscriptions
   */
  static async expireSubscriptions(): Promise<void> {
    try {
      const now = new Date()
      
      // Find expired subscriptions
      const { data: expiredUsers } = await supabase
        .from('users')
        .select('id')
        .lt('subscription_expires', now.toISOString())
        .neq('subscription_tier', 'free')

      // Downgrade expired users to free tier
      if (expiredUsers && expiredUsers.length > 0) {
        for (const user of expiredUsers) {
          const freePlan = this.getPlan('free')!
          await updateUserSubscription(user.id, {
            subscription_tier: 'free',
            audit_limit: freePlan.auditsPerMonth,
            subscription_expires: null
          })
        }
      }

      console.log(`Expired ${expiredUsers?.length || 0} subscriptions`)
    } catch (error) {
      console.error('Error expiring subscriptions:', error)
    }
  }

  /**
   * Private helper methods
   */
  private static isValidUpgrade(currentTier: string, newTier: string): boolean {
    const tierLevels = { free: 0, pro: 1, max: 2 }
    const currentLevel = tierLevels[currentTier as keyof typeof tierLevels] ?? 0
    const newLevel = tierLevels[newTier as keyof typeof tierLevels] ?? 0
    return newLevel > currentLevel
  }

  private static isValidDowngrade(currentTier: string, newTier: string): boolean {
    const tierLevels = { free: 0, pro: 1, max: 2 }
    const currentLevel = tierLevels[currentTier as keyof typeof tierLevels] ?? 0
    const newLevel = tierLevels[newTier as keyof typeof tierLevels] ?? 0
    return newLevel < currentLevel
  }

  private static async createSubscriptionRecord(
    userId: string, 
    plan: string, 
    expiresAt: Date
  ): Promise<void> {
    await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan: plan,
        expires_at: expiresAt.toISOString()
      })
  }
}