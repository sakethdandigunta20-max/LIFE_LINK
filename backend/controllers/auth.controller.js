const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const { generateToken } = require("../utils/jwt");
const { success, error } = require("../utils/response");
const { notifyRole } = require("../utils/notify");

// POST /api/auth/register
async function register(req, res, next) {
  const client = await pool.connect();

  try {
    const { name, email, password, phone, role } = req.body;

    const existing = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length) {
      return error(res, "An account with this email already exists", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await client.query("BEGIN");

    const userResult = await client.query(
      `INSERT INTO users
      (name,email,password_hash,phone,role)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id`,
      [name, email, passwordHash, phone || null, role]
    );

    const userId = userResult.rows[0].id;

    if (role === "donor") {
      await client.query(
        `INSERT INTO donor_profiles(user_id,blood_group)
         VALUES($1,$2)`,
        [userId, req.body.blood_group || "O+"]
      );
    } else if (role === "recipient") {
      await client.query(
        `INSERT INTO recipient_profiles(user_id)
         VALUES($1)`,
        [userId]
      );
    } else if (role === "hospital") {
      await client.query(
        `INSERT INTO hospitals(user_id,hospital_name)
         VALUES($1,$2)`,
        [userId, req.body.organization_name || name]
      );
    } else if (role === "bloodbank") {
      const bankResult = await client.query(
        `INSERT INTO blood_banks(user_id,bank_name)
         VALUES($1,$2)
         RETURNING id`,
        [userId, req.body.organization_name || name]
      );

      const bankId = bankResult.rows[0].id;

      const groups = [
        "A+",
        "A-",
        "B+",
        "B-",
        "O+",
        "O-",
        "AB+",
        "AB-",
      ];

      for (const group of groups) {
        await client.query(
          `INSERT INTO blood_inventory
          (blood_bank_id,blood_group,units_available)
          VALUES($1,$2,$3)`,
          [bankId, group, 0]
        );
      }
    }

    await client.query("COMMIT");

    const token = generateToken({
      id: userId,
      role,
    });

    notifyRole(
      "admin",
      "New Registration",
      `${name} registered as ${role}.`,
      "info"
    ).catch(() => { });

    return success(
      res,
      {
        token,
        user: {
          id: userId,
          name,
          email,
          role,
        },
      },
      "Registration successful",
      201
    );
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (!result.rows.length) {
      return error(res, "Invalid email or password", 401);
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return error(
        res,
        "This account has been deactivated. Contact support.",
        403
      );
    }

    const match = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!match) {
      return error(res, "Invalid email or password", 401);
    }

    const token = generateToken({
      id: user.id,
      role: user.role,
    });

    delete user.password_hash;

    return success(
      res,
      {
        token,
        user,
      },
      "Login successful"
    );
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
async function me(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id,name,email,phone,role,
              profile_picture,created_at
       FROM users
       WHERE id=$1`,
      [req.user.id]
    );

    return success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  return success(res, {}, "Logged out successfully");
}

module.exports = {
  register,
  login,
  me,
  logout,
};