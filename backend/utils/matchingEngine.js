/**
 * Matching Engine
 * Handles blood compatibility rules, organ eligibility, distance scoring,
 * and produces a ranked list of best-matching donors for a given request.
 */

// Which blood groups can donate TO the key group
const BLOOD_COMPATIBILITY = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // universal recipient
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'], // universal donor pool consumer is only O-
};

function compatibleDonorGroups(recipientGroup) {
  return BLOOD_COMPATIBILITY[recipientGroup] || [];
}

/**
 * Haversine distance in km between two lat/lng points
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((v) => v === null || v === undefined)) {
    return null;
  }
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Compute a 0-100 match score for a donor against a request.
 * Weighting: blood compatibility (mandatory filter, not scored),
 * distance (up to 50 pts), availability/eligibility (20 pts),
 * recency of last donation / rest period (20 pts), donation history (10 pts).
 */
function scoreDonor({ distanceKm, isAvailable, isEligible, lastDonationDate, totalDonations }) {
  let score = 0;

  // Distance score (closer = better). Cap at 200km relevance radius.
  if (distanceKm === null) {
    score += 15; // unknown location, neutral-low score
  } else if (distanceKm <= 5) score += 50;
  else if (distanceKm <= 15) score += 42;
  else if (distanceKm <= 30) score += 34;
  else if (distanceKm <= 60) score += 24;
  else if (distanceKm <= 100) score += 14;
  else if (distanceKm <= 200) score += 6;
  else score += 0;

  // Availability & eligibility
  if (isAvailable) score += 12;
  if (isEligible) score += 8;

  // Rest period since last donation (blood donors need ~90 day gap ideally)
  if (!lastDonationDate) {
    score += 20; // never donated / fully rested
  } else {
    const daysSince = (Date.now() - new Date(lastDonationDate).getTime()) / 86400000;
    if (daysSince >= 90) score += 20;
    else if (daysSince >= 60) score += 12;
    else if (daysSince >= 30) score += 5;
    else score += 0;
  }

  // Experience bonus
  score += Math.min(totalDonations || 0, 10);

  return Math.min(Math.round(score), 100);
}

function isRestPeriodOver(lastDonationDate, minDays = 90) {
  if (!lastDonationDate) return true;
  const daysSince = (Date.now() - new Date(lastDonationDate).getTime()) / 86400000;
  return daysSince >= minDays;
}

module.exports = {
  BLOOD_COMPATIBILITY,
  compatibleDonorGroups,
  haversineDistance,
  scoreDonor,
  isRestPeriodOver,
};
