import { NextRequest, NextResponse } from 'next/server'
import { getHederaService, type AuditData } from '@/lib/hedera'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { ReportPersistenceService } from '@/lib/report-persistence-supabase'

/**
 * POST /api/audit/verify - Verify audit result using Hedera transaction ID
 * Requirements: 8.1, 8.4
 * 
 * Verifies the authenticity and integrity of audit results stored on Hedera blockchain
 */

interface VerifyRequest {
  transactionId: string;
  auditId: string;
}

interface VerifyResponse {
  success: boolean;
  isValid: boolean;
  auditHash?: string;
  consensusTimestamp?: string;
  topicSequenceNumber?: number;
  blockchainStatus?: {
    stored: boolean;
    transactionId?: string;
    network: string;
    verifiable: boolean;
  };
  error?: string;
}

const persistenceService = new ReportPersistenceService()

export async function POST(request: NextRequest): Promise<NextResponse<VerifyResponse>> {
  try {
    // Parse request body
    const body = await request.json()
    const { transactionId, auditId } = body as VerifyRequest

    if (!transactionId || !auditId) {
      return NextResponse.json({
        success: false,
        isValid: false,
        error: 'Transaction ID and Audit ID are required'
      }, { status: 400 })
    }

    // Authenticate user (optional for verification, but recommended)
    const token = getTokenFromRequest(request)
    let user = null
    if (token) {
      user = await verifyToken(token)
    }

    // Get audit data from database
    const auditReport = await persistenceService.getAuditById(auditId)
    if (!auditReport) {
      return NextResponse.json({
        success: false,
        isValid: false,
        error: 'Audit not found'
      }, { status: 404 })
    }

    // Check if user has access to this audit (if authenticated)
    if (user && auditReport.userId !== user.id) {
      return NextResponse.json({
        success: false,
        isValid: false,
        error: 'Access denied to this audit'
      }, { status: 403 })
    }

    // Verify transaction ID matches stored value
    if (auditReport.hederaTransactionId !== transactionId) {
      return NextResponse.json({
        success: false,
        isValid: false,
        error: 'Transaction ID does not match audit record'
      }, { status: 400 })
    }

    // Prepare audit data for verification
    const auditData: AuditData = {
      id: auditReport.id,
      url: auditReport.url,
      trustScore: auditReport.trustScore.finalScore,
      riskLevel: auditReport.trustScore.riskLevel,
      userId: auditReport.userId || '',
      timestamp: auditReport.generatedAt
    }

    // Verify with Hedera service
    const hederaService = getHederaService()
    const verificationResult = await hederaService.verifyAuditResult(transactionId, auditData)
    
    // Get blockchain storage status
    const blockchainStatus = hederaService.getStorageStatus(transactionId)

    console.log(`Verification result for ${transactionId}: ${verificationResult.isValid}`)

    return NextResponse.json({
      success: true,
      isValid: verificationResult.isValid,
      auditHash: verificationResult.auditHash,
      consensusTimestamp: verificationResult.consensusTimestamp,
      topicSequenceNumber: verificationResult.topicSequenceNumber,
      blockchainStatus,
      error: verificationResult.error
    })

  } catch (error) {
    console.error('Verification API error:', error)
    
    return NextResponse.json({
      success: false,
      isValid: false,
      error: error instanceof Error ? error.message : 'Verification failed'
    }, { status: 500 })
  }
}

/**
 * GET /api/audit/verify?transactionId=xxx&auditId=xxx - Alternative GET endpoint for verification
 */
export async function GET(request: NextRequest): Promise<NextResponse<VerifyResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')
    const auditId = searchParams.get('auditId')

    if (!transactionId || !auditId) {
      return NextResponse.json({
        success: false,
        isValid: false,
        error: 'Transaction ID and Audit ID are required as query parameters'
      }, { status: 400 })
    }

    // Create a new request with the body data
    const mockBody = JSON.stringify({ transactionId, auditId })
    const mockRequest = new Request(request.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(request.headers.entries())
      },
      body: mockBody
    }) as NextRequest

    return POST(mockRequest)

  } catch (error) {
    console.error('Verification GET API error:', error)
    
    return NextResponse.json({
      success: false,
      isValid: false,
      error: error instanceof Error ? error.message : 'Verification failed'
    }, { status: 500 })
  }
}