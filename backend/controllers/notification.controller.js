const { pool } = require("../config/db");
const { success } = require("../utils/response");

async function list(req, res, next) {
  try {
    const { unread_only } = req.query;

    const where = ["user_id = $1"];
    const values = [req.user.id];

    if (unread_only === "true") {
      where.push("is_read = false");
    }

    const result = await pool.query(
      `
      SELECT *
      FROM notifications
      WHERE ${where.join(" AND ")}
      ORDER BY created_at DESC
      LIMIT 100
      `,
      values
    );

    const countResult = await pool.query(
      `
      SELECT COUNT(*)::int AS unread
      FROM notifications
      WHERE user_id = $1
      AND is_read = false
      `,
      [req.user.id]
    );

    return success(res, {
      notifications: result.rows,
      unreadCount: countResult.rows[0].unread,
    });

  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    await pool.query(
      `
      UPDATE notifications
      SET is_read = true
      WHERE id = $1
      AND user_id = $2
      `,
      [req.params.id, req.user.id]
    );

    return success(res, {}, "Marked as read");

  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await pool.query(
      `
      UPDATE notifications
      SET is_read = true
      WHERE user_id = $1
      `,
      [req.user.id]
    );

    return success(
      res,
      {},
      "All notifications marked as read"
    );

  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  markRead,
  markAllRead,
};