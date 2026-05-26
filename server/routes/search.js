const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');

// GET /api/search?q=&cuisine=&difficulty=&mood=&dietary=&sort=newest&page=1
router.get('/', async (req, res) => {
  try {
    const {
      q, cuisine, difficulty, mood, dietary, sort = 'newest', page = 1, limit = 12
    } = req.query;

    const filter = { status: 'published', visibility: 'public' };

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
        { cuisineType: { $regex: q, $options: 'i' } },
        { 'ingredients.name': { $regex: q, $options: 'i' } },
      ];
    }
    if (cuisine)    filter.cuisineType   = { $regex: cuisine, $options: 'i' };
    if (difficulty) filter.difficulty    = difficulty;
    if (mood)       filter['emotionalContext.mood'] = mood;
    if (dietary)    filter.dietaryTags   = dietary;

    const sortMap = {
      newest:  { createdAt: -1 },
      popular: { likeCount: -1 },
      quick:   { totalTime:  1 },
    };

    const skip = (Number(page) - 1) * Number(limit);
    const [recipes, total] = await Promise.all([
      Recipe.find(filter)
        .sort(sortMap[sort] || sortMap.newest)
        .skip(skip)
        .limit(Number(limit))
        .populate('author', 'username profileImage')
        .lean(),
      Recipe.countDocuments(filter),
    ]);

    res.json({ recipes, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;