// server/routes/network.routes.js
import express from 'express';
import mongoose from 'mongoose';
import Post from '../models/Post.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

const PAGE_SIZE = 10;

// ── Type → postType mapping ───────────────────────────────────────────────
const TYPE_MAP = {
  post:  ['general', 'tip_technique', 'question', 'milestone', 'recipe_share'],
  job:   ['job_opportunity', 'seeking_chef'],
  collab:['collab_request'],
};

// ── GET /api/network/feed ─────────────────────────────────────────────────
// Query: type=all|post|job|collab  page=1
router.get('/feed', protect, async (req, res) => {
  try {
    const { type = 'all', page = 1 } = req.query;
    const skip = (Number(page) - 1) * PAGE_SIZE;

    const filter = { status: 'published' };

    if (type !== 'all') {
      const types = TYPE_MAP[type];
      if (!types) return res.status(400).json({ message: 'Invalid type' });
      filter.postType = { $in: types };
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .populate('author', 'displayName username avatar')
        .populate('attachedRecipe', 'title coverImage slug'),
      Post.countDocuments(filter),
    ]);

    // Attach isLiked flag for current user
    const userId = req.user._id.toString();
    const data = posts.map(p => ({
      ...p.toObject(),
      isLiked: p.likes.some(id => id.toString() === userId),
    }));

    res.json({
      posts: data,
      page: Number(page),
      totalPages: Math.ceil(total / PAGE_SIZE),
      hasMore: skip + posts.length < total,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/network/posts ───────────────────────────────────────────────
router.post('/posts', protect, async (req, res) => {
  try {
    const {
      content, postType = 'general',
      mediaUrls, tags, attachedRecipe, visibility,
    } = req.body;

    if (!content?.trim()) return res.status(400).json({ message: 'Content required' });

    const post = await Post.create({
      author: req.user._id,
      content: content.trim(),
      postType,
      mediaUrls: mediaUrls || [],
      tags: tags || [],
      attachedRecipe: attachedRecipe || null,
      visibility: visibility || 'public',
    });

    await post.populate('author', 'displayName username avatar');
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/network/posts/:id ─────────────────────────────────────────
router.delete('/posts/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not your post' });

    post.status = 'deleted';
    await post.save();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/network/posts/:id/like ─────────────────────────────────────
router.post('/posts/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const uid = req.user._id;
    const liked = post.likes.some(id => id.equals(uid));

    if (liked) {
      post.likes.pull(uid);
      post.likeCount = Math.max(0, post.likeCount - 1);
    } else {
      post.likes.push(uid);
      post.likeCount += 1;
    }

    await post.save();
    res.json({ liked: !liked, likeCount: post.likeCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;