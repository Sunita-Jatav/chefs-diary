 // routes/user.routes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import { protect } from '../middleware/auth.middleware.js';
import User from '../models/User.js';
import Recipe from '../models/Recipe.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
const router = express.Router();

// GET /api/users/me — get current user profile
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/users/profile — update profile fields
router.put('/profile', protect, async (req, res) => {
  try {
    const allowed = [
      'displayName', 'bio', 'location', 'avatarUrl', 'coverImageUrl',
      'culinaryTitle', 'culinaryPhilosophy', 'yearsOfExperience',
      'cuisineSpecialties', 'dietaryExpertise', 'socialLinks',
      'role', 'isPrivate'
    ];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/users/password — change password
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Both fields required' });
    if (newPassword.length < 8)
      return res.status(400).json({ success: false, message: 'Min 8 characters' });

    const user = await User.findById(req.user._id).select('+password');
    const valid = await user.comparePassword(currentPassword);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Current password incorrect' });

    user.password = newPassword; // pre-save hook hashes it
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/:username — public profile
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username, accountActive: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/:username/activity — public activity
router.get('/:username/activity', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Fetch recent likes (recipes and posts) and comments
    const [likedRecipes, likedPosts, comments] = await Promise.all([
      Recipe.find({ likes: user._id, status: 'published', visibility: 'public' })
        .sort({ updatedAt: -1 }).limit(5).select('title slug coverImageUrl likeCount'),
      Post.find({ likes: user._id, status: 'published', visibility: 'public' })
        .sort({ updatedAt: -1 }).limit(5).populate('author', 'displayName username avatarUrl'),
      Comment.find({ author: user._id, isDeleted: false })
        .sort({ createdAt: -1 }).limit(5).populate('targetId', 'title slug content')
    ]);

    res.json({ likedRecipes, likedPosts, comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:username/stats — private stats
router.get('/:username/stats', protect, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    // Aggregate recipe stats
    const recipeStats = await Recipe.aggregate([
      { $match: { author: user._id } },
      { $group: {
          _id: null,
          totalViews: { $sum: "$viewCount" },
          totalLikes: { $sum: "$likeCount" },
          totalSaves: { $sum: "$saveCount" }
      }}
    ]);

    // Aggregate post stats
    const postStats = await Post.aggregate([
      { $match: { author: user._id } },
      { $group: {
          _id: null,
          totalLikes: { $sum: "$likeCount" }
      }}
    ]);

    res.json({
      recipeStats: recipeStats[0] || { totalViews: 0, totalLikes: 0, totalSaves: 0 },
      postStats: postStats[0] || { totalLikes: 0 },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ── ADD THESE ROUTES to server/routes/user.routes.js ─────────────────────
// Import User at top of file (already there), protect middleware too.

// ── POST /api/users/:username/skills ─────────────────────────────────────
// Add a skill to own profile
router.post('/:username/skills', protect, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not your profile' });

    const { name, category = 'technique' } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Skill name required' });

    const exists = user.skills.some(s => s.name.toLowerCase() === name.toLowerCase().trim());
    if (exists) return res.status(409).json({ message: 'Skill already added' });

    user.skills.push({ name: name.trim(), category, endorsedBy: [], endorseCount: 0 });
    await user.save();

    res.status(201).json(user.skills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/users/:username/skills/:skillId ───────────────────────────
// Remove a skill from own profile
router.delete('/:username/skills/:skillId', protect, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not your profile' });

    user.skills = user.skills.filter(s => s._id.toString() !== req.params.skillId);
    await user.save();

    res.json(user.skills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/users/:username/skills/:skillId/endorse ─────────────────────
// Toggle endorsement (cannot endorse own skills)
router.post('/:username/skills/:skillId/endorse', protect, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user._id.toString() === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot endorse your own skills' });

    const skill = user.skills.id(req.params.skillId);
    if (!skill) return res.status(404).json({ message: 'Skill not found' });

    const alreadyEndorsed = skill.endorsedBy.some(e => e.user.toString() === req.user._id.toString());

    if (alreadyEndorsed) {
      skill.endorsedBy = skill.endorsedBy.filter(e => e.user.toString() !== req.user._id.toString());
      skill.endorseCount = Math.max(0, skill.endorseCount - 1);
    } else {
      skill.endorsedBy.push({ user: req.user._id });
      skill.endorseCount += 1;
    }

    await user.save();
    res.json({ endorsed: !alreadyEndorsed, endorseCount: skill.endorseCount, skillId: skill._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;