import Recipe from '../models/Recipe.js';
import User from '../models/User.js';
import EmbeddingService from '../services/embedding.service.js';

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/recommendations
// @access  Protected
// Returns recipes recommended for the authenticated user using
// cosine similarity on the User's preferenceVector and Recipe embeddings.
// ─────────────────────────────────────────────────────────────────
export const getRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('preferenceVector');
    
    // Fetch all published recipes with their embeddings
    const recipes = await Recipe.find({ status: 'published', visibility: 'public' })
      .populate('author', 'username displayName avatarUrl culinaryTitle isVerifiedChef')
      .select('-steps -ingredients -aiSubstitutionCache')
      .lean();

    const userVector = user?.preferenceVector || [];

    if (userVector.length > 0) {
      // Calculate similarity for each recipe
      recipes.forEach(recipe => {
        if (recipe.embedding && recipe.embedding.length > 0) {
          recipe.similarityScore = EmbeddingService.cosineSimilarity(userVector, recipe.embedding);
        } else {
          recipe.similarityScore = 0;
        }
      });

      // Sort by highest similarity score
      recipes.sort((a, b) => b.similarityScore - a.similarityScore);
    } else {
      // Fallback: sort by popularity if user has no preferences yet
      recipes.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    }

    // Return top 15 recommendations
    const topRecommendations = recipes.slice(0, 15);

    // Remove the embedding field from the response payload for bandwidth efficiency
    topRecommendations.forEach(r => delete r.embedding);

    return res.status(200).json({
      success: true,
      message: 'Recommendations fetched successfully',
      data: { recipes: topRecommendations },
    });
  } catch (error) {
    console.error('getRecommendations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations',
    });
  }
};
