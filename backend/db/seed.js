/**
 * Seed script - populates demo data for local development/testing.
 * Run with: npm run seed  (after creating the schema with db/schema.sql)
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seed() {
  const conn = await pool.getConnection();
  try {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    console.log('Seeding demo data...');

    // Admin
    const [admin] = await conn.query(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
      ['System Admin', 'admin@example.com', passwordHash, '9999999999', 'admin']
    );

    // Hospital
    const [hospUser] = await conn.query(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
      ['Dr. Mehta', 'hospital@example.com', passwordHash, '9888888888', 'hospital']
    );
    const [hosp] = await conn.query(
      'INSERT INTO hospitals (user_id, hospital_name, license_number, city, state, country, latitude, longitude, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
      [hospUser.insertId, 'City Care Hospital', 'HL-1001', 'Mumbai', 'Maharashtra', 'India', 19.0760, 72.8777]
    );

    // Blood bank
    const [bankUser] = await conn.query(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
      ['Red Cross Manager', 'bloodbank@example.com', passwordHash, '9777777777', 'bloodbank']
    );
    const [bank] = await conn.query(
      'INSERT INTO blood_banks (user_id, bank_name, license_number, city, state, country, latitude, longitude, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
      [bankUser.insertId, 'Red Cross Blood Bank', 'BB-2001', 'Mumbai', 'Maharashtra', 'India', 19.0825, 72.8811]
    );
    const groups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    for (const g of groups) {
      await conn.query(
        'INSERT INTO blood_inventory (blood_bank_id, blood_group, units_available) VALUES (?, ?, ?)',
        [bank.insertId, g, Math.floor(Math.random() * 30) + 5]
      );
    }

    // Donors
    const donorSeed = [
      { name: 'Rahul Sharma', email: 'donor1@example.com', bg: 'O+', lat: 19.076, lng: 72.877, organ: 1, organs: 'kidney,cornea' },
      { name: 'Priya Nair', email: 'donor2@example.com', bg: 'A+', lat: 19.10, lng: 72.85, organ: 0, organs: null },
      { name: 'Aman Verma', email: 'donor3@example.com', bg: 'O-', lat: 19.05, lng: 72.90, organ: 1, organs: 'liver' },
    ];
    for (const d of donorSeed) {
      const [u] = await conn.query(
        'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
        [d.name, d.email, passwordHash, '90000000' + Math.floor(Math.random() * 10), 'donor']
      );
      await conn.query(
        `INSERT INTO donor_profiles (user_id, blood_group, city, state, country, latitude, longitude, is_organ_donor, organ_types, is_available, eligibility_status)
         VALUES (?, ?, 'Mumbai', 'Maharashtra', 'India', ?, ?, ?, ?, 1, 'eligible')`,
        [u.insertId, d.bg, d.lat, d.lng, d.organ, d.organs]
      );
    }

    // Recipient
    const [recUser] = await conn.query(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
      ['Sana Khan', 'recipient@example.com', passwordHash, '9666666666', 'recipient']
    );
    await conn.query(
      `INSERT INTO recipient_profiles (user_id, blood_group, city, state, country, latitude, longitude)
       VALUES (?, 'A+', 'Mumbai', 'Maharashtra', 'India', 19.08, 72.88)`,
      [recUser.insertId]
    );

    console.log('✅ Seed complete. Demo login (all users): password = Password123!');
    console.log('   admin@example.com | hospital@example.com | bloodbank@example.com');
    console.log('   donor1@example.com | recipient@example.com');
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed();
