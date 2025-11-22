import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { SubscriptionManager } from '@/lib/subscription-manager'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const status = await SubscriptionManager.getUserSubscriptionStatus(user.id)
    if (!status) {
      return NextResponse.json({ error: 'Unable to get subscription status' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      status
    })
  } catch (error) {
    console.error('Error getting subscription status:', error)
    return NextResponse.json({
      error: 'Failed to get subscription status'
    }, { status: 500 })
  }
}