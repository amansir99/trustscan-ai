import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function simpleQuery(text: string, params: any[] = []) {
  // This is kept for compatibility but not used with Supabase
  throw new Error('Use Supabase client methods instead of raw queries');
}

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
  return data;
}

export async function getUser(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
  return data;
}

export async function createUser(email: string, hashedPassword: string) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      password_hash: hashedPassword,
      subscription_tier: 'free',
      audits_this_month: 0,
      audit_limit: 3,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating user:', error);
    return null;
  }
  return data;
}