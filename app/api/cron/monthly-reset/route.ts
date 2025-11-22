import { NextRequest, NextResponse } from 'next/server'
import { UsageTracker } from '@/lib/usage-tracker'
import { SubscriptionManager } from '@/lib/subscription-manager'

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting monthly reset job...')
    
    // Reset monthly audit counters
    await UsageTracker.resetAllMonthlyCounters()
    
    // Expire subscriptions
    await SubscriptionManager.expireSubscriptions()
    
    console.log('Monthly reset job completed successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Monthly reset completed successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Monthly reset job failed:', error)
    return NextResponse.json({
      error: 'Monthly reset job failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Also allow GET for manual testing (with proper auth)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      message: 'Monthly reset endpoint is active',
      nextReset: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get cron status' }, { status: 500 })
  }
}