import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken, validateEmail, hashPassword } from '@/lib/auth'
import { UsageTracker } from '@/lib/usage-tracker'
import { ReportPersistenceService } from '@/lib/report-persistence-supabase'
import { getUserById } from '@/lib/database'

const reportService = new ReportPersistenceService()

// Request/Response interfaces for type safety
interface UserProfile {
  id: string;
  email: string;
  subscriptionTier: string;
  subscriptionExpires?: Date;
  usageStats?: {
    auditsThisMonth: number;
    auditLimit: number;
    remainingAudits: number;
    resetDate: Date;
  };
  auditStatistics?: {
    totalAudits: number;
    averageTrustScore: number;
    riskDistribution: Record<string, number>;
    recentActivity: Array<{ date: string; count: number }>;
  };
  preferences?: {
    emailNotifications: boolean;
    defaultAnalysisType: 'summary' | 'detailed';
    autoStoreOnHedera: boolean;
  };
}

interface UpdateProfileRequest {
  preferences?: {
    emailNotifications?: boolean;
    defaultAnalysisType?: 'summary' | 'detailed';
    autoStoreOnHedera?: boolean;
  };
  password?: {
    current: string;
    new: string;
  };
}

/**
 * GET /api/user/profile - Get user profile with usage statistics
 * Requirements: 5.1, 5.2, 6.3
 * 
 * Returns comprehensive user profile including subscription and usage data
 */
export async function GET(request: NextRequest): Promise<NextResponse<{ success: boolean; profile?: UserProfile; error?: string }>> {
  try {
    // Authenticate user
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get('includeStats') !== 'false' // Default to true
    const includeUsage = searchParams.get('includeUsage') !== 'false' // Default to true

    // Get fresh user data from database
    const dbUser = await getUserById(user.id)
    if (!dbUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Build profile response
    const profile: UserProfile = {
      id: dbUser.id,
      email: dbUser.email,
      subscriptionTier: dbUser.subscription_tier || 'free',
      subscriptionExpires: dbUser.subscription_expires ? new Date(dbUser.subscription_expires) : undefined
    }

    // Add usage statistics if requested
    if (includeUsage) {
      try {
        const usageStats = await UsageTracker.getUserUsageStats(user.id)
        if (usageStats) {
          profile.usageStats = usageStats
        }
      } catch (error) {
        console.warn('Failed to fetch usage stats:', error)
        // Continue without usage stats
      }
    }

    // Add audit statistics if requested
    if (includeStats) {
      try {
        const auditStats = await reportService.getAuditStatistics(user.id)
        if (auditStats) {
          profile.auditStatistics = auditStats
        }
      } catch (error) {
        console.warn('Failed to fetch audit statistics:', error)
        // Continue without audit stats
      }
    }

    // Add user preferences (with defaults)
    profile.preferences = {
      emailNotifications: (dbUser as any).email_notifications ?? true,
      defaultAnalysisType: ((dbUser as any).default_analysis_type as 'summary' | 'detailed') || 'summary',
      autoStoreOnHedera: (dbUser as any).auto_store_hedera ?? false
    }

    // Track profile view for analytics
    await UsageTracker.trackUsage(user.id, 'profile_viewed', {
      includeStats,
      includeUsage
    })

    return NextResponse.json({
      success: true,
      profile
    })
    
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to retrieve user profile' 
    }, { status: 500 })
  }
}

/**
 * PUT /api/user/profile - Update user profile and preferences
 * Requirements: 5.1, 5.2
 * 
 * Allows users to update their profile settings and preferences
 */
