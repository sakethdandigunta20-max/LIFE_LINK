const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { generateToken } = require('../utils/jwt');
const { success, error } = require('../utils/response');
const { notifyRole } = require('../utils/notify');

// POST /api/auth/register
async function register(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { name, email, password, phone, role } = req.body;

    const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return error(res, 'An account with this email already exists', 409);

    const passwordHash = await bcrypt.hash(password, 10);

    await conn.beginTransaction();

    const [result] = await conn.query(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, phone || null, role]
    );
    const userId = result.insertId;

    // Create the role-specific profile shell so the user can fill it in later
    if (role === 'donor') {
      await conn.query(
        'INSERT INTO donor_profiles (user_id, blood_group) VALUES (?, ?)',
        [userId, req.body.blood_group || 'O+']
      );
    } else if (role === 'recipient') {
      await conn.query('INSERT INTO recipient_profiles (user_id) VALUES (?)', [userId]);
    } else if (role === 'hospital') {
      await conn.query(
        'INSERT INTO hospitals (user_id, hospital_name) VALUES (?, ?)',
        [userId, req.body.organization_name || name]
      );
    } else if (role === 'bloodbank') {
      await conn.query(
        'INSERT INTO blood_banks (user_id, bank_name) VALUES (?, ?)',
        [userId, req.body.organization_name || name]
      );
      // seed empty inventory rows for all 8 blood groups
      const [bankRow] = await conn.query('SELECT id FROM blood_banks WHERE user_id = ?', [userId]);
      const bankId = bankRow[0].id;
      const groups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
      const values = groups.map((g) => [bankId, g, 0]);
      await conn.query('INSERT INTO blood_inventory (blood_bank_id, blood_group, units_available) VALUES ?', [values]);
    }

    await conn.commit();

    const token = generateToken({ id: userId, role });
    notifyRole('admin', 'New Registration', `${name} registered as ${role}.`, 'info').catch(() => {});

    return success(
      res,
      { token, user: { id: userId, name, email, role } },
      'Registration successful',
      201
    );
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return error(res, 'Invalid email or password', 401);

    const user = rows[0];
    if (!user.is_active) return error(res, 'This account has been deactivated. Contact support.', 403);

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return error(res, 'Invalid email or password', 401);

    const token = generateToken({ id: user.id, role: user.role });
    delete user.password_hash;

    return success(res, { token, user }, 'Login successful');
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
async function me(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, profile_picture, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    return success(res, rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout - stateless JWT: client discards token. Endpoint kept for symmetry/auditing.
async function logout(req, res) {
  return success(res, {}, 'Logged out successfully');
}

module.exports = { register, login, me, logout };
