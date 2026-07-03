const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { registerValidation, loginValidation } = require('../utils/validators');

router.post('/register', registerValidation, ctrl.register);
router.post('/login', loginValidation, ctrl.login);
router.get('/me', authenticate, ctrl.me);
router.post('/logout', authenticate, ctrl.logout);

module.exports = router;
