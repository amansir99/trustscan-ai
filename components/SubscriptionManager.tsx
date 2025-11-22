'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { 
  Crown, 
  Check, 
  Zap, 
  Shield, 
  Download, 
  BarChart3,
  Clock,
  AlertCircle,
  CreditCard
} from 'lucide-react'
import { useAuth } from '@/lib/useAuth'

interface SubscriptionPlan {
  id: string
  name: string
  price: number
  interval: 'month' | 'year'
  auditsPerMonth: number
  features: string[]
  popular?: boolean
  current?: boolean
}

interface Subscription {
  id: string
  plan: string
  status: 'active' | 'expired' | 'cancelled'
  expires_at: string
  created_at: string
}

export default function SubscriptionManager() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)

  const plans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: 'month',
      auditsPerMonth: 3,
      features: [
        '3 audits per month',
        'Basic trust scoring',
        'Standard reports',
        'Email support'
      ],
      current: user?.subscription_tier === 'free'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29,
      interval: 'month',
      auditsPerMonth: 50,
      features: [
        '50 audits per month',
        'Advanced AI analysis',
        'Detailed reports with explanations',
        'Export to PDF/CSV',
        'Priority support',
        'Hedera blockchain storage'
      ],
      popular: true,
      current: user?.subscription_tier === 'pro'
    },
    {
      id: 'max',
      name: 'Max',
      price: 99,
      interval: 'month',
      auditsPerMonth: 1000,
      features: [
        '1000 audits per month',
        'Full detailed analysis',
        'Export reports',
        'Priority support'
      ],
      current: user?.subscription_tier === 'max'
    }
  ]

  useEffect(() => {
    fetchSubscription()
  }, [user])

  const fetchSubscription = async () => {
    if (!user) return
    
    try {
      const response = await fetch('/api/user/subscription')
      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId)
    
    try {
      const response = await fetch('/api/payment/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // For demo purposes, we'll simulate a successful upgrade
        // In production, this would redirect to Hedera payment or handle the payment flow
        if (data.success) {
          alert(`Successfully upgraded to ${planId.toUpperCase()} plan!`)
          window.location.reload()
        }
      }
    } catch (error) {
      console.error('Upgrade failed:', error)
      alert('Upgrade failed. Please try again.')
    } finally {
      setUpgrading(null)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return
    }
    
    try {
      const response = await fetch('/api/user/subscription', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        alert('Subscription cancelled successfully.')
        fetchSubscription()
      }
    } catch (error) {
      console.error('Cancellation failed:', error)
      alert('Cancellation failed. Please contact support.')
    }
  }

  const getUsagePercentage = () => {
    if (!user) return 0
    const limit = user.subscription_tier === 'free' ? 3 : 
                 user.subscription_tier === 'pro' ? 50 : 500
    return Math.min((user.auditsThisMonth / limit) * 100, 100)
  }

  const getDaysUntilReset = () => {
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const diffTime = nextMonth.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Current Usage */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Current Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Monthly Audits</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{user.auditsThisMonth}</span>
                  <span className="text-gray-500">
                    / {user.subscription_tier === 'free' ? 3 : 
                       user.subscription_tier === 'pro' ? 50 : 500}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${getUsagePercentage()}%` }}
                  />
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Current Plan</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold capitalize">
                    {user.subscription_tier}
                  </span>
                  {user.subscription_tier !== 'free' && (
                    <Crown className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {subscription?.status === 'active' ? 'Active' : 'Inactive'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Resets In</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-lg font-semibold">
                    {getDaysUntilReset()} days
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Next billing cycle
                </p>
              </div>
            </div>
            
            {getUsagePercentage() >= 80 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    You're approaching your monthly limit. Consider upgrading for unlimited audits.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subscription Plans */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Subscription Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${
                plan.popular ? 'border-blue-500 shadow-lg' : ''
              } ${plan.current ? 'bg-blue-50 border-blue-300' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              {plan.current && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Current Plan
                  </span>
                </div>
              )}

              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  {plan.id === 'free' && <Shield className="w-5 h-5" />}
                  {plan.id === 'pro' && <Zap className="w-5 h-5" />}
                  {plan.id === 'max' && <Crown className="w-5 h-5" />}
                  {plan.name}
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-gray-600">/{plan.interval}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {plan.auditsPerMonth} audits per month
                </p>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.current ? (
                  <div className="space-y-2">
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                    {plan.id !== 'free' && subscription?.status === 'active' && (
                      <Button 
                        variant="outline" 
                        className="w-full text-red-600 hover:text-red-700"
                        onClick={handleCancelSubscription}
                      >
                        Cancel Subscription
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={upgrading === plan.id}
                    variant={plan.id === 'free' ? 'outline' : 'default'}
                  >
                    {upgrading === plan.id ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </div>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        {plan.id === 'free' ? 'Downgrade' : 'Upgrade'}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing Information */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Billing Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">
                    {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan
                  </p>
                  <p className="text-sm text-gray-600">
                    Started {new Date(subscription.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ${subscription.plan === 'pro' ? '29.00' : subscription.plan === 'max' ? '99.00' : '0.00'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {subscription.status === 'active' ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
              
              {subscription.expires_at && (
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    {subscription.status === 'active' 
                      ? `Next billing date: ${new Date(subscription.expires_at).toLocaleDateString()}`
                      : `Expired on: ${new Date(subscription.expires_at).toLocaleDateString()}`
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}