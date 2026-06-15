import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collectionAPI } from '../api/collection.api';
import { RecipeCard } from '../components/recipe/RecipeCard';
import UseAuthStore from '../store/useAuthStore';
import { Trash2, ArrowLeft } from 'lucide-react';

export const CollectionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = UseAuthStore();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCollection();
  }, [id]);

  const fetchCollection = async () => {
    try {
      const res = await collectionAPI.getById(id);
      setCollection(res.data.data);
    } catch (err) {
      setError('Collection not found or private.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this collection? The recipes will not be deleted.')) return;
    setIsDeleting(true);
    try {
      await collectionAPI.delete(id);
      navigate('/collections');
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pulse">📚</div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h2 className="font-display text-4xl mb-4 text-ink">Oops!</h2>
        <p className="text-ink-muted mb-6">{error || 'Something went wrong.'}</p>
        <Link to="/collections" className="btn-primary px-6">Back to Collections</Link>
      </div>
    );
  }

  const isOwner = user?.id === collection.user?.toString();

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-4 py-8">
      <Link to="/collections" className="inline-flex items-center gap-2 text-terracotta hover:underline font-medium mb-8">
        <ArrowLeft size={16} /> Back to Collections
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-ink mb-3">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="font-body text-ink-muted text-lg max-w-xl">
              {collection.description}
            </p>
          )}
          <p className="text-sm text-ink-muted mt-3 uppercase tracking-wider font-bold">
            {collection.recipes.length} Recipe{collection.recipes.length !== 1 ? 's' : ''}
          </p>
        </div>

        {isOwner && (
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 text-sm text-red-500/70 hover:text-red-500 transition-colors px-4 py-2 rounded-lg hover:bg-red-500/10"
          >
            <Trash2 size={16} /> {isDeleting ? 'Deleting...' : 'Delete Collection'}
          </button>
        )}
      </div>

      {collection.recipes.length === 0 ? (
        <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-ink/5">
          <p className="text-ink-muted font-body mb-6 text-lg">
            This collection is empty.
          </p>
          <Link to="/" className="btn-primary px-6">
            Discover Recipes to Save
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 fade-in">
          {collection.recipes.map(recipe => (
            <RecipeCard 
              key={recipe._id} 
              recipe={recipe} 
              onLikeToggle={fetchCollection} 
            />
          ))}
        </div>
      )}
    </div>
  );
};
