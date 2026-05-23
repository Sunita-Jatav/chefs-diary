// routes/ai.routes.js
// All AI routes are protected — we don't want unauthenticated users
// burning our Groq API quota with unlimited requests.
//
// RATE LIMITING NOTE:
// For production, add express-rate-limit to these routes.
// Example: limit each user to 20 AI requests per hour.
// We'll add this when we harden the API before launch.

import { Router }          from 'express';
import {
  streamStory,
  getSubstitutions,
  streamAssistant,
  getStoryPrompts,
}                          from '../controllers/ai.controller.js';
import { protect }         from '../middleware/auth.middleware.js';

const router = Router();

// All AI routes require authentication
router.use(protect);

// ── Story generation ──────────────────────────────────────────────
router.post('/story/stream',   streamStory);     // SSE streaming
router.post('/story/prompts',  getStoryPrompts); // 3 inspiration prompts

// ── Ingredient substitutions ──────────────────────────────────────
router.post('/substitutions',  getSubstitutions); // Dietary adaptation

// ── Cooking assistant ─────────────────────────────────────────────
router.post('/assistant/stream', streamAssistant); // SSE chat streaming

export default router;