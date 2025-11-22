import { NextResponse } from 'next/server'
import { SubscriptionManager } from '@/lib/subscription-manager'

export async function GET() {
  try {
    const plans = SubscriptionManager.getAllPlans()
    
    return NextResponse.json({
      success: true,
      plans
    })
  } catch (error) {
    console.error('Error fetching subscription plans:', error)
    return NextResponse.json({
      error: 'Failed to fetch subscription plans'
    }, { status: 500 })
  }
}