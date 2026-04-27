const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const {
  uploadContent,
  getMyContent,
  getAllContent,
  getPendingContent,
  approveContent,
  rejectContent,
  getLiveContent,
  getSchedule,
} = require('../controllers/contentController');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const validate = require('../middlewares/validate');

// ──────────────────────────────────────────────
// PUBLIC ROUTES (no auth required)
// ──────────────────────────────────────────────

// GET /content/live/:teacherId - Public broadcasting endpoint
router.get(
  '/live/:teacherId',
  [param('teacherId').isUUID().withMessage('Invalid teacher ID')],
  validate,
  getLiveContent
);

// ──────────────────────────────────────────────
// TEACHER ROUTES
// ──────────────────────────────────────────────

// POST /content/upload
router.post(
  '/upload',
  authenticate,
  authorize('teacher'),
  upload.single('file'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('description').optional().trim(),
    body('start_time').optional().isISO8601().withMessage('start_time must be a valid ISO date'),
    body('end_time').optional().isISO8601().withMessage('end_time must be a valid ISO date'),
    body('rotation_duration')
      .optional()
      .isInt({ min: 1, max: 1440 })
      .withMessage('rotation_duration must be between 1-1440 minutes'),
  ],
  validate,
  uploadContent
);

// GET /content/my - Teacher's own content
router.get('/my', authenticate, authorize('teacher'), getMyContent);

// GET /content/schedule - Teacher's schedule
router.get('/schedule', authenticate, authorize('teacher'), getSchedule);

// ──────────────────────────────────────────────
// PRINCIPAL ROUTES
// ──────────────────────────────────────────────

// GET /content/all - All content (Principal)
router.get('/all', authenticate, authorize('principal'), getAllContent);

// GET /content/pending - Pending content (Principal)
router.get('/pending', authenticate, authorize('principal'), getPendingContent);

// PATCH /content/:id/approve
router.patch(
  '/:id/approve',
  authenticate,
  authorize('principal'),
  [param('id').isUUID().withMessage('Invalid content ID')],
  validate,
  approveContent
);

// PATCH /content/:id/reject
router.patch(
  '/:id/reject',
  authenticate,
  authorize('principal'),
  [
    param('id').isUUID().withMessage('Invalid content ID'),
    body('reason').trim().notEmpty().withMessage('Rejection reason is required'),
  ],
  validate,
  rejectContent
);

module.exports = router;
