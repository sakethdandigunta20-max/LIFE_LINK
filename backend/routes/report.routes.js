const router = require('express').Router();
const ctrl = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/:type', authenticate, authorize('admin'), ctrl.generateReport);

module.exports = router;
