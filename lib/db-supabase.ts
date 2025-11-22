import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton Supabase client
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }

  return supabaseInstance;
}

// User operations
export async function getUserById(userId: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return data;
}

export async function getUserByEmail(email: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error getting user by email:', error);
    return null;
  }
  return data;
}

export async function createUser(userData: {
  id: string;
  email: string;
  name?: string;
  subscription_tier?: string;
}) {
  const supabase = getSupabaseClient();
  
  const tier = userData.subscription_tier || 'free';
  
  // Set audit limits based on tier: Free=10, Pro=100, Max=999999 (unlimited)
  const auditLimit = tier === 'free' ? 10 : tier === 'pro' ? 100 : 999999;
  
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: userData.id,
      email: userData.email,
      name: userData.name || null,
      password_hash: '', // Empty since Supabase Auth handles passwords
      subscription_tier: tier,
      audits_this_month: 0,
      audit_limit: auditLimit,
      last_audit_reset: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating user:', error);
    return null;
  }
  return data;
}

export async function updateUserSubscription(userId: string, subscriptionData: any) {
  const supabase = getSupabaseClient();
  
  const { subscription_tier, subscription_expires } = subscriptionData;
  
  // Automatically set audit limit based on tier: Free=10, Pro=100, Max=999999
  const audit_limit = subscription_tier === 'free' ? 10 : 
                      subscription_tier === 'pro' ? 100 : 
                      999999;
  
  const { data, error } = await supabase
    .from('users')
    .update({
      subscription_tier,
      audit_limit,
      subscription_expires,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating user subscription:', error);
    return null;
  }
  return data;
}

export async function incrementUserAudits(userId: string) {
  const supabase = getSupabaseClient();
  
  // Get current count
  const user = await getUserById(userId);
  if (!user) return null;
  
  const newCount = (user.audits_this_month || 0) + 1;
  
  const { data, error } = await supabase
    .from('users')
    .update({
      audits_this_month: newCount,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    console.error('Error incrementing user audits:', error);
    return null;
  }
  return newCount;
}

export async function resetMonthlyAudits(userId: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('users')
    .update({
      audits_this_month: 0,
      last_audit_reset: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    console.error('Error resetting monthly audits:', error);
    return null;
  }
  return data;
}

// Usage tracking
export async function trackUsage(userId: string, action: string, metadata: any = {}) {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('usage_logs')
    .insert({
      user_id: userId,
      action,
      metadata,
      created_at: new Date().toISOString()
    });
  
  if (error) {
    console.error('Error tracking usage:', error);
  }
}

// Health check
export async function checkDatabaseHealth() {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('users').select('id').limit(1);
    
    return {
      healthy: !error,
      timestamp: new Date().toISOString(),
      version: 'Supabase',
      error: error ? error.message : undefined
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  }
}
