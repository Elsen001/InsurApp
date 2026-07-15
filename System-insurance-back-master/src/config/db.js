const knex = require('knex');
const fs = require('fs');
require('dotenv').config();

// TiDB Cloud / uzaq baza TLS tələb edir. DB_SSL=true olanda TLS aktivləşir.
// DB_CA verilibsə həmin CA faylı, yoxsa sistem CA-ları istifadə olunur.
function buildSsl() {
  if (String(process.env.DB_SSL).toLowerCase() !== 'true') return undefined;
  const ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: true };
  if (process.env.DB_CA && fs.existsSync(process.env.DB_CA)) {
    ssl.ca = fs.readFileSync(process.env.DB_CA);
  }
  return ssl;
}

const useSsl = String(process.env.DB_SSL).toLowerCase() === 'true';

const db = knex({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'insurance_db',
    charset: 'utf8mb4',
    ssl: buildSsl(),
  },
  // Serverless (Vercel) üçün min:0 — boşda bağlantı saxlanmasın
  pool: { min: useSsl ? 0 : 2, max: 10 },
  acquireConnectionTimeout: 20000,
});

module.exports = db;
