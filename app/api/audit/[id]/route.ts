import { NextRequest, NextResponse } from 'next/server'
import { reportCache } from '@/lib/report-cache'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auditId } = await params
    
    console.log(`Attempting to retrieve report: ${auditId}`)
    
    if (!auditId) {
      return NextResponse.json(
        { error: 'Audit ID is required' },
        { status: 400 }
      )
    }

    const cached = reportCache.get(auditId)
    
    if (!cached) {
      console.log(`Report not found in cache: ${auditId}`)
      return NextResponse.json(
        { error: 'Report not found or expired' },
        { status: 404 }
      )
    }
    
    console.log(`Report found in cache: ${auditId}`)

    return NextResponse.json({
      success: true,
      auditId,
      report: cached.report,
      summary: cached.summary
    })

  } catch (error) {
    console.error('Error retrieving cached report:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve report' },
      { status: 500 }
    )
  }
}