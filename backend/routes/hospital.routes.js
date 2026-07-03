const router = require('express').Router();
const ctrl = require('../controllers/hospital.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/me', authenticate, authorize('hospital'), ctrl.getMyProfile);
router.put('/me', authenticate, authorize('hospital'), ctrl.updateMyProfile);
router.get('/me/patient-requests', authenticate, authorize('hospital'), ctrl.myPatientRequests);
router.get('/', ctrl.listHospitals);

module.exports = router;
