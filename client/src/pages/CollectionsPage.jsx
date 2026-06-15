import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collectionAPI } from '../api/collection.api';
import UseAuthStore from '../store/useAuthStore';
import { FolderHeart } from 'lucide-react';

export const CollectionsPage = () => {
  const { isAuthenticated } = UseAuthStore();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCollections();
    }
  }, [isAuthenticated]);

  const fetchCollections = async () => {
    try {
      const res = await collectionAPI.getMyCollections();
      setCollections(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <p className="font-display text-2xl mb-2 text-ink">Sign in to view your collections</p>
          <Link to="/settings" className="text-terracotta underline">Go to Settings to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-ink mb-4">
          My Collections
        </h1>
        <p className="font-body text-ink-muted text-lg max-w-xl mx-auto">
          Organize your favorite recipes into folders to quickly find them later.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="text-4xl animate-pulse">📚</div>
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-ink/5">
          <FolderHeart size={48} className="mx-auto text-ink/20 mb-4" />
          <h3 className="font-display text-xl text-ink font-semibold mb-2">No collections yet</h3>
          <p className="text-ink-muted font-body mb-6">
            Click the "Save" button on any recipe to create your first collection.
          </p>
          <Link to="/" className="btn-primary px-6">
            Discover Recipes
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 fade-in">
          {collections.map(collection => (
            <Link 
              key={collection._id} 
              to={`/collections/${collection._id}`}
              className="block group"
            >
              <div className="card overflow-hidden transition-all duration-300 hover:shadow-warm-lg hover:-translate-y-1 h-full flex flex-col">
                <div className="h-40 bg-gradient-to-br from-terracotta/20 to-parchment flex items-center justify-center relative overflow-hidden">
                  <FolderHeart size={40} className="text-terracotta/40 group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink group-hover:text-terracotta transition-colors line-clamp-1">
                      {collection.name}
                    </h3>
                    {collection.description && (
                      <p className="text-xs text-ink-muted mt-1 line-clamp-2">
                        {collection.description}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 text-xs font-medium text-ink-muted uppercase tracking-widest">
                    {collection.recipes.length} Recipe{collection.recipes.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
