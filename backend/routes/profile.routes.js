const router = require('express').Router();
const ctrl = require('../controllers/profile.controller');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { changePasswordValidation } = require('../utils/validators');

router.put('/', authenticate, ctrl.updateProfile);
router.put('/password', authenticate, changePasswordValidation, ctrl.changePassword);
router.put('/picture', authenticate, upload.single('picture'), ctrl.updatePicture);
router.put('/deactivate', authenticate, ctrl.deactivateAccount);

module.exports = router;
