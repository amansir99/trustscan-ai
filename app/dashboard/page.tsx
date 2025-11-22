'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  BarChart3,
  CheckCircle,
  Crown,
  Zap,
  Gift,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/lib/useAuth'
import { DashboardSkeleton } from '@/components/LoadingStates'
import { supabase } from '@/lib/supabase'

// Coupon Upgrade Component
function CouponUpgrade({ onSuccess }: { onSuccess: () => void }) {
  const [couponCode, setCouponCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showCoupons, setShowCoupons] = useState(false)

  const demoCoupons = [
    { code: 'TRUSTSCAN-PRO', plan: 'PRO', duration: '30 days' },
    { code: 'TRUSTSCAN-MAX', plan: 'MAX', duration: '30 days' },
    { code: 'DEMO-PRO', plan: 'PRO', duration: '7 days' },
    { code: 'DEMO-MAX', plan: 'MAX', duration: '7 days' }
  ]

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setMessage({ type: 'error', text: 'Please enter a coupon code' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // Get session token from Supabase
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setMessage({ type: 'error', text: 'Please log in to apply coupons' })
        setLoading(false)
        return
      }

      const response = await fetch('/api/subscription/coupon', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ couponCode: couponCode.trim() })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: data.message || 'Coupon applied successfully!' 
        })
        setCouponCode('')
        // Refresh user data after 1 second
        setTimeout(() => {
          onSuccess()
        }, 1000)
      } else {
        setMessage({ 
          type: 'error', 
          text: data.error || 'Invalid coupon code. Please try again.' 
        })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to apply coupon. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 flex items-center gap-2">
          <Gift className="w-4 h-4" />
          <strong>Demo Mode:</strong> Use coupon codes to test PRO and MAX plans without payment!
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter coupon code"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
          disabled={loading}
          className="flex-1"
        />
        <Button onClick={handleApplyCoupon} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Applying...
            </>
          ) : (
            'Apply'
          )}
        </Button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div>
        <button
          onClick={() => setShowCoupons(!showCoupons)}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          {showCoupons ? 'Hide' : 'Show'} available demo coupons
        </button>

        {showCoupons && (
          <div className="mt-3 space-y-2">
            {demoCoupons.map((coupon) => (
              <div
                key={coupon.code}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                onClick={() => setCouponCode(coupon.code)}
              >
                <div>
                  <code className="text-sm font-mono font-semibold text-purple-600">
                    {coupon.code}
                  </code>
                  <p className="text-xs text-gray-600 mt-1">
                    {coupon.plan} Plan • {coupon.duration}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={(e) => {
                  e.stopPropagation()
                  setCouponCode(coupon.code)
                }}>
                  Use
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading, refreshUser } = useAuth()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const handleCouponSuccess = async () => {
    // Refresh user data from database
    await refreshUser()
  }

  const getSubscriptionInfo = () => {
    if (!user) return { plan: 'Free', limit: 10, used: 0, color: 'gray' }
    
    const plan = user.subscription_tier || 'free'
    const limits = {
      free: { limit: 10, color: 'gray' },
      pro: { limit: 100, color: 'blue' },
      max: { limit: 999999, color: 'purple' }
    }
    
    return {
      plan: plan.charAt(0).toUpperCase() + plan.slice(1),
      limit: limits[plan as keyof typeof limits]?.limit || 10,
      used: user.auditsThisMonth || 0,
      color: limits[plan as keyof typeof limits]?.color || 'gray'
    }
  }

  if (authLoading || !user) {
    return <DashboardSkeleton />
  }

  const subscriptionInfo = getSubscriptionInfo()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Welcome back, {(user as any).name || user.email?.split('@')[0] || 'User'}!
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Link href="/pricing">
                <Button variant="outline" size="sm">
                  <Crown className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Upgrade</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Subscription Status
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold bg-${subscriptionInfo.color}-100 text-${subscriptionInfo.color}-800`}>
                {subscriptionInfo.plan}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Monthly Usage</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{subscriptionInfo.used}</span>
                  <span className="text-gray-500">
                    / {subscriptionInfo.limit === 999999 ? 'Unlimited' : subscriptionInfo.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full bg-${subscriptionInfo.color}-500`}
                    style={{ 
                      width: subscriptionInfo.limit === 999999 
                        ? '100%' 
                        : `${Math.min((subscriptionInfo.used / subscriptionInfo.limit) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Plan Benefits</p>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {subscriptionInfo.limit === 999999 ? 'Unlimited' : subscriptionInfo.limit} audits/month
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Full detailed analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Export reports
                  </li>
                </ul>
              </div>
              
              <div className="flex items-center justify-center">
                {subscriptionInfo.used >= subscriptionInfo.limit && subscriptionInfo.limit !== 999999 ? (
                  <Link href="/pricing">
                    <Button className="w-full">
                      Upgrade Plan
                    </Button>
                  </Link>
                ) : (
                  <Link href="/audit">
                    <Button className="w-full">
                      Start New Audit
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo: Coupon Code Section */}
        {subscriptionInfo.plan === 'Free' && (
          <Card className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-purple-600" />
                Upgrade with Coupon Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CouponUpgrade onSuccess={handleCouponSuccess} />
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">New Analysis</h3>
                  <p className="text-gray-600 text-sm">Analyze a DeFi project</p>
                </div>
                <Search className="h-8 w-8 text-blue-600" />
              </div>
              <Link href="/audit">
                <Button className="w-full">Start Audit</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Documentation</h3>
                  <p className="text-gray-600 text-sm">Learn how to use TrustScan</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <Link href="/docs">
                <Button variant="outline" className="w-full">View Docs</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Pricing Plans</h3>
                  <p className="text-gray-600 text-sm">Upgrade your account</p>
                </div>
                <Crown className="h-8 w-8 text-blue-600" />
              </div>
              <Link href="/pricing">
                <Button variant="outline" className="w-full">View Plans</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}