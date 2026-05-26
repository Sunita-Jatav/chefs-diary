// src/components/recipe/RecipeCard.jsx
import { Link }    from 'react-router-dom';
import { useState }from 'react';
import { recipeAPI } from '../../api/recipe.api';
import UseAuthStore from '../../store/useAuthStore';

const moodEmoji = {
  nostalgic:    '🌙',
  celebratory:  '🎉',
  comforting:   '🫂',
  adventurous:  '🌍',
  healing:      '🌿',
  romantic:     '🌹',
  spiritual:    '🕊️',
  playful:      '✨',
};

export const RecipeCard = ({ recipe, onLikeToggle }) => {
  const { isAuthenticated } = useAuthStore();
  const [liked,     setLiked]     = useState(false);
  const [likeCount, setLikeCount] = useState(recipe.likeCount || 0);

  const handleLike = async (e) => {
    e.preventDefault(); // Prevent Link navigation
    if (!isAuthenticated) return;

    try {
      const res = await recipeAPI.toggleLike(recipe._id);
      setLiked(res.data.data.liked);
      setLikeCount(res.data.data.likeCount);
      onLikeToggle?.();
    } catch {
      // Silently fail — user sees the toggle animation either way
    }
  };

  const mood = recipe.emotionalContext?.mood;

  return (
    <Link to={`/recipe/${recipe.slug}`} className="block group">
      <article className="card overflow-hidden transition-all duration-300 hover:shadow-warm-lg hover:-translate-y-1">

        {/* Cover image / placeholder */}
        <div className="relative h-52 bg-parchment-200 overflow-hidden">
          {recipe.coverImageUrl ? (
            <img
              src={recipe.coverImageUrl}
              alt={recipe.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-parchment-200 to-parchment">
              <span className="text-5xl opacity-40">
                {moodEmoji[mood] || '🍽️'}
              </span>
            </div>
          )}

          {/* Mood badge */}
          {mood && (
            <div className="absolute top-3 left-3">
              <span className="tag text-xs bg-white/90 backdrop-blur-sm">
                {moodEmoji[mood]} {mood}
              </span>
            </div>
          )}

          {/* Like button */}
          {isAuthenticated && (
            <button
              onClick={handleLike}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm
                         flex items-center justify-center shadow-warm-sm
                         transition-transform hover:scale-110 active:scale-95"
            >
              <span className={liked ? 'text-terracotta' : 'text-ink-muted'}>
                {liked ? '♥' : '♡'}
              </span>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Cultural origin */}
          {recipe.emotionalContext?.culturalOrigin && (
            <p className="text-xs font-body text-saffron font-medium uppercase tracking-wider mb-1">
              {recipe.emotionalContext.culturalOrigin}
            </p>
          )}

          {/* Title */}
          <h3 className="font-display text-xl font-semibold text-ink mb-2 line-clamp-2 group-hover:text-terracotta transition-colors">
            {recipe.title}
          </h3>

          {/* Dedication */}
          {recipe.dedication?.dedicatedTo && (
            <p className="text-xs font-body text-ink-muted italic mb-3">
              For {recipe.dedication.dedicatedTo}
            </p>
          )}

          {/* Story snippet */}
          {recipe.emotionalContext?.story && (
            <p className="text-sm font-body text-ink-muted line-clamp-2 mb-4 leading-relaxed">
              "{recipe.emotionalContext.story.slice(0, 100)}…"
            </p>
          )}

          {/* Footer meta */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-terracotta/20 flex items-center justify-center text-xs text-terracotta font-medium">
                {recipe.author?.displayName?.[0] || '?'}
              </div>
              <span className="text-xs font-body text-ink-muted">
                {recipe.author?.displayName}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-ink-muted font-body">
              <span>♥ {likeCount}</span>
              {recipe.totalTime && <span>⏱ {recipe.totalTime}m</span>}
              <span className="tag capitalize">{recipe.difficulty}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};