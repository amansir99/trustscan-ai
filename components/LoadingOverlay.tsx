'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, X } from 'lucide-react'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { cn } from '@/lib/utils'

interface LoadingOverlayProps {
  isVisible: boolean
  title?: string
  description?: string
  progress?: number
  showProgress?: boolean
  showCancel?: boolean
  onCancel?: () => void
  className?: string
  backdrop?: 'blur' | 'dark' | 'light'
  size?: 'sm' | 'md' | 'lg'
  position?: 'center' | 'top'
}

export function LoadingOverlay({
  isVisible,
  title = 'Loading...',
  description,
  progress,
  showProgress = false,
  showCancel = false,
  onCancel,
  className,
  backdrop = 'blur',
  size = 'md',
  position = 'center'
}: LoadingOverlayProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isVisible) {
      // Prevent body scroll when overlay is visible
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isVisible])

  if (!mounted || typeof window === 'undefined' || !isVisible) {
    return null
  }

  const backdropStyles = {
    blur: 'bg-white/80 backdrop-blur-sm',
    dark: 'bg-black/50',
    light: 'bg-white/90'
  }

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  }

  const positionStyles = {
    center: 'items-center justify-center',
    top: 'items-start justify-center pt-20'
  }

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex transition-all duration-300',
        backdropStyles[backdrop],
        positionStyles[position]
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-title"
      aria-describedby={description ? "loading-description" : undefined}
    >
      <div
        className={cn(
          'relative bg-white rounded-xl shadow-2xl border border-gray-200 p-6 mx-4 w-full',
          sizeStyles[size],
          'animate-in fade-in-0 zoom-in-95 duration-300',
          className
        )}
      >
        {/* Cancel Button */}
        {showCancel && onCancel && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Cancel loading"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}

        {/* Content */}
        <div className="text-center space-y-4">
          {/* Loading Spinner */}
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>

          {/* Title */}
          <div>
            <h3 id="loading-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
            {description && (
              <p id="loading-description" className="text-sm text-gray-600 mt-2">
                {description}
              </p>
            )}
          </div>

          {/* Progress Bar */}
          {showProgress && typeof progress === 'number' && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          )}

          {/* Cancel Button (Bottom) */}
          {showCancel && onCancel && (
            <div className="pt-2">
              <Button onClick={onCancel} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

// Hook for managing loading overlay state
export function useLoadingOverlay() {
  const [isVisible, setIsVisible] = useState(false)
  const [config, setConfig] = useState<Partial<LoadingOverlayProps>>({})

  const show = (options?: Partial<LoadingOverlayProps>) => {
    setConfig(options || {})
    setIsVisible(true)
  }

  const hide = () => {
    setIsVisible(false)
    setConfig({})
  }

  const update = (options: Partial<LoadingOverlayProps>) => {
    setConfig(prev => ({ ...prev, ...options }))
  }

  return {
    isVisible,
    show,
    hide,
    update,
    LoadingOverlay: (props: Partial<LoadingOverlayProps>) => (
      <LoadingOverlay {...config} {...props} isVisible={isVisible} />
    )
  }
}

// Inline loading component for smaller areas
export function InlineLoading({
  size = 'md',
  text,
  className
}: {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}) {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const textSizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <div className={cn('flex items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-blue-600', sizeStyles[size])} />
      {text && (
        <span className={cn('text-gray-600', textSizeStyles[size])}>
          {text}
        </span>
      )}
    </div>
  )
}

// Button with loading state
export function LoadingButton({
  loading,
  children,
  loadingText,
  className,
  disabled,
  ...props
}: {
  loading: boolean
  children: React.ReactNode
  loadingText?: string
  className?: string
  disabled?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button
      {...props}
      disabled={disabled || loading}
      className={cn('relative', className)}
    >
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      )}
      {loading ? (loadingText || 'Loading...') : children}
    </Button>
  )
}

export default LoadingOverlay