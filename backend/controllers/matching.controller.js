const { pool } = require('../config/db');
const { success, error } = require('../utils/response');
const { compatibleDonorGroups, haversineDistance, scoreDonor } = require('../utils/matchingEngine');

// GET /api/matching/blood/:requestId
async function matchBloodRequest(req, res, next) {
  try {
    const [reqRows] = await pool.query(
      `SELECT br.*, rp.latitude AS recipient_lat, rp.longitude AS recipient_lng
       FROM blood_requests br JOIN recipient_profiles rp ON rp.id = br.recipient_id
       WHERE br.id = ?`,
      [req.params.requestId]
    );
    if (!reqRows.length) return error(res, 'Blood request not found', 404);
    const request = reqRows[0];

    const compatibleGroups = compatibleDonorGroups(request.blood_group);
    if (!compatibleGroups.length) return success(res, []);

    const [donors] = await pool.query(
      `SELECT dp.*, u.name, u.phone, u.email,
        (SELECT COUNT(*) FROM donations d WHERE d.donor_id = dp.id AND d.status='completed') AS total_donations
       FROM donor_profiles dp JOIN users u ON u.id = dp.user_id
       WHERE dp.blood_group IN (?) AND dp.is_available = 1 AND dp.eligibility_status = 'eligible'`,
      [compatibleGroups]
    );

    const ranked = donors
      .map((d) => {
        const distanceKm = haversineDistance(request.recipient_lat, request.recipient_lng, d.latitude, d.longitude);
        const score = scoreDonor({
          distanceKm,
          isAvailable: !!d.is_available,
          isEligible: d.eligibility_status === 'eligible',
          lastDonationDate: d.last_donation_date,
          totalDonations: d.total_donations,
        });
        return { ...d, distanceKm, matchScore: score };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 50);

    return success(res, ranked);
  } catch (err) {
    next(err);
  }
}

// GET /api/matching/organ/:requestId
async function matchOrganRequest(req, res, next) {
  try {
    const [reqRows] = await pool.query(
      `SELECT o.*, rp.latitude AS recipient_lat, rp.longitude AS recipient_lng
       FROM organ_requests o JOIN recipient_profiles rp ON rp.id = o.recipient_id
       WHERE o.id = ?`,
      [req.params.requestId]
    );
    if (!reqRows.length) return error(res, 'Organ request not found', 404);
    const request = reqRows[0];

    const [donors] = await pool.query(
      `SELECT dp.*, u.name, u.phone, u.email
       FROM donor_profiles dp JOIN users u ON u.id = dp.user_id
       WHERE dp.is_organ_donor = 1 AND dp.is_available = 1 AND dp.eligibility_status = 'eligible'
         AND FIND_IN_SET(?, dp.organ_types)`,
      [request.organ_type]
    );

    const ranked = donors
      .map((d) => {
        const distanceKm = haversineDistance(request.recipient_lat, request.recipient_lng, d.latitude, d.longitude);
        const score = scoreDonor({
          distanceKm,
          isAvailable: !!d.is_available,
          isEligible: d.eligibility_status === 'eligible',
          lastDonationDate: null,
          totalDonations: 0,
        });
        return { ...d, distanceKm, matchScore: score };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 50);

    return success(res, ranked);
  } catch (err) {
    next(err);
  }
}

// GET /api/matching/donor/me/recommendations - suggest nearby requests matching this donor
async function recommendationsForDonor(req, res, next) {
  try {
    const [donorRow] = await pool.query('SELECT * FROM donor_profiles WHERE user_id = ?', [req.user.id]);
    if (!donorRow.length) return error(res, 'Donor profile not found', 404);
    const donor = donorRow[0];

    const [bloodReqs] = await pool.query(
      `SELECT br.*, rp.latitude AS recipient_lat, rp.longitude AS recipient_lng, u.name AS recipient_name
       FROM blood_requests br
       JOIN recipient_profiles rp ON rp.id = br.recipient_id
       JOIN users u ON u.id = rp.user_id
       WHERE br.status = 'pending'`
    );

    const compatibleAsRecipientGroups = Object.entries(require('../utils/matchingEngine').BLOOD_COMPATIBILITY)
      .filter(([, donors]) => donors.includes(donor.blood_group))
      .map(([recipientGroup]) => recipientGroup);

    const matches = bloodReqs
      .filter((r) => compatibleAsRecipientGroups.includes(r.blood_group))
      .map((r) => ({
        ...r,
        distanceKm: haversineDistance(donor.latitude, donor.longitude, r.recipient_lat, r.recipient_lng),
      }))
      .sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999))
      .slice(0, 20);

    return success(res, matches);
  } catch (err) {
    next(err);
  }
}

module.exports = { matchBloodRequest, matchOrganRequest, recommendationsForDonor };
