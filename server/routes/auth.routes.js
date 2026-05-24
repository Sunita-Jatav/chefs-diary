// routes/auth.routes.js
// Maps HTTP verbs + URL paths to controller functions.
// Applies validation middleware before controllers.
// Applies protect middleware on authenticated routes.
//
// Route design follows REST conventions:
//   POST   = create (register, login are creation-like actions)
//   GET    = read
//   PATCH  = partial update (profile fields)

import { Router }                    from 'express';
import { register, login, getMe,
         updateProfile, changePassword } from '../controllers/auth.controller.js';
import { protect }                   from '../middleware/auth.middleware.js';
import { registerValidation,
         loginValidation,
         updateProfileValidation }   from '../middleware/validate.middleware.js';
import { register, login, getMe, updateProfile,
         changePassword, getProfileByUsername } from '../controllers/auth.controller.js';


const router = Router();

// ── Public routes (no token required) ────────────────────────────
router.post('/register', registerValidation, register);
router.post('/login',    loginValidation,    login);
router.get('/profile/:username', getProfileByUsername);


// ── Protected routes (valid JWT required) ────────────────────────
// The `protect` middleware runs first on each of these.
// If the token is missing/invalid/expired, it responds with 401
// and the controller never runs.
router.get  ('/me',              protect, getMe);
router.patch('/profile',         protect, updateProfileValidation, updateProfile);
router.patch('/change-password', protect, changePassword);

export default router;