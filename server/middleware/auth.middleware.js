// middleware/auth.middleware.js
// The gatekeeper for all protected routes.
//
// HOW IT WORKS:
// 1. Reads the Authorization header: "Bearer eyJhbGciOiJIUzI1NiJ9..."
// 2. Strips the "Bearer " prefix to get the raw token string
// 3. Calls verifyToken() — if the token is expired or tampered, this throws
// 4. Looks up the user in the database to confirm they still exist and are active
// 5. Attaches the full user object to req.user
// 6. Calls next() — the actual route controller runs
//
// WHY look up the user in the DB on every request?
// Because a token stays valid until it expires (7 days), even if:
//   - The user changes their password
//   - The admin suspends their account (accountActive: false)
//   - The user deletes their account
// The DB lookup catches all these cases. It costs one indexed query
// per request — acceptable, and fast with MongoDB's _id index.

import { verifyToken } from '../services/token.service.js';
import User             from '../models/User.js';

// ─────────────────────────────────────────────────────────────────
// protect — require a valid JWT (authentication)
// Use this on any route that needs "who is this user?"
// ─────────────────────────────────────────────────────────────────
export const protect = async (req, res, next) => {
  try {
    // ── Step 1: Extract token ──────────────────────────────────
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided. Please log in.',
      });
    }

    const token = authHeader.split(' ')[1]; // "Bearer TOKEN" → "TOKEN"

    // ── Step 2: Verify token signature and expiry ──────────────
    // verifyToken throws JsonWebTokenError (bad signature) or
    // TokenExpiredError (expired) — both are caught below.
    const decoded = verifyToken(token);

    // ── Step 3: Confirm user still exists and is active ────────
    // .select('-password') ensures the hash never touches req.user
    const currentUser = await User.findById(decoded.id).select('-password');

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'The account associated with this token no longer exists.',
      });
    }

    if (!currentUser.accountActive) {
      return res.status(401).json({
        success: false,
        message: 'This account has been suspended. Please contact support.',
      });
    }

    // ── Step 4: Attach user to request ────────────────────────
    // Every controller downstream can now access req.user
    // without making its own database call.
    req.user = currentUser;

    next();

  } catch (error) {
    // Specific error messages help the frontend handle token expiry
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.',
        code:    'TOKEN_EXPIRED',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
        code:    'TOKEN_INVALID',
      });
    }

    // Unexpected errors (DB down, etc.)
    return res.status(500).json({
      success: false,
      message: 'Authentication failed due to a server error.',
    });
  }
};

// ─────────────────────────────────────────────────────────────────
// restrictTo — require a specific role (authorization)
// Use AFTER protect. Protect confirms identity; restrictTo
// confirms permission.
//
// Usage example:
//   router.delete('/users/:id', protect, restrictTo('admin'), deleteUser);
//
// WHY return a function from a function (closure pattern)?
// Because Express middleware must be a function with signature (req, res, next).
// restrictTo('admin', 'chef') needs to accept arguments first.
// The closure captures `...roles` and returns the actual middleware function.
// ─────────────────────────────────────────────────────────────────
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // protect must run first — this relies on req.user being set
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires one of these roles: ${roles.join(', ')}.`,
      });
    }
    next();
  };
};

// ─────────────────────────────────────────────────────────────────
// optionalAuth — attach user if token is present, but don't block
// Use on public routes where logged-in users get richer responses.
//
// Example: GET /api/recipes/:slug
//   - Not logged in → returns recipe (public)
//   - Logged in     → returns recipe + "did I like this?" + "did I save this?"
// ─────────────────────────────────────────────────────────────────
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token   = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      const user    = await User.findById(decoded.id).select('-password');
      if (user && user.accountActive) {
        req.user = user; // Attach if valid — but don't block if not
      }
    }
  } catch {
    // Silently ignore token errors on optional auth routes
    // The route will just treat this as an unauthenticated request
  }

  next(); // Always continue regardless
};