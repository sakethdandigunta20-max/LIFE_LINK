const { pool } = require('../config/db');
const { success, error } = require('../utils/response');
const { notifyUser, notifyRole } = require('../utils/notify');

async function createRequest(req, res, next) {
  try {
    const [recRow] = await pool.query('SELECT id FROM recipient_profiles WHERE user_id = ?', [req.user.id]);
    if (!recRow.length) return error(res, 'Complete your recipient profile first', 400);

    const { organ_type, urgency = 'medium', hospital_id, notes } = req.body;
    if (!organ_type) return error(res, 'organ_type is required', 400);

    const documentPath = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO organ_requests (recipient_id, hospital_id, organ_type, urgency, document_path, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [recRow[0].id, hospital_id || null, organ_type, urgency, documentPath, notes || null]
    );

    if (urgency === 'critical') {
      notifyRole('admin', 'Emergency Organ Request', `Critical ${organ_type} request created.`, 'emergency').catch(() => {});
      notifyRole('hospital', 'Emergency Organ Request', `Critical ${organ_type} request needs review.`, 'emergency').catch(() => {});
    }

    const [rows] = await pool.query('SELECT * FROM organ_requests WHERE id = ?', [result.insertId]);
    return success(res, rows[0], 'Organ request created', 201);
  } catch (err) {
    next(err);
  }
}

async function myRequests(req, res, next) {
  try {
    const [recRow] = await pool.query('SELECT id FROM recipient_profiles WHERE user_id = ?', [req.user.id]);
    if (!recRow.length) return success(res, []);
    const [rows] = await pool.query(
      `SELECT o.*, h.hospital_name FROM organ_requests o LEFT JOIN hospitals h ON h.id = o.hospital_id
       WHERE o.recipient_id = ? ORDER BY o.created_at DESC`,
      [recRow[0].id]
    );
    return success(res, rows);
  } catch (err) {
    next(err);
  }
}

async function listRequests(req, res, next) {
  try {
    const { status, urgency, organ_type, page = 1, limit = 20 } = req.query;
    const where = [];
    const values = [];
    if (status) { where.push('o.status = ?'); values.push(status); }
    if (urgency) { where.push('o.urgency = ?'); values.push(urgency); }
    if (organ_type) { where.push('o.organ_type = ?'); values.push(organ_type); }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (Number(page) - 1) * Number(limit);

    const [rows] = await pool.query(
      `SELECT o.*, u.name AS recipient_name, u.phone AS recipient_phone, h.hospital_name
       FROM organ_requests o
       JOIN recipient_profiles rp ON rp.id = o.recipient_id
       JOIN users u ON u.id = rp.user_id
       LEFT JOIN hospitals h ON h.id = o.hospital_id
       ${whereSql}
       ORDER BY FIELD(o.urgency,'critical','high','medium','low'), o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...values, Number(limit), offset]
    );
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM organ_requests o ${whereSql}`, values);
    return success(res, { requests: rows, total: countRows[0].total });
  } catch (err) {
    next(err);
  }
}

async function cancelRequest(req, res, next) {
  try {
    const [reqRow] = await pool.query(
      `SELECT o.* FROM organ_requests o JOIN recipient_profiles rp ON rp.id = o.recipient_id WHERE o.id = ? AND rp.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!reqRow.length) return error(res, 'Request not found', 404);
    if (['fulfilled', 'cancelled'].includes(reqRow[0].status)) return error(res, 'Request cannot be cancelled', 400);

    await pool.query('UPDATE organ_requests SET status = "cancelled" WHERE id = ?', [req.params.id]);
    return success(res, {}, 'Request cancelled');
  } catch (err) {
    next(err);
  }
}

// PUT /api/organ-requests/:id/status  (hospital/admin: approve, reject, fulfill)
async function updateStatus(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { status, donor_id } = req.body; // donor_id = donor_profiles.id for fulfillment
    if (!['approved', 'rejected', 'fulfilled'].includes(status)) return error(res, 'Invalid status', 400);

    const [rows] = await conn.query('SELECT * FROM organ_requests WHERE id = ?', [req.params.id]);
    if (!rows.length) return error(res, 'Request not found', 404);
    const request = rows[0];

    await conn.beginTransaction();

    if (status === 'fulfilled' && donor_id) {
      await conn.query(
        `INSERT INTO donations (donor_id, type, organ_request_id, hospital_id, status, donation_date)
         VALUES (?, 'organ', ?, ?, 'scheduled', CURDATE())`,
        [donor_id, request.id, request.hospital_id]
      );
    }

    await conn.query('UPDATE organ_requests SET status = ? WHERE id = ?', [status, req.params.id]);
    await conn.commit();

    const [recUser] = await pool.query(
      'SELECT u.id FROM users u JOIN recipient_profiles rp ON rp.user_id = u.id WHERE rp.id = ?',
      [request.recipient_id]
    );
    if (recUser.length) {
      notifyUser(recUser[0].id, `Organ Request ${status}`, `Your ${request.organ_type} request was ${status}.`, status === 'rejected' ? 'warning' : 'success').catch(() => {});
    }

    const [updated] = await pool.query('SELECT * FROM organ_requests WHERE id = ?', [req.params.id]);
    return success(res, updated[0], `Request marked as ${status}`);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

module.exports = { createRequest, myRequests, listRequests, cancelRequest, updateStatus };
