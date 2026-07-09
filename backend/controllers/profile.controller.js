const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const { success, error } = require("../utils/response");

// GET /api/profile
async function getProfile(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT
          id,
          name,
          email,
          phone,
          role,
          profile_picture,
          is_active,
          created_at
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (!result.rows.length) {
      return error(res, "User not found", 404);
    }

    return success(res, result.rows[0], "Profile fetched successfully");
  } catch (err) {
    next(err);
  }
}

// PUT /api/profile
async function updateProfile(req, res, next) {
  try {
    const { name, phone } = req.body;

    const updates = [];
    const values = [];
    let index = 1;

    if (name !== undefined) {
      updates.push(`name = $${index++}`);
      values.push(name);
    }

    if (phone !== undefined) {
      updates.push(`phone = $${index++}`);
      values.push(phone);
    }

    if (!updates.length) {
      return error(res, "No valid fields to update", 400);
    }

    values.push(req.user.id);

    await pool.query(
      `UPDATE users
       SET ${updates.join(", ")}
       WHERE id = $${index}`,
      values
    );

    const result = await pool.query(
      `SELECT
          id,
          name,
          email,
          phone,
          role,
          profile_picture,
          is_active,
          created_at
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    return success(res, result.rows[0], "Profile updated");
  } catch (err) {
    next(err);
  }
}

// PUT /api/profile/password
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    const result = await pool.query(
      `SELECT password_hash
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (!result.rows.length) {
      return error(res, "User not found", 404);
    }

    const match = await bcrypt.compare(
      currentPassword,
      result.rows[0].password_hash
    );

    if (!match) {
      return error(res, "Current password is incorrect", 401);
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE users
       SET password_hash = $1
       WHERE id = $2`,
      [newHash, req.user.id]
    );

    return success(res, {}, "Password changed successfully");
  } catch (err) {
    next(err);
  }
}

// PUT /api/profile/picture
async function updatePicture(req, res, next) {
  try {
    if (!req.file) {
      return error(res, "No file uploaded", 400);
    }

    const picPath = `/uploads/${req.file.filename}`;

    await pool.query(
      `UPDATE users
       SET profile_picture = $1
       WHERE id = $2`,
      [picPath, req.user.id]
    );

    return success(
      res,
      { profile_picture: picPath },
      "Profile picture updated"
    );
  } catch (err) {
    next(err);
  }
}

// PUT /api/profile/deactivate
async function deactivateAccount(req, res, next) {
  try {
    await pool.query(
      `UPDATE users
       SET is_active = false
       WHERE id = $1`,
      [req.user.id]
    );

    return success(res, {}, "Account deactivated");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  updatePicture,
  deactivateAccount,
};