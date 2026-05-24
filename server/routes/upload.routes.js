// routes/upload.routes.js
import { Router } from 'express';
import {
  uploadRecipeImage as uploadRecipeImageController,
  uploadAvatar      as uploadAvatarController,
  uploadCover       as uploadCoverController,
} from '../controllers/upload.controller.js';
import {
  uploadRecipeImage,
  uploadAvatar,
  uploadCover,
} from '../middleware/upload.middleware.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/recipe-image', protect, uploadRecipeImage, uploadRecipeImageController);
router.post('/avatar',       protect, uploadAvatar,      uploadAvatarController);
router.post('/cover',        protect, uploadCover,       uploadCoverController);

export default router;