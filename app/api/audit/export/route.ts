import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { ReportPersistenceService, ExportOptions } from '@/lib/report-persistence-supabase'

const reportService = new ReportPersistenceService()

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    const user = token ? await verifyToken(token) : null
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has premium access for export functionality
    // This would typically check subscription tier
    // For now, we'll allow all authenticated users but limit export size
    
    const { searchParams } = new URL(request.url)
    
    // Parse export options
    const exportOptions: ExportOptions = {
      format: (searchParams.get('format') as 'json' | 'summary') || 'json',
      includeContent: searchParams.get('includeContent') === 'true'
    }

    // Parse date range if provided
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    if (startDate && endDate) {
      exportOptions.dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      }
    }

    const exportData = await reportService.exportAuditReports(user.id, exportOptions)
    
    // Set appropriate headers for file download
    const filename = `audit-reports-${new Date().toISOString().split('T')[0]}.json`
    
    return new NextResponse(exportData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Export audits error:', error)
    return NextResponse.json({ error: 'Failed to export audit reports' }, { status: 500 })
  }
}