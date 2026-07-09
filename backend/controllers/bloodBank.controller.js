const { pool } = require("../config/db");
const { success, error } = require("../utils/response");

// GET /api/bloodbanks/me
async function getMyProfile(req, res, next) {
  try {
    const result = await pool.query(
      "SELECT * FROM blood_banks WHERE user_id = $1",
      [req.user.id]
    );

    if (!result.rows.length) {
      return error(res, "Blood bank profile not found", 404);
    }

    return success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// PUT /api/bloodbanks/me
async function updateMyProfile(req, res, next) {
  try {
    const fields = [
      "bank_name",
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
      `UPDATE blood_banks
       SET ${updates.join(", ")}
       WHERE user_id = $${index}`,
      values
    );

    const result = await pool.query(
      "SELECT * FROM blood_banks WHERE user_id = $1",
      [req.user.id]
    );

    return success(res, result.rows[0], "Blood bank profile updated");
  } catch (err) {
    next(err);
  }
}

// GET /api/bloodbanks
async function listBloodBanks(req, res, next) {
  try {
    const {
      city,
      blood_group,
      page = 1,
      limit = 20,
    } = req.query;

    const where = ["bb.is_verified = true"];
    const values = [];
    let index = 1;

    let joinInventory = "";

    if (blood_group) {
      joinInventory = `
        JOIN blood_inventory bi
          ON bi.blood_bank_id = bb.id
         AND bi.blood_group = $${index++}
         AND bi.units_available > 0
      `;
      values.push(blood_group);
    }

    if (city) {
      where.push(`bb.city ILIKE $${index++}`);
      values.push(`%${city}%`);
    }

    const whereSql = `WHERE ${where.join(" AND ")}`;

    const offset = (Number(page) - 1) * Number(limit);

    const result = await pool.query(
      `
      SELECT DISTINCT bb.*
      FROM blood_banks bb
      ${joinInventory}
      ${whereSql}
      ORDER BY bb.bank_name
      LIMIT $${index++}
      OFFSET $${index}
      `,
      [...values, Number(limit), offset]
    );

    return success(res, result.rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/bloodbanks/:id/inventory
async function getInventory(req, res, next) {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM blood_inventory
      WHERE blood_bank_id = $1
      ORDER BY blood_group
      `,
      [req.params.id]
    );

    return success(res, result.rows);
  } catch (err) {
    next(err);
  }
}

// PUT /api/bloodbanks/me/inventory
async function updateInventory(req, res, next) {
  try {
    const { blood_group, units_available } = req.body;

    if (!blood_group || units_available === undefined) {
      return error(
        res,
        "blood_group and units_available are required",
        400
      );
    }

    if (units_available < 0) {
      return error(
        res,
        "units_available cannot be negative",
        400
      );
    }

    const bankResult = await pool.query(
      `
      SELECT id
      FROM blood_banks
      WHERE user_id = $1
      `,
      [req.user.id]
    );

    if (!bankResult.rows.length) {
      return error(res, "Blood bank profile not found", 404);
    }

    const bankId = bankResult.rows[0].id;

    await pool.query(
      `
      INSERT INTO blood_inventory (
        blood_bank_id,
        blood_group,
        units_available
      )
      VALUES ($1, $2, $3)
      ON CONFLICT (blood_bank_id, blood_group)
      DO UPDATE
      SET units_available = EXCLUDED.units_available
      `,
      [bankId, blood_group, units_available]
    );

    const inventoryResult = await pool.query(
      `
      SELECT *
      FROM blood_inventory
      WHERE blood_bank_id = $1
      ORDER BY blood_group
      `,
      [bankId]
    );

    return success(
      res,
      inventoryResult.rows,
      "Inventory updated"
    );

  } catch (err) {
    next(err);
  }
}

// GET /api/bloodbanks/me/inventory
async function getMyInventory(req, res, next) {
  try {
    const bankResult = await pool.query(
      `
      SELECT id
      FROM blood_banks
      WHERE user_id = $1
      `,
      [req.user.id]
    );

    if (!bankResult.rows.length) {
      return error(res, "Blood bank profile not found", 404);
    }

    const result = await pool.query(
      `
      SELECT *
      FROM blood_inventory
      WHERE blood_bank_id = $1
      ORDER BY blood_group
      `,
      [bankResult.rows[0].id]
    );

    return success(res, result.rows);

  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  listBloodBanks,
  getInventory,
  updateInventory,
  getMyInventory,
};