// services/token.service.js
// Pure JWT logic — no Express imports, no req/res.
// Lives in services/ so it can be unit-tested independently.
//
// WHY keep this separate from the controller?
// The controller handles HTTP concerns (reading req, sending res).
// The service handles business logic (generating and verifying tokens).
// If you ever switch from REST to GraphQL, you reuse this file unchanged.

import jwt from 'jsonwebtoken';

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────
const JWT_SECRET     = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ─────────────────────────────────────────────────────────────────
// signToken
// Creates a signed JWT containing the user's id and role.
//
// WHY include `role` in the payload?
// The `protect` middleware can then check req.user.role === 'admin'
// without a database query on every request. The role is baked into
// the token, so authorization checks are pure in-memory operations.
//
// WHY NOT include email or username?
// Minimise the payload. Only include what authorization decisions
// need. Email/username can be fetched from DB when needed.
// ─────────────────────────────────────────────────────────────────
export const signToken = (userId, role) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables.');
  }

  return jwt.sign(
    {
      id:   userId.toString(), // Convert ObjectId to string for JSON safety
      role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// ─────────────────────────────────────────────────────────────────
// verifyToken
// Decodes and validates a JWT string.
// Returns the payload object { id, role, iat, exp } if valid.
// Throws a JsonWebTokenError or TokenExpiredError if invalid.
//
// The auth middleware calls this and handles the thrown errors.
// ─────────────────────────────────────────────────────────────────
export const verifyToken = (token) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables.');
  }
  return jwt.verify(token, JWT_SECRET);
};

// ─────────────────────────────────────────────────────────────────
// createTokenResponse
// Convenience helper used by both register and login controllers.
// Returns the standardized auth response shape the frontend expects.
// ─────────────────────────────────────────────────────────────────
export const createTokenResponse = (user) => {
  const token = signToken(user._id, user.role);

  return {
    token,
    expiresIn: JWT_EXPIRES_IN,
    user: {
      id:            user._id,
      username:      user.username,
      displayName:   user.displayName,
      email:         user.email,
      role:          user.role,
      avatarUrl:     user.avatarUrl,
      culinaryTitle: user.culinaryTitle,
      isVerifiedChef:user.isVerifiedChef,
    },
  };
};