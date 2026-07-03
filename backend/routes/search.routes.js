const router = require('express').Router();
const ctrl = require('../controllers/search.controller');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, ctrl.search);

module.exports = router;
