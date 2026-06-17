/**
 * Run from the BACKEND folder:
 *   cd ../System-insurance-back-master/System-insurance-back-master
 *   node ../../System-insurance-front-master/System-insurance-front-master/add_new_admin.js
 *
 * Or copy this file into the backend folder and run:
 *   node add_new_admin.js
 *
 * New admin credentials:
 *   Email   : superadmin@insurance.az
 *   Password: Admin@2025!
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const knex   = require('knex');

const db = knex({
  client: 'mysql2',
  connection: {
    host    : process.env.DB_HOST     || 'localhost',
    port    : process.env.DB_PORT     || 3306,
    user    : process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'insurance_db',
    charset : 'utf8mb4',
  },
});

(async () => {
  try {
    const email         = 'superadmin@insurance.az';
    const plainPassword = 'Admin@2025!';

    const existing = await db('users').where({ email }).first();
    if (existing) {
      console.log('Admin already exists:', email);
      return;
    }

    const hashed = await bcrypt.hash(plainPassword, 10);
    const [id] = await db('users').insert({
      name           : 'Super Admin',
      email,
      password       : hashed,
      role           : 'admin',
      commission_rate: 0.00,
      is_active      : 1,
    });

    console.log('\nAdmin created!');
    console.log('  ID      :', id);
    console.log('  Email   :', email);
    console.log('  Password: Admin@2025!\n');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await db.destroy();
  }
})();
