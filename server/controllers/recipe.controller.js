// controllers/recipe.controller.js — Chef's Diary Recipe API
//
// CONTROLLER RESPONSIBILITIES:
//   1. Read from req (body, params, query, user)
//   2. Call the Recipe model
//   3. Handle edge cases (not found, unauthorized, duplicates)
//   4. Send a clean JSON response
//
// OWNERSHIP CHECK PATTERN:
//   We compare recipe.author.toString() === req.user._id.toString()
//   WHY .toString()? Both values are MongoDB ObjectIds — a special BSON type.
//   Direct comparison (===) on ObjectIds always returns false even when
//   they represent the same ID, because they're different object references.
//   .toString() converts both to plain strings, making comparison work.

import Recipe from '../models/Recipe.js';
import User   from '../models/User.js';
import EmbeddingService from '../services/embedding.service.js';

// ─────────────────────────────────────────────────────────────────
// HELPER — buildRecipeFilter
// Constructs the MongoDB query filter for the public feed.
// Extracted as a helper so the logic is reusable and testable.
// ─────────────────────────────────────────────────────────────────
const generateRecipeEmbeddingAsync = async (recipe) => {
  try {
    const textToEmbed = [
      recipe.title,
      recipe.description,
      recipe.cuisineType?.join(' '),
      recipe.dietaryTags?.join(' '),
      recipe.emotionalContext?.mood,
      recipe.emotionalContext?.culturalOrigin,
      recipe.ingredients?.map(i => i.name).join(' ')
    ].filter(Boolean).join('. ');
    
    const embedding = await EmbeddingService.generateEmbedding(textToEmbed);
    if (embedding && embedding.length > 0) {
      await Recipe.findByIdAndUpdate(recipe._id, { embedding });
    }
  } catch (err) {
    console.error('Failed to generate embedding:', err);
  }
};

const updateUserPreferenceVectorAsync = async (userId) => {
  try {
    const user = await User.findById(userId).populate('savedRecipes', 'embedding');
    const likedRecipes = await Recipe.find({ likes: userId }).select('embedding');
    
    let allEmbeddings = [];
    user.savedRecipes?.forEach(r => { if (r.embedding && r.embedding.length) allEmbeddings.push(r.embedding); });
    likedRecipes?.forEach(r => { if (r.embedding && r.embedding.length) allEmbeddings.push(r.embedding); });
    
    if (allEmbeddings.length > 0) {
      const vectorLength = allEmbeddings[0].length;
      let sumVector = new Array(vectorLength).fill(0);
      for (const emb of allEmbeddings) {
        for (let i = 0; i < vectorLength; i++) {
          sumVector[i] += emb[i];
        }
      }
      const avgVector = sumVector.map(val => val / allEmbeddings.length);
      await User.findByIdAndUpdate(userId, { preferenceVector: avgVector });
    }
  } catch (err) {
    console.error('Failed to update user preference vector:', err);
  }
};

