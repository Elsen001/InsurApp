require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function buildSsl() {
  if (String(process.env.DB_SSL).toLowerCase() !== 'true') return undefined;
  const ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: true };
  if (process.env.DB_CA && fs.existsSync(process.env.DB_CA)) {
    ssl.ca = fs.readFileSync(process.env.DB_CA);
  }
  return ssl;
}

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
    ssl: buildSsl(),
  });

  try {
    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`Migration icra edilir: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await connection.query(sql);
      console.log(`✓ ${file} tamamlandı`);
    }

    console.log('\nBütün migrationlar uğurla icra edildi!');
    console.log('\nTest hesabları:');
    console.log('Admin: admin@insurance.az / password');
    console.log('Agent: ali.hasanov@insurance.az / password');
  } catch (err) {
    console.error('Migration xətası:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigrations();
