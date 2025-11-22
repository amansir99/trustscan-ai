'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface UsageStats {
  auditsThisMonth: number
  auditLimit: number
  remainingAudits: number
  resetDate: Date
  subscriptionTier: string
}

interface UsageDashboardProps {
  className?: string
}

export default function UsageDashboard({ className }: UsageDashboardProps) {
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsageStats()
  }, [])

  const fetchUsageStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/usage/stats')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch usage stats')
      }

      setStats(data.stats)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load usage statistics')
    } finally {
      setLoading(false)
    }
  }

  const getUsagePercentage = () => {
    if (!stats || stats.auditLimit === -1) return 0
    return Math.min((stats.auditsThisMonth / stats.auditLimit) * 100, 100)
  }

  const getUsageColor = () => {
    const percentage = getUsagePercentage()
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const formatResetDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date))
  }

  const getTierDisplayName = (tier: string) => {
    switch (tier) {
      case 'free': return 'Free'
      case 'pro': return 'Pro'
      case 'max': return 'Max'
      default: return tier
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={fetchUsageStats} variant="outline" size="sm">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Usage Statistics</CardTitle>
        <CardDescription>
          Current plan: {getTierDisplayName(stats.subscriptionTier)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Usage Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Audits this month</span>
            <span>
              {stats.auditsThisMonth}
              {stats.auditLimit === -1 ? ' (Unlimited)' : ` / ${stats.auditLimit}`}
            </span>
          </div>
          
          {stats.auditLimit !== -1 && (
            <Progress 
              value={getUsagePercentage()} 
              className="h-2"
            />
          )}
          
          {stats.auditLimit !== -1 && (
            <div className="text-xs text-gray-600">
              {stats.remainingAudits} audits remaining
            </div>
          )}
        </div>

        {/* Reset Information */}
        <div className="pt-4 border-t">
          <div className="text-sm text-gray-600">
            <div>Next reset: {formatResetDate(stats.resetDate)}</div>
          </div>
        </div>

        {/* Upgrade Prompt */}
        {stats.subscriptionTier === 'free' && stats.remainingAudits <= 1 && (
          <div className="pt-4 border-t">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-sm text-yellow-800 mb-2">
                You're running low on audits!
              </div>
              <Button size="sm" className="w-full">
                Upgrade to Pro for Unlimited Audits
              </Button>
            </div>
          </div>
        )}

        {/* Usage Tips */}
        <div className="pt-4 border-t">
          <div className="text-xs text-gray-500">
            <div className="font-medium mb-1">Usage Tips:</div>
            <ul className="space-y-1">
              <li>• Audits reset on the 1st of each month</li>
              <li>• Pro plan includes unlimited audits</li>
              <li>• Export reports are available with Pro plan</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}