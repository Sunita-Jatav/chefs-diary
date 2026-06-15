import { useState, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { collectionAPI } from '../../api/collection.api';

export const SaveModal = ({ isOpen, onClose, recipeId, toast }) => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCollections();
    }
  }, [isOpen]);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const res = await collectionAPI.getMyCollections();
      setCollections(res.data.data);
    } catch (err) {
      toast?.error('Failed to load collections.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (collectionId) => {
    try {
      const res = await collectionAPI.toggleRecipe(collectionId, recipeId);
      // Optimistically update the local state
      setCollections(prev => prev.map(c => {
        if (c._id === collectionId) {
          const hasRecipe = c.recipes.includes(recipeId);
          return {
            ...c,
            recipes: hasRecipe 
              ? c.recipes.filter(id => id !== recipeId)
              : [...c.recipes, recipeId]
          };
        }
        return c;
      }));
      toast?.success(res.data.message);
    } catch (err) {
      toast?.error('Failed to update collection.');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    setIsCreating(true);
    try {
      const res = await collectionAPI.create({ name: newCollectionName, recipeId });
      setCollections([res.data.data, ...collections]);
      setNewCollectionName('');
      toast?.success('Collection created & recipe saved!');
    } catch (err) {
      toast?.error(err.response?.data?.message || 'Failed to create collection.');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-warm-lg relative slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-muted hover:text-ink transition-colors"
        >
          <X size={20} />
        </button>

        <h3 className="font-display text-xl font-bold text-ink mb-6 text-center">
          Save to Collection
        </h3>

        {loading ? (
          <div className="py-8 text-center text-ink-muted">Loading collections...</div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto mb-6 pr-2 custom-scrollbar">
            {collections.length === 0 ? (
              <p className="text-center text-sm text-ink-muted py-4">
                You haven't created any collections yet.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {collections.map(collection => {
                  const isSaved = collection.recipes.includes(recipeId);
                  return (
                    <button
                      key={collection._id}
                      onClick={() => handleToggle(collection._id)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isSaved 
                          ? 'border-terracotta bg-terracotta/5' 
                          : 'border-ink/10 hover:border-ink/30'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className={`font-medium text-sm ${isSaved ? 'text-terracotta' : 'text-ink'}`}>
                          {collection.name}
                        </span>
                        <span className="text-xs text-ink-muted">
                          {collection.recipes.length} recipe{collection.recipes.length !== 1 && 's'}
                        </span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSaved ? 'bg-terracotta border-terracotta text-white' : 'border-ink/20'
                      }`}>
                        {isSaved && <Check size={12} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            placeholder="New collection name..."
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            className="input flex-1 py-2 px-3 text-sm"
            maxLength={50}
          />
          <button
            type="submit"
            disabled={!newCollectionName.trim() || isCreating}
            className="btn-primary py-2 px-3 flex items-center justify-center disabled:opacity-50"
          >
            <Plus size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
