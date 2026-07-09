const { pool } = require("../config/db");
const { success, error } = require("../utils/response");
const { notifyUser, notifyRole } = require("../utils/notify");

// POST /api/blood-requests
async function createRequest(req, res, next) {
  try {

    console.log("========== BLOOD REQUEST ==========");
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const recipientResult = await pool.query(
      "SELECT id FROM recipient_profiles WHERE user_id = $1",
      [req.user.id]
    );

    if (!recipientResult.rows.length) {
      return error(res, "Complete your recipient profile first", 400);
    }

    const recipientId = recipientResult.rows[0].id;

    const {
      blood_group,
      units_needed = 1,
      urgency = "medium",
      hospital_id,
      notes,
    } = req.body;

    if (!blood_group) {
      return error(res, "blood_group is required", 400);
    }

    const documentPath = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    const insertResult = await pool.query(
      `
      INSERT INTO blood_requests
      (
        recipient_id,
        hospital_id,
        blood_group,
        units_needed,
        urgency,
        document_path,
        notes
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [
        recipientId,
        hospital_id || null,
        blood_group,
        units_needed,
        urgency,
        documentPath,
        notes || null,
      ]
    );

    if (urgency === "critical") {
      notifyRole(
        "admin",
        "Emergency Blood Request",
        `Critical ${blood_group} blood request created.`,
        "emergency"
      ).catch(() => { });

      notifyRole(
        "bloodbank",
        "Emergency Blood Request",
        `Critical ${blood_group} blood request needs fulfillment.`,
        "emergency"
      ).catch(() => { });
    }

    return success(
      res,
      insertResult.rows[0],
      "Blood request created",
      201
    );

  } catch (err) {
    next(err);
  }
}

// GET /api/blood-requests/me
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
        br.*,
        h.hospital_name,
        bb.bank_name
      FROM blood_requests br
      LEFT JOIN hospitals h
        ON h.id = br.hospital_id
      LEFT JOIN blood_banks bb
        ON bb.id = br.blood_bank_id
      WHERE br.recipient_id = $1
      ORDER BY br.created_at DESC
      `,
      [recipientResult.rows[0].id]
    );

    return success(res, result.rows);

  } catch (err) {
    next(err);
  }
}

// GET /api/blood-requests
async function listRequests(req, res, next) {
  try {
    const {
      status,
      urgency,
      blood_group,
      page = 1,
      limit = 20,
    } = req.query;

    const where = [];
    const values = [];
    let index = 1;

    if (status) {
      where.push(`br.status = $${index++}`);
      values.push(status);
    }

    if (urgency) {
      where.push(`br.urgency = $${index++}`);
      values.push(urgency);
    }

    if (blood_group) {
      where.push(`br.blood_group = $${index++}`);
      values.push(blood_group);
    }

    const whereSql = where.length
      ? `WHERE ${where.join(" AND ")}`
      : "";

    const offset = (Number(page) - 1) * Number(limit);

    const requestResult = await pool.query(
      `
      SELECT
        br.*,
        u.name AS recipient_name,
        u.phone AS recipient_phone,
        h.hospital_name,
        bb.bank_name
      FROM blood_requests br
      JOIN recipient_profiles rp
        ON rp.id = br.recipient_id
      JOIN users u
        ON u.id = rp.user_id
      LEFT JOIN hospitals h
        ON h.id = br.hospital_id
      LEFT JOIN blood_banks bb
        ON bb.id = br.blood_bank_id
      ${whereSql}
      ORDER BY
        CASE br.urgency
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
          ELSE 5
        END,
        br.created_at DESC
      LIMIT $${index++}
      OFFSET $${index}
      `,
      [...values, Number(limit), offset]
    );

    const countResult = await pool.query(
      `
      SELECT COUNT(*)::int AS total
      FROM blood_requests br
      ${whereSql}
      `,
      values
    );

    return success(res, {
      requests: requestResult.rows,
      total: countResult.rows[0].total,
    });

  } catch (err) {
    next(err);
  }
}

