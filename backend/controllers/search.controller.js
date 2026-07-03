const { pool } = require('../config/db');
const { success } = require('../utils/response');

// GET /api/search?type=donors|bloodbanks|hospitals&q=&blood_group=&organ_type=&city=
async function search(req, res, next) {
  try {
    const { type, q, blood_group, organ_type, city } = req.query;

    if (type === 'bloodbanks') {
      const where = ['bb.is_verified = 1'];
      const values = [];
      if (q) { where.push('bb.bank_name LIKE ?'); values.push(`%${q}%`); }
      if (city) { where.push('bb.city LIKE ?'); values.push(`%${city}%`); }
      const [rows] = await pool.query(`SELECT * FROM blood_banks bb WHERE ${where.join(' AND ')} LIMIT 50`, values);
      return success(res, rows);
    }

    if (type === 'hospitals') {
      const where = ['is_verified = 1'];
      const values = [];
      if (q) { where.push('hospital_name LIKE ?'); values.push(`%${q}%`); }
      if (city) { where.push('city LIKE ?'); values.push(`%${city}%`); }
      const [rows] = await pool.query(`SELECT * FROM hospitals WHERE ${where.join(' AND ')} LIMIT 50`, values);
      return success(res, rows);
    }

    if (type === 'emergency') {
      const [bloodReqs] = await pool.query(
        `SELECT br.*, 'blood' as request_type FROM blood_requests br WHERE br.urgency = 'critical' AND br.status = 'pending'`
      );
      const [organReqs] = await pool.query(
        `SELECT o.*, 'organ' as request_type FROM organ_requests o WHERE o.urgency = 'critical' AND o.status = 'pending'`
      );
      return success(res, [...bloodReqs, ...organReqs]);
    }

    // default: donors
    const where = ['1=1'];
    const values = [];
    if (q) { where.push('u.name LIKE ?'); values.push(`%${q}%`); }
    if (blood_group) { where.push('dp.blood_group = ?'); values.push(blood_group); }
    if (organ_type) { where.push('FIND_IN_SET(?, dp.organ_types)'); values.push(organ_type); }
    if (city) { where.push('dp.city LIKE ?'); values.push(`%${city}%`); }

    const [rows] = await pool.query(
      `SELECT dp.*, u.name FROM donor_profiles dp JOIN users u ON u.id = dp.user_id WHERE ${where.join(' AND ')} LIMIT 50`,
      values
    );
    return success(res, rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { search };
