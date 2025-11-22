'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { 
  Loader2, 
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  Globe,
  Brain,
  Calculator,
  FileText,
  Wifi,
  WifiOff,
  AlertTriangle
} from 'lucide-react'

interface LoadingStage {
  id: string
  label: string
  icon: React.ReactNode
  duration: number // estimated duration in seconds
  description: string
}

interface LoadingStateProps {
  isLoading: boolean
  currentStage?: string
  progress?: number
  error?: string | null
  onRetry?: () => void
  onCancel?: () => void
  estimatedTime?: number
}

interface ErrorDisplayProps {
  error: string
  type?: 'network' | 'validation' | 'server' | 'timeout' | 'rate-limit' | 'unknown'
  onRetry?: () => void
  onCancel?: () => void
  suggestions?: string[]
}

interface ProgressIndicatorProps {
  stages: LoadingStage[]
  currentStage: string
  progress: number
  showEstimate?: boolean
}

// Predefined loading stages for audit process
const AUDIT_STAGES: LoadingStage[] = [
  {
    id: 'validation',
    label: 'Validating URL',
    icon: <Globe className="w-5 h-5" />,
    duration: 2,
    description: 'Checking if the website is accessible and valid'
  },
  {
    id: 'extraction',
    label: 'Extracting Content',
    icon: <Loader2 className="w-5 h-5 animate-spin" />,
    duration: 8,
    description: 'Scanning website content, documentation, and project information'
  },
  {
    id: 'analysis',
    label: 'AI Analysis',
    icon: <Brain className="w-5 h-5" />,
    duration: 12,
    description: 'Analyzing content quality, transparency, and security factors'
  },
  {
    id: 'scoring',
    label: 'Calculating Score',
    icon: <Calculator className="w-5 h-5" />,
    duration: 3,
    description: 'Computing trust score and risk assessment'
  },
  {
    id: 'report',
    label: 'Generating Report',
    icon: <FileText className="w-5 h-5" />,
    duration: 5,
    description: 'Creating detailed audit report with recommendations'
  }
]

// Error type configurations
const ERROR_CONFIGS = {
  network: {
    icon: <WifiOff className="w-6 h-6 text-red-500" />,
    title: 'Network Connection Error',
    color: 'red',
    suggestions: [
      'Check your internet connection',
      'Try refreshing the page',
      'Verify the website URL is correct'
    ]
  },
  validation: {
    icon: <AlertCircle className="w-6 h-6 text-yellow-500" />,
    title: 'Invalid Input',
    color: 'yellow',
    suggestions: [
      'Ensure the URL starts with http:// or https://',
      'Check for typos in the website address',
      'Make sure the website is a DeFi project'
    ]
  },
  server: {
    icon: <XCircle className="w-6 h-6 text-red-500" />,
    title: 'Server Error',
    color: 'red',
    suggestions: [
      'Our servers are experiencing issues',
      'Please try again in a few minutes',
      'Contact support if the problem persists'
    ]
  },
  timeout: {
    icon: <Clock className="w-6 h-6 text-orange-500" />,
    title: 'Request Timeout',
    color: 'orange',
    suggestions: [
      'The website took too long to respond',
      'Try again with a different URL',
      'Some websites may block automated access'
    ]
  },
  'rate-limit': {
    icon: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
    title: 'Rate Limit Exceeded',
    color: 'yellow',
    suggestions: [
      'You have reached your audit limit',
      'Wait for your limit to reset',
      'Upgrade your plan for more audits'
    ]
  },
  unknown: {
    icon: <AlertCircle className="w-6 h-6 text-gray-500" />,
    title: 'Unexpected Error',
    color: 'gray',
    suggestions: [
      'An unexpected error occurred',
      'Please try again',
      'Contact support if the issue continues'
    ]
  }
}

