const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User registration validation
const validateRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  handleValidationErrors
];

// User login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Post creation validation
const validatePost = [
  body('content')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Post content cannot exceed 5000 characters'),
  
  body('privacy')
    .optional()
    .isIn(['public', 'friends', 'private'])
    .withMessage('Privacy must be public, friends, or private'),
  
  body('groupId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Group ID must be a positive integer'),
  
  handleValidationErrors
];

// Comment validation
const validateComment = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
  
  body('postId')
    .isInt({ min: 1 })
    .withMessage('Post ID must be a positive integer'),
  
  handleValidationErrors
];

// Group creation validation
const validateGroup = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Group name must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Group description cannot exceed 500 characters'),
  
  body('privacy')
    .optional()
    .isIn(['public', 'private', 'secret'])
    .withMessage('Privacy must be public, private, or secret'),
  
  handleValidationErrors
];

// Event creation validation
const validateEvent = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Event title must be between 3 and 255 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Event description cannot exceed 1000 characters'),
  
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((endDate, { req }) => {
      if (endDate && new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location cannot exceed 255 characters'),
  
  body('privacy')
    .optional()
    .isIn(['public', 'private'])
    .withMessage('Privacy must be public or private'),
  
  body('maxAttendees')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max attendees must be a positive integer'),
  
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  
  body('website')
    .optional()
    .isURL()
    .withMessage('Website must be a valid URL'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Gender must be male, female, other, or prefer_not_to_say'),
  
  body('privacy')
    .optional()
    .isIn(['public', 'friends', 'private'])
    .withMessage('Privacy must be public, friends, or private'),
  
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

// Search validation
const validateSearch = [
  query('q')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validatePost,
  validateComment,
  validateGroup,
  validateEvent,
  validateProfileUpdate,
  validateId,
  validatePagination,
  validateSearch
};
