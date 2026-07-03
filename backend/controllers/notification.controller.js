const { pool } = require('../config/db');
const { success, error } = require('../utils/response');

async function list(req, res, next) {
  try {
    const { unread_only } = req.query;
    const where = ['user_id = ?'];
    const values = [req.user.id];
    if (unread_only === 'true') where.push('is_read = 0');

    const [rows] = await pool.query(
      `SELECT * FROM notifications WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT 100`,
      values
    );
    const [countRow] = await pool.query('SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0', [req.user.id]);
    return success(res, { notifications: rows, unreadCount: countRow[0].unread });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    return success(res, {}, 'Marked as read');
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    return success(res, {}, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
}

module.exports = { list, markRead, markAllRead };
