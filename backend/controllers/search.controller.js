const { pool } = require("../config/db");
const { success } = require("../utils/response");

// GET /api/search?type=donors|bloodbanks|hospitals&q=&blood_group=&organ_type=&city=
async function search(req, res, next) {
  try {
    const { type, q, blood_group, organ_type, city } = req.query;

    // ==========================
    // BLOOD BANKS
    // ==========================
    if (type === "bloodbanks") {
      const where = ["bb.is_verified = true"];
      const values = [];
      let index = 1;

      if (q) {
        where.push(`bb.bank_name ILIKE $${index++}`);
        values.push(`%${q}%`);
      }

      if (city) {
        where.push(`bb.city ILIKE $${index++}`);
        values.push(`%${city}%`);
      }

      const result = await pool.query(
        `
        SELECT *
        FROM blood_banks bb
        WHERE ${where.join(" AND ")}
        LIMIT 50
        `,
        values
      );

      return success(res, result.rows);
    }

    // ==========================
    // HOSPITALS
    // ==========================
    if (type === "hospitals") {
      const where = ["is_verified = true"];
      const values = [];
      let index = 1;

      if (q) {
        where.push(`hospital_name ILIKE $${index++}`);
        values.push(`%${q}%`);
      }

      if (city) {
        where.push(`city ILIKE $${index++}`);
        values.push(`%${city}%`);
      }

      const result = await pool.query(
        `
        SELECT *
        FROM hospitals
        WHERE ${where.join(" AND ")}
        LIMIT 50
        `,
        values
      );

      return success(res, result.rows);
    }

    // ==========================
    // EMERGENCY REQUESTS
    // ==========================
    if (type === "emergency") {
      const bloodReqs = await pool.query(
        `
        SELECT
          br.*,
          'blood' AS request_type
        FROM blood_requests br
        WHERE br.urgency='critical'
        AND br.status='pending'
        `
      );

      const organReqs = await pool.query(
        `
        SELECT
          o.*,
          'organ' AS request_type
        FROM organ_requests o
        WHERE o.urgency='critical'
        AND o.status='pending'
        `
      );

      return success(res, [
        ...bloodReqs.rows,
        ...organReqs.rows,
      ]);
    }

    // ==========================
    // DONORS
    // ==========================
    const where = ["1=1"];
    const values = [];
    let index = 1;

    if (q) {
      where.push(`u.name ILIKE $${index++}`);
      values.push(`%${q}%`);
    }

    if (blood_group) {
      where.push(`dp.blood_group = $${index++}`);
      values.push(blood_group);
    }

    if (organ_type) {
      where.push(
        `$${index++} = ANY(string_to_array(dp.organ_types, ','))`
      );
      values.push(organ_type);
    }

    if (city) {
      where.push(`dp.city ILIKE $${index++}`);
      values.push(`%${city}%`);
    }

    const result = await pool.query(
      `
      SELECT
        dp.*,
        u.name
      FROM donor_profiles dp
      JOIN users u
        ON u.id = dp.user_id
      WHERE ${where.join(" AND ")}
      LIMIT 50
      `,
      values
    );

    return success(res, result.rows);

  } catch (err) {
    next(err);
  }
}

module.exports = {
  search,
};