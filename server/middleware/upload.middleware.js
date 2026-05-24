// middleware/upload.middleware.js
import multer                   from 'multer';
import { CloudinaryStorage }    from 'multer-storage-cloudinary';
import cloudinary               from '../config/cloudinary.js';

// ── Recipe cover images ───────────────────────────────────────────
const recipeStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'chefs-diary/recipes',
    allowed_formats:['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 800, crop: 'fill', quality: 'auto' }],
  },
});

// ── User avatars ──────────────────────────────────────────────────
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'chefs-diary/avatars',
    allowed_formats:['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' }],
  },
});

// ── Cover / banner images ─────────────────────────────────────────
const coverStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'chefs-diary/covers',
    allowed_formats:['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1500, height: 500, crop: 'fill', quality: 'auto' }],
  },
});

const fileSizeLimit = 5 * 1024 * 1024; // 5MB

export const uploadRecipeImage = multer({ storage: recipeStorage, limits: { fileSize: fileSizeLimit } }).single('image');
export const uploadAvatar      = multer({ storage: avatarStorage, limits: { fileSize: fileSizeLimit } }).single('image');
export const uploadCover       = multer({ storage: coverStorage,  limits: { fileSize: fileSizeLimit } }).single('image');