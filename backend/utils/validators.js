const { body, validationResult } = require('express-validator');
const { error } = require('./response');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, 'Validation failed', 422, errors.array().map((e) => ({ field: e.path, message: e.msg })));
  }
  next();
}

const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Name must be 2-120 characters'),
  body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['donor', 'recipient', 'bloodbank', 'hospital', 'admin']).withMessage('Invalid role'),
  body('phone').optional().isLength({ min: 7, max: 20 }),
  handleValidation,
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  handleValidation,
];

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const organTypes = ['kidney', 'liver', 'heart', 'lungs', 'cornea', 'pancreas', 'skin', 'bone_marrow'];

module.exports = {
  handleValidation,
  registerValidation,
  loginValidation,
  changePasswordValidation,
  bloodGroups,
  organTypes,
};
