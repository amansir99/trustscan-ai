import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { SubscriptionManager } from '@/lib/subscription-manager'

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { plan } = body

    if (!plan) {
      return NextResponse.json({ error: 'Plan is required' }, { status: 400 })
    }

    // Validate plan exists
    const planDetails = SubscriptionManager.getPlan(plan)
    if (!planDetails) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const result = await SubscriptionManager.downgradeSubscription(user.id, plan)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Get updated subscription status
    const status = await SubscriptionManager.getUserSubscriptionStatus(user.id)

    return NextResponse.json({
      success: true,
      message: `Successfully downgraded to ${planDetails.displayName}`,
      status
    })
  } catch (error) {
    console.error('Error downgrading subscription:', error)
    return NextResponse.json({
      error: 'Failed to downgrade subscription'
    }, { status: 500 })
  }
}