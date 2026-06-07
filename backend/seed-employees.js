const dotenv = require('dotenv');
dotenv.config();

const db = require('./utils/database');
const { hashPassword } = require('./utils/hash');
const { auditLog } = require('./utils/logger');

/**
 * Employee Seeding Script
 * Creates pre-defined employee accounts for the International Payments Portal
 * Employees use username/password login (no account number required)
 * Passwords are read from environment variables for security
 */

const EMPLOYEES = [
  {
    username: 'emp_john',
    fullName: 'John Smith',
    email: 'john.smith@company.com',
    password: process.env.EMPLOYEE_PASSWORD,
    role: 'employee'
  },
  {
    username: 'mgr_jane',
    fullName: 'Jane Doe',
    email: 'jane.doe@company.com',
    password: process.env.MANAGER_PASSWORD,
    role: 'manager'
  },
  {
    username: 'admin_bob',
    fullName: 'Bob Johnson',
    email: 'bob.johnson@company.com',
    password: process.env.ADMIN_PASSWORD,
    role: 'admin'
  }
];

async function seedEmployees() {
  try {
    console.log('🌱 Starting employee seeding process...');
    
    // Connect to database
    const isConnected = await db.testConnection();
    if (!isConnected) {
      console.error('❌ Database connection failed. Please ensure the database is running.');
      process.exit(1);
    }
    console.log('✅ Database connected successfully');
    
    // Check if employees table exists, if not create it
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'employees'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('📋 Creating employees table...');
      await db.query(`
        CREATE TABLE employees (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(20) DEFAULT 'employee',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP
        );
      `);
      console.log('✅ Employees table created');
    }
    
    for (const employee of EMPLOYEES) {
      console.log(`\n📝 Processing employee: ${employee.username}`);
      
      // Check if employee already exists
      const existingEmployee = await db.query(
        'SELECT id FROM employees WHERE username = $1 OR email = $2',
        [employee.username, employee.email]
      );
      
      if (existingEmployee.rows.length > 0) {
        console.log(`   ✅ Employee ${employee.username} already exists, skipping...`);
        continue;
      }
      
      // Hash the password with scrypt
      const passwordHash = await hashPassword(employee.password);
      console.log(`   🔒 Password hashed successfully`);
      
      // Insert new employee
      const result = await db.query(
        `INSERT INTO employees 
         (username, full_name, email, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, username, full_name, email, role, created_at`,
        [
          employee.username,
          employee.fullName,
          employee.email,
          passwordHash,
          employee.role
        ]
      );
      
      const newEmployee = result.rows[0];
      console.log(`   ✅ Employee created successfully (ID: ${newEmployee.id})`);
      
      // Don't use auditLog for employees since it requires customer_id foreign key
      console.log(`   📝 Employee audit: Created ${employee.username} (${employee.role})`);
    }
    
    console.log('\n✨ Employee seeding completed successfully!');
    console.log('\n📋 Employee credentials for testing:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    EMPLOYEES.forEach(emp => {
      console.log(`\n👤 ${emp.fullName} (${emp.role})`);
      console.log(`   Username: ${emp.username}`);
      console.log(`   Password: ${emp.password}`);
      console.log(`   Email: ${emp.email}`);
    });
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    await db.pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during employee seeding:', error);
    // Don't use auditLog for employees since it requires customer_id foreign key
    await db.pool.end();
    process.exit(1);
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedEmployees();
}

module.exports = { seedEmployees, EMPLOYEES };
