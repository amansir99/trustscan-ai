'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/useAuth'

export default function AuthDebugPage() {
  const { user, loading } = useAuth()
  const [authUser, setAuthUser] = useState<any>(null)
  const [dbUser, setDbUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Check Supabase Auth session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        setError(`Session error: ${sessionError.message}`)
        return
      }

      if (session?.user) {
        setAuthUser(session.user)
        
        // Check if user exists in public.users
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profileError) {
          setError(`Profile error: ${profileError.message}`)
        } else {
          setDbUser(profile)
        }
      } else {
        setError('No active session')
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`)
    }
  }

  const createMissingProfile = async () => {
    if (!authUser) {
      alert('No auth user found')
      return
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          password_hash: '',
          subscription_tier: 'free',
          audits_this_month: 0,
          audit_limit: 3,
          last_audit_reset: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        alert(`Error creating profile: ${error.message}`)
      } else {
        alert('Profile created successfully!')
        setDbUser(data)
        window.location.reload()
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Debug</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">useAuth Hook Status:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify({ user, loading }, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Supabase Auth User:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {authUser ? JSON.stringify(authUser, null, 2) : 'No auth user'}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Database Profile (public.users):</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {dbUser ? JSON.stringify(dbUser, null, 2) : 'No database profile'}
              </pre>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">
                <h3 className="font-semibold mb-2">Error:</h3>
                <p>{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <Button onClick={checkAuth}>Refresh</Button>
              {authUser && !dbUser && (
                <Button onClick={createMissingProfile} variant="outline">
                  Create Missing Profile
                </Button>
              )}
              {authUser && (
                <Button onClick={signOut} className="bg-red-600 hover:bg-red-700 text-white">
                  Sign Out
                </Button>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded">
              <h3 className="font-semibold mb-2">Status Summary:</h3>
              <ul className="space-y-1 text-sm">
                <li>✅ Auth User: {authUser ? 'Found' : '❌ Not found'}</li>
                <li>✅ Database Profile: {dbUser ? 'Found' : '❌ Not found'}</li>
                <li>✅ useAuth Hook: {user ? 'Working' : '❌ No user'}</li>
                <li>✅ Password Hash: {dbUser?.password_hash === '' ? 'Correct (empty)' : dbUser?.password_hash ? '⚠️ Has value (should be empty)' : 'N/A'}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
