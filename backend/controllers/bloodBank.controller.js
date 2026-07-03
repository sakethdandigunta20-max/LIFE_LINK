const { pool } = require('../config/db');
const { success, error } = require('../utils/response');

async function getMyProfile(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM blood_banks WHERE user_id = ?', [req.user.id]);
    if (!rows.length) return error(res, 'Blood bank profile not found', 404);
    return success(res, rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updateMyProfile(req, res, next) {
  try {
    const fields = ['bank_name', 'license_number', 'address', 'city', 'state', 'country', 'latitude', 'longitude', 'contact_person'];
    const updates = [];
    const values = [];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); }
    });
    if (!updates.length) return error(res, 'No valid fields to update', 400);
    values.push(req.user.id);

    await pool.query(`UPDATE blood_banks SET ${updates.join(', ')} WHERE user_id = ?`, values);
    const [rows] = await pool.query('SELECT * FROM blood_banks WHERE user_id = ?', [req.user.id]);
    return success(res, rows[0], 'Blood bank profile updated');
  } catch (err) {
    next(err);
  }
}

// GET /api/bloodbanks  - public-ish list for search/nearby
async function listBloodBanks(req, res, next) {
  try {
    const { city, blood_group, page = 1, limit = 20 } = req.query;
    const where = ['bb.is_verified = 1'];
    const values = [];
    if (city) { where.push('bb.city LIKE ?'); values.push(`%${city}%`); }

    let joinInventory = '';
    if (blood_group) {
      joinInventory = 'JOIN blood_inventory bi ON bi.blood_bank_id = bb.id AND bi.blood_group = ? AND bi.units_available > 0';
      values.unshift(blood_group);
    }

    const whereSql = `WHERE ${where.join(' AND ')}`;
    const offset = (Number(page) - 1) * Number(limit);

    const [rows] = await pool.query(
      `SELECT DISTINCT bb.* FROM blood_banks bb ${joinInventory} ${whereSql} LIMIT ? OFFSET ?`,
      [...values, Number(limit), offset]
    );
    return success(res, rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/bloodbanks/:id/inventory
async function getInventory(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM blood_inventory WHERE blood_bank_id = ? ORDER BY blood_group', [req.params.id]);
    return success(res, rows);
  } catch (err) {
    next(err);
  }
}

// PUT /api/bloodbanks/me/inventory  { blood_group, units_available }
async function updateInventory(req, res, next) {
  try {
    const { blood_group, units_available } = req.body;
    if (!blood_group || units_available === undefined) return error(res, 'blood_group and units_available are required', 400);
    if (units_available < 0) return error(res, 'units_available cannot be negative', 400);

    const [bankRow] = await pool.query('SELECT id FROM blood_banks WHERE user_id = ?', [req.user.id]);
    if (!bankRow.length) return error(res, 'Blood bank profile not found', 404);

    await pool.query(
      `INSERT INTO blood_inventory (blood_bank_id, blood_group, units_available)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE units_available = ?`,
      [bankRow[0].id, blood_group, units_available, units_available]
    );

    const [rows] = await pool.query('SELECT * FROM blood_inventory WHERE blood_bank_id = ? ORDER BY blood_group', [bankRow[0].id]);
    return success(res, rows, 'Inventory updated');
  } catch (err) {
    next(err);
  }
}

async function getMyInventory(req, res, next) {
  try {
    const [bankRow] = await pool.query('SELECT id FROM blood_banks WHERE user_id = ?', [req.user.id]);
    if (!bankRow.length) return error(res, 'Blood bank profile not found', 404);
    const [rows] = await pool.query('SELECT * FROM blood_inventory WHERE blood_bank_id = ? ORDER BY blood_group', [bankRow[0].id]);
    return success(res, rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyProfile, updateMyProfile, listBloodBanks, getInventory, updateInventory, getMyInventory };
