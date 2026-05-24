// controllers/upload.controller.js
import cloudinary from '../config/cloudinary.js';
import User       from '../models/User.js';

// @route POST /api/upload/recipe-image
export const uploadRecipeImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }
    return res.status(200).json({
      success:  true,
      message:  'Image uploaded successfully.',
      data:     { url: req.file.path, publicId: req.file.filename },
    });
  } catch (error) {
    console.error('uploadRecipeImage error:', error);
    return res.status(500).json({ success: false, message: 'Upload failed.' });
  }
};

// @route POST /api/upload/avatar
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }

    // Delete old avatar from Cloudinary if it exists
    if (req.user.avatarUrl) {
      try {
        // Extract public_id from existing Cloudinary URL
        const parts    = req.user.avatarUrl.split('/');
        const filename = parts[parts.length - 1].split('.')[0];
        const folder   = parts[parts.length - 2];
        await cloudinary.uploader.destroy(`${folder}/${filename}`);
      } catch {
        // Non-critical — continue even if old image deletion fails
      }
    }

    // Save new avatar URL to user profile
    await User.findByIdAndUpdate(req.user._id, { avatarUrl: req.file.path });

    return res.status(200).json({
      success: true,
      message: 'Avatar updated successfully.',
      data:    { url: req.file.path },
    });
  } catch (error) {
    console.error('uploadAvatar error:', error);
    return res.status(500).json({ success: false, message: 'Upload failed.' });
  }
};

// @route POST /api/upload/cover
export const uploadCover = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }
    await User.findByIdAndUpdate(req.user._id, { coverImageUrl: req.file.path });
    return res.status(200).json({
      success: true,
      message: 'Cover image updated.',
      data:    { url: req.file.path },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Upload failed.' });
  }
};