export function ProgressIndicator({ stages, currentStage, progress, showEstimate = true }: ProgressIndicatorProps) {
  const currentStageIndex = stages.findIndex(stage => stage.id === currentStage)
  const currentStageData = stages[currentStageIndex]
  
  // Calculate estimated time remaining
  const totalDuration = stages.reduce((sum, stage) => sum + stage.duration, 0)
  const completedDuration = stages.slice(0, currentStageIndex).reduce((sum, stage) => sum + stage.duration, 0)
  const currentStageDuration = currentStageData?.duration || 0
  const currentStageProgress = (progress - (completedDuration / totalDuration * 100)) / (currentStageDuration / totalDuration * 100) * 100
  const remainingTime = Math.max(0, totalDuration - completedDuration - (currentStageDuration * Math.max(0, currentStageProgress) / 100))

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Analysis Progress</span>
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-3" />
        {showEstimate && (
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Estimated time remaining: {Math.ceil(remainingTime)}s</span>
            <span>{currentStageIndex + 1} of {stages.length} stages</span>
          </div>
        )}
      </div>

      {/* Current Stage */}
      {currentStageData && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            {currentStageData.icon}
            <span className="font-medium text-blue-900">{currentStageData.label}</span>
          </div>
          <p className="text-sm text-blue-700">{currentStageData.description}</p>
        </div>
      )}

      {/* Stage List */}
      <div className="space-y-2">
        {stages.map((stage, index) => {
          const isCompleted = index < currentStageIndex
          const isCurrent = index === currentStageIndex
          const isPending = index > currentStageIndex

          return (
            <div
              key={stage.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                isCompleted ? 'bg-green-50 border border-green-200' :
                isCurrent ? 'bg-blue-50 border border-blue-200' :
                'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isCompleted ? 'bg-green-500 text-white' :
                isCurrent ? 'bg-blue-500 text-white' :
                'bg-gray-300 text-gray-600'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${
                  isCompleted ? 'text-green-800' :
                  isCurrent ? 'text-blue-800' :
                  'text-gray-600'
                }`}>
                  {stage.label}
                </div>
                <div className={`text-sm ${
                  isCompleted ? 'text-green-600' :
                  isCurrent ? 'text-blue-600' :
                  'text-gray-500'
                }`}>
                  {isCompleted ? 'Completed' : 
                   isCurrent ? 'In progress...' : 
                   'Pending'}
                </div>
              </div>
              
              {isCurrent && (
                <div className="flex-shrink-0">
                  <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ErrorDisplay({ error, type = 'unknown', onRetry, onCancel, suggestions }: ErrorDisplayProps) {
  const config = ERROR_CONFIGS[type]
  const errorSuggestions = suggestions || config.suggestions

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          {config.icon}
          <div>
            <CardTitle className="text-lg text-red-800">{config.title}</CardTitle>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Error Suggestions */}
        <div className="space-y-2">
          <h4 className="font-medium text-red-800">What you can try:</h4>
          <ul className="space-y-1">
            {errorSuggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-red-700">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {onRetry && (
            <Button onClick={onRetry} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          )}
          {onCancel && (
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function LoadingState({ 
  isLoading, 
  currentStage = 'validation', 
  progress = 0, 
  error, 
  onRetry, 
  onCancel,
  estimatedTime = 30
}: LoadingStateProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isOnline, setIsOnline] = useState(true)

  // Track elapsed time
  useEffect(() => {
    if (!isLoading) {
      setElapsedTime(0)
      return
    }

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isLoading])

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Show error state
  if (error) {
    // Determine error type based on error message
    let errorType: keyof typeof ERROR_CONFIGS = 'unknown'
    
    if (error.toLowerCase().includes('network') || error.toLowerCase().includes('connection')) {
      errorType = 'network'
    } else if (error.toLowerCase().includes('invalid') || error.toLowerCase().includes('url')) {
      errorType = 'validation'
    } else if (error.toLowerCase().includes('timeout')) {
      errorType = 'timeout'
    } else if (error.toLowerCase().includes('rate') || error.toLowerCase().includes('limit')) {
      errorType = 'rate-limit'
    } else if (error.toLowerCase().includes('server') || error.toLowerCase().includes('500')) {
      errorType = 'server'
    }

    return (
      <div className="w-full max-w-2xl mx-auto">
        <ErrorDisplay 
          error={error} 
          type={errorType}
          onRetry={onRetry}
          onCancel={onCancel}
        />
      </div>
    )
  }

  // Show offline state
  if (!isOnline) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <ErrorDisplay 
          error="You appear to be offline. Please check your internet connection."
          type="network"
          onRetry={onRetry}
          onCancel={onCancel}
        />
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              Analyzing DeFi Project
            </CardTitle>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-600">
              <span>This may take up to {estimatedTime} seconds</span>
              <div className="flex items-center gap-4">
                <span>Elapsed: {elapsedTime}s</span>
                <div className="flex items-center gap-1">
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">Online</span>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <ProgressIndicator 
              stages={AUDIT_STAGES}
              currentStage={currentStage}
              progress={progress}
              showEstimate={true}
            />
            
            {/* Cancel Button */}
            {onCancel && (
              <div className="mt-6 text-center">
                <Button onClick={onCancel} variant="outline" size="sm">
                  Cancel Analysis
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">💡</span>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-blue-900">Analysis Tips</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• We analyze documentation, team info, tokenomics, and security practices</li>
                  <li>• Scores range from 0-100 with detailed explanations for each factor</li>
                  <li>• Red flags are highlighted to help you make informed decisions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

// Skeleton loading components for different UI sections
export function AuditFormSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    </div>
  )
}

export function AuditReportSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl space-y-8">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-48"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-64"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 text-center space-y-4">
                <div className="h-12 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse w-16 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mx-auto"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Audits Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-64"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoadingState