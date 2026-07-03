const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));

router.get('/users', ctrl.listUsers);
router.put('/users/:id/status', ctrl.setUserStatus);
router.delete('/users/:id', ctrl.deleteUser);
router.get('/hospitals/pending', ctrl.pendingHospitals);
router.put('/hospitals/:id/verify', ctrl.verifyHospital);
router.get('/bloodbanks/pending', ctrl.pendingBloodBanks);
router.put('/bloodbanks/:id/verify', ctrl.verifyBloodBank);
router.get('/emergencies', ctrl.emergencies);

module.exports = router;
