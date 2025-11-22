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

    const result = await SubscriptionManager.cancelSubscription(user.id)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Get updated subscription status
    const status = await SubscriptionManager.getUserSubscriptionStatus(user.id)

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully. You can continue using your current plan until it expires.',
      status
    })
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json({
      error: 'Failed to cancel subscription'
    }, { status: 500 })
  }
}