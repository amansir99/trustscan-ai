const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Testing database connection...');
    
    const client = await pool.connect();
    
    // Test basic connectivity
    const timeResult = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connected at:', timeResult.rows[0].current_time);
    
    // Test table existence and data
    const tables = await client.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Database Tables:');
    for (const table of tables.rows) {
      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
      console.log(`   ${table.table_name}: ${countResult.rows[0].count} records (${table.column_count} columns)`);
    }
    
    // Test insert/select functionality
    console.log('\n🧪 Testing CRUD operations...');
    
    // Insert test user
    const testUser = await client.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      ['test@example.com', 'test_hash_123']
    );
    console.log('✅ Test user created:', testUser.rows[0].id);
    
    // Select test user
    const foundUser = await client.query('SELECT * FROM users WHERE email = $1', ['test@example.com']);
    console.log('✅ Test user retrieved:', foundUser.rows[0].email);
    
    // Clean up test data
    await client.query('DELETE FROM users WHERE email = $1', ['test@example.com']);
    console.log('✅ Test user cleaned up');
    
    console.log('\n🎉 Database is working perfectly!');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testDatabase();