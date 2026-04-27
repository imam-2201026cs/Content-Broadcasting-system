const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

// POST /auth/register
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['principal', 'teacher']).withMessage('Role must be principal or teacher'),
  ],
  validate,
  registerUser
);

// POST /auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  loginUser
);

// GET /auth/me
router.get('/me', authenticate, getMe);

module.exports = router;
