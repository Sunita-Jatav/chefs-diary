// src/pages/HomePage.jsx — The public discovery feed
import { useState, useEffect } from 'react';
import { recipeAPI }    from '../api/recipe.api';
import { RecipeCard }   from '../components/recipe/RecipeCard';
import useAuthStore     from '../store/authStore';

const MOODS = ['', 'nostalgic', 'celebratory', 'comforting', 'adventurous', 'healing'];
const SORTS = [
  { value: 'latest',  label: 'Latest'   },
  { value: 'popular', label: 'Popular'  },
  { value: 'trending',label: 'Trending' },
];

export const HomePage = () => {
  const [recipes,  setRecipes]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState('');
  const [mood,     setMood]     = useState('');
  const [sort,     setSort]     = useState('latest');
  const [page,     setPage]     = useState(1);
  const [pagination, setPagination] = useState(null);
  const { isAuthenticated } = useAuthStore();

  const fetchRecipes = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, sort, limit: 12 };
      if (search) params.search = search;
      if (mood)   params.mood   = mood;

      const res = await recipeAPI.getAll(params);
      setRecipes(res.data.data.recipes);
      setPagination(res.data.data.pagination);
    } catch {
      setError('Failed to load recipes. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [page, sort, mood]); // Refetch when filters change

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRecipes();
  };

  return (
    <div className="min-h-screen">

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full bg-terracotta/5 blur-3xl" />
        </div>

        <div className="relative max-w-2xl mx-auto fade-in">
          <p className="font-body text-saffron font-medium uppercase tracking-widest text-sm mb-4">
            Where food becomes memory
          </p>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-ink leading-tight mb-6">
            Every Dish<br />
            <em className="text-terracotta not-italic">Tells a Story</em>
          </h1>
          <p className="font-body text-ink-muted text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            A culinary platform where home cooks and professional chefs share recipes
            wrapped in memory, culture, and love.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto">
            <input
              type="text"
              placeholder="Search recipes, cultures, memories…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input flex-1"
            />
            <button type="submit" className="btn-primary px-6">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 mb-8">
        <div className="flex flex-wrap items-center gap-3">

          {/* Mood filter */}
          <div className="flex gap-2 flex-wrap">
            {MOODS.map(m => (
              <button
                key={m || 'all'}
                onClick={() => { setMood(m); setPage(1); }}
                className={`tag cursor-pointer transition-all hover:border-terracotta/40 ${
                  mood === m ? 'bg-terracotta text-white border-terracotta' : ''
                }`}
              >
                {m ? `${m}` : 'All moods'}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="ml-auto flex gap-2">
            {SORTS.map(s => (
              <button
                key={s.value}
                onClick={() => { setSort(s.value); setPage(1); }}
                className={`tag cursor-pointer transition-all ${
                  sort === s.value ? 'bg-ink text-parchment border-ink' : 'hover:border-ink/30'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recipe Grid ─────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card h-80 animate-pulse">
                <div className="h-52 bg-parchment-200 rounded-t-2xl" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-parchment-200 rounded w-3/4" />
                  <div className="h-3 bg-parchment-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-ink-muted font-body">{error}</p>
            <button onClick={fetchRecipes} className="btn-primary mt-4">
              Try Again
            </button>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-4xl mb-4">🍽️</p>
            <p className="text-ink-muted font-body text-lg">No recipes found.</p>
            <p className="text-ink-muted font-body text-sm mt-1">
              {isAuthenticated ? 'Be the first to share one!' : 'Sign in to share your first recipe.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map(recipe => (
                <RecipeCard
                  key={recipe._id}
                  recipe={recipe}
                  onLikeToggle={fetchRecipes}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-12">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={!pagination.hasPreviousPage}
                  className="btn-secondary disabled:opacity-40"
                >
                  ← Previous
                </button>
                <span className="font-body text-sm text-ink-muted">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!pagination.hasNextPage}
                  className="btn-secondary disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};