'use client'

import React, { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef } from 'react'
import { supabase } from './supabase'

interface User {
  id: string
  email: string
  name?: string
  subscription_tier: string
  auditsThisMonth: number
  auditLimit: number
  subscriptionExpires?: Date
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name?: string) => Promise<boolean>
  logout: () => Promise<void>
  loading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const loadingProfileRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    let authSubscription: any = null

    const initAuth = async () => {
      await checkAuth()
      
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.email)
          
          if (!mountedRef.current) return

          if (event === 'SIGNED_IN' && session?.user) {
            await loadUserProfile(session.user.id)
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
            setLoading(false)
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            // Refresh user profile on token refresh
            await loadUserProfile(session.user.id)
          } else if (event === 'USER_UPDATED' && session?.user) {
            await loadUserProfile(session.user.id)
          }
        }
      )
      
      authSubscription = subscription
    }

    initAuth()

    return () => {
      mountedRef.current = false
      if (authSubscription) {
        authSubscription.unsubscribe()
      }
    }
  }, [])

  const checkAuth = useCallback(async () => {
    if (!mountedRef.current) return
    
    try {
      setLoading(true)
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Session error:', error)
        setUser(null)
        return
      }

      if (session?.user) {
        await loadUserProfile(session.user.id)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  const loadUserProfile = useCallback(async (userId: string, retryCount = 0) => {
    if (!mountedRef.current || loadingProfileRef.current) return
    
    loadingProfileRef.current = true
    
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Error loading profile:', error)
        
        // Retry once after a delay if profile not found
        if (error.code === 'PGRST116' && retryCount < 2) {
          console.log('Profile not found, retrying...', retryCount + 1)
          await new Promise(resolve => setTimeout(resolve, 1000))
          loadingProfileRef.current = false
          return loadUserProfile(userId, retryCount + 1)
        }
        
        // Fallback: Get email from auth user
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser && mountedRef.current) {
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || undefined,
            subscription_tier: 'free',
            auditsThisMonth: 0,
            auditLimit: 10
          })
        }
        return
      }
      
      if (profile && mountedRef.current) {
        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name || undefined,
          subscription_tier: profile.subscription_tier || 'free',
          auditsThisMonth: profile.audits_this_month || 0,
          auditLimit: profile.audit_limit || 10,
          subscriptionExpires: profile.subscription_expires ? new Date(profile.subscription_expires) : undefined
        })
      }
    } catch (error) {
      console.error('Failed to load user profile:', error)
    } finally {
      loadingProfileRef.current = false
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    if (isAuthenticating) {
      console.log('Login already in progress')
      return false
    }

    setIsAuthenticating(true)
    
    try {
      // Clear any existing session first
      await supabase.auth.signOut()
      await new Promise(resolve => setTimeout(resolve, 300))

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Login error:', error)
        return false
      }
      
      if (data.user && data.session) {
        console.log('Login successful, loading profile...')
        await loadUserProfile(data.user.id)
        
        // Wait a bit to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 500))
        return true
      }
      return false
    } catch (error) {
      console.error('Login failed:', error)
      return false
    } finally {
      setIsAuthenticating(false)
    }
  }

  const register = async (email: string, password: string, name?: string): Promise<boolean> => {
    try {
      // Check if user already exists
      const { data: existingSession } = await supabase.auth.getSession()
      if (existingSession?.session) {
        console.log('User already logged in, signing out first')
        await supabase.auth.signOut()
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            name: name || ''
          }
        }
      })

      if (error) {
        console.error('Registration error:', error)
        // Check if user already exists
        if (error.message.includes('already registered')) {
          alert('This email is already registered. Please login instead.')
          return false
        }
        return false
      }

      if (data.user) {
        console.log('User registered successfully:', data.user.id)
        
        // Wait for database trigger to create user profile
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Load the profile created by the trigger
        await loadUserProfile(data.user.id)
        
        // Check if profile was created
        const profile = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()
        
        if (profile.error) {
          console.error('Profile not found, creating manually:', profile.error)
          // Create profile manually if trigger failed
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email,
              name: name || null,
              subscription_tier: 'free',
              audits_this_month: 0,
              audit_limit: 10,
              last_audit_reset: new Date().toISOString().split('T')[0],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          
          if (insertError) {
            console.error('Failed to create profile:', insertError)
          } else {
            // Update with name if profile was created
            if (name) {
              await supabase
                .from('users')
                .update({ name: name })
                .eq('id', data.user.id)
            }
            await loadUserProfile(data.user.id)
          }
        } else if (name && profile.data) {
          // Update name if profile exists but doesn't have name
          await supabase
            .from('users')
            .update({ name: name })
            .eq('id', data.user.id)
          await loadUserProfile(data.user.id)
        }
        
        return true
      }
      return false
    } catch (error) {
      console.error('Registration failed:', error)
      return false
    }
  }

  const logout = async (): Promise<void> => {
    if (isAuthenticating) {
      console.log('Auth operation in progress, waiting...')
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setIsAuthenticating(true)
    
    try {
      console.log('Logging out...')
      
      // Clear user state immediately
      setUser(null)
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Supabase logout error:', error)
      }
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token')
        sessionStorage.clear()
      }
      
      console.log('Logout complete')
    } catch (error) {
      console.error('Logout failed:', error)
      // Still clear user state even if logout fails
      setUser(null)
    } finally {
      setIsAuthenticating(false)
    }
  }

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await loadUserProfile(session.user.id)
    }
  }, [loadUserProfile])

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    refreshUser
  }

  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}