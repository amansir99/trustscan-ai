'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Zap, Shield, Star } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '0',
    period: ' HBAR/month',
    description: 'Perfect for trying out TrustScan AI',
    features: [
      '10 audits per month',
      'Full detailed analysis',
      'Complete trust scoring',
      'Real-time report generation',
      'Email support'
    ],
    icon: Shield,
    popular: false,
    buttonText: 'Get Started Free',
    buttonVariant: 'outline' as const
  },
  {
    name: 'Pro',
    price: '2,900',
    period: ' HBAR/month',
    description: 'For professionals and active users',
    features: [
      '100 audits per month',
      'Full detailed analysis',
      'Complete trust scoring',
      'Priority processing',
      'Priority email support',
      'Advanced AI analysis'
    ],
    icon: Zap,
    popular: true,
    buttonText: 'Temporarily Disabled',
    buttonVariant: 'default' as const
  },
  {
    name: 'Max',
    price: '9,900',
    period: ' HBAR/month',
    description: 'For power users and teams',
    features: [
      'Unlimited audits',
      'Full detailed analysis',
      'Complete trust scoring',
      'Highest priority processing',
      'Dedicated support',
      'Premium AI analysis'
    ],
    icon: Star,
    popular: false,
    buttonText: 'Temporarily Disabled',
    buttonVariant: 'outline' as const
  }
]

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
            Choose the perfect plan for your DeFi audit needs. All plans include the same high-quality detailed analysis - no compromises.
          </p>
          <div className="inline-block bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-3 rounded-lg mb-8">
            <p className="font-semibold">⚠️ Paid Subscriptions Temporarily Disabled</p>
            <p className="text-sm">Currently, only the Free plan is available. Pro and Max plans are temporarily disabled.</p>
          </div>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm ${!isAnnual ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAnnual ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${isAnnual ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              Annual
              <span className="ml-1 text-green-600 font-medium">(Save 20%)</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon
            const annualPrice = plan.name === 'Pro' ? '2,320' : plan.name === 'Max' ? '7,920' : '0'
            const displayPrice = isAnnual && plan.name !== 'Free' ? annualPrice : plan.price
            
            return (
              <Card key={plan.name} className={`relative p-8 ${plan.popular ? 'ring-2 ring-blue-600 shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <Icon className={`h-12 w-12 mx-auto mb-4 ${
                    plan.popular ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-4xl font-bold text-gray-900">{displayPrice}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.name === 'Free' ? (
                  <Link href="/register">
                    <Button 
                      variant={plan.buttonVariant} 
                      className="w-full"
                    >
                      {plan.buttonText}
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    variant={plan.buttonVariant} 
                    className="w-full"
                    disabled
                  >
                    {plan.buttonText}
                  </Button>
                )}
              </Card>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Do all plans get the same quality analysis?</h3>
              <p className="text-gray-600">
                Yes! Every plan receives the exact same detailed, comprehensive analysis. The only difference is the number of audits per month.
              </p>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">How accurate are the trust scores?</h3>
              <p className="text-gray-600">
                Our AI-powered analysis evaluates multiple factors including smart contract security, team transparency, and community engagement to provide accurate risk assessments.
              </p>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. No long-term contracts or cancellation fees.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}