/**
 * Subscription Tiers and Limits Configuration
 * Centralized configuration for subscription plans
 */

export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  MAX: 'max'
} as const;

export type SubscriptionTier = typeof SUBSCRIPTION_TIERS[keyof typeof SUBSCRIPTION_TIERS];

export interface TierLimits {
  name: string;
  displayName: string;
  auditLimit: number;
  auditLimitDisplay: string;
  price: number;
  features: string[];
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    name: 'free',
    displayName: 'Free',
    auditLimit: 10,
    auditLimitDisplay: '10 audits/month',
    price: 0,
    features: [
      '10 audits per month',
      'Basic security analysis',
      'Trust score calculation',
      'Real-time report generation',
      'No audit history storage'
    ]
  },
  pro: {
    name: 'pro',
    displayName: 'Pro',
    auditLimit: 100,
    auditLimitDisplay: '100 audits/month',
    price: 29,
    features: [
      '100 audits per month',
      'Advanced AI analysis',
      'Detailed risk assessment',
      'Priority processing',
      'Email support',
      'No audit history storage'
    ]
  },
  max: {
    name: 'max',
    displayName: 'Max',
    auditLimit: 999999, // Effectively unlimited
    auditLimitDisplay: 'Unlimited audits',
    price: 99,
    features: [
      'Unlimited audits',
      'Premium AI analysis',
      'Comprehensive security reports',
      'Highest priority processing',
      'Dedicated support',
      'API access (coming soon)',
      'No audit history storage'
    ]
  }
};

/**
 * Get audit limit for a subscription tier
 */
export function getAuditLimitForTier(tier: SubscriptionTier): number {
  return TIER_LIMITS[tier]?.auditLimit || TIER_LIMITS.free.auditLimit;
}

/**
 * Check if a tier has unlimited audits
 */
export function isUnlimitedTier(tier: SubscriptionTier): boolean {
  return tier === SUBSCRIPTION_TIERS.MAX;
}

/**
 * Validate subscription tier
 */
export function isValidTier(tier: string): tier is SubscriptionTier {
  return Object.values(SUBSCRIPTION_TIERS).includes(tier as SubscriptionTier);
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: SubscriptionTier): string {
  return TIER_LIMITS[tier]?.displayName || 'Unknown';
}

/**
 * Check if user has reached audit limit
 */
export function hasReachedLimit(auditsThisMonth: number, tier: SubscriptionTier): boolean {
  if (isUnlimitedTier(tier)) {
    return false;
  }
  return auditsThisMonth >= getAuditLimitForTier(tier);
}

/**
 * Get remaining audits for the month
 */
export function getRemainingAudits(auditsThisMonth: number, tier: SubscriptionTier): number | 'unlimited' {
  if (isUnlimitedTier(tier)) {
    return 'unlimited';
  }
  const limit = getAuditLimitForTier(tier);
  return Math.max(0, limit - auditsThisMonth);
}

/**
 * Calculate usage percentage
 */
export function getUsagePercentage(auditsThisMonth: number, tier: SubscriptionTier): number {
  if (isUnlimitedTier(tier)) {
    return 0; // No limit to calculate percentage against
  }
  const limit = getAuditLimitForTier(tier);
  return Math.min(100, Math.round((auditsThisMonth / limit) * 100));
}
