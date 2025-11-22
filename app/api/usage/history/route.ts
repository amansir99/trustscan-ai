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

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Validate parameters
    if (limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Limit must be between 1 and 100' }, { status: 400 })
    }

    if (offset < 0) {
      return NextResponse.json({ error: 'Offset must be non-negative' }, { status: 400 })
    }

    const history = await UsageTracker.getUserUsageHistory(user.id, limit, offset)

    return NextResponse.json({
      success: true,
      history,
      pagination: {
        limit,
        offset,
        count: history.length
      }
    })
  } catch (error) {
    console.error('Error getting usage history:', error)
    return NextResponse.json({
      error: 'Failed to get usage history'
    }, { status: 500 })
  }
}