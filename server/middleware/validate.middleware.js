// middleware/validate.middleware.js
// Input validation using express-validator.
//
// WHY validate in middleware, not in the controller?
// The controller's only job is business logic. If we mix in
// "is this email valid?" checks, the controller becomes cluttered
// and the validation logic isn't reusable across routes.
//
// HOW express-validator works:
// 1. You define a chain of rules: body('email').isEmail()
// 2. Each rule runs against req.body and adds errors to an internal store
// 3. validationResult(req) collects all errors
// 4. Our `validate` runner checks that store and either blocks or proceeds

import { body, validationResult } from 'express-validator';

// ─────────────────────────────────────────────────────────────────
// validate — the middleware runner
// Always add this as the LAST item in your validation array.
// It reads the accumulated errors and either returns a 422 response
// or calls next() to proceed to the controller.
// ─────────────────────────────────────────────────────────────────
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Format errors as a clean array: [{ field: 'email', message: 'Invalid email' }]
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

// ─────────────────────────────────────────────────────────────────
// registerValidation
// Rules for POST /api/auth/register
// ─────────────────────────────────────────────────────────────────
export const registerValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(), // Lowercases, removes dots from gmail, etc.

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

  validate, // Always last — runs the check and responds or proceeds
];

// ─────────────────────────────────────────────────────────────────
// loginValidation
// Rules for POST /api/auth/login
// ─────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────
// updateProfileValidation
// Rules for PATCH /api/auth/profile
// All fields are optional — only validate what's present.
// ─────────────────────────────────────────────────────────────────
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