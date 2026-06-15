// client/src/components/profile/ActivityTab.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../../api/user.api';
import api from '../../api/axiosInstance';
import UseAuthStore from '../../store/useAuthStore';

export const ActivityTab = ({ profileUser }) => {
  const { user: currentUser, isAuthenticated } = UseAuthStore();
  const isOwner = currentUser?.username === profileUser.username;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      try {
        const promises = [
          userAPI.getUserActivity(profileUser.username).then(r => r.data),
          api.get('/api/network/feed', { params: { authorId: profileUser._id, type: 'all' } }).then(r => r.data)
        ];
        
        if (isOwner && isAuthenticated) {
          promises.push(userAPI.getUserStats(profileUser.username).then(r => r.data));
        } else {
          promises.push(Promise.resolve(null));
        }

        const [actData, postsData, statsData] = await Promise.all(promises);
        
        setActivity(actData);
        setPosts(postsData.posts || []);
        setStats(statsData);
      } catch (err) {
        console.error('Failed to fetch activity:', err);
      } finally {
        setLoading(false);
      }
    };
    if (profileUser?._id) fetchActivity();
  }, [profileUser, isOwner, isAuthenticated]);

  if (loading) return <div className="text-center py-8 text-ink-muted">Loading activity...</div>;

  return (
    <div className="space-y-8 pb-12" style={{ paddingTop: '1rem' }}>
      {/* PRIVATE STATS (Owner Only) */}
      {isOwner && stats && (
        <div style={{ background: 'var(--color-parchment)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid rgba(44,31,14,0.1)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 1rem 0' }}>
            Your Private Statistics
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(44,31,14,0.05)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-terracotta)' }}>{stats.recipeStats?.totalViews || 0}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>Total Recipe Views</div>
            </div>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(44,31,14,0.05)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-saffron-dark)' }}>{stats.recipeStats?.totalLikes || 0}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>Recipe Likes</div>
            </div>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(44,31,14,0.05)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-sage-dark)' }}>{stats.recipeStats?.totalSaves || 0}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>Recipe Saves</div>
            </div>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(44,31,14,0.05)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#3b82f6' }}>{stats.postStats?.totalLikes || 0}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>Network Likes</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
        {/* RECENT POSTS */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 1rem 0' }}>
            Recent Posts
          </h3>
          {posts.length === 0 ? (
            <p style={{ color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>No recent network posts.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {posts.map(post => (
                <div key={post._id} style={{ background: 'white', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid rgba(44,31,14,0.1)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', marginBottom: '0.5rem' }}>{new Date(post.createdAt).toLocaleDateString()}</div>
                  <p style={{ color: 'var(--color-ink)', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.content}</p>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--color-terracotta)', fontWeight: 500 }}>{post.likeCount} Likes</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RECENT LIKES & COMMENTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 1rem 0' }}>
              Recently Liked Recipes
            </h3>
            {activity?.likedRecipes?.length === 0 ? (
              <p style={{ color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>No liked recipes yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {activity?.likedRecipes?.map(recipe => (
                  <Link key={recipe._id} to={`/recipe/${recipe.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: 'white', borderRadius: '0.75rem', textDecoration: 'none', border: '1px solid rgba(44,31,14,0.05)' }}>
                    <div style={{ width: '3rem', height: '3rem', background: 'rgba(193,97,79,0.2)', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
                      {recipe.coverImageUrl && <img src={recipe.coverImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-ink)', fontSize: '0.95rem' }}>{recipe.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>{recipe.likeCount} likes</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 1rem 0' }}>
              Recent Comments
            </h3>
            {activity?.comments?.length === 0 ? (
              <p style={{ color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>No recent comments.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {activity?.comments?.map(comment => (
                  <div key={comment._id} style={{ background: 'white', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(44,31,14,0.1)' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-ink)', fontStyle: 'italic', margin: '0 0 0.5rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>"{comment.content}"</p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                      On: <Link to={comment.targetType === 'Recipe' && comment.targetId?.slug ? `/recipe/${comment.targetId.slug}` : '#'} style={{ color: 'var(--color-terracotta)', textDecoration: 'none' }}>{comment.targetId?.title || 'a post'}</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
