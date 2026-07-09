const { pool } = require("../config/db");
const { success, error } = require("../utils/response");
const { notifyUser, notifyRole } = require("../utils/notify");

// POST /api/organ-requests
async function createRequest(req, res, next) {
  try {
    const recipientResult = await pool.query(
      "SELECT id FROM recipient_profiles WHERE user_id = $1",
      [req.user.id]
    );

    if (!recipientResult.rows.length) {
      return error(res, "Complete your recipient profile first", 400);
    }

    const recipientId = recipientResult.rows[0].id;

    const {
      organ_type,
      urgency = "medium",
      hospital_id,
      notes,
    } = req.body;

    if (!organ_type) {
      return error(res, "organ_type is required", 400);
    }

    const documentPath = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    const result = await pool.query(
      `
      INSERT INTO organ_requests
      (
        recipient_id,
        hospital_id,
        organ_type,
        urgency,
        document_path,
        notes
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        recipientId,
        hospital_id || null,
        organ_type,
        urgency,
        documentPath,
        notes || null,
      ]
    );

    if (urgency === "critical") {
      notifyRole(
        "admin",
        "Emergency Organ Request",
        `Critical ${organ_type} request created.`,
        "emergency"
      ).catch(() => { });

      notifyRole(
        "hospital",
        "Emergency Organ Request",
        `Critical ${organ_type} request needs review.`,
        "emergency"
      ).catch(() => { });
    }

    return success(
      res,
      result.rows[0],
      "Organ request created",
      201
    );

  } catch (err) {
    next(err);
  }
}

// GET /api/organ-requests/me
async function myRequests(req, res, next) {
  try {

    const recipientResult = await pool.query(
      "SELECT id FROM recipient_profiles WHERE user_id = $1",
      [req.user.id]
    );

    if (!recipientResult.rows.length) {
      return success(res, []);
    }

    const result = await pool.query(
      `
      SELECT
        o.*,
        h.hospital_name
      FROM organ_requests o
      LEFT JOIN hospitals h
        ON h.id = o.hospital_id
      WHERE o.recipient_id = $1
      ORDER BY o.created_at DESC
      `,
      [recipientResult.rows[0].id]
    );

    return success(res, result.rows);

  } catch (err) {
    next(err);
  }
}

// GET /api/organ-requests
async function listRequests(req, res, next) {
  try {

    const {
      status,
      urgency,
      organ_type,
      page = 1,
      limit = 20,
    } = req.query;

    const where = [];
    const values = [];
    let index = 1;

    if (status) {
      where.push(`o.status = $${index++}`);
      values.push(status);
    }

    if (urgency) {
      where.push(`o.urgency = $${index++}`);
      values.push(urgency);
    }

    if (organ_type) {
      where.push(`o.organ_type = $${index++}`);
      values.push(organ_type);
    }

    const whereSql = where.length
      ? `WHERE ${where.join(" AND ")}`
      : "";

    const offset = (Number(page) - 1) * Number(limit);

    const result = await pool.query(
      `
      SELECT
        o.*,
        u.name AS recipient_name,
        u.phone AS recipient_phone,
        h.hospital_name
      FROM organ_requests o
      JOIN recipient_profiles rp
        ON rp.id = o.recipient_id
      JOIN users u
        ON u.id = rp.user_id
      LEFT JOIN hospitals h
        ON h.id = o.hospital_id
      ${whereSql}
      ORDER BY
        CASE o.urgency
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
          ELSE 5
        END,
        o.created_at DESC
      LIMIT $${index++}
      OFFSET $${index}
      `,
      [...values, Number(limit), offset]
    );

    const countResult = await pool.query(
      `
      SELECT COUNT(*)::int AS total
      FROM organ_requests o
      ${whereSql}
      `,
      values
    );

    return success(res, {
      requests: result.rows,
      total: countResult.rows[0].total,
    });

  } catch (err) {
    next(err);
  }
}

// PUT /api/organ-requests/:id/cancel
async function cancelRequest(req, res, next) {
  try {
    const requestResult = await pool.query(
      `
      SELECT o.*
      FROM organ_requests o
      JOIN recipient_profiles rp
        ON rp.id = o.recipient_id
      WHERE o.id = $1
        AND rp.user_id = $2
      `,
      [req.params.id, req.user.id]
    );

    if (!requestResult.rows.length) {
      return error(res, "Request not found", 404);
    }

    if (
      ["fulfilled", "cancelled"].includes(
        requestResult.rows[0].status
      )
    ) {
      return error(res, "Request cannot be cancelled", 400);
    }

    await pool.query(
      `
      UPDATE organ_requests
      SET status = 'cancelled'
      WHERE id = $1
      `,
      [req.params.id]
    );

    return success(res, {}, "Request cancelled");

  } catch (err) {
    next(err);
  }
}

// PUT /api/organ-requests/:id/status
async function updateStatus(req, res, next) {
  const client = await pool.connect();

  try {
    const { status, donor_id } = req.body;

    if (!["approved", "rejected", "fulfilled"].includes(status)) {
      client.release();
      return error(res, "Invalid status", 400);
    }

    await client.query("BEGIN");

    const requestResult = await client.query(
      `
      SELECT *
      FROM organ_requests
      WHERE id = $1
      FOR UPDATE
      `,
      [req.params.id]
    );

    if (!requestResult.rows.length) {
      await client.query("ROLLBACK");
      client.release();
      return error(res, "Request not found", 404);
    }

    const request = requestResult.rows[0];

    if (status === "fulfilled" && donor_id) {
      await client.query(
        `
        INSERT INTO donations
        (
          donor_id,
          type,
          organ_request_id,
          hospital_id,
          status,
          donation_date
        )
        VALUES
        ($1,'organ',$2,$3,'scheduled',CURRENT_DATE)
        `,
        [
          donor_id,
          request.id,
          request.hospital_id,
        ]
      );
    }

    await client.query(
      `
      UPDATE organ_requests
      SET status = $1
      WHERE id = $2
      `,
      [
        status,
        req.params.id,
      ]
    );

    await client.query("COMMIT");
    client.release();

    const recipientResult = await pool.query(
      `
      SELECT u.id
      FROM users u
      JOIN recipient_profiles rp
        ON rp.user_id = u.id
      WHERE rp.id = $1
      `,
      [request.recipient_id]
    );

    if (recipientResult.rows.length) {
      notifyUser(
        recipientResult.rows[0].id,
        `Organ Request ${status}`,
        `Your ${request.organ_type} request was ${status}.`,
        status === "rejected"
          ? "warning"
          : "success"
      ).catch(() => { });
    }

    const updated = await pool.query(
      `
      SELECT *
      FROM organ_requests
      WHERE id = $1
      `,
      [req.params.id]
    );

    return success(
      res,
      updated.rows[0],
      `Request marked as ${status}`
    );

  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch { }

    client.release();
    next(err);
  }
}

module.exports = {
  createRequest,
  myRequests,
  listRequests,
  cancelRequest,
  updateStatus,
};