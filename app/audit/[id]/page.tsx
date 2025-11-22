'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import AuditReport from '@/components/AuditReport'
import ErrorPage from '@/components/ErrorPage'
import { LoadingState } from '@/components/LoadingStates'

export default function AuditReportPage() {
  const params = useParams()
  const auditId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!auditId) {
      setError('Invalid audit ID')
      setLoading(false)
      return
    }

    fetchReport()
  }, [auditId])

  const fetchReport = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/audit/${auditId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Report not found or expired')
        }
        throw new Error('Failed to load report')
      }

      const data = await response.json()
      
      // Transform the cached report to match AuditReport component expectations
      const transformedReport = transformReportData(data.report, auditId)
      setReport(transformedReport)
    } catch (err: any) {
      setError(err.message || 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  // Transform report data to match AuditReport component interface
  const transformReportData = (reportData: any, id: string) => {
    if (!reportData) return null

    // Handle both detailed report format and summary format
    const summary = reportData.summary || reportData
    const sections = reportData.sections || []
    const metadata = reportData.metadata || {}

    return {
      id: id,
      url: metadata.url || reportData.url || 'Unknown URL',
      created_at: metadata.analysisDate || reportData.generatedAt || new Date().toISOString(),
      trust_score: summary.trustScore || reportData.trustScore?.finalScore || 0,
      analysis_data: {
        factors: summary.scoreBreakdown || {
          documentationQuality: 0,
          transparencyIndicators: 0,
          securityDocumentation: 0,
          communityEngagement: 0,
          technicalImplementation: 0
        },
        explanations: sections.reduce((acc: any, section: any) => {
          const key = section.title.toLowerCase().replace(/\s+/g, '')
          acc[key] = section.explanation || 'No explanation available'
          return acc
        }, {}),
        recommendations: summary.recommendations || reportData.recommendations || [],
        risks: summary.criticalIssues || reportData.riskAssessment?.riskFactors || []
      },
      hedera_transaction_id: reportData.hederaTransactionId,
      blockchain_status: reportData.blockchainStatus || {
        stored: !!reportData.hederaTransactionId,
        network: 'testnet',
        verifiable: false
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingState
          isLoading={true}
          currentStage="Loading report..."
          progress={50}
        />
      </div>
    )
  }

  if (error) {
    return (
      <ErrorPage
        error={{
          type: 'not-found',
          message: error
        }}
        customActions={[
          {
            label: 'New Analysis',
            action: () => window.location.href = '/audit',
            variant: 'default'
          },
          {
            label: 'Dashboard',
            action: () => window.location.href = '/dashboard',
            variant: 'outline'
          }
        ]}
      />
    )
  }

  if (!report) {
    return (
      <ErrorPage
        error={{
          type: 'not-found',
          message: 'Report data not available'
        }}
        customActions={[
          {
            label: 'New Analysis',
            action: () => window.location.href = '/audit',
            variant: 'default'
          }
        ]}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <AuditReport audit={report} />
      </div>
    </div>
  )
}