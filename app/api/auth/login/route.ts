import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient, getUserById } from '@/lib/db-supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    const supabase = getSupabaseClient()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!data.user || !data.session) {
      return NextResponse.json({ error: 'Login failed' }, { status: 401 })
    }

    // Fetch user profile from database
    const userProfile = await getUserById(data.user.id)
    
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        subscription_tier: userProfile?.subscription_tier || 'free',
        auditsThisMonth: userProfile?.audits_this_month || 0,
        auditLimit: userProfile?.audit_limit || 3
      }
    })

    // Set session cookies
    response.cookies.set('sb-access-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    response.cookies.set('sb-refresh-token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}