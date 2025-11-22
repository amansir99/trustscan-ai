import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Valid coupon codes with their configurations
const VALID_COUPONS: Record<string, {
  tier: 'pro' | 'max';
  duration: number; // days
  description: string;
}> = {
  'TRUSTSCAN-PRO': {
    tier: 'pro',
    duration: 30,
    description: '1 month Pro trial'
  },
  'TRUSTSCAN-MAX': {
    tier: 'max',
    duration: 30,
    description: '1 month Max trial'
  },
  'DEMO-PRO': {
    tier: 'pro',
    duration: 7,
    description: '7 days Pro trial'
  },
  'DEMO-MAX': {
    tier: 'max',
    duration: 7,
    description: '7 days Max trial'
  },
  'TRIAL-PRO': {
    tier: 'pro',
    duration: 14,
    description: '14 days Pro trial'
  },
  'TRIAL-MAX': {
    tier: 'max',
    duration: 14,
    description: '14 days Max trial'
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      )
    }

    // Create Supabase client with the access token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )

    // Get authenticated user using the token
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Invalid authentication token. Please log in again.' },
        { status: 401 }
      )
    }

    // Parse request body
    const { couponCode } = await request.json()

    if (!couponCode || typeof couponCode !== 'string') {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      )
    }

    // Validate coupon code
    const normalizedCode = couponCode.trim().toUpperCase()
    const coupon = VALID_COUPONS[normalizedCode]

    if (!coupon) {
      return NextResponse.json(
        { error: 'Invalid coupon code' },
        { status: 400 }
      )
    }

    // Get user's current subscription
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('subscription_tier, subscription_expires')
      .eq('id', user.id)
      .single()

    if (fetchError || !userData) {
      console.error('Error fetching user:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      )
    }

    // Check if user has already used this coupon (optional - requires coupon_usage table)
    try {
      const { data: existingUsage } = await supabase
        .from('coupon_usage')
        .select('id')
        .eq('user_id', user.id)
        .eq('coupon_code', normalizedCode)
        .single()

      if (existingUsage) {
        return NextResponse.json(
          { error: 'You have already used this coupon code' },
          { status: 400 }
        )
      }
    } catch (checkError) {
      // Ignore if coupon_usage table doesn't exist
      console.log('Coupon usage check skipped (table not available)')
    }

    // Check if user already has an active subscription
    const now = new Date()
    const currentExpiry = userData.subscription_expires 
      ? new Date(userData.subscription_expires) 
      : null

    // If user has an active paid subscription, don't allow coupon
    if (currentExpiry && currentExpiry > now && userData.subscription_tier !== 'free') {
      return NextResponse.json(
        { 
          error: 'You already have an active subscription. Coupons can only be used on free accounts.' 
        },
        { status: 400 }
      )
    }

    // Calculate expiration date
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + coupon.duration)

    // Set audit limit based on tier
    const auditLimit = coupon.tier === 'pro' ? 100 : 999999

    // Update user subscription
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_tier: coupon.tier,
        audit_limit: auditLimit,
        subscription_expires: expirationDate.toISOString(),
        audits_this_month: 0, // Reset audit count
        last_audit_reset: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating subscription:', updateError)
      return NextResponse.json(
        { error: 'Failed to apply coupon' },
        { status: 500 }
      )
    }

    // Log the coupon usage in usage_logs
    await supabase
      .from('usage_logs')
      .insert({
        user_id: user.id,
        action: 'coupon_applied',
        metadata: {
          coupon_code: normalizedCode,
          tier: coupon.tier,
          duration: coupon.duration,
          expires_at: expirationDate.toISOString()
        }
      })

    // Track coupon usage (optional - prevents reuse)
    // This will fail silently if the table doesn't exist
    try {
      await supabase
        .from('coupon_usage')
        .insert({
          user_id: user.id,
          coupon_code: normalizedCode,
          tier_granted: coupon.tier,
          duration_days: coupon.duration,
          expires_at: expirationDate.toISOString()
        })
    } catch (trackError) {
      // Ignore if coupon_usage table doesn't exist
      console.log('Coupon tracking table not available (optional feature)')
    }

    return NextResponse.json({
      success: true,
      message: `Coupon applied successfully! You now have ${coupon.description}.`,
      subscription: {
        tier: coupon.tier,
        auditLimit: auditLimit,
        expiresAt: expirationDate.toISOString(),
        description: coupon.description
      }
    })

  } catch (error) {
    console.error('Coupon application error:', error)
    return NextResponse.json(
      { error: 'An error occurred while applying the coupon' },
      { status: 500 }
    )
  }
}

// GET endpoint to list available coupons (for demo purposes)
export async function GET() {
  const coupons = Object.entries(VALID_COUPONS).map(([code, config]) => ({
    code,
    tier: config.tier.toUpperCase(),
    duration: `${config.duration} days`,
    description: config.description
  }))

  return NextResponse.json({
    coupons,
    note: 'These are demo coupon codes for testing. In production, these would be stored in a database.'
  })
}
