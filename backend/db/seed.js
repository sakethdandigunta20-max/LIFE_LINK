/**
 * Seed script - populates demo data for local development/testing.
 * Run with: npm run seed  (after creating the schema with db/schema.sql)
 */
require('dotenv').config({ path: '.env.supabase' });
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seed() {
  const client = await pool.connect();
  try {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    console.log('Seeding demo data...');

    // Admin
    const admin = await client.query(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      ['System Admin', 'admin@example.com', passwordHash, '9999999999', 'admin']
    );

    // Hospital
    const hospUser = await client.query(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      ['Dr. Mehta', 'hospital@example.com', passwordHash, '9888888888', 'hospital']
    );
    const hosp = await client.query(
      'INSERT INTO hospitals (user_id, hospital_name, license_number, city, state, country, latitude, longitude, is_verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) RETURNING *',
      [hospUser.rows[0].id, 'City Care Hospital', 'HL-1001', 'Mumbai', 'Maharashtra', 'India', 19.0760, 72.8777]
    );

    // Blood bank
    const bankUser = await client.query(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      ['Red Cross Manager', 'bloodbank@example.com', passwordHash, '9777777777', 'bloodbank']
    );
    const bank = await client.query(
      'INSERT INTO blood_banks (user_id, bank_name, license_number, city, state, country, latitude, longitude, is_verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) RETURNING *',
      [bankUser.rows[0].id, 'Red Cross Blood Bank', 'BB-2001', 'Mumbai', 'Maharashtra', 'India', 19.0825, 72.8811]
    );
    const groups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    for (const g of groups) {
      await client.query(
        'INSERT INTO blood_inventory (blood_bank_id, blood_group, units_available) VALUES ($1, $2, $3) RETURNING *',
        [bank.rows[0].id, g, Math.floor(Math.random() * 30) + 5]
      );
    }

    // Donors
    const donorSeed = [
      { name: 'Rahul Sharma', email: 'donor1@example.com', bg: 'O+', lat: 19.076, lng: 72.877, organ: true, organs: 'kidney,cornea' },
      { name: 'Priya Nair', email: 'donor2@example.com', bg: 'A+', lat: 19.10, lng: 72.85, organ: false, organs: null },
      { name: 'Aman Verma', email: 'donor3@example.com', bg: 'O-', lat: 19.05, lng: 72.90, organ: true, organs: 'liver' },
    ];
    for (const d of donorSeed) {
      const u = await client.query(
        'INSERT INTO users (name, email, password_hash, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [d.name, d.email, passwordHash, '90000000' + Math.floor(Math.random() * 10), 'donor']
      );
      await client.query(
        `INSERT INTO donor_profiles (user_id, blood_group, city, state, country, latitude, longitude, is_organ_donor, organ_types, is_available, eligibility_status)
         VALUES ($1, $2, 'Mumbai', 'Maharashtra', 'India', $3, $4, $5, $6, true, 'eligible') RETURNING *`,
        [u.rows[0].id, d.bg, d.lat, d.lng, d.organ, d.organs]
      );
    }

    // Recipient
    const recUser = await client.query(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      ['Sana Khan', 'recipient@example.com', passwordHash, '9666666666', 'recipient']
    );
    await client.query(
      `INSERT INTO recipient_profiles (user_id, blood_group, city, state, country, latitude, longitude)
       VALUES ($1, 'A+', 'Mumbai', 'Maharashtra', 'India', 19.08, 72.88) RETURNING *`,
      [recUser.rows[0].id]
    );

    console.log('✅ Seed complete. Demo login (all users): password = Password123!');
    console.log('   admin@example.com | hospital@example.com | bloodbank@example.com');
    console.log('   donor1@example.com | recipient@example.com');
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    if (client) client.release();
    process.exit(0);
  }
}

seed();
