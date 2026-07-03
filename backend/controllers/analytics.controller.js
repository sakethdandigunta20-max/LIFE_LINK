const { pool } = require('../config/db');
const { success } = require('../utils/response');

// GET /api/analytics/summary
async function summary(req, res, next) {
  try {
    const [[totalDonors]] = await pool.query('SELECT COUNT(*) as count FROM donor_profiles');
    const [[activeDonors]] = await pool.query('SELECT COUNT(*) as count FROM donor_profiles WHERE is_available = 1');
    const [[bloodRequests]] = await pool.query('SELECT COUNT(*) as count FROM blood_requests');
    const [[organRequests]] = await pool.query('SELECT COUNT(*) as count FROM organ_requests');
    const [[successfulDonations]] = await pool.query("SELECT COUNT(*) as count FROM donations WHERE status = 'completed'");
    const [[pendingRequests]] = await pool.query(
      "SELECT (SELECT COUNT(*) FROM blood_requests WHERE status='pending') + (SELECT COUNT(*) FROM organ_requests WHERE status='pending') as count"
    );
    const [[emergencyRequests]] = await pool.query(
      "SELECT (SELECT COUNT(*) FROM blood_requests WHERE urgency='critical') + (SELECT COUNT(*) FROM organ_requests WHERE urgency='critical') as count"
    );
    const [[totalHospitals]] = await pool.query('SELECT COUNT(*) as count FROM hospitals');
    const [[totalBloodBanks]] = await pool.query('SELECT COUNT(*) as count FROM blood_banks');
    const [[totalUsers]] = await pool.query('SELECT COUNT(*) as count FROM users');

    return success(res, {
      totalDonors: totalDonors.count,
      activeDonors: activeDonors.count,
      bloodRequests: bloodRequests.count,
      organRequests: organRequests.count,
      successfulDonations: successfulDonations.count,
      pendingRequests: pendingRequests.count,
      emergencyRequests: emergencyRequests.count,
      totalHospitals: totalHospitals.count,
      totalBloodBanks: totalBloodBanks.count,
      totalUsers: totalUsers.count,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/blood-stock
async function bloodStock(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT blood_group, SUM(units_available) as total_units
       FROM blood_inventory GROUP BY blood_group ORDER BY blood_group`
    );
    return success(res, rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/donation-trends?months=6
async function donationTrends(req, res, next) {
  try {
    const months = Number(req.query.months) || 6;
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
       FROM donations
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
       GROUP BY month ORDER BY month`,
      [months]
    );
    return success(res, rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/blood-group-distribution
async function bloodGroupDistribution(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT blood_group, COUNT(*) as count FROM donor_profiles GROUP BY blood_group ORDER BY blood_group`
    );
    return success(res, rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/registration-trends?months=6
async function registrationTrends(req, res, next) {
  try {
    const months = Number(req.query.months) || 6;
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, role, COUNT(*) as count
       FROM users
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
       GROUP BY month, role ORDER BY month`,
      [months]
    );
    return success(res, rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/emergency-stats
async function emergencyStats(req, res, next) {
  try {
    const [bloodByStatus] = await pool.query(
      "SELECT status, COUNT(*) as count FROM blood_requests WHERE urgency='critical' GROUP BY status"
    );
    const [organByStatus] = await pool.query(
      "SELECT status, COUNT(*) as count FROM organ_requests WHERE urgency='critical' GROUP BY status"
    );
    return success(res, { blood: bloodByStatus, organ: organByStatus });
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/facility-activity
async function facilityActivity(req, res, next) {
  try {
    const [hospitals] = await pool.query(
      `SELECT h.hospital_name, COUNT(DISTINCT br.id) as blood_requests, COUNT(DISTINCT o.id) as organ_requests
       FROM hospitals h
       LEFT JOIN blood_requests br ON br.hospital_id = h.id
       LEFT JOIN organ_requests o ON o.hospital_id = h.id
       GROUP BY h.id ORDER BY (blood_requests + organ_requests) DESC LIMIT 10`
    );
    const [bloodBanks] = await pool.query(
      `SELECT bb.bank_name, COUNT(br.id) as requests_fulfilled
       FROM blood_banks bb LEFT JOIN blood_requests br ON br.blood_bank_id = bb.id AND br.status = 'fulfilled'
       GROUP BY bb.id ORDER BY requests_fulfilled DESC LIMIT 10`
    );
    return success(res, { hospitals, bloodBanks });
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
