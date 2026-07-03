const router = require('express').Router();
const ctrl = require('../controllers/donor.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/me', authenticate, authorize('donor'), ctrl.getMyProfile);
router.put('/me', authenticate, authorize('donor'), ctrl.updateMyProfile);
router.get('/me/history', authenticate, authorize('donor'), ctrl.myDonationHistory);
router.get('/', authenticate, authorize('admin', 'hospital', 'bloodbank', 'recipient'), ctrl.listDonors);
router.get('/:id', authenticate, ctrl.getDonorById);

module.exports = router;
