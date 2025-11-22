import { NextResponse } from 'next/server';
import { checkDatabaseHealth, query } from '@/lib/database';

export async function GET() {
  try {
    // Perform comprehensive database health check
    const health = await checkDatabaseHealth();
    
    // Count records in each table if database is healthy
    let tables = { users: 0, audits: 0 };
    if (health.healthy) {
      try {
        const userCount = await query('SELECT COUNT(*) as count FROM users');
        const auditCount = await query('SELECT COUNT(*) as count FROM audits');
        tables = {
          users: parseInt(userCount.rows[0].count),
          audits: parseInt(auditCount.rows[0].count)
        };
      } catch (error) {
        console.warn('Failed to count table records:', error);
      }
    }
    
    return NextResponse.json({
      status: health.healthy ? 'healthy' : 'unhealthy',
      database: {
        healthy: health.healthy,
        version: health.version,
        currentTime: health.timestamp,
        poolStats: health.poolStats,
        error: health.error
      },
      tables,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Database health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}