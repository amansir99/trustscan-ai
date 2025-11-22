'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { AlertTriangle, RefreshCw, Home, Bug, Mail } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo })
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
    
    // In production, you might want to send this to an error reporting service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                  <div>
                    <CardTitle className="text-xl text-red-800">
                      Something went wrong
                    </CardTitle>
                    <p className="text-red-600 mt-1">
                      An unexpected error occurred while loading this page
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Error Details (Development Only) */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="p-4 bg-red-100 border border-red-200 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-2">Error Details:</h4>
                    <pre className="text-xs text-red-700 overflow-auto max-h-32">
                      {this.state.error.toString()}
                    </pre>
                    {this.state.errorInfo && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-red-700 font-medium">
                          Component Stack
                        </summary>
                        <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-32">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                {/* User-Friendly Error Message */}
                <div className="space-y-3">
                  <h4 className="font-medium text-red-800">What happened?</h4>
                  <p className="text-red-700 text-sm leading-relaxed">
                    The application encountered an unexpected error and couldn't continue. 
                    This might be due to a temporary issue or a problem with the current page.
                  </p>
                </div>

                {/* Suggestions */}
                <div className="space-y-3">
                  <h4 className="font-medium text-red-800">What you can try:</h4>
                  <ul className="space-y-2 text-sm text-red-700">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
                      Try refreshing the page or going back to the previous page
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
                      Check your internet connection and try again
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
                      Clear your browser cache and cookies
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
                      If the problem persists, contact our support team
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button onClick={this.handleRetry} className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Button>
                  
                  <Button onClick={this.handleReload} variant="outline" className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Reload Page
                  </Button>
                  
                  <Button onClick={this.handleGoHome} variant="outline" className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Go Home
                  </Button>
                </div>

                {/* Support Contact */}
                <div className="pt-4 border-t border-red-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-red-700">
                      <Bug className="w-4 h-4" />
                      <span>Error ID: {Date.now().toString(36)}</span>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const subject = encodeURIComponent('TrustScan AI - Error Report')
                        const body = encodeURIComponent(`
Error Details:
- Error ID: ${Date.now().toString(36)}
- Timestamp: ${new Date().toISOString()}
- User Agent: ${navigator.userAgent}
- URL: ${window.location.href}
- Error: ${this.state.error?.toString() || 'Unknown error'}

Please describe what you were doing when this error occurred:
[Your description here]
                        `.trim())
                        window.open(`mailto:support@trustscan.ai?subject=${subject}&body=${body}`)
                      }}
                      className="flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Report Issue
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const handleError = React.useCallback((error: Error) => {
    setError(error)
    
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('useErrorHandler caught an error:', error)
    }
  }, [])

  // Reset error when component unmounts
  React.useEffect(() => {
    return () => setError(null)
  }, [])

  return { error, handleError, resetError }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={errorFallback}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

export default ErrorBoundary