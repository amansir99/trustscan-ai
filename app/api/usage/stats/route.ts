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

    const stats = await UsageTracker.getUserUsageStats(user.id)
    if (!stats) {
      return NextResponse.json({ error: 'Unable to get usage statistics' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('Error getting usage stats:', error)
    return NextResponse.json({
      error: 'Failed to get usage statistics'
    }, { status: 500 })
  }
}