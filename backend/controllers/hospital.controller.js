const { pool } = require("../config/db");
const { success, error } = require("../utils/response");

// GET /api/hospitals/me
async function getMyProfile(req, res, next) {
  try {
    const result = await pool.query(
      "SELECT * FROM hospitals WHERE user_id = $1",
      [req.user.id]
    );

    if (!result.rows.length) {
      return error(res, "Hospital profile not found", 404);
    }

    return success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// PUT /api/hospitals/me
async function updateMyProfile(req, res, next) {
  try {
    const fields = [
      "hospital_name",
      "license_number",
      "address",
      "city",
      "state",
      "country",
      "latitude",
      "longitude",
      "contact_person",
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
      `UPDATE hospitals
       SET ${updates.join(", ")}
       WHERE user_id = $${index}`,
      values
    );

    const result = await pool.query(
      "SELECT * FROM hospitals WHERE user_id = $1",
      [req.user.id]
    );

    return success(res, result.rows[0], "Hospital profile updated");
  } catch (err) {
    next(err);
  }
}

// GET /api/hospitals
async function listHospitals(req, res, next) {
  try {
    const { city } = req.query;

    const where = ["is_verified = true"];
    const values = [];
    let index = 1;

    if (city) {
      where.push(`city ILIKE $${index++}`);
      values.push(`%${city}%`);
    }

    const result = await pool.query(
      `SELECT *
       FROM hospitals
       WHERE ${where.join(" AND ")}`,
      values
    );

    return success(res, result.rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/hospitals/me/patient-requests
async function myPatientRequests(req, res, next) {
  try {
    const hospitalResult = await pool.query(
      "SELECT id FROM hospitals WHERE user_id = $1",
      [req.user.id]
    );

    if (!hospitalResult.rows.length) {
      return error(res, "Hospital profile not found", 404);
    }

    const hospitalId = hospitalResult.rows[0].id;

    const bloodResult = await pool.query(
      `
      SELECT
        br.*,
        u.name AS recipient_name,
        u.phone AS recipient_phone
      FROM blood_requests br
      JOIN recipient_profiles rp
        ON rp.id = br.recipient_id
      JOIN users u
        ON u.id = rp.user_id
      WHERE br.hospital_id = $1
      ORDER BY br.created_at DESC
      `,
      [hospitalId]
    );

    const organResult = await pool.query(
      `
      SELECT
        o.*,
        u.name AS recipient_name,
        u.phone AS recipient_phone
      FROM organ_requests o
      JOIN recipient_profiles rp
        ON rp.id = o.recipient_id
      JOIN users u
        ON u.id = rp.user_id
      WHERE o.hospital_id = $1
      ORDER BY o.created_at DESC
      `,
      [hospitalId]
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
  listHospitals,
  myPatientRequests,
};