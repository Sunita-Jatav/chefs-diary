// routes/recipe.routes.js
// ROUTE ORDER IS CRITICAL in Express.
// Express matches routes top to bottom and stops at the first match.
//
// The route GET /my/drafts MUST be defined BEFORE GET /:slug
// because Express would otherwise interpret "my" as a slug value
// and call getRecipeBySlug with slug="my", returning a 404.
//
// Same for GET /user/:username — must come before /:slug.
// This is a common Express gotcha for beginners.

import { Router }            from 'express';
import {
  createRecipe, getRecipes, getRecipeBySlug,
  getRecipesByUser, getMyRecipes,
  updateRecipe, deleteRecipe,
  toggleLike, toggleSave,
}                            from '../controllers/recipe.controller.js';
import { protect, optionalAuth } from '../middleware/auth.middleware.js';
import { recipeValidation }  from '../middleware/validate.middleware.js';

const router = Router();

// ── Public routes ─────────────────────────────────────────────────────────
// optionalAuth: attaches req.user if a token is present, but doesn't block
// unauthenticated users. Used to return personalized data (hasLiked, hasSaved)
// when the user is logged in, while still serving public visitors.

router.get('/',                  getRecipes);                        // Feed with filters
router.get('/user/:username',    getRecipesByUser);                  // Chef's profile recipes

// ── Protected routes (order matters — specific before dynamic) ────────────
router.get('/my/drafts',         protect, getMyRecipes);             // Must be BEFORE /:slug

// ── Dynamic slug route — must be LAST among GET routes ───────────────────
router.get('/:slug',             optionalAuth, getRecipeBySlug);     // Single recipe page

// ── Write operations (all protected) ─────────────────────────────────────
router.post('/',                 protect, recipeValidation, createRecipe);
router.put('/:id',               protect, recipeValidation, updateRecipe);
router.delete('/:id',            protect, deleteRecipe);

// ── Interaction routes ────────────────────────────────────────────────────
router.post('/:id/like',         protect, toggleLike);
router.post('/:id/save',         protect, toggleSave);

export default router;