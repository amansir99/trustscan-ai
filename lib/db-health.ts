/**
 * Database health monitoring and diagnostics
 */

import { query, checkDatabaseHealth } from './database';

interface TableStats {
  tableName: string;
  rowCount: number;
  sizeBytes: number;
  indexCount: number;
}

interface DatabaseStats {
  healthy: boolean;
  connectionPool: {
    totalConnections: number;
    idleConnections: number;
    waitingClients: number;
  };
  tables: TableStats[];
  slowQueries: number;
  lastChecked: Date;
}

export async function getDatabaseStats(): Promise<DatabaseStats> {
  try {
    const healthCheck = await checkDatabaseHealth();
    
    // Get table statistics
    const tableStatsQuery = `
      SELECT 
        schemaname,
        tablename,
        n_tup_ins + n_tup_upd + n_tup_del as total_operations,
        n_live_tup as row_count,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public'
    `;
    
    const tableStatsResult = await query(tableStatsQuery);
    
    // Get index counts for each table
    const indexCountQuery = `
      SELECT 
        t.tablename,
        COUNT(i.indexname) as index_count
      FROM pg_tables t
      LEFT JOIN pg_indexes i ON t.tablename = i.tablename AND t.schemaname = i.schemaname
      WHERE t.schemaname = 'public'
      GROUP BY t.tablename
    `;
    
    const indexCountResult = await query(indexCountQuery);
    const indexCounts = Object.fromEntries(
      indexCountResult.rows.map((row: any) => [row.tablename, parseInt(row.index_count)])
    );
    
    const tables: TableStats[] = tableStatsResult.rows.map((row: any) => ({
      tableName: row.tablename,
      rowCount: parseInt(row.row_count) || 0,
      sizeBytes: parseInt(row.size_bytes) || 0,
      indexCount: indexCounts[row.tablename] || 0
    }));
    
    return {
      healthy: healthCheck.healthy,
      connectionPool: {
        totalConnections: healthCheck.poolStats?.totalConnections || 0,
        idleConnections: healthCheck.poolStats?.idleConnections || 0,
        waitingClients: healthCheck.poolStats?.waitingClients || 0
      },
      tables,
      slowQueries: 0, // This would be tracked by a query logger in production
      lastChecked: new Date()
    };
    
  } catch (error) {
    console.error('Error getting database stats:', error);
    return {
      healthy: false,
      connectionPool: {
        totalConnections: 0,
        idleConnections: 0,
        waitingClients: 0
      },
      tables: [],
      slowQueries: 0,
      lastChecked: new Date()
    };
  }
}

export async function validateDatabaseSchema(): Promise<{
  valid: boolean;
  issues: string[];
}> {
  const issues: string[] = [];
  
  try {
    // Check required tables exist
    const requiredTables = ['users', 'audits', 'subscriptions', 'usage_logs'];
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const existingTables = tablesResult.rows.map((row: any) => row.table_name);
    
    for (const table of requiredTables) {
      if (!existingTables.includes(table)) {
        issues.push(`Missing required table: ${table}`);
      }
    }
    
    // Check required columns exist
    const requiredColumns = {
      users: ['id', 'email', 'password_hash', 'subscription_tier', 'audits_this_month'],
      audits: ['id', 'user_id', 'url', 'trust_score', 'risk_level', 'analysis_data', 'extracted_content'],
      subscriptions: ['id', 'user_id', 'plan', 'status', 'expires_at'],
      usage_logs: ['id', 'user_id', 'action', 'created_at']
    };
    
    for (const [tableName, columns] of Object.entries(requiredColumns)) {
      if (existingTables.includes(tableName)) {
        const columnsResult = await query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1
        `, [tableName]);
        
        const existingColumns = columnsResult.rows.map((row: any) => row.column_name);
        
        for (const column of columns) {
          if (!existingColumns.includes(column)) {
            issues.push(`Missing required column: ${tableName}.${column}`);
          }
        }
      }
    }
    
    // Check required indexes exist
    const requiredIndexes = [
      'idx_users_email',
      'idx_audits_user_id',
      'idx_audits_trust_score',
      'idx_subscriptions_user_status'
    ];
    
    const indexesResult = await query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `);
    
    const existingIndexes = indexesResult.rows.map((row: any) => row.indexname);
    
    for (const index of requiredIndexes) {
      if (!existingIndexes.includes(index)) {
        issues.push(`Missing required index: ${index}`);
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
    
  } catch (error) {
    issues.push(`Schema validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      valid: false,
      issues
    };
  }
}

export async function runDatabaseDiagnostics(): Promise<void> {
  console.log('🔍 Running database diagnostics...\n');
  
  // Health check
  const healthCheck = await checkDatabaseHealth();
  console.log('📊 Database Health:');
  console.log(`  Status: ${healthCheck.healthy ? '✅ Healthy' : '❌ Unhealthy'}`);
  if (healthCheck.healthy) {
    console.log(`  Pool Size: ${healthCheck.poolStats?.totalConnections || 0}`);
    console.log(`  Idle Connections: ${healthCheck.poolStats?.idleConnections || 0}`);
    console.log(`  Waiting Clients: ${healthCheck.poolStats?.waitingClients || 0}`);
  }
  console.log();
  
  // Schema validation
  const schemaValidation = await validateDatabaseSchema();
  console.log('🏗️  Schema Validation:');
  console.log(`  Status: ${schemaValidation.valid ? '✅ Valid' : '❌ Issues Found'}`);
  if (schemaValidation.issues.length > 0) {
    console.log('  Issues:');
    schemaValidation.issues.forEach(issue => console.log(`    - ${issue}`));
  }
  console.log();
  
  // Database statistics
  const stats = await getDatabaseStats();
  console.log('📈 Database Statistics:');
  console.log(`  Tables: ${stats.tables.length}`);
  stats.tables.forEach(table => {
    const sizeKB = Math.round(table.sizeBytes / 1024);
    console.log(`    ${table.tableName}: ${table.rowCount} rows, ${sizeKB}KB, ${table.indexCount} indexes`);
  });
  
  console.log('\n✅ Database diagnostics completed');
}