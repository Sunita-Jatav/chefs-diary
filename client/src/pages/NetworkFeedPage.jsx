// client/src/pages/NetworkFeedPage.jsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, Briefcase, Users, MessageCircle, Star, Lightbulb, BookOpen, ChefHat } from 'lucide-react';
import useNetworkStore from '../store/networkStore';
import useAuthStore from '../store/authStore';

const FILTERS = [
  { key: 'all',    label: 'All' },
  { key: 'post',   label: 'Posts' },
  { key: 'job',    label: 'Jobs' },
  { key: 'collab', label: 'Collabs' },
];

const TYPE_META = {
  general:        { label: 'Update',      icon: ChefHat,    color: 'text-terracotta' },
  recipe_share:   { label: 'Recipe',      icon: BookOpen,   color: 'text-amber-600'  },
  seeking_chef:   { label: 'Hiring',      icon: Briefcase,  color: 'text-blue-600'   },
  job_opportunity:{ label: 'Job',         icon: Briefcase,  color: 'text-blue-600'   },
  collab_request: { label: 'Collab',      icon: Users,      color: 'text-green-600'  },
  tip_technique:  { label: 'Tip',         icon: Lightbulb,  color: 'text-yellow-600' },
  question:       { label: 'Question',    icon: MessageCircle, color: 'text-purple-600'},
  milestone:      { label: 'Milestone',   icon: Star,       color: 'text-pink-600'   },
};

const CTA_LABEL = {
  job_opportunity: 'Apply',
  seeking_chef:    'Apply',
  collab_request:  'Express Interest',
};

export const NetworkFeedPage = ({ toast }) => {
  const { posts, hasMore, loading, filter, setFilter, fetchPosts, deletePost, toggleLike } = useNetworkStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchPosts(true);
  }, [filter]);

  const handleFilter = (key) => {
    setFilter(key);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deletePost(id);
      toast?.success('Post deleted');
    } catch {
      toast?.error('Failed to delete');
    }
  };

  const handleLike = async (id) => {
    try { await toggleLike(id); } catch { toast?.error('Failed'); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">Network Feed</h1>
        <Link to="/network/create" className="btn-primary text-sm py-2 px-4">
          + Post
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-6 bg-parchment-100 rounded-xl p-1">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => handleFilter(f.key)}
            className={`flex-1 py-2 text-sm font-body rounded-lg transition-colors ${
              filter === f.key
                ? 'bg-white text-ink font-medium shadow-sm'
                : 'text-ink/60 hover:text-ink'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {posts.map(post => {
          const meta = TYPE_META[post.postType] || TYPE_META.general;
          const Icon = meta.icon;
          const isOwner = user?._id === post.author?._id;
          const ctaLabel = CTA_LABEL[post.postType];

          return (
            <div key={post._id} className="card p-5">

              {/* Post header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Link to={`/@${post.author?.username}`}>
                    <div className="w-10 h-10 rounded-full bg-terracotta flex items-center justify-center text-white text-sm font-medium">
                      {post.author?.displayName?.[0]?.toUpperCase() || '?'}
                    </div>
                  </Link>
                  <div>
                    <Link to={`/@${post.author?.username}`} className="font-medium text-sm text-ink hover:text-terracotta">
                      {post.author?.displayName}
                    </Link>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Icon size={12} className={meta.color} />
                      <span className={`text-xs font-body ${meta.color}`}>{meta.label}</span>
                      <span className="text-xs text-ink/40">·</span>
                      <span className="text-xs text-ink/40">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                {isOwner && (
                  <button onClick={() => handleDelete(post._id)} className="text-ink/30 hover:text-terracotta transition-colors">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              {/* Content */}
              <p className="font-body text-sm text-ink leading-relaxed mb-3 whitespace-pre-line">
                {post.content}
              </p>

              {/* Attached recipe */}
              {post.attachedRecipe && (
                <Link
                  to={`/recipe/${post.attachedRecipe.slug || post.attachedRecipe._id}`}
                  className="block mb-3 rounded-lg overflow-hidden border border-[var(--border)] hover:border-terracotta transition-colors"
                >
                  {post.attachedRecipe.coverImage && (
                    <img src={post.attachedRecipe.coverImage} alt={post.attachedRecipe.title}
                      className="w-full h-32 object-cover" />
                  )}
                  <div className="px-3 py-2 bg-parchment-100">
                    <p className="text-sm font-medium text-ink">{post.attachedRecipe.title}</p>
                  </div>
                </Link>
              )}

              {/* Tags */}
              {post.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {post.tags.map(tag => (
                    <span key={tag} className="text-xs bg-parchment-100 text-ink/60 px-2 py-0.5 rounded-full font-body">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 pt-3 border-t border-[var(--border)]">
                <button
                  onClick={() => handleLike(post._id)}
                  className={`flex items-center gap-1.5 text-sm font-body transition-colors ${
                    post.isLiked ? 'text-terracotta' : 'text-ink/50 hover:text-terracotta'
                  }`}
                >
                  <Heart size={15} fill={post.isLiked ? 'currentColor' : 'none'} />
                  {post.likeCount > 0 && <span>{post.likeCount}</span>}
                </button>

                {ctaLabel && (
                  <button className="ml-auto btn-primary text-xs py-1.5 px-4">
                    {ctaLabel}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {!loading && posts.length === 0 && (
        <div className="text-center py-16 text-ink/40 font-body">
          <ChefHat size={40} className="mx-auto mb-3 opacity-30" />
          <p>No posts yet. Be the first to share!</p>
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="text-center mt-6">
          <button
            onClick={() => fetchPosts()}
            disabled={loading}
            className="btn-ghost text-sm px-6 py-2"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};