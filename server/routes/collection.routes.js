import { Router } from 'express';
import {
  createCollection,
  getUserCollections,
  getCollectionById,
  toggleRecipeInCollection,
  deleteCollection,
} from '../controllers/collection.controller.js';
import { protect, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', protect, createCollection);
router.get('/', protect, getUserCollections);
router.get('/:id', optionalAuth, getCollectionById);
router.post('/:id/toggle', protect, toggleRecipeInCollection);
router.delete('/:id', protect, deleteCollection);

export default router;
