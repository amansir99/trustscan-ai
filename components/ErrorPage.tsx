'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  ArrowLeft, 
  Wifi, 
  WifiOff,
  Clock,
  Server,
  Shield,
  Bug,
  Mail,
  ExternalLink,
  CheckCircle
} from 'lucide-react'

interface ErrorPageProps {
  error?: {
    type?: 'network' | 'validation' | 'server' | 'timeout' | 'rate-limit' | 'auth' | 'not-found' | 'unknown'
    message: string
    details?: string
    code?: string | number
    retryable?: boolean
  }
  onRetry?: () => void
  onGoBack?: () => void
  showContactSupport?: boolean
  customActions?: Array<{
    label: string
    action: () => void
    variant?: 'default' | 'outline' | 'ghost' | 'secondary'
    icon?: React.ReactNode
  }>
}

interface ErrorConfig {
  icon: React.ReactNode
  title: string
  color: string
  bgColor: string
  suggestions: string[]
  canRetry: boolean
}

const ERROR_CONFIGS: Record<string, ErrorConfig> = {
  network: {
    icon: <WifiOff className="w-8 h-8" />,
    title: 'Network Connection Error',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    suggestions: [
      'Check your internet connection',
      'Try refreshing the page',
      'Disable VPN if you\'re using one',
      'Check if the website is accessible from another device'
    ],
    canRetry: true
  },
  validation: {
    icon: <AlertTriangle className="w-8 h-8" />,
    title: 'Invalid Input',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    suggestions: [
      'Ensure the URL starts with http:// or https://',
      'Check for typos in the website address',
      'Make sure the website is a DeFi project',
      'Try a different URL format'
    ],
    canRetry: true
  },
  server: {
    icon: <Server className="w-8 h-8" />,
    title: 'Server Error',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    suggestions: [
      'Our servers are experiencing issues',
      'Please try again in a few minutes',
      'Check our status page for updates',
      'Contact support if the problem persists'
    ],
    canRetry: true
  },
  timeout: {
    icon: <Clock className="w-8 h-8" />,
    title: 'Request Timeout',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    suggestions: [
      'The website took too long to respond',
      'Try again with a different URL',
      'Some websites may block automated access',
      'Check if the website is currently online'
    ],
    canRetry: true
  },
  'rate-limit': {
    icon: <Shield className="w-8 h-8" />,
    title: 'Rate Limit Exceeded',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    suggestions: [
      'You have reached your audit limit',
      'Wait for your limit to reset',
      'Upgrade your plan for more audits',
      'Try again later'
    ],
    canRetry: false
  },
  auth: {
    icon: <Shield className="w-8 h-8" />,
    title: 'Authentication Required',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    suggestions: [
      'Please log in to continue',
      'Your session may have expired',
      'Check your account credentials',
      'Contact support if you can\'t access your account'
    ],
    canRetry: false
  },
  'not-found': {
    icon: <AlertTriangle className="w-8 h-8" />,
    title: 'Page Not Found',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
    suggestions: [
      'The page you\'re looking for doesn\'t exist',
      'Check the URL for typos',
      'The page may have been moved or deleted',
      'Go back to the homepage'
    ],
    canRetry: false
  },
  unknown: {
    icon: <Bug className="w-8 h-8" />,
    title: 'Unexpected Error',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
    suggestions: [
      'An unexpected error occurred',
      'Please try again',
      'Clear your browser cache',
      'Contact support if the issue continues'
    ],
    canRetry: true
  }
}

export default function ErrorPage({
  error = { type: 'unknown', message: 'An unexpected error occurred' },
  onRetry,
  onGoBack,
  showContactSupport = true,
  customActions = []
}: ErrorPageProps) {
  const router = useRouter()
  const [isOnline, setIsOnline] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  const config = ERROR_CONFIGS[error.type || 'unknown']

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

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return
    
    setIsRetrying(true)
    setRetryCount(prev => prev + 1)
    
    try {
      await onRetry()
    } catch (err) {
      console.error('Retry failed:', err)
    } finally {
      setIsRetrying(false)
    }
  }

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack()
    } else {
      router.back()
    }
  }

  const handleGoHome = () => {
    router.push('/')
  }

  const handleContactSupport = () => {
    const subject = encodeURIComponent(`TrustScan AI - Error Report: ${error.type || 'Unknown'}`)
    const body = encodeURIComponent(`
Error Details:
- Type: ${error.type || 'Unknown'}
- Message: ${error.message}
- Code: ${error.code || 'N/A'}
- Details: ${error.details || 'N/A'}
- Timestamp: ${new Date().toISOString()}
- User Agent: ${navigator.userAgent}
- URL: ${window.location.href}
- Retry Count: ${retryCount}

Please describe what you were doing when this error occurred:
[Your description here]
    `.trim())
    
    window.open(`mailto:support@trustscan.ai?subject=${subject}&body=${body}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className={config.bgColor}>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className={config.color}>
                {config.icon}
              </div>
              <div className="flex-1">
                <CardTitle className={`text-xl ${config.color}`}>
                  {config.title}
                </CardTitle>
                <p className={`mt-2 ${config.color.replace('600', '700')}`}>
                  {error.message}
                </p>
                {error.details && (
                  <p className="text-sm text-gray-600 mt-1">
                    {error.details}
                  </p>
                )}
                {error.code && (
                  <p className="text-xs text-gray-500 mt-1">
                    Error Code: {error.code}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Network Status */}
            <div className="flex items-center gap-2 text-sm">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-red-600">Offline</span>
                </>
              )}
              {retryCount > 0 && (
                <span className="text-gray-500 ml-2">
                  • Retry attempts: {retryCount}
                </span>
              )}
            </div>

            {/* Error Suggestions */}
            <div className="space-y-3">
              <h4 className={`font-medium ${config.color}`}>What you can try:</h4>
              <ul className="space-y-2">
                {config.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {config.canRetry && onRetry && (
                <Button 
                  onClick={handleRetry} 
                  disabled={isRetrying || !isOnline}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                  {isRetrying ? 'Retrying...' : 'Try Again'}
                </Button>
              )}
              
              <Button 
                onClick={handleGoBack} 
                variant="outline" 
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </Button>
              
              <Button 
                onClick={handleGoHome} 
                variant="outline" 
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Home
              </Button>

              {/* Custom Actions */}
              {customActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.action}
                  variant={action.variant || 'outline'}
                  className="flex items-center gap-2"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>

            {/* Support Contact */}
            {showContactSupport && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    <p>Still having trouble? We're here to help.</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleContactSupport}
                      className="flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Contact Support
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('https://status.trustscan.ai', '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Status Page
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}