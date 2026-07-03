const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { success, error } = require('../utils/response');

// PUT /api/profile - update shared user fields (name, phone)
async function updateProfile(req, res, next) {
  try {
    const { name, phone } = req.body;
    const updates = [];
    const values = [];
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (!updates.length) return error(res, 'No valid fields to update', 400);
    values.push(req.user.id);

    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    const [rows] = await pool.query('SELECT id, name, email, phone, role, profile_picture FROM users WHERE id = ?', [req.user.id]);
    return success(res, rows[0], 'Profile updated');
  } catch (err) {
    next(err);
  }
}

// PUT /api/profile/password
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!match) return error(res, 'Current password is incorrect', 401);

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);
    return success(res, {}, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
}

// PUT /api/profile/picture
async function updatePicture(req, res, next) {
  try {
    if (!req.file) return error(res, 'No file uploaded', 400);
    const picPath = `/uploads/${req.file.filename}`;
    await pool.query('UPDATE users SET profile_picture = ? WHERE id = ?', [picPath, req.user.id]);
    return success(res, { profile_picture: picPath }, 'Profile picture updated');
  } catch (err) {
    next(err);
  }
}

// PUT /api/profile/deactivate
async function deactivateAccount(req, res, next) {
  try {
    await pool.query('UPDATE users SET is_active = 0 WHERE id = ?', [req.user.id]);
    return success(res, {}, 'Account deactivated');
  } catch (err) {
    next(err);
  }
}

module.exports = { updateProfile, changePassword, updatePicture, deactivateAccount };
