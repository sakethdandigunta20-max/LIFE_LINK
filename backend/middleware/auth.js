const { verifyToken } = require("../utils/jwt");
const { error } = require("../utils/response");
const { pool } = require("../config/db");

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;

    console.log("========================================");
    console.log("AUTHORIZATION HEADER:", header);

    if (!header || !header.startsWith("Bearer ")) {
      console.log("❌ No Bearer token found");
      return error(res, "Authentication token missing", 401);
    }

    const token = header.split(" ")[1];

    // NEW DEBUG LOGS
    console.log("HEADER:", header);
    console.log("TOKEN:", token);
    console.log("TOKEN LENGTH:", token.length);

    console.log("Incoming Token:");
    console.log(token);

    const decoded = verifyToken(token);

    console.log("✅ Decoded Token:");
    console.log(decoded);

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        role,
        is_active
      FROM users
      WHERE id = $1
      `,
      [decoded.id]
    );

    if (!result.rows.length) {
      console.log("❌ User not found in database");
      return error(res, "User not found", 401);
    }

    if (!result.rows[0].is_active) {
      console.log("❌ User account is inactive");
      return error(res, "Account has been deactivated", 403);
    }

    console.log("✅ Authenticated User:");
    console.log(result.rows[0]);

    req.user = result.rows[0];

    next();
  } catch (err) {
    console.log("========================================");
    console.error("❌ JWT VERIFY ERROR");
    console.error("Name :", err.name);
    console.error("Message :", err.message);

    if (err.stack) {
      console.error(err.stack);
    }

    return error(res, "Invalid or expired token", 401);
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    console.log("Required Roles:", roles);

    if (!req.user || !roles.includes(req.user.role)) {
      console.log("❌ Authorization Failed");
      console.log("User Role:", req.user?.role);

      return error(
        res,
        "You do not have permission to perform this action",
        403
      );
    }

    console.log("✅ Authorization Successful");

    next();
  };
}

module.exports = {
  authenticate,
  authorize,
};