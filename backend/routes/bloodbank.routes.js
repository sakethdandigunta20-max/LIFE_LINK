const router = require('express').Router();
const ctrl = require('../controllers/bloodBank.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/me', authenticate, authorize('bloodbank'), ctrl.getMyProfile);
router.put('/me', authenticate, authorize('bloodbank'), ctrl.updateMyProfile);
router.get('/me/inventory', authenticate, authorize('bloodbank'), ctrl.getMyInventory);
router.put('/me/inventory', authenticate, authorize('bloodbank'), ctrl.updateInventory);
router.get('/', ctrl.listBloodBanks);
router.get('/:id/inventory', authenticate, ctrl.getInventory);

module.exports = router;
