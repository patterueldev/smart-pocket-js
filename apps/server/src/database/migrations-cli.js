const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function listMigrations() {
  const client = await pool.connect();
  
  try {
    const result = await client.query('SELECT version, applied_at FROM schema_migrations ORDER BY version');
    const applied = new Set(result.rows.map(r => r.version));
    
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log('\nMigration Status:');
    console.log('==================\n');
    
    files.forEach(f => {
      const version = f.replace('.sql', '');
      const status = applied.has(version) ? '✓ Applied' : '⬜ Pending';
      const appliedInfo = applied.has(version) 
        ? ` (at ${result.rows.find(r => r.version === version).applied_at.toISOString()})` 
        : '';
      console.log(`${status}  ${version}${appliedInfo}`);
    });
    
    console.log('\n');
  } finally {
    client.release();
  }
}

async function resetMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('\n⚠️  This will drop all migration tracking and re-run from scratch!');
    console.log('⚠️  This does NOT drop any tables - only the migration history.');
    
    await client.query('DROP TABLE IF EXISTS schema_migrations');
    console.log('\nMigration tracking table dropped. Next run will apply all migrations.\n');
  } finally {
    client.release();
  }
}

const command = process.argv[2];

if (command === 'list') {
  listMigrations().catch(console.error);
} else if (command === 'reset') {
  resetMigrations().catch(console.error);
} else {
  console.log('Usage:');
  console.log('  node migrations.js list    - Show migration status');
  console.log('  node migrations.js reset   - Reset migration tracking');
  process.exit(1);
}
