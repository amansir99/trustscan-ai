import { NextRequest, NextResponse } from 'next/server'
import { getHederaService } from '@/lib/hedera'
import { getSupabaseClient } from '@/lib/db-supabase'

/**
 * POST /api/payment/subscribe - Process subscription payment with Hedera integration
 * Requirements: 8.4, 8.5
 * 
 * Handles subscription upgrades with mock HBAR payment processing
 */

interface SubscribeRequest {
  plan: 'free' | 'pro' | 'max';
  paymentMethod: 'hbar' | 'demo';
  fromAccountId?: string;
}

interface SubscribeResponse {
  success: boolean;
  transactionId?: string;
  hederaTransactionId?: string;
  message?: string;
  error?: string;
  subscriptionDetails?: {
    plan: string;
    expiresAt: string;
    features: string[];
  };
}

// Subscription plan configurations
const SUBSCRIPTION_PLANS = {
  free: {
    price: 0,
    auditsPerMonth: 3,
    features: ['Basic audit reports', 'Trust score calculation', 'Risk assessment']
  },
  pro: {
    price: 10, // HBAR
    auditsPerMonth: -1, // Unlimited
    features: [
      'Unlimited audit reports',
      'Detailed analysis',
      'Blockchain verification',
      'Export functionality',
      'Priority support'
    ]
  },
  max: {
    price: 50, // HBAR
    auditsPerMonth: 1000,
    features: [
      'All Pro features',
      '1000 audits per month',
      'Priority support',
      'Dedicated support',
      'Advanced analytics'
    ]
  }
};

export async function POST(request: NextRequest): Promise<NextResponse<SubscribeResponse>> {
  try {
    // Authenticate user via cookie
    const userId = request.cookies.get('userId')?.value
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Get user from database
    const supabase = getSupabaseClient()
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, subscription_tier')
      .eq('id', userId)
      .single()
    
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { plan, paymentMethod = 'demo', fromAccountId } = body as SubscribeRequest

    // Validate plan
    if (!plan || !SUBSCRIPTION_PLANS[plan]) {
      return NextResponse.json({
        success: false,
        error: 'Invalid subscription plan'
      }, { status: 400 })
    }

    const planConfig = SUBSCRIPTION_PLANS[plan]

    // Handle free plan (no payment required)
    if (plan === 'free') {
      await supabase
        .from('users')
        .update({
          subscription_tier: plan,
          subscription_expires: null
        })
        .eq('id', userId)

      return NextResponse.json({
        success: true,
        message: 'Subscription updated to free plan',
        subscriptionDetails: {
          plan,
          expiresAt: 'Never',
          features: planConfig.features
        }
      })
    }

    let transactionId: string
    let hederaTransactionId: string | undefined

    // Process payment based on method
    if (paymentMethod === 'hbar' && fromAccountId) {
      // Process HBAR payment through Hedera
      console.log(`Processing HBAR payment: ${planConfig.price} HBAR for ${plan} plan`)
      
      const hederaService = getHederaService()
      const paymentResult = await hederaService.processMockPayment(
        fromAccountId,
        planConfig.price,
        plan
      )

      if (paymentResult.status !== 'SUCCESS') {
        return NextResponse.json({
          success: false,
          error: paymentResult.error || 'Payment processing failed'
        }, { status: 400 })
      }

      transactionId = paymentResult.transactionId
      hederaTransactionId = paymentResult.transactionId

    } else {
      // Demo payment processing
      await new Promise(resolve => setTimeout(resolve, 2500))
      transactionId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // Calculate subscription expiration (30 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Update user subscription in database
    await supabase
      .from('users')
      .update({
        subscription_tier: plan,
        subscription_expires: expiresAt.toISOString()
      })
      .eq('id', user.id)

    // Record subscription in subscriptions table (if table exists)
    try {
      await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan: plan,
          status: 'active',
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        })
    } catch (e) {
      console.log('Subscriptions table may not exist, skipping insert')
    }

    console.log(`✅ Subscription activated: ${plan} for user ${userId}`)

    return NextResponse.json({
      success: true,
      transactionId,
      hederaTransactionId,
      message: `${plan.charAt(0).toUpperCase() + plan.slice(1)} subscription activated!`,
      subscriptionDetails: {
        plan,
        expiresAt: expiresAt.toISOString(),
        features: planConfig.features
      }
    })

  } catch (error) {
    console.error('Subscription payment error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed'
    }, { status: 500 })
  }
}

/**
 * GET /api/payment/subscribe - Get subscription plans and pricing
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const hederaService = getHederaService()
    const networkInfo = hederaService.getNetworkInfo()

    return NextResponse.json({
      success: true,
      plans: SUBSCRIPTION_PLANS,
      paymentMethods: ['demo', 'hbar'],
      hederaNetwork: networkInfo,
      currency: 'HBAR'
    })

  } catch (error) {
    console.error('Get subscription plans error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to load subscription plans'
    }, { status: 500 })
  }
}
