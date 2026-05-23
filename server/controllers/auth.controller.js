// controllers/auth.controller.js
// Handles all HTTP auth logic: register, login, profile fetch/update.
//
// CONTROLLER PHILOSOPHY:
// Controllers are thin. They:
//   1. Read from req (body, params, user)
//   2. Call models/services
//   3. Write to res
// Heavy logic (hashing, token signing, DB queries) lives in models and services.

import User                  from '../models/User.js';
import { createTokenResponse } from '../services/token.service.js';

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { email, username, displayName, password, role } = req.body;

    // Check for existing email — give a specific, user-friendly message.
    // We check email and username separately so the user knows which one conflicts.
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
        field:   'email',
      });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'This username is already taken. Please choose another.',
        field:   'username',
      });
    }

    // Create the user document.
    // The password field here is the plain text — the User model's
    // pre-save hook automatically hashes it before it hits the database.
    const user = await User.create({
      email,
      username,
      displayName,
      password,
      role: role || 'home_cook',
    });

    // Build and send the auth response
    const authData = createTokenResponse(user);

    return res.status(201).json({
      success: true,
      message: `Welcome to Chef's Diary, ${user.displayName}!`,
      data:    authData,
    });

  } catch (error) {
    // Mongoose duplicate key error (race condition — two simultaneous registrations)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `This ${field} is already registered.`,
        field,
      });
    }

    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed due to a server error. Please try again.',
    });
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // findByCredentials is the static method we defined on User.js.
    // It handles both "user not found" and "wrong password" cases,
    // throwing the SAME error message for both to prevent user enumeration
    // (attackers shouldn't be able to tell if an email exists or not).
    const user = await User.findByCredentials(email, password);

    const authData = createTokenResponse(user);

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.displayName}!`,
      data:    authData,
    });

  } catch (error) {
    // findByCredentials throws 'Invalid email or password' for both cases
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed due to a server error. Please try again.',
    });
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/auth/me
// @access  Protected (requires valid JWT)
// Used by the frontend on app load to rehydrate user state from token.
// ─────────────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    // req.user is already attached by the `protect` middleware.
    // We re-fetch to get the absolute freshest data from the DB,
    // and to include extra fields the token payload doesn't have.
    const user = await User.findById(req.user._id)
      .select('-password');
      //.populate('savedRecipes', 'title slug coverImageUrl likeCount'); // Populate saves

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data:    { user },
    });

  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   PATCH /api/auth/profile
// @access  Protected
// Updates profile fields — NOT password (that's a separate endpoint).
// ─────────────────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    // Whitelist the fields a user is allowed to update via this endpoint.
    // NEVER do: User.findByIdAndUpdate(id, req.body) — that would allow
    // a user to update their own role to 'admin', set isVerifiedChef: true, etc.
    const allowedFields = [
      'displayName', 'bio', 'location', 'avatarUrl', 'coverImageUrl',
      'culinaryTitle', 'culinaryPhilosophy', 'yearsOfExperience',
      'cuisineSpecialties', 'dietaryExpertise', 'socialLinks',
    ];

    // Build the update object with only the allowed, present fields
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update.',
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      {
        new:            true,  // Return the updated document, not the old one
        runValidators:  true,  // Run Mongoose schema validators on the update
        select:         '-password',
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data:    { user: updatedUser },
    });

  } catch (error) {
    console.error('updateProfile error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   PATCH /api/auth/change-password
// @access  Protected
// Password changes are separate from profile updates by design.
// They require verifying the current password first.
// ─────────────────────────────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both currentPassword and newPassword are required.',
      });
    }

    if (newPassword.length < 8) {
      return res.status(422).json({
        success: false,
        message: 'New password must be at least 8 characters.',
      });
    }

    // Re-fetch the user WITH the password hash for comparison
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    // Assign the new plain-text password — the pre-save hook will hash it
    user.password = newPassword;
    await user.save();

    // Issue a fresh token — good security practice after a password change
    const authData = createTokenResponse(user);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
      data:    authData,
    });

  } catch (error) {
    console.error('changePassword error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};