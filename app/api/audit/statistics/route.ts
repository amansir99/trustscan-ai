import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { ReportPersistenceService } from '@/lib/report-persistence-supabase'

const reportService = new ReportPersistenceService()

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    const user = token ? await verifyToken(token) : null
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const statistics = await reportService.getAuditStatistics(user.id)
    
    return NextResponse.json({ statistics })
  } catch (error) {
    console.error('Get statistics error:', error)
    return NextResponse.json({ error: 'Failed to retrieve audit statistics' }, { status: 500 })
  }
}