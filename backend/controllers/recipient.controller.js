const { pool } = require("../config/db");
const { success, error } = require("../utils/response");

// GET /api/recipients/me
async function getMyProfile(req, res, next) {
  try {
    const result = await pool.query(
      "SELECT * FROM recipient_profiles WHERE user_id = $1",
      [req.user.id]
    );

    if (!result.rows.length) {
      return error(res, "Recipient profile not found", 404);
    }

    return success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// PUT /api/recipients/me
async function updateMyProfile(req, res, next) {
  try {
    const fields = [
      "blood_group",
      "date_of_birth",
      "gender",
      "address",
      "city",
      "state",
      "country",
      "latitude",
      "longitude",
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

    values.push(req.user.id);

    await pool.query(
      `UPDATE recipient_profiles
       SET ${updates.join(", ")}
       WHERE user_id = $${index}`,
      values
    );

    const result = await pool.query(
      "SELECT * FROM recipient_profiles WHERE user_id = $1",
      [req.user.id]
    );

    return success(res, result.rows[0], "Recipient profile updated");
  } catch (err) {
    next(err);
  }
}

// GET /api/recipients/me/history
async function myRequestHistory(req, res, next) {
  try {
    const recipientResult = await pool.query(
      "SELECT id FROM recipient_profiles WHERE user_id = $1",
      [req.user.id]
    );

    if (!recipientResult.rows.length) {
      return error(res, "Recipient profile not found", 404);
    }

    const recipientId = recipientResult.rows[0].id;

    const bloodResult = await pool.query(
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
      [recipientId]
    );

    const organResult = await pool.query(
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
      [recipientId]
    );

    return success(res, {
      bloodRequests: bloodResult.rows,
      organRequests: organResult.rows,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  myRequestHistory,
};