// routes/follow.routes.js
import { Router }          from 'express';
import {
  toggleFollow, getFollowStatus,
  getFollowers, getFollowing, getSuggestions,
} from '../controllers/follow.controller.js';
import { protect, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/suggestions',           protect,       getSuggestions);
router.post('/follow/:userId',        protect,       toggleFollow);
router.get('/follow-status/:userId',  protect,       getFollowStatus);
router.get('/followers/:userId',      optionalAuth,  getFollowers);
router.get('/following/:userId',      optionalAuth,  getFollowing);

export default router;