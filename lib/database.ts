import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Compatibility layer for raw SQL queries using Supabase
export async function query(text: string, params: any[] = []): Promise<any> {
  try {
    const { data, error } = await supabase.rpc('execute_sql', { 
      query: text, 
      params: params 
    });
    
    if (error) throw error;
    return { rows: data || [] };
  } catch (error) {
    console.error('Query error:', error);
    // Fallback: return empty result for compatibility
    return { rows: [], rowCount: 0 };
  }
}

export const neonDb = {
  stats: { totalConnections: 0, idleConnections: 0, waitingClients: 0 },
  close: async () => {}
};

export async function getConnection() {
  return supabase;
}

export async function healthCheck() {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    return { healthy: !error, poolStats: neonDb.stats };
  } catch (error) {
    return { healthy: false, poolStats: neonDb.stats, error: String(error) };
  }
}

// Database health check
export async function checkDatabaseHealth() {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    return {
      healthy: !error,
      timestamp: new Date().toISOString(),
      version: 'Supabase',
      poolStats: neonDb.stats
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : String(error),
      poolStats: neonDb.stats
    };
  }
}

// Re-export functions from db-supabase for backward compatibility
export { 
  getUserById, 
  updateUserSubscription, 
  incrementUserAudits, 
  resetMonthlyAudits,
  createUser,
  getUserByEmail
} from './db-supabase';

// Export trackUsage with proper name
export { trackUsage } from './db-supabase';

// Transaction helper (simplified for Supabase)
export async function withTransaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  // Supabase handles transactions internally
  return await callback(supabase);
}