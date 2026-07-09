const { pool } = require("../config/db");
const { success } = require("../utils/response");

// GET /api/analytics/summary
async function summary(req, res, next) {
  try {
    const totalDonors = await pool.query(
      "SELECT COUNT(*)::int AS count FROM donor_profiles"
    );

    const activeDonors = await pool.query(
      "SELECT COUNT(*)::int AS count FROM donor_profiles WHERE is_available = true"
    );

    const bloodRequests = await pool.query(
      "SELECT COUNT(*)::int AS count FROM blood_requests"
    );

    const organRequests = await pool.query(
      "SELECT COUNT(*)::int AS count FROM organ_requests"
    );

    const successfulDonations = await pool.query(
      "SELECT COUNT(*)::int AS count FROM donations WHERE status='completed'"
    );

    const pendingRequests = await pool.query(`
      SELECT
      (
        (SELECT COUNT(*) FROM blood_requests WHERE status='pending')
        +
        (SELECT COUNT(*) FROM organ_requests WHERE status='pending')
      )::int AS count
    `);

    const emergencyRequests = await pool.query(`
      SELECT
      (
        (SELECT COUNT(*) FROM blood_requests WHERE urgency='critical')
        +
        (SELECT COUNT(*) FROM organ_requests WHERE urgency='critical')
      )::int AS count
    `);

    const totalHospitals = await pool.query(
      "SELECT COUNT(*)::int AS count FROM hospitals"
    );

    const totalBloodBanks = await pool.query(
      "SELECT COUNT(*)::int AS count FROM blood_banks"
    );

    const totalUsers = await pool.query(
      "SELECT COUNT(*)::int AS count FROM users"
    );

    return success(res, {
      totalDonors: totalDonors.rows[0].count,
      activeDonors: activeDonors.rows[0].count,
      bloodRequests: bloodRequests.rows[0].count,
      organRequests: organRequests.rows[0].count,
      successfulDonations: successfulDonations.rows[0].count,
      pendingRequests: pendingRequests.rows[0].count,
      emergencyRequests: emergencyRequests.rows[0].count,
      totalHospitals: totalHospitals.rows[0].count,
      totalBloodBanks: totalBloodBanks.rows[0].count,
      totalUsers: totalUsers.rows[0].count,
    });

  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/blood-stock
async function bloodStock(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT
        blood_group,
        SUM(units_available)::int AS total_units
      FROM blood_inventory
      GROUP BY blood_group
      ORDER BY blood_group
    `);

    return success(res, result.rows);

  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/donation-trends?months=6
async function donationTrends(req, res, next) {
  try {
    const months = Number(req.query.months) || 6;

    const result = await pool.query(
      `
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') AS month,
        COUNT(*)::int AS count
      FROM donations
      WHERE created_at >= CURRENT_DATE - ($1 * INTERVAL '1 month')
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month
      `,
      [months]
    );

    return success(res, result.rows);

  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/blood-group-distribution
async function bloodGroupDistribution(req, res, next) {
  try {
    const result = await pool.query(
      `
      SELECT
        blood_group,
        COUNT(*)::int AS count
      FROM donor_profiles
      GROUP BY blood_group
      ORDER BY blood_group
      `
    );

    return success(res, result.rows);

  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/registration-trends?months=6
async function registrationTrends(req, res, next) {
  try {
    const months = Number(req.query.months) || 6;

    const result = await pool.query(
      `
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') AS month,
        role,
        COUNT(*)::int AS count
      FROM users
      WHERE created_at >= CURRENT_DATE - ($1 * INTERVAL '1 month')
      GROUP BY
        TO_CHAR(created_at, 'YYYY-MM'),
        role
      ORDER BY month
      `,
      [months]
    );

    return success(res, result.rows);

  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/emergency-stats
async function emergencyStats(req, res, next) {
  try {

    const bloodResult = await pool.query(
      `
      SELECT
        status,
        COUNT(*)::int AS count
      FROM blood_requests
      WHERE urgency = 'critical'
      GROUP BY status
      `
    );

    const organResult = await pool.query(
      `
      SELECT
        status,
        COUNT(*)::int AS count
      FROM organ_requests
      WHERE urgency = 'critical'
      GROUP BY status
      `
    );

    return success(res, {
      blood: bloodResult.rows,
      organ: organResult.rows,
    });

  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/facility-activity
async function facilityActivity(req, res, next) {
  try {

    const hospitalResult = await pool.query(
      `
      SELECT
        h.hospital_name,
        COUNT(DISTINCT br.id)::int AS blood_requests,
        COUNT(DISTINCT o.id)::int AS organ_requests
      FROM hospitals h
      LEFT JOIN blood_requests br
        ON br.hospital_id = h.id
      LEFT JOIN organ_requests o
        ON o.hospital_id = h.id
      GROUP BY h.id, h.hospital_name
      ORDER BY
        COUNT(DISTINCT br.id) +
        COUNT(DISTINCT o.id) DESC
      LIMIT 10
      `
    );

    const bloodBankResult = await pool.query(
      `
      SELECT
        bb.bank_name,
        COUNT(br.id)::int AS requests_fulfilled
      FROM blood_banks bb
      LEFT JOIN blood_requests br
        ON br.blood_bank_id = bb.id
       AND br.status = 'fulfilled'
      GROUP BY bb.id, bb.bank_name
      ORDER BY requests_fulfilled DESC
      LIMIT 10
      `
    );

    return success(res, {
      hospitals: hospitalResult.rows,
      bloodBanks: bloodBankResult.rows,
    });

  } catch (err) {
    next(err);
  }
}

module.exports = {
  summary,
  bloodStock,
  donationTrends,
  bloodGroupDistribution,
  registrationTrends,
  emergencyStats,
  facilityActivity,
};