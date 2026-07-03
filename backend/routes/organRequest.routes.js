const router = require('express').Router();
const ctrl = require('../controllers/organRequest.controller');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', authenticate, authorize('recipient'), upload.single('document'), ctrl.createRequest);
router.get('/me', authenticate, authorize('recipient'), ctrl.myRequests);
router.get('/', authenticate, authorize('admin', 'hospital'), ctrl.listRequests);
router.put('/:id/cancel', authenticate, authorize('recipient'), ctrl.cancelRequest);
router.put('/:id/status', authenticate, authorize('admin', 'hospital'), ctrl.updateStatus);

module.exports = router;
