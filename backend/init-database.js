const db = require('./utils/database');

/**
 * Database Initialization Script
 * Creates all necessary tables for the International Payments Portal
 */

async function initializeDatabase() {
  try {
    console.log('🗄️  Initializing database schema...');
    
    await db.initializeDatabase();
    
    // Create customers table
    await db.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(50) NOT NULL,
        id_hash VARCHAR(128) NOT NULL,
        id_salt VARCHAR(64) NOT NULL,
        account_number_hash VARCHAR(128) NOT NULL,
        account_number_salt VARCHAR(64) NOT NULL,
        email VARCHAR(254) UNIQUE NOT NULL,
        password_hash VARCHAR(256) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ Customers table created');
    
    // Create user_sessions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(64) UNIQUE NOT NULL,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        ip_address VARCHAR(45) NOT NULL,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ User sessions table created');
    
    // Create transactions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) NOT NULL,
        provider VARCHAR(50) NOT NULL,
        swift_bic VARCHAR(11) NOT NULL,
        recipient_account VARCHAR(34) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        submission_signature VARCHAR(256) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ Transactions table created');
    
    // Create audit_log table (matching existing schema)
    await db.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id BIGSERIAL PRIMARY KEY,
        action VARCHAR(50) NOT NULL,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        ip_address INET,
        user_agent TEXT,
        details JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        success BOOLEAN NOT NULL DEFAULT true
      )
    `);
    console.log('   ✅ Audit log table created');
    
    // Create indexes for performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_customers_id_hash ON customers(id_hash)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_customer_id ON user_sessions(customer_id)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_customer_id ON audit_log(customer_id)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action)
    `);
    console.log('   ✅ Indexes created');
    
    console.log('\n✨ Database initialization completed successfully!');
    
    await db.pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during database initialization:', error);
    await db.pool.end();
    process.exit(1);
  }
}

// Run initialization if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
