const { pool } = require("../config/db");
const { success, error } = require("../utils/response");
const { notifyUser } = require("../utils/notify");

// GET /api/admin/users
async function listUsers(req, res, next) {
  try {
    const {
      role,
      is_active,
      q,
      page = 1,
      limit = 20,
    } = req.query;

    const where = [];
    const values = [];
    let index = 1;

    if (role) {
      where.push(`role = $${index++}`);
      values.push(role);
    }

    if (is_active !== undefined) {
      where.push(`is_active = $${index++}`);
      values.push(is_active === "true");
    }

    if (q) {
      where.push(
        `(name ILIKE $${index} OR email ILIKE $${index + 1})`
      );
      values.push(`%${q}%`);
      values.push(`%${q}%`);
      index += 2;
    }

    const whereSql =
      where.length > 0
        ? `WHERE ${where.join(" AND ")}`
        : "";

    const offset =
      (Number(page) - 1) * Number(limit);

    const userResult = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        phone,
        role,
        is_active,
        created_at
      FROM users
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT $${index++}
      OFFSET $${index}
      `,
      [...values, Number(limit), offset]
    );

    const countResult = await pool.query(
      `
      SELECT COUNT(*)::int AS total
      FROM users
      ${whereSql}
      `,
      values
    );

    return success(res, {
      users: userResult.rows,
      total: countResult.rows[0].total,
    });

  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/users/:id/status
async function setUserStatus(req, res, next) {
  try {

    const { is_active } = req.body;

    await pool.query(
      `
      UPDATE users
      SET is_active = $1
      WHERE id = $2
      `,
      [
        !!is_active,
        req.params.id,
      ]
    );

    notifyUser(
      req.params.id,
      "Account Status Updated",
      `Your account has been ${is_active
        ? "activated"
        : "deactivated"
      } by an administrator.`,
      "warning"
    ).catch(() => { });

    return success(
      res,
      {},
      "User status updated"
    );

  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/users/:id
async function deleteUser(req, res, next) {
  try {

    await pool.query(
      `
      DELETE FROM users
      WHERE id = $1
      `,
      [req.params.id]
    );

    return success(
      res,
      {},
      "User deleted"
    );

  } catch (err) {
    next(err);
  }
}

// GET /api/admin/hospitals/pending
async function pendingHospitals(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT *
      FROM hospitals
      WHERE is_verified = false
    `);

    return success(res, result.rows);

  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/hospitals/:id/verify
async function verifyHospital(req, res, next) {
  try {

    await pool.query(
      `
      UPDATE hospitals
      SET is_verified = true
      WHERE id = $1
      `,
      [req.params.id]
    );

    const hospitalResult = await pool.query(
      `
      SELECT
        user_id,
        hospital_name
      FROM hospitals
      WHERE id = $1
      `,
      [req.params.id]
    );

    if (hospitalResult.rows.length) {
      notifyUser(
        hospitalResult.rows[0].user_id,
        "Hospital Verified",
        `${hospitalResult.rows[0].hospital_name} has been verified.`,
        "success"
      ).catch(() => { });
    }

    return success(res, {}, "Hospital verified");

  } catch (err) {
    next(err);
  }
}

// GET /api/admin/bloodbanks/pending
async function pendingBloodBanks(req, res, next) {
  try {

    const result = await pool.query(`
      SELECT *
      FROM blood_banks
      WHERE is_verified = false
    `);

    return success(res, result.rows);

  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/bloodbanks/:id/verify
async function verifyBloodBank(req, res, next) {
  try {

    await pool.query(
      `
      UPDATE blood_banks
      SET is_verified = true
      WHERE id = $1
      `,
      [req.params.id]
    );

    const bankResult = await pool.query(
      `
      SELECT
        user_id,
        bank_name
      FROM blood_banks
      WHERE id = $1
      `,
      [req.params.id]
    );

    if (bankResult.rows.length) {
      notifyUser(
        bankResult.rows[0].user_id,
        "Blood Bank Verified",
        `${bankResult.rows[0].bank_name} has been verified.`,
        "success"
      ).catch(() => { });
    }

    return success(res, {}, "Blood bank verified");

  } catch (err) {
    next(err);
  }
}

// GET /api/admin/emergencies
async function emergencies(req, res, next) {
  try {

    const bloodResult = await pool.query(`
      SELECT
        br.*,
        u.name AS recipient_name,
        u.phone AS recipient_phone,
        'blood' AS request_type
      FROM blood_requests br
      JOIN recipient_profiles rp
        ON rp.id = br.recipient_id
      JOIN users u
        ON u.id = rp.user_id
      WHERE br.urgency = 'critical'
        AND br.status = 'pending'
    `);

    const organResult = await pool.query(`
      SELECT
        o.*,
        u.name AS recipient_name,
        u.phone AS recipient_phone,
        'organ' AS request_type
      FROM organ_requests o
      JOIN recipient_profiles rp
        ON rp.id = o.recipient_id
      JOIN users u
        ON u.id = rp.user_id
      WHERE o.urgency = 'critical'
        AND o.status = 'pending'
    `);

    return success(res, [
      ...bloodResult.rows,
      ...organResult.rows,
    ]);

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