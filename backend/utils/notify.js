const { pool } = require("../config/db");

/**
 * Create a notification for one user
 */
async function notifyUser(
  userId,
  title,
  message,
  type = "info"
) {
  await pool.query(
    `
    INSERT INTO notifications
    (user_id, title, message, type)
    VALUES ($1, $2, $3, $4)
    `,
    [userId, title, message, type]
  );
}

/**
 * Create the same notification for many users
 */
async function notifyMany(
  userIds,
  title,
  message,
  type = "info"
) {
  if (!userIds.length) return;

  const placeholders = [];
  const values = [];
  let index = 1;

  for (const id of userIds) {
    placeholders.push(
      `($${index}, $${index + 1}, $${index + 2}, $${index + 3})`
    );

    values.push(id, title, message, type);

    index += 4;
  }

  await pool.query(
    `
    INSERT INTO notifications
    (user_id, title, message, type)
    VALUES
    ${placeholders.join(", ")}
    `,
    values
  );
}

/**
 * Notify everyone having a specific role
 */
async function notifyRole(
  role,
  title,
  message,
  type = "info"
) {
  const result = await pool.query(
    `
    SELECT id
    FROM users
    WHERE role = $1
      AND is_active = true
    `,
    [role]
  );

  const userIds = result.rows.map((r) => r.id);

  await notifyMany(
    userIds,
    title,
    message,
    type
  );
}

module.exports = {
  notifyUser,
  notifyMany,
  notifyRole,
};