export async function PUT(request: NextRequest): Promise<NextResponse<{ success: boolean; error?: string }>> {
  try {
    // Authenticate user
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    // Parse and validate update request
    const updates = await parseUpdateRequest(request)
    
    // Verify user exists in database
    const dbUser = await getUserById(user.id)
    if (!dbUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Handle password update if provided
    if (updates.password) {
      const { comparePassword } = await import('@/lib/auth')
      
      // Verify current password
      const isCurrentPasswordValid = await comparePassword(updates.password.current, dbUser.password_hash)
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ 
          success: false, 
          error: 'Current password is incorrect' 
        }, { status: 400 })
      }

      // Hash new password
      const newPasswordHash = await hashPassword(updates.password.new)
      
      // Update password in database
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      await supabase
        .from('users')
        .update({ 
          password_hash: newPasswordHash, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', user.id)
    }

    // Handle preferences update if provided
    if (updates.preferences) {
      const updateData: any = {}
      
      if (updates.preferences.emailNotifications !== undefined) {
        updateData.email_notifications = updates.preferences.emailNotifications
      }
      
      if (updates.preferences.defaultAnalysisType !== undefined) {
        updateData.default_analysis_type = updates.preferences.defaultAnalysisType
      }
      
      if (updates.preferences.autoStoreOnHedera !== undefined) {
        updateData.auto_store_hedera = updates.preferences.autoStoreOnHedera
      }

      // Update preferences in database
      if (Object.keys(updateData).length > 0) {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        
        await supabase
          .from('users')
          .update({ 
            ...updateData, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', user.id)
      }
    }

    // Track profile update for analytics
    await UsageTracker.trackUsage(user.id, 'profile_updated', {
      updatedFields: Object.keys(updates),
      hasPasswordUpdate: !!updates.password,
      hasPreferencesUpdate: !!updates.preferences
    })

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Update profile error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid JSON')) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid request body format' 
        }, { status: 400 })
      }
      
      if (error.message.includes('Validation failed')) {
        return NextResponse.json({ 
          success: false, 
          error: error.message 
        }, { status: 400 })
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update user profile' 
    }, { status: 500 })
  }
}

/**
 * Authenticates the request and returns user info
 */
async function authenticateRequest(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) {
    return null
  }

  const user = await verifyToken(token)
  if (!user) {
    return null
  }

  // Validate email format as additional security check
  if (!validateEmail(user.email)) {
    console.warn(`Invalid email format in token: ${user.email}`)
    return null
  }

  return user
}

/**
 * Parses and validates profile update request
 */
async function parseUpdateRequest(request: NextRequest): Promise<UpdateProfileRequest> {
  try {
    const body = await request.json()
    
    if (!body || typeof body !== 'object') {
      throw new Error('Invalid JSON format')
    }

    const updates: UpdateProfileRequest = {}

    // Validate preferences update
    if (body.preferences !== undefined) {
      if (typeof body.preferences !== 'object') {
        throw new Error('Validation failed: preferences must be an object')
      }

      updates.preferences = {}

      if (body.preferences.emailNotifications !== undefined) {
        if (typeof body.preferences.emailNotifications !== 'boolean') {
          throw new Error('Validation failed: emailNotifications must be a boolean')
        }
        updates.preferences.emailNotifications = body.preferences.emailNotifications
      }

      if (body.preferences.defaultAnalysisType !== undefined) {
        if (!['summary', 'detailed'].includes(body.preferences.defaultAnalysisType)) {
          throw new Error('Validation failed: defaultAnalysisType must be "summary" or "detailed"')
        }
        updates.preferences.defaultAnalysisType = body.preferences.defaultAnalysisType
      }

      if (body.preferences.autoStoreOnHedera !== undefined) {
        if (typeof body.preferences.autoStoreOnHedera !== 'boolean') {
          throw new Error('Validation failed: autoStoreOnHedera must be a boolean')
        }
        updates.preferences.autoStoreOnHedera = body.preferences.autoStoreOnHedera
      }
    }

    // Validate password update
    if (body.password !== undefined) {
      if (typeof body.password !== 'object' || !body.password.current || !body.password.new) {
        throw new Error('Validation failed: password update requires current and new password')
      }

      if (typeof body.password.current !== 'string' || typeof body.password.new !== 'string') {
        throw new Error('Validation failed: passwords must be strings')
      }

      // Validate new password strength
      const { validatePassword } = await import('@/lib/auth')
      const passwordValidation = validatePassword(body.password.new)
      if (!passwordValidation.valid) {
        throw new Error(`Validation failed: ${passwordValidation.error}`)
      }

      updates.password = {
        current: body.password.current,
        new: body.password.new
      }
    }

    // Ensure at least one field is being updated
    if (Object.keys(updates).length === 0) {
      throw new Error('Validation failed: no valid update fields provided')
    }

    return updates
    
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format')
    }
    throw error
  }
}