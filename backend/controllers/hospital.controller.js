const { pool } = require('../config/db');
const { success, error } = require('../utils/response');

async function getMyProfile(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM hospitals WHERE user_id = ?', [req.user.id]);
    if (!rows.length) return error(res, 'Hospital profile not found', 404);
    return success(res, rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updateMyProfile(req, res, next) {
  try {
    const fields = ['hospital_name', 'license_number', 'address', 'city', 'state', 'country', 'latitude', 'longitude', 'contact_person'];
    const updates = [];
    const values = [];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); }
    });
    if (!updates.length) return error(res, 'No valid fields to update', 400);
    values.push(req.user.id);

    await pool.query(`UPDATE hospitals SET ${updates.join(', ')} WHERE user_id = ?`, values);
    const [rows] = await pool.query('SELECT * FROM hospitals WHERE user_id = ?', [req.user.id]);
    return success(res, rows[0], 'Hospital profile updated');
  } catch (err) {
    next(err);
  }
}

async function listHospitals(req, res, next) {
  try {
    const { city } = req.query;
    const where = ['is_verified = 1'];
    const values = [];
    if (city) { where.push('city LIKE ?'); values.push(`%${city}%`); }
    const [rows] = await pool.query(`SELECT * FROM hospitals WHERE ${where.join(' AND ')}`, values);
    return success(res, rows);
  } catch (err) {
    next(err);
  }
}

// Hospital dashboard: recipient requests routed to this hospital + patient coordination view
async function myPatientRequests(req, res, next) {
  try {
    const [hospRow] = await pool.query('SELECT id FROM hospitals WHERE user_id = ?', [req.user.id]);
    if (!hospRow.length) return error(res, 'Hospital profile not found', 404);

    const [bloodReqs] = await pool.query(
      `SELECT br.*, u.name AS recipient_name, u.phone AS recipient_phone FROM blood_requests br
       JOIN recipient_profiles rp ON rp.id = br.recipient_id JOIN users u ON u.id = rp.user_id
       WHERE br.hospital_id = ? ORDER BY br.created_at DESC`,
      [hospRow[0].id]
    );
    const [organReqs] = await pool.query(
      `SELECT o.*, u.name AS recipient_name, u.phone AS recipient_phone FROM organ_requests o
       JOIN recipient_profiles rp ON rp.id = o.recipient_id JOIN users u ON u.id = rp.user_id
       WHERE o.hospital_id = ? ORDER BY o.created_at DESC`,
      [hospRow[0].id]
    );

    return success(res, { bloodRequests: bloodReqs, organRequests: organReqs });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyProfile, updateMyProfile, listHospitals, myPatientRequests };
