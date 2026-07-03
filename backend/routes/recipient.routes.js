const router = require('express').Router();
const ctrl = require('../controllers/recipient.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/me', authenticate, authorize('recipient'), ctrl.getMyProfile);
router.put('/me', authenticate, authorize('recipient'), ctrl.updateMyProfile);
router.get('/me/history', authenticate, authorize('recipient'), ctrl.myRequestHistory);

module.exports = router;
