import { supabase } from './supabase'
import bcrypt from 'bcryptjs'

export interface AuthUser {
  id: string
  email: string
  subscription_tier: string
  auditsThisMonth: number
  auditLimit: number
  subscriptionExpires?: Date
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' }
  }
  return { valid: true }
}

export function getAuditLimit(subscriptionTier: string): number {
  const limits: Record<string, number> = {
    free: 5,
    pro: 50,
    max: 1000
  }
  return limits[subscriptionTier] || limits.free
}

export function getTokenFromRequest(request: any): string | null {
  const token = request.cookies.get('token')?.value
  if (token) return token
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) return authHeader.substring(7)
  return null
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return null
    
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (!profile) return null
    
    return {
      id: profile.id,
      email: profile.email,
      subscription_tier: profile.subscription_tier || 'free',
      auditsThisMonth: profile.audits_this_month || 0,
      auditLimit: profile.audit_limit || 3
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}