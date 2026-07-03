const router = require('express').Router();
const ctrl = require('../controllers/matching.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/blood/:requestId', authenticate, authorize('admin', 'bloodbank', 'hospital', 'recipient'), ctrl.matchBloodRequest);
router.get('/organ/:requestId', authenticate, authorize('admin', 'hospital', 'recipient'), ctrl.matchOrganRequest);
router.get('/donor/me/recommendations', authenticate, authorize('donor'), ctrl.recommendationsForDonor);

module.exports = router;
