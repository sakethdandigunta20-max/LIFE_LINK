const { pool } = require('../config/db');
const { success, error } = require('../utils/response');
const { notifyUser } = require('../utils/notify');

// GET /api/admin/users?role=&is_active=&page=&limit=
async function listUsers(req, res, next) {
  try {
    const { role, is_active, q, page = 1, limit = 20 } = req.query;
    const where = [];
    const values = [];
    if (role) { where.push('role = ?'); values.push(role); }
    if (is_active !== undefined) { where.push('is_active = ?'); values.push(is_active === 'true' ? 1 : 0); }
    if (q) { where.push('(name LIKE ? OR email LIKE ?)'); values.push(`%${q}%`, `%${q}%`); }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (Number(page) - 1) * Number(limit);

    const [rows] = await pool.query(
      `SELECT id, name, email, phone, role, is_active, created_at FROM users ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...values, Number(limit), offset]
    );
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM users ${whereSql}`, values);
    return success(res, { users: rows, total: countRows[0].total });
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/users/:id/status  { is_active }
async function setUserStatus(req, res, next) {
  try {
    const { is_active } = req.body;
    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, req.params.id]);
    notifyUser(req.params.id, 'Account Status Updated', `Your account has been ${is_active ? 'activated' : 'deactivated'} by an administrator.`, 'warning').catch(() => {});
    return success(res, {}, 'User status updated');
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/users/:id
async function deleteUser(req, res, next) {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    return success(res, {}, 'User deleted');
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/hospitals/pending
async function pendingHospitals(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM hospitals WHERE is_verified = 0');
    return success(res, rows);
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/hospitals/:id/verify
async function verifyHospital(req, res, next) {
  try {
    await pool.query('UPDATE hospitals SET is_verified = 1 WHERE id = ?', [req.params.id]);
    const [rows] = await pool.query('SELECT user_id, hospital_name FROM hospitals WHERE id = ?', [req.params.id]);
    if (rows.length) notifyUser(rows[0].user_id, 'Hospital Verified', `${rows[0].hospital_name} has been verified.`, 'success').catch(() => {});
    return success(res, {}, 'Hospital verified');
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/bloodbanks/pending
async function pendingBloodBanks(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM blood_banks WHERE is_verified = 0');
    return success(res, rows);
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/bloodbanks/:id/verify
async function verifyBloodBank(req, res, next) {
  try {
    await pool.query('UPDATE blood_banks SET is_verified = 1 WHERE id = ?', [req.params.id]);
    const [rows] = await pool.query('SELECT user_id, bank_name FROM blood_banks WHERE id = ?', [req.params.id]);
    if (rows.length) notifyUser(rows[0].user_id, 'Blood Bank Verified', `${rows[0].bank_name} has been verified.`, 'success').catch(() => {});
    return success(res, {}, 'Blood bank verified');
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/emergencies - all pending critical requests across the system
async function emergencies(req, res, next) {
  try {
    const [bloodReqs] = await pool.query(
      `SELECT br.*, u.name as recipient_name, u.phone as recipient_phone, 'blood' as request_type
       FROM blood_requests br JOIN recipient_profiles rp ON rp.id = br.recipient_id JOIN users u ON u.id = rp.user_id
       WHERE br.urgency = 'critical' AND br.status = 'pending'`
    );
    const [organReqs] = await pool.query(
      `SELECT o.*, u.name as recipient_name, u.phone as recipient_phone, 'organ' as request_type
       FROM organ_requests o JOIN recipient_profiles rp ON rp.id = o.recipient_id JOIN users u ON u.id = rp.user_id
       WHERE o.urgency = 'critical' AND o.status = 'pending'`
    );
    return success(res, [...bloodReqs, ...organReqs]);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listUsers,
  setUserStatus,
  deleteUser,
  pendingHospitals,
  verifyHospital,
  pendingBloodBanks,
  verifyBloodBank,
  emergencies,
};
