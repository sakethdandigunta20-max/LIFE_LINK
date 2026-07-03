const { verifyToken } = require('../utils/jwt');
const { error } = require('../utils/response');
const { pool } = require('../config/db');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return error(res, 'Authentication token missing', 401);
    }
    const token = header.split(' ')[1];
    const decoded = verifyToken(token);

    const [rows] = await pool.query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = ?',
      [decoded.id]
    );
    if (rows.length === 0) return error(res, 'User not found', 401);
    if (!rows[0].is_active) return error(res, 'Account has been deactivated', 403);

    req.user = rows[0];
    next();
  } catch (err) {
    return error(res, 'Invalid or expired token', 401);
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return error(res, 'You do not have permission to perform this action', 403);
    }
    next();
  };
}

module.exports = { authenticate, authorize };
