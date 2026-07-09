const { pool } = require("../config/db");
const { success, error } = require("../utils/response");

// GET /api/donors/me
async function getMyProfile(req, res, next) {
  try {
    const result = await pool.query(
      "SELECT * FROM donor_profiles WHERE user_id = $1",
      [req.user.id]
    );

    if (!result.rows.length) {
      return error(res, "Donor profile not found", 404);
    }

    return success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// PUT /api/donors/me
async function updateMyProfile(req, res, next) {
  try {
    const fields = [
      "blood_group",
      "date_of_birth",
      "gender",
      "weight_kg",
      "medical_conditions",
      "is_organ_donor",
      "organ_types",
      "address",
      "city",
      "state",
      "country",
      "latitude",
      "longitude",
      "is_available",
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
      `UPDATE donor_profiles
       SET ${updates.join(", ")}
       WHERE user_id = $${index}`,
      values
    );

    const result = await pool.query(
      "SELECT * FROM donor_profiles WHERE user_id = $1",
      [req.user.id]
    );

    return success(res, result.rows[0], "Donor profile updated");
  } catch (err) {
    next(err);
  }
}

// GET /api/donors
async function listDonors(req, res, next) {
  try {
    const {
      blood_group,
      organ_type,
      city,
      is_available,
      page = 1,
      limit = 20,
    } = req.query;

    const where = [];
    const values = [];
    let index = 1;

    if (blood_group) {
      where.push(`dp.blood_group = $${index++}`);
      values.push(blood_group);
    }

    if (organ_type) {
      where.push(`dp.is_organ_donor = true`);
      where.push(
        `$${index++} = ANY(string_to_array(dp.organ_types, ','))`
      );
      values.push(organ_type);
    }

    if (city) {
      where.push(`dp.city ILIKE $${index++}`);
      values.push(`%${city}%`);
    }

    if (is_available !== undefined) {
      where.push(`dp.is_available = $${index++}`);
      values.push(is_available === "true");
    }

    const whereSql = where.length
      ? `WHERE ${where.join(" AND ")}`
      : "";

    const offset = (Number(page) - 1) * Number(limit);

    const donorResult = await pool.query(
      `
      SELECT
        dp.*,
        u.name,
        u.email,
        u.phone
      FROM donor_profiles dp
      JOIN users u
        ON u.id = dp.user_id
      ${whereSql}
      ORDER BY dp.updated_at DESC
      LIMIT $${index++}
      OFFSET $${index}
      `,
      [...values, Number(limit), offset]
    );

    const countResult = await pool.query(
      `
      SELECT COUNT(*)::int AS total
      FROM donor_profiles dp
      ${whereSql}
      `,
      values
    );

    return success(res, {
      donors: donorResult.rows,
      total: countResult.rows[0].total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/donors/:id
async function getDonorById(req, res, next) {
  try {
    const result = await pool.query(
      `
      SELECT
        dp.*,
        u.name,
        u.email,
        u.phone
      FROM donor_profiles dp
      JOIN users u
        ON u.id = dp.user_id
      WHERE dp.id = $1
      `,
      [req.params.id]
    );

    if (!result.rows.length) {
      return error(res, "Donor not found", 404);
    }

    return success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// GET /api/donors/me/history
async function myDonationHistory(req, res, next) {
  try {
    const donorResult = await pool.query(
      "SELECT id FROM donor_profiles WHERE user_id = $1",
      [req.user.id]
    );

    if (!donorResult.rows.length) {
      return error(res, "Donor profile not found", 404);
    }

    const historyResult = await pool.query(
      `
      SELECT
        d.*,
        h.hospital_name,
        bb.bank_name
      FROM donations d
      LEFT JOIN hospitals h
        ON h.id = d.hospital_id
      LEFT JOIN blood_banks bb
        ON bb.id = d.blood_bank_id
      WHERE d.donor_id = $1
      ORDER BY d.created_at DESC
      `,
      [donorResult.rows[0].id]
    );

    return success(res, historyResult.rows);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  listDonors,
  getDonorById,
  myDonationHistory,
};