import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { UsageTracker } from '@/lib/usage-tracker'

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

    const result = await UsageTracker.canUserAudit(user.id)

    return NextResponse.json({
      success: true,
      canAudit: result.allowed,
      reason: result.reason,
      stats: result.stats
    })
  } catch (error) {
    console.error('Error checking usage limits:', error)
    return NextResponse.json({
      error: 'Failed to check usage limits'
    }, { status: 500 })
  }
}