const buildRecipeFilter = (query) => {
  const filter = { status: 'published', visibility: 'public' };

  // Full-text search — uses the text index we defined in Recipe.js
  // MongoDB text search is fast and relevance-ranked out of the box.
  if (query.search) {
    filter.$text = { $search: query.search };
  }

  // Filter by cuisine type — supports comma-separated values
  // Example: ?cuisine=Indian,Italian
  if (query.cuisine) {
    const cuisines = query.cuisine.split(',').map(c => c.trim());
    filter.cuisineType = { $in: cuisines };
  }

  // Filter by dietary tag
  // Example: ?dietary=vegan
  if (query.dietary) {
    const tags = query.dietary.split(',').map(t => t.trim());
    filter.dietaryTags = { $in: tags };
  }

  // Filter by difficulty
  if (query.difficulty) {
    filter.difficulty = query.difficulty;
  }

  // Filter by mood (emotional context)
  if (query.mood) {
    filter['emotionalContext.mood'] = query.mood;
  }

  // Filter by cultural origin
  if (query.culture) {
    filter['emotionalContext.culturalOrigin'] = new RegExp(query.culture, 'i');
  }

  return filter;
};

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/recipes
// @access  Protected
// Creates a new recipe. Status defaults to 'draft' so chefs can
// save progress without publishing to the public feed.
// ─────────────────────────────────────────────────────────────────
export const createRecipe = async (req, res) => {
  try {
    const {
      title, description, coverImageUrl, mediaGallery,
      ingredients, steps, servings, prepTime, cookTime, restTime,
      difficulty, cuisineType, dietaryTags, tags,
      emotionalContext, dedication, familyLegacy,
      status, visibility,
    } = req.body;

    // Create the recipe — author is set from the authenticated user,
    // NOT from req.body. This prevents a user from creating a recipe
    // and claiming it belongs to someone else.
    const recipe = await Recipe.create({
      author:      req.user._id,
      title,
      description,
      coverImageUrl,
      mediaGallery,
      ingredients:      ingredients || [],
      steps:            steps       || [],
      servings:         servings    || 4,
      prepTime,
      cookTime,
      restTime,
      difficulty:       difficulty  || 'beginner',
      cuisineType:      cuisineType || [],
      dietaryTags:      dietaryTags || [],
      tags:             tags        || [],
      emotionalContext: emotionalContext || {},
      dedication:       dedication       || {},
      familyLegacy:     familyLegacy     || {},
      status:           status      || 'draft',
      visibility:       visibility  || 'public',
    });

    // Increment the author's recipe count (denormalized counter)
    // $inc is an atomic MongoDB operation — safe for concurrent requests
    await User.findByIdAndUpdate(req.user._id, { $inc: { recipeCount: 1 } });

    // Populate the author field so the response includes profile info
    // instead of just the raw ObjectId
    await recipe.populate('author', 'username displayName avatarUrl culinaryTitle');

    // Trigger async generation of vector embedding for ML recommendations
    generateRecipeEmbeddingAsync(recipe);

    return res.status(201).json({
      success: true,
      message: status === 'published'
        ? 'Recipe published successfully!'
        : 'Recipe saved as draft.',
      data: { recipe },
    });

  } catch (error) {
    console.error('createRecipe error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create recipe. Please try again.',
    });
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/recipes
// @access  Public
// Returns paginated public recipes with filtering and sorting.
//
// PAGINATION STRATEGY — cursor-based vs offset-based:
// We use offset (skip/limit) here for simplicity. For a high-traffic
// feed (10k+ recipes), cursor-based pagination is more efficient.
// We'll migrate to cursor-based when we build the feed algorithm.
//
// Query params:
//   ?page=1          default: 1
//   ?limit=12        default: 12
//   ?sort=latest     options: latest, popular, trending
//   ?search=biryani
//   ?cuisine=Indian
//   ?dietary=vegan
//   ?difficulty=beginner
//   ?mood=nostalgic
//   ?culture=Hyderabadi
// ─────────────────────────────────────────────────────────────────
export const getRecipes = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 12); // Cap at 50 per page
    const skip  = (page - 1) * limit;

    // Build the filter from query parameters
    const filter = buildRecipeFilter(req.query);

    // Build the sort object
    // WHY object instead of string? MongoDB sort takes an object.
    let sort = {};
    switch (req.query.sort) {
      case 'popular':   sort = { likeCount: -1, createdAt: -1 }; break;
      case 'trending':  sort = { viewCount: -1, createdAt: -1 }; break;
      case 'oldest':    sort = { createdAt: 1 };                  break;
      default:          sort = { createdAt: -1 };                 break; // 'latest'
    }

    // If text search is active, also sort by text relevance score
    if (req.query.search) {
      sort = { score: { $meta: 'textScore' }, ...sort };
    }

    // Run count and data queries in parallel for performance.
    // Promise.all() fires both queries simultaneously instead of sequentially.
    // This roughly halves the response time for paginated endpoints.
    const [recipes, totalCount] = await Promise.all([
      Recipe.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('author', 'username displayName avatarUrl culinaryTitle isVerifiedChef')
        .select('-steps -ingredients -aiSubstitutionCache') // Exclude heavy fields from list view
        .lean(), // .lean() returns plain JS objects instead of Mongoose documents — 2-3x faster for reads

      Recipe.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      data: {
        recipes,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage:     page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
    });

  } catch (error) {
    console.error('getRecipes error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch recipes.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/recipes/:slug
// @access  Public (with optional auth for richer response)
// Returns the full recipe document including steps and ingredients.
// Also increments the view count atomically.
// ─────────────────────────────────────────────────────────────────
export const getRecipeBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // findOneAndUpdate with $inc atomically increments viewCount
    // and returns the updated document in one DB operation.
    // This is safer than find() then save() which has a race condition.
    const recipe = await Recipe.findOneAndUpdate(
      {
        slug,
        status:     'published',
        visibility: 'public',
      },
      { $inc: { viewCount: 1 } },
      { new: true } // Return the document AFTER the update
    )
      .populate('author', 'username displayName avatarUrl culinaryTitle isVerifiedChef followerCount')
      .lean();

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found.',
      });
    }

    let userInteraction = null;
    if (req.user) {
      const userId = req.user._id.toString();
      const existingRating = recipe.ratings?.find(r => r.user.toString() === userId);
      
      userInteraction = {
        hasLiked:   recipe.likes.some(id => id.toString() === userId),
        hasSaved:   req.user.savedRecipes.some(id => id.toString() === recipe._id.toString()),
        userRating: existingRating ? existingRating.value : 0,
      };
    }

    return res.status(200).json({
      success: true,
      data:    { recipe, userInteraction },
    });

  } catch (error) {
    console.error('getRecipeBySlug error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch recipe.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/recipes/user/:username
// @access  Public
// Returns all published recipes by a specific chef.
// Used on the chef's profile page.
// ─────────────────────────────────────────────────────────────────
export const getRecipesByUser = async (req, res) => {
  try {
    const { username } = req.params;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 12);
    const skip  = (page - 1) * limit;

    // First find the user by username to get their _id
    const user = await User.findOne({ username }).select('_id displayName avatarUrl').lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No chef found with username @${username}.`,
      });
    }

    const filter = { author: user._id, status: 'published' };

    const [recipes, totalCount] = await Promise.all([
      Recipe.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-steps -aiSubstitutionCache')
        .lean(),
      Recipe.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        chef: user,
        recipes,
        pagination: {
          currentPage: page,
          totalPages:  Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage: page < Math.ceil(totalCount / limit),
        },
      },
    });

  } catch (error) {
    console.error('getRecipesByUser error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch recipes.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/recipes/my/drafts
// @access  Protected
// Returns all recipes (including drafts) by the logged-in user.
// Used in the chef's personal dashboard.
// ─────────────────────────────────────────────────────────────────
export const getMyRecipes = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 12);
    const skip  = (page - 1) * limit;
    const statusFilter = req.query.status; // Filter by draft/published/archived

    const filter = { author: req.user._id };
    if (statusFilter && ['draft', 'published', 'archived'].includes(statusFilter)) {
      filter.status = statusFilter;
    }

    const [recipes, totalCount] = await Promise.all([
      Recipe.find(filter)
        .sort({ updatedAt: -1 }) // Most recently edited first for dashboard
        .skip(skip)
        .limit(limit)
        .select('-aiSubstitutionCache')
        .lean(),
      Recipe.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        recipes,
        pagination: {
          currentPage: page,
          totalPages:  Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage: page < Math.ceil(totalCount / limit),
        },
      },
    });

  } catch (error) {
    console.error('getMyRecipes error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch your recipes.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   PUT /api/recipes/:id
// @access  Protected (owner only)
// Full update of a recipe document.
// ─────────────────────────────────────────────────────────────────
export const updateRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Recipe not found.' });
    }

    // OWNERSHIP CHECK — critical security gate
    // Only the author can edit their own recipe.
    // .toString() is required because ObjectId !== ObjectId by reference.
    if (recipe.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this recipe.',
      });
    }

    // Whitelist updatable fields — prevents unwanted field injection
    const allowedUpdates = [
      'title', 'description', 'coverImageUrl', 'mediaGallery',
      'ingredients', 'steps', 'servings', 'prepTime', 'cookTime', 'restTime',
      'difficulty', 'cuisineType', 'dietaryTags', 'tags',
      'emotionalContext', 'dedication', 'familyLegacy',
      'status', 'visibility',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        recipe[field] = req.body[field];
      }
    });

    // Using .save() instead of findByIdAndUpdate() here is intentional.
    // .save() triggers the pre-save middleware (slug regeneration, totalTime calc).
    // findByIdAndUpdate() bypasses middleware — we'd lose our auto-slug feature.
    await recipe.save();
    await recipe.populate('author', 'username displayName avatarUrl culinaryTitle');

    // Trigger async generation of vector embedding for ML recommendations
    generateRecipeEmbeddingAsync(recipe);

    return res.status(200).json({
      success: true,
      message: 'Recipe updated successfully.',
      data:    { recipe },
    });

  } catch (error) {
    console.error('updateRecipe error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update recipe.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   DELETE /api/recipes/:id
// @access  Protected (owner or admin)
// Soft-delete by setting status to 'archived'.
// Hard-delete only for admins.
// ─────────────────────────────────────────────────────────────────
export const deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Recipe not found.' });
    }

    // Allow delete if: user is the author OR user is an admin
    const isOwner = recipe.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this recipe.',
      });
    }

    // Admins can hard-delete; owners soft-delete (archive)
    if (isAdmin && req.query.hard === 'true') {
      await Recipe.findByIdAndDelete(req.params.id);
      await User.findByIdAndUpdate(recipe.author, { $inc: { recipeCount: -1 } });
      return res.status(200).json({ success: true, message: 'Recipe permanently deleted.' });
    }

    // Soft-delete — sets status to 'archived', recipe disappears from public feed
    // but remains in the database for recovery if needed
    recipe.status = 'archived';
    await recipe.save();

    return res.status(200).json({
      success: true,
      message: 'Recipe archived successfully.',
    });

  } catch (error) {
    console.error('deleteRecipe error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete recipe.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/recipes/:id/like
// @access  Protected
// Toggle like — if already liked, unlike. If not, like.
//
// WHY $addToSet and $pull instead of checking then updating?
// $addToSet adds the userId ONLY if it doesn't already exist.
// $pull removes it if it does exist.
// Both are atomic operations — no race condition if two requests
// arrive at the same time.
// ─────────────────────────────────────────────────────────────────
export const toggleLike = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Recipe not found.' });
    }

    const userId    = req.user._id;
    const hasLiked  = recipe.likes.some(id => id.toString() === userId.toString());

    if (hasLiked) {
      // Unlike — remove userId from likes array and decrement counter
      await Recipe.findByIdAndUpdate(req.params.id, {
        $pull: { likes: userId },
        $inc:  { likeCount: -1 },
      });

      updateUserPreferenceVectorAsync(userId);

      return res.status(200).json({
        success: true,
        message: 'Recipe unliked.',
        data:    { liked: false, likeCount: recipe.likeCount - 1 },
      });

    } else {
      // Like — add userId to likes array and increment counter
      await Recipe.findByIdAndUpdate(req.params.id, {
        $addToSet: { likes: userId }, // $addToSet prevents duplicates
        $inc:      { likeCount: 1 },
      });

      updateUserPreferenceVectorAsync(userId);

      return res.status(200).json({
        success: true,
        message: 'Recipe liked!',
        data:    { liked: true, likeCount: recipe.likeCount + 1 },
      });
    }

  } catch (error) {
    console.error('toggleLike error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update like.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/recipes/:id/save
// @access  Protected
// Toggle save — adds/removes recipe from user's savedRecipes array.
// Also increments/decrements the recipe's saveCount.
// ─────────────────────────────────────────────────────────────────
export const toggleSave = async (req, res) => {
  try {
    const recipe  = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Recipe not found.' });
    }

    const recipeId  = recipe._id;
    const userId    = req.user._id;
    const hasSaved  = req.user.savedRecipes.some(id => id.toString() === recipeId.toString());

    if (hasSaved) {
      // Unsave — remove from user's saved list and decrement recipe counter
      await Promise.all([
        User.findByIdAndUpdate(userId,   { $pull: { savedRecipes: recipeId } }),
        Recipe.findByIdAndUpdate(recipeId, { $inc: { saveCount: -1 } }),
      ]);

      updateUserPreferenceVectorAsync(userId);

      return res.status(200).json({
        success: true,
        message: 'Recipe removed from saved.',
        data:    { saved: false, saveCount: recipe.saveCount - 1 },
      });

    } else {
      // Save — add to user's saved list and increment recipe counter
      await Promise.all([
        User.findByIdAndUpdate(userId,   { $addToSet: { savedRecipes: recipeId } }),
        Recipe.findByIdAndUpdate(recipeId, { $inc: { saveCount: 1 } }),
      ]);

      updateUserPreferenceVectorAsync(userId);

      return res.status(200).json({
        success: true,
        message: 'Recipe saved to your collection!',
        data:    { saved: true, saveCount: recipe.saveCount + 1 },
      });
    }

  } catch (error) {
    console.error('toggleSave error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save recipe.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/recipes/:id/rate
// @access  Protected
// Submit a 1-5 star rating for a recipe.
// Updates existing rating if user already rated.
// ─────────────────────────────────────────────────────────────────
export const rateRecipe = async (req, res) => {
  try {
    const { rating } = req.body;
    const userId = req.user._id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Recipe not found.' });
    }

    // Check if user already rated
    const existingRatingIndex = recipe.ratings.findIndex(r => r.user.toString() === userId.toString());

    if (existingRatingIndex >= 0) {
      // Update existing rating
      recipe.ratings[existingRatingIndex].value = rating;
    } else {
      // Add new rating
      recipe.ratings.push({ user: userId, value: rating });
    }

    // Recalculate average rating
    const totalRating = recipe.ratings.reduce((sum, r) => sum + r.value, 0);
    recipe.averageRating = totalRating / recipe.ratings.length;
    recipe.ratingCount = recipe.ratings.length;

    await recipe.save();

    return res.status(200).json({
      success: true,
      message: 'Rating submitted!',
      data: {
        averageRating: recipe.averageRating,
        ratingCount: recipe.ratingCount,
        userRating: rating
      }
    });
  } catch (error) {
    console.error('rateRecipe error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit rating.' });
  }
};