// PUT /api/blood-requests/:id
async function updateRequest(req, res, next) {
  try {

    const requestResult = await pool.query(
      `
      SELECT br.*
      FROM blood_requests br
      JOIN recipient_profiles rp
        ON rp.id = br.recipient_id
      WHERE br.id = $1
      AND rp.user_id = $2
      `,
      [req.params.id, req.user.id]
    );

    if (!requestResult.rows.length) {
      return error(res, "Request not found", 404);
    }

    if (requestResult.rows[0].status !== "pending") {
      return error(
        res,
        "Only pending requests can be edited",
        400
      );
    }

    const fields = [
      "blood_group",
      "units_needed",
      "urgency",
      "notes",
      "hospital_id",
    ];

    const updates = [];
    const values = [];
    let index = 1;

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${index++}`);
        values.push(req.body[field]);
      }
    });

    if (!updates.length) {
      return error(res, "No valid fields to update", 400);
    }

    values.push(req.params.id);

    await pool.query(
      `
      UPDATE blood_requests
      SET ${updates.join(", ")}
      WHERE id = $${index}
      `,
      values
    );

    const updated = await pool.query(
      "SELECT * FROM blood_requests WHERE id = $1",
      [req.params.id]
    );

    return success(
      res,
      updated.rows[0],
      "Request updated"
    );

  } catch (err) {
    next(err);
  }
}

// PUT /api/blood-requests/:id/cancel
async function cancelRequest(req, res, next) {
  try {

    const requestResult = await pool.query(
      `
      SELECT br.*
      FROM blood_requests br
      JOIN recipient_profiles rp
        ON rp.id = br.recipient_id
      WHERE br.id = $1
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
      return error(
        res,
        "Request cannot be cancelled",
        400
      );
    }

    await pool.query(
      `
      UPDATE blood_requests
      SET status = 'cancelled'
      WHERE id = $1
      `,
      [req.params.id]
    );

    return success(
      res,
      {},
      "Request cancelled"
    );

  } catch (err) {
    next(err);
  }
}
// PUT /api/blood-requests/:id/status  (admin / bloodbank: approve, reject, fulfill)
async function updateStatus(req, res, next) {
  const client = await pool.connect();

  try {
    const { status, blood_bank_id } = req.body;

    if (!["approved", "rejected", "fulfilled"].includes(status)) {
      client.release();
      return error(res, "Invalid status", 400);
    }

    await client.query("BEGIN");

    const requestResult = await client.query(
      `SELECT *
       FROM blood_requests
       WHERE id = $1
       FOR UPDATE`,
      [req.params.id]
    );

    if (!requestResult.rows.length) {
      await client.query("ROLLBACK");
      client.release();
      return error(res, "Request not found", 404);
    }

    const request = requestResult.rows[0];

    if (status === "fulfilled") {
      const bankId = blood_bank_id || request.blood_bank_id;

      if (bankId) {
        const inventoryResult = await client.query(
          `SELECT units_available
           FROM blood_inventory
           WHERE blood_bank_id = $1
             AND blood_group = $2
           FOR UPDATE`,
          [bankId, request.blood_group]
        );

        if (
          inventoryResult.rows.length &&
          inventoryResult.rows[0].units_available >= request.units_needed
        ) {
          await client.query(
            `UPDATE blood_inventory
             SET units_available = units_available - $1
             WHERE blood_bank_id = $2
               AND blood_group = $3`,
            [
              request.units_needed,
              bankId,
              request.blood_group,
            ]
          );
        }
      }
    }

    await client.query(
      `UPDATE blood_requests
       SET status = $1,
           blood_bank_id = COALESCE($2, blood_bank_id)
       WHERE id = $3`,
      [
        status,
        blood_bank_id || null,
        req.params.id,
      ]
    );

    await client.query("COMMIT");
    client.release();

    const recipientResult = await pool.query(
      `SELECT u.id
       FROM users u
       JOIN recipient_profiles rp
         ON rp.user_id = u.id
       WHERE rp.id = $1`,
      [request.recipient_id]
    );

    if (recipientResult.rows.length) {
      notifyUser(
        recipientResult.rows[0].id,
        `Blood Request ${status}`,
        `Your blood request for ${request.blood_group} was ${status}.`,
        status === "rejected" ? "warning" : "success"
      ).catch(() => { });
    }

    const updated = await pool.query(
      `SELECT *
       FROM blood_requests
       WHERE id = $1`,
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

module.exports = { createRequest, myRequests, listRequests, updateRequest, cancelRequest, updateStatus };
