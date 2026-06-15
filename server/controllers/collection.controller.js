import Collection from '../models/Collection.js';
import Recipe from '../models/Recipe.js';

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/collections
// @access  Protected
// Create a new collection
// ─────────────────────────────────────────────────────────────────
export const createCollection = async (req, res) => {
  try {
    const { name, description, isPublic, recipeId } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Collection name is required.' });
    }

    const newCollection = new Collection({
      name,
      description,
      isPublic,
      user: req.user._id,
      recipes: recipeId ? [recipeId] : [],
    });

    await newCollection.save();

    return res.status(201).json({
      success: true,
      message: 'Collection created successfully',
      data: newCollection,
    });
  } catch (error) {
    console.error('createCollection error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You already have a collection with this name.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to create collection.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/collections
// @access  Protected
// Get all collections for the logged in user
// ─────────────────────────────────────────────────────────────────
export const getUserCollections = async (req, res) => {
  try {
    const collections = await Collection.find({ user: req.user._id }).sort({ updatedAt: -1 });

    // Also get the user's legacy "savedRecipes" array as a virtual "All Saved" collection if we wanted to
    // But for Option A, we migrate or just rely on collections.

    return res.status(200).json({
      success: true,
      data: collections,
    });
  } catch (error) {
    console.error('getUserCollections error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch collections.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/collections/:id
// @access  Protected (or public if isPublic=true)
// Get a specific collection by ID
// ─────────────────────────────────────────────────────────────────
export const getCollectionById = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id).populate({
      path: 'recipes',
      populate: {
        path: 'author',
        select: 'username displayName profilePicture',
      },
    });

    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found.' });
    }

    // Check visibility
    if (!collection.isPublic && collection.user.toString() !== req.user?._id?.toString()) {
      return res.status(403).json({ success: false, message: 'This collection is private.' });
    }

    return res.status(200).json({
      success: true,
      data: collection,
    });
  } catch (error) {
    console.error('getCollectionById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch collection.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/collections/:id/toggle
// @access  Protected
// Add or remove a recipe from a collection
// ─────────────────────────────────────────────────────────────────
export const toggleRecipeInCollection = async (req, res) => {
  try {
    const { recipeId } = req.body;
    if (!recipeId) {
      return res.status(400).json({ success: false, message: 'Recipe ID is required.' });
    }

    const collection = await Collection.findOne({ _id: req.params.id, user: req.user._id });
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found.' });
    }

    const recipeIndex = collection.recipes.indexOf(recipeId);
    let isSaved = false;

    if (recipeIndex === -1) {
      // Add recipe
      collection.recipes.push(recipeId);
      isSaved = true;
    } else {
      // Remove recipe
      collection.recipes.splice(recipeIndex, 1);
      isSaved = false;
    }

    await collection.save();

    return res.status(200).json({
      success: true,
      message: isSaved ? 'Recipe added to collection.' : 'Recipe removed from collection.',
      data: { isSaved, collection },
    });
  } catch (error) {
    console.error('toggleRecipeInCollection error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update collection.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   DELETE /api/collections/:id
// @access  Protected
// Delete a collection
// ─────────────────────────────────────────────────────────────────
export const deleteCollection = async (req, res) => {
  try {
    const collection = await Collection.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found or unauthorized.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Collection deleted successfully.',
    });
  } catch (error) {
    console.error('deleteCollection error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete collection.' });
  }
};
