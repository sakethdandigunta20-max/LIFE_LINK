const { pool } = require("../config/db");
const { success, error } = require("../utils/response");
const {
  compatibleDonorGroups,
  haversineDistance,
  scoreDonor,
  BLOOD_COMPATIBILITY,
} = require("../utils/matchingEngine");

// GET /api/matching/blood/:requestId
async function matchBloodRequest(req, res, next) {
  try {
    const requestResult = await pool.query(
      `
      SELECT
        br.*,
        rp.latitude AS recipient_lat,
        rp.longitude AS recipient_lng
      FROM blood_requests br
      JOIN recipient_profiles rp
        ON rp.id = br.recipient_id
      WHERE br.id = $1
      `,
      [req.params.requestId]
    );

    if (!requestResult.rows.length) {
      return error(res, "Blood request not found", 404);
    }

    const request = requestResult.rows[0];

    const compatibleGroups = compatibleDonorGroups(
      request.blood_group
    );

    if (!compatibleGroups.length) {
      return success(res, []);
    }

    const donorResult = await pool.query(
      `
      SELECT
        dp.*,
        u.name,
        u.phone,
        u.email,
        (
          SELECT COUNT(*)
          FROM donations d
          WHERE d.donor_id = dp.id
          AND d.status = 'completed'
        )::int AS total_donations
      FROM donor_profiles dp
      JOIN users u
        ON u.id = dp.user_id
      WHERE dp.blood_group = ANY($1::text[])
        AND dp.is_available = true
        AND dp.eligibility_status = 'eligible'
      `,
      [compatibleGroups]
    );

    const ranked = donorResult.rows
      .map((d) => {
        const distanceKm = haversineDistance(
          request.recipient_lat,
          request.recipient_lng,
          d.latitude,
          d.longitude
        );

        const score = scoreDonor({
          distanceKm,
          isAvailable: !!d.is_available,
          isEligible:
            d.eligibility_status === "eligible",
          lastDonationDate: d.last_donation_date,
          totalDonations: d.total_donations,
        });

        return {
          ...d,
          distanceKm,
          matchScore: score,
        };
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
    const requestResult = await pool.query(
      `
      SELECT
        o.*,
        rp.latitude AS recipient_lat,
        rp.longitude AS recipient_lng
      FROM organ_requests o
      JOIN recipient_profiles rp
        ON rp.id = o.recipient_id
      WHERE o.id = $1
      `,
      [req.params.requestId]
    );

    if (!requestResult.rows.length) {
      return error(res, "Organ request not found", 404);
    }

    const request = requestResult.rows[0];

    const donorResult = await pool.query(
      `
      SELECT
        dp.*,
        u.name,
        u.phone,
        u.email
      FROM donor_profiles dp
      JOIN users u
        ON u.id = dp.user_id
      WHERE dp.is_organ_donor = true
        AND dp.is_available = true
        AND dp.eligibility_status = 'eligible'
        AND $1 = ANY(string_to_array(dp.organ_types, ','))
      `,
      [request.organ_type]
    );

    const ranked = donorResult.rows
      .map((d) => {
        const distanceKm = haversineDistance(
          request.recipient_lat,
          request.recipient_lng,
          d.latitude,
          d.longitude
        );

        const score = scoreDonor({
          distanceKm,
          isAvailable: !!d.is_available,
          isEligible:
            d.eligibility_status === "eligible",
          lastDonationDate: null,
          totalDonations: 0,
        });

        return {
          ...d,
          distanceKm,
          matchScore: score,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 50);

    return success(res, ranked);

  } catch (err) {
    next(err);
  }
}

// GET /api/matching/donor/me/recommendations
async function recommendationsForDonor(req, res, next) {
  try {
    const donorResult = await pool.query(
      `
      SELECT *
      FROM donor_profiles
      WHERE user_id = $1
      `,
      [req.user.id]
    );

    if (!donorResult.rows.length) {
      return error(res, "Donor profile not found", 404);
    }

    const donor = donorResult.rows[0];

    const bloodResult = await pool.query(
      `
      SELECT
        br.*,
        rp.latitude AS recipient_lat,
        rp.longitude AS recipient_lng,
        u.name AS recipient_name
      FROM blood_requests br
      JOIN recipient_profiles rp
        ON rp.id = br.recipient_id
      JOIN users u
        ON u.id = rp.user_id
      WHERE br.status = 'pending'
      `
    );

    const compatibleRecipientGroups = Object.entries(
      BLOOD_COMPATIBILITY
    )
      .filter(([, donors]) =>
        donors.includes(donor.blood_group)
      )
      .map(([recipientGroup]) => recipientGroup);

    const matches = bloodResult.rows
      .filter((r) =>
        compatibleRecipientGroups.includes(r.blood_group)
      )
      .map((r) => ({
        ...r,
        distanceKm: haversineDistance(
          donor.latitude,
          donor.longitude,
          r.recipient_lat,
          r.recipient_lng
        ),
      }))
      .sort(
        (a, b) =>
          (a.distanceKm ?? 9999) -
          (b.distanceKm ?? 9999)
      )
      .slice(0, 20);

    return success(res, matches);

  } catch (err) {
    next(err);
  }
}

module.exports = {
  matchBloodRequest,
  matchOrganRequest,
  recommendationsForDonor,
};