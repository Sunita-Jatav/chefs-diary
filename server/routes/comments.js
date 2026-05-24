import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import Comment from '../models/Comment.js';

// routes/comments.js
const router = express.Router({ mergeParams: true }); // mergeParams for :recipeId

// GET /api/recipes/:recipeId/comments
router.get('/', protect, async (req, res) => {
  const comments = await Comment.find({ recipe: req.params.recipeId })
    .populate('author', 'username avatar')
    .sort({ createdAt: -1 });
  res.json(comments);
});

// POST /api/recipes/:recipeId/comments
router.post('/', protect, async (req, res) => {
  const comment = await Comment.create({
    recipe: req.params.recipeId,
    author: req.user._id,
    text: req.body.text,
    parentComment: req.body.parentComment || null
  });
  await comment.populate('author', 'username avatar');
  res.status(201).json(comment);
});

// DELETE /api/recipes/:recipeId/comments/:commentId
router.delete('/:commentId', protect, async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) return res.status(404).json({ message: 'Not found' });
  if (comment.author.toString() !== req.user._id.toString())
    return res.status(403).json({ message: 'Unauthorized' });
  await comment.deleteOne();
  res.json({ success: true });
});

export default router;