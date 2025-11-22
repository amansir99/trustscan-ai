'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import AuditForm from '@/components/AuditForm'
import AuditReport from '@/components/AuditReport'
import ErrorPage from '@/components/ErrorPage'
import { LoadingState } from '@/components/LoadingStates'

interface AuditState {
  loading: boolean
  currentStage?: string
  progress?: number
  error?: string | null
  report?: any
}

export default function AuditPage() {
  const { user, loading: authLoading } = useAuth()
  const [auditState, setAuditState] = useState<AuditState>({
    loading: false,
    currentStage: undefined,
    progress: 0,
    error: null
  })

  // Redirect to login if not authenticated
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      console.log('Auth loading on audit page...')
      return
    }

    // Only redirect if we're sure there's no user
    if (!user) {
      console.log('No user on audit page, redirecting to login')
      window.location.href = '/login'
    } else {
      console.log('User authenticated on audit page:', user.email)
    }
  }, [user, authLoading])

  const handleAuditSubmit = async (url: string) => {
    setAuditState({
      loading: true,
      currentStage: 'validation',
      progress: 0,
      error: null
    })

    try {
      // Simulate progress updates
      const progressStages = [
        { stage: 'validation', progress: 10, duration: 2000 },
        { stage: 'extraction', progress: 30, duration: 8000 },
        { stage: 'analysis', progress: 70, duration: 12000 },
        { stage: 'scoring', progress: 90, duration: 3000 },
        { stage: 'report', progress: 100, duration: 2000 }
      ]

      let currentProgress = 0
      for (const { stage, progress, duration } of progressStages) {
        setAuditState(prev => ({
          ...prev,
          currentStage: stage,
          progress: currentProgress
        }))

        // Animate progress
        const steps = 20
        const stepDuration = duration / steps
        const progressIncrement = (progress - currentProgress) / steps

        for (let i = 0; i < steps; i++) {
          await new Promise(resolve => setTimeout(resolve, stepDuration))
          currentProgress += progressIncrement
          setAuditState(prev => ({
            ...prev,
            progress: Math.min(currentProgress, progress)
          }))
        }
      }

      // Make actual API call
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Server error: ${response.status}`)
      }

      const data = await response.json()
      
      // Use fullAuditData from API response or fallback to transformed data
      const reportData = data.fullAuditData || {
        id: data.auditId,
        url: data.summary?.url || url,
        created_at: new Date().toISOString(),
        trust_score: data.summary?.trustScore || 0,
        analysis_data: {
          factors: data.summary?.scoreBreakdown || {},
          explanations: {},
          recommendations: data.summary?.recommendations || [],
          risks: data.summary?.criticalIssues || []
        },
        hedera_transaction_id: data.hederaTransactionId,
        blockchain_status: {
          stored: !!data.hederaTransactionId,
          network: 'testnet',
          verifiable: false
        }
      }
      
      setAuditState({
        loading: false,
        report: reportData
      })
      
    } catch (error: any) {
      console.error('Audit failed:', error)
      setAuditState({
        loading: false,
        error: error.message || 'An unexpected error occurred during analysis'
      })
    }
  }

  const handleRetry = () => {
    setAuditState({
      loading: false,
      currentStage: undefined,
      progress: 0,
      error: null
    })
  }

  const handleCancel = () => {
    setAuditState({
      loading: false,
      currentStage: undefined,
      progress: 0,
      error: null
    })
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingState
          isLoading={true}
          currentStage="validation"
          progress={50}
        />
      </div>
    )
  }

  // Show error if user not found
  if (!user) {
    return (
      <ErrorPage
        error={{
          type: 'auth',
          message: 'Please log in to access the audit feature'
        }}
        customActions={[
          {
            label: 'Log In',
            action: () => window.location.href = '/login',
            variant: 'default'
          },
          {
            label: 'Sign Up',
            action: () => window.location.href = '/register',
            variant: 'outline'
          }
        ]}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          {!auditState.report && (
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                DeFi Trust Analysis
              </h1>
              <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
                Get comprehensive trust scores and security analysis for DeFi projects. 
                Our AI analyzes documentation, team transparency, and security practices.
              </p>
            </div>
          )}

          {/* Audit Form */}
          {!auditState.report && (
            <AuditForm
              onSubmit={handleAuditSubmit}
              loading={auditState.loading}
              currentStage={auditState.currentStage}
              progress={auditState.progress}
              error={auditState.error}
              onRetry={handleRetry}
              onCancel={handleCancel}
            />
          )}

          {/* Audit Report */}
          {auditState.report && (
            <div>
              <button
                onClick={handleRetry}
                className="mb-6 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
              >
                ← New Analysis
              </button>
              <AuditReport audit={auditState.report} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}