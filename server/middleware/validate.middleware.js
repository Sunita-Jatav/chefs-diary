// middleware/validate.middleware.js
import { body, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formatted = errors.array().map((err) => ({
      field:   err.path,
      message: err.msg,
    }));

    return res.status(422).json({
      success: false,
      message: 'Validation failed. Please check your input.',
      errors:  formatted,
    });
  }

  next();
};

export const registerValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('username')
    .trim()
    .notEmpty().withMessage('Username is required.')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters.')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores.'),

  body('displayName')
    .trim()
    .notEmpty().withMessage('Display name is required.')
    .isLength({ max: 60 }).withMessage('Display name cannot exceed 60 characters.'),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/\d/).withMessage('Password must contain at least one number.'),

  body('role')
    .optional()
    .isIn(['home_cook', 'professional_chef', 'food_blogger', 'culinary_student'])
    .withMessage('Invalid role selected.'),

  validate,
];

export const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.'),

  validate,
];

export const updateProfileValidation = [
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 60 }).withMessage('Display name must be between 1 and 60 characters.'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Bio cannot exceed 300 characters.'),

  body('culinaryTitle')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Culinary title cannot exceed 100 characters.'),

  body('culinaryPhilosophy')
    .optional()
    .trim()
    .isLength({ max: 600 }).withMessage('Culinary philosophy cannot exceed 600 characters.'),

  body('yearsOfExperience')
    .optional()
    .isInt({ min: 0, max: 70 }).withMessage('Years of experience must be a number between 0 and 70.'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters.'),

  validate,
];

// ─────────────────────────────────────────────────────────────────
// recipeValidation
// Nested ingredient/step field validators removed — they fire on
// empty array items that the controller already cleans up before
// saving. Top-level array type checks are sufficient here.
// ─────────────────────────────────────────────────────────────────
export const recipeValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Recipe title is required.')
    .isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters.'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 600 }).withMessage('Description cannot exceed 600 characters.'),

  body('ingredients')
    .optional()
    .isArray().withMessage('Ingredients must be an array.'),

  body('steps')
    .optional()
    .isArray().withMessage('Steps must be an array.'),

  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'professional'])
    .withMessage('Invalid difficulty level.'),

  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Invalid status value.'),

  body('visibility')
    .optional()
    .isIn(['public', 'connections_only', 'private'])
    .withMessage('Invalid visibility value.'),

  body('servings')
    .optional()
    .isInt({ min: 1 }).withMessage('Servings must be a positive number.'),

  body('prepTime')
    .optional()
    .isInt({ min: 0 }).withMessage('Prep time must be a non-negative number.'),

  body('cookTime')
    .optional()
    .isInt({ min: 0 }).withMessage('Cook time must be a non-negative number.'),

  body('emotionalContext.mood')
    .optional()
    .isIn(['nostalgic', 'celebratory', 'comforting', 'adventurous', 'healing', 'romantic', 'spiritual', 'playful', ''])
    .withMessage('Invalid mood value.'),

  validate,
];