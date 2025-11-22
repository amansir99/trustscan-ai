import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/db-supabase'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()
    
    const supabase = getSupabaseClient()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name.trim()
        }
      }
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data.user) {
      return NextResponse.json({ error: 'Registration failed' }, { status: 400 })
    }

    // Update user profile with name (database trigger creates the profile)
    console.log('User registered successfully:', data.user.id)
    
    // Wait a moment for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500))

    // Update the user record with the name
    const { error: updateError } = await supabase
      .from('users')
      .update({ name: name.trim() })
      .eq('id', data.user.id)

    if (updateError) {
      console.error('Error updating user name:', updateError)
    }

    const response = NextResponse.json({
      message: 'User created successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        name: name.trim(),
        subscription_tier: 'free',
        auditsThisMonth: 0,
        auditLimit: 10
      }
    })

    // Set session cookies if session exists (auto-login after registration)
    if (data.session) {
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
    }

    return response

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}