const router = require('express').Router();
const ctrl = require('../controllers/analytics.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/summary', authenticate, authorize('admin'), ctrl.summary);
router.get('/blood-stock', authenticate, authorize('admin', 'bloodbank'), ctrl.bloodStock);
router.get('/donation-trends', authenticate, authorize('admin'), ctrl.donationTrends);
router.get('/blood-group-distribution', authenticate, authorize('admin'), ctrl.bloodGroupDistribution);
router.get('/registration-trends', authenticate, authorize('admin'), ctrl.registrationTrends);
router.get('/emergency-stats', authenticate, authorize('admin'), ctrl.emergencyStats);
router.get('/facility-activity', authenticate, authorize('admin'), ctrl.facilityActivity);

module.exports = router;
