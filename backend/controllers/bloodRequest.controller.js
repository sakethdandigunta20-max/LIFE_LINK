const { pool } = require('../config/db');
const { success, error } = require('../utils/response');
const { notifyUser, notifyRole } = require('../utils/notify');

// POST /api/blood-requests
async function createRequest(req, res, next) {
  try {
    const [recRow] = await pool.query('SELECT id FROM recipient_profiles WHERE user_id = ?', [req.user.id]);
    if (!recRow.length) return error(res, 'Complete your recipient profile first', 400);

    const { blood_group, units_needed = 1, urgency = 'medium', hospital_id, notes } = req.body;
    if (!blood_group) return error(res, 'blood_group is required', 400);

    const documentPath = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO blood_requests (recipient_id, hospital_id, blood_group, units_needed, urgency, document_path, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [recRow[0].id, hospital_id || null, blood_group, units_needed, urgency, documentPath, notes || null]
    );

    if (urgency === 'critical') {
      notifyRole('admin', 'Emergency Blood Request', `Critical ${blood_group} blood request created.`, 'emergency').catch(() => {});
      notifyRole('bloodbank', 'Emergency Blood Request', `Critical ${blood_group} blood request needs fulfillment.`, 'emergency').catch(() => {});
    }

    const [rows] = await pool.query('SELECT * FROM blood_requests WHERE id = ?', [result.insertId]);
    return success(res, rows[0], 'Blood request created', 201);
  } catch (err) {
    next(err);
  }
}

// GET /api/blood-requests/me
async function myRequests(req, res, next) {
  try {
    const [recRow] = await pool.query('SELECT id FROM recipient_profiles WHERE user_id = ?', [req.user.id]);
    if (!recRow.length) return success(res, []);
    const [rows] = await pool.query(
      `SELECT br.*, h.hospital_name, bb.bank_name FROM blood_requests br
       LEFT JOIN hospitals h ON h.id = br.hospital_id
       LEFT JOIN blood_banks bb ON bb.id = br.blood_bank_id
       WHERE br.recipient_id = ? ORDER BY br.created_at DESC`,
      [recRow[0].id]
    );
    return success(res, rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/blood-requests (admin, bloodbank, hospital view all/filtered)
async function listRequests(req, res, next) {
  try {
    const { status, urgency, blood_group, page = 1, limit = 20 } = req.query;
    const where = [];
    const values = [];
    if (status) { where.push('br.status = ?'); values.push(status); }
    if (urgency) { where.push('br.urgency = ?'); values.push(urgency); }
    if (blood_group) { where.push('br.blood_group = ?'); values.push(blood_group); }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (Number(page) - 1) * Number(limit);

    const [rows] = await pool.query(
      `SELECT br.*, u.name AS recipient_name, u.phone AS recipient_phone, h.hospital_name, bb.bank_name
       FROM blood_requests br
       JOIN recipient_profiles rp ON rp.id = br.recipient_id
       JOIN users u ON u.id = rp.user_id
       LEFT JOIN hospitals h ON h.id = br.hospital_id
       LEFT JOIN blood_banks bb ON bb.id = br.blood_bank_id
       ${whereSql}
       ORDER BY FIELD(br.urgency,'critical','high','medium','low'), br.created_at DESC
       LIMIT ? OFFSET ?`,
      [...values, Number(limit), offset]
    );
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM blood_requests br ${whereSql}`, values);
    return success(res, { requests: rows, total: countRows[0].total });
  } catch (err) {
    next(err);
  }
}

// PUT /api/blood-requests/:id  (recipient updates own pending request)
async function updateRequest(req, res, next) {
  try {
    const [reqRow] = await pool.query(
      `SELECT br.* FROM blood_requests br JOIN recipient_profiles rp ON rp.id = br.recipient_id WHERE br.id = ? AND rp.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!reqRow.length) return error(res, 'Request not found', 404);
    if (reqRow[0].status !== 'pending') return error(res, 'Only pending requests can be edited', 400);

    const fields = ['blood_group', 'units_needed', 'urgency', 'notes', 'hospital_id'];
    const updates = [];
    const values = [];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); }
    });
    if (!updates.length) return error(res, 'No valid fields to update', 400);
    values.push(req.params.id);

    await pool.query(`UPDATE blood_requests SET ${updates.join(', ')} WHERE id = ?`, values);
    const [rows] = await pool.query('SELECT * FROM blood_requests WHERE id = ?', [req.params.id]);
    return success(res, rows[0], 'Request updated');
  } catch (err) {
    next(err);
  }
}

// PUT /api/blood-requests/:id/cancel
async function cancelRequest(req, res, next) {
  try {
    const [reqRow] = await pool.query(
      `SELECT br.* FROM blood_requests br JOIN recipient_profiles rp ON rp.id = br.recipient_id WHERE br.id = ? AND rp.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!reqRow.length) return error(res, 'Request not found', 404);
    if (['fulfilled', 'cancelled'].includes(reqRow[0].status)) return error(res, 'Request cannot be cancelled', 400);

    await pool.query('UPDATE blood_requests SET status = "cancelled" WHERE id = ?', [req.params.id]);
    return success(res, {}, 'Request cancelled');
  } catch (err) {
    next(err);
  }
}

// PUT /api/blood-requests/:id/status  (admin / bloodbank: approve, reject, fulfill)
async function updateStatus(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { status, blood_bank_id } = req.body;
    if (!['approved', 'rejected', 'fulfilled'].includes(status)) return error(res, 'Invalid status', 400);

    const [rows] = await conn.query('SELECT * FROM blood_requests WHERE id = ?', [req.params.id]);
    if (!rows.length) return error(res, 'Request not found', 404);
    const request = rows[0];

    await conn.beginTransaction();

    if (status === 'fulfilled') {
      const bankId = blood_bank_id || request.blood_bank_id;
      if (bankId) {
        const [inv] = await conn.query(
          'SELECT units_available FROM blood_inventory WHERE blood_bank_id = ? AND blood_group = ? FOR UPDATE',
          [bankId, request.blood_group]
        );
        if (inv.length && inv[0].units_available >= request.units_needed) {
          await conn.query(
            'UPDATE blood_inventory SET units_available = units_available - ? WHERE blood_bank_id = ? AND blood_group = ?',
            [request.units_needed, bankId, request.blood_group]
          );
        }
      }
    }

    await conn.query(
      'UPDATE blood_requests SET status = ?, blood_bank_id = COALESCE(?, blood_bank_id) WHERE id = ?',
      [status, blood_bank_id || null, req.params.id]
    );

    await conn.commit();

    const [recUser] = await pool.query(
      'SELECT u.id FROM users u JOIN recipient_profiles rp ON rp.user_id = u.id WHERE rp.id = ?',
      [request.recipient_id]
    );
    if (recUser.length) {
      notifyUser(recUser[0].id, `Blood Request ${status}`, `Your blood request for ${request.blood_group} was ${status}.`, status === 'rejected' ? 'warning' : 'success').catch(() => {});
    }

    const [updated] = await pool.query('SELECT * FROM blood_requests WHERE id = ?', [req.params.id]);
    return success(res, updated[0], `Request marked as ${status}`);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

module.exports = { createRequest, myRequests, listRequests, updateRequest, cancelRequest, updateStatus };
