const { pool } = require('../config/db');

/**
 * Create a notification for a single user.
 */
async function notifyUser(userId, title, message, type = 'info') {
  await pool.query(
    'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
    [userId, title, message, type]
  );
}

/**
 * Create the same notification for many users (e.g. all admins).
 */
async function notifyMany(userIds, title, message, type = 'info') {
  if (!userIds.length) return;
  const values = userIds.map((id) => [id, title, message, type]);
  await pool.query(
    'INSERT INTO notifications (user_id, title, message, type) VALUES ?',
    [values]
  );
}

async function notifyRole(role, title, message, type = 'info') {
  const [rows] = await pool.query('SELECT id FROM users WHERE role = ? AND is_active = 1', [role]);
  await notifyMany(rows.map((r) => r.id), title, message, type);
}

module.exports = { notifyUser, notifyMany, notifyRole };
