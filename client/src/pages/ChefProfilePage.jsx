// src/pages/ChefProfilePage.jsx — The LinkedIn-for-Chefs profile
import { useState, useEffect } from 'react';
import { useParams, Link }     from 'react-router-dom';
import { authAPI }             from '../api/auth.api';
import { recipeAPI }           from '../api/recipe.api';
import { networkAPI }          from '../api/network.api';
import { uploadAPI }           from '../api/upload.api';
import { RecipeCard }          from '../components/recipe/RecipeCard';
import UseAuthStore            from '../store/useAuthStore';
import { SkillsSection }       from '../components/ui/SkillsSection';
import { ActivityTab }         from '../components/profile/ActivityTab';

// ─── Skill category colors ────────────────────────────────────────
const skillColors = {
  technique:  { bg: 'rgba(193,97,79,0.1)',  color: 'var(--color-terracotta)' },
  cuisine:    { bg: 'rgba(230,168,23,0.1)', color: 'var(--color-saffron-dark)' },
  dietary:    { bg: 'rgba(122,158,114,0.1)',color: 'var(--color-sage-dark)' },
  equipment:  { bg: 'rgba(44,31,14,0.08)',  color: 'var(--color-ink-muted)' },
  management: { bg: 'rgba(124,111,160,0.1)',color: '#5c4fa0' },
  other:      { bg: 'rgba(44,31,14,0.06)',  color: 'var(--color-ink-muted)' },
};

const roleLabels = {
  home_cook:         '🏠 Home Cook',
  professional_chef: '👨‍🍳 Professional Chef',
  food_blogger:      '✍️ Food Blogger',
  culinary_student:  '🎓 Culinary Student',
  admin:             '⚙️ Admin',
};

// ─── Sub-components ──────────────────────────────────────────────

const StatBox = ({ value, label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      textAlign: 'center', padding: '0.75rem 1.25rem',
      background: 'white', borderRadius: '0.75rem',
      border: '1px solid rgba(44,31,14,0.1)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s',
    }}
    onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = 'var(--color-terracotta)')}
    onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = 'rgba(44,31,14,0.1)')}
  >
    <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
      {value}
    </p>
    <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', margin: 0, fontWeight: 500 }}>
      {label}
    </p>
  </button>
);

const PortfolioCard = ({ item }) => {
  const startYear = item.startDate ? new Date(item.startDate).getFullYear() : null;
  const endYear   = item.isCurrentRole ? 'Present' : (item.endDate ? new Date(item.endDate).getFullYear() : null);

  return (
    <div style={{
      display: 'flex', gap: '1rem',
      paddingBottom: '1.5rem',
      borderBottom: '1px solid rgba(44,31,14,0.08)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: '0.75rem', height: '0.75rem', borderRadius: '50%',
          background: item.isCurrentRole ? 'var(--color-terracotta)' : 'rgba(44,31,14,0.2)',
          border: '2px solid',
          borderColor: item.isCurrentRole ? 'var(--color-terracotta)' : 'rgba(44,31,14,0.15)',
          marginTop: '0.25rem',
        }} />
        <div style={{ width: '1px', flex: 1, background: 'rgba(44,31,14,0.1)', marginTop: '0.5rem' }} />
      </div>
      <div style={{ flex: 1, paddingBottom: '0.5rem' }}>
        <p style={{ fontWeight: 700, color: 'var(--color-ink)', fontSize: '0.95rem', margin: '0 0 0.125rem' }}>
          {item.role}
        </p>
        <p style={{ color: 'var(--color-terracotta)', fontWeight: 500, fontSize: '0.875rem', margin: '0 0 0.25rem' }}>
          {item.establishment}
          {item.location && <span style={{ color: 'var(--color-ink-muted)', fontWeight: 400 }}> · {item.location}</span>}
        </p>
        {(startYear || endYear) && (
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.8rem', margin: '0 0 0.5rem' }}>
            {startYear} — {endYear}
            <span style={{ marginLeft: '0.5rem', textTransform: 'capitalize', fontSize: '0.75rem' }}>
              ({item.employmentType})
            </span>
          </p>
        )}
        {item.description && (
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
            {item.description}
          </p>
        )}
        {item.highlights?.length > 0 && (
          <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1rem' }}>
            {item.highlights.map((h, i) => (
              <li key={i} style={{ color: 'var(--color-ink-muted)', fontSize: '0.82rem', marginBottom: '0.2rem' }}>
                {h}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const FollowModal = ({ type, userId, onClose }) => {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = type === 'followers'
          ? await networkAPI.getFollowers(userId)
          : await networkAPI.getFollowing(userId);
        const key = type === 'followers' ? 'followers' : 'following';
        setUsers(res.data.data[key] || []);
      } catch { setUsers([]); }
      finally { setLoading(false); }
    };
    fetch();
  }, [type, userId]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(44,31,14,0.4)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fdfaf4', borderRadius: '1rem', width: '100%', maxWidth: '420px',
          maxHeight: '70vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: '1rem 1.25rem', borderBottom: '1px solid rgba(44,31,14,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--color-ink)' }}>
            {type === 'followers' ? 'Followers' : 'Following'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--color-ink-muted)' }}>×</button>
        </div>
        <div style={{ overflowY: 'auto', padding: '0.75rem' }}>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-ink-muted)' }}>Loading…</p>
          ) : users.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-ink-muted)' }}>None yet.</p>
          ) : users.map(u => (
            <Link
              key={u._id}
              to={`/@${u.username}`}
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem', borderRadius: '0.75rem', textDecoration: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(44,31,14,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: '2.5rem', height: '2.5rem', borderRadius: '50%', flexShrink: 0,
                background: u.avatarUrl ? 'transparent' : 'var(--color-terracotta)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {u.avatarUrl
                  ? <img src={u.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: 'white', fontWeight: 700 }}>{u.displayName?.[0]}</span>
                }
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-ink)', fontSize: '0.875rem' }}>
                  {u.displayName} {u.isVerifiedChef && '✓'}
                </p>
                <p style={{ margin: 0, color: 'var(--color-ink-muted)', fontSize: '0.78rem' }}>
                  @{u.username} {u.culinaryTitle && `· ${u.culinaryTitle}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────
export const ChefProfilePage = ({ toast }) => {
  const { username: paramUsername } = useParams();
  // Strip the '@' prefix if present for database/API queries
  const username = paramUsername?.startsWith('@') ? paramUsername.slice(1) : paramUsername;
  const { user: currentUser, isAuthenticated, updateUser } = UseAuthStore();

  const [profile,       setProfile]       = useState(null);
  const [recipes,       setRecipes]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [following,     setFollowing]     = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab,     setActiveTab]     = useState('recipes');
  const [followModal,   setFollowModal]   = useState(null);
  const [uploadingImg,  setUploadingImg]  = useState(null);

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => { loadProfile(); }, [username]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [userRes, recipesRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/profile/${username}`)
          .then(r => r.json()).catch(() => null),
        recipeAPI.getByUser(username, { limit: 12 }),
      ]);

      if (userRes?.success) {
        setProfile(userRes.data.user);
      } else if (recipesRes.data.data.chef) {
        setProfile(recipesRes.data.data.chef);
      }

      setRecipes(recipesRes.data.data.recipes || []);

      if (isAuthenticated && !isOwnProfile) {
        try {
          const followRes = await networkAPI.getFollowStatus(recipesRes.data.data.chef?._id);
          setFollowing(followRes.data.following);
        } catch { }
      }
    } catch (error) {
      console.error('loadProfile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated || !profile?._id) return;
    setFollowLoading(true);
    try {
      const res = await networkAPI.toggleFollow(profile._id);
      setFollowing(res.data.following);
      setProfile(prev => prev ? {
        ...prev,
        followerCount: prev.followerCount + (res.data.following ? 1 : -1),
      } : prev);
    } catch { }
    finally { setFollowLoading(false); }
  };

  const handleImageUpload = async (type, file) => {
    setUploadingImg(type);
    try {
      const data = await uploadAPI[type](file);
      if (isOwnProfile) {
        updateUser({ [type === 'avatar' ? 'avatarUrl' : 'coverImageUrl']: data.data.url });
        setProfile(prev => prev ? {
          ...prev,
          [type === 'avatar' ? 'avatarUrl' : 'coverImageUrl']: data.data.url,
        } : prev);
      }
    } catch { }
    finally { setUploadingImg(null); }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍🍳</div>
          <p style={{ color: 'var(--color-ink-muted)' }}>Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!loading && !profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍽️</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-ink)', marginBottom: '0.5rem' }}>Chef Not Found</h2>
          <p style={{ color: 'var(--color-ink-muted)' }}>We couldn't find a chef with this username.</p>
        </div>
      </div>
    );
  }

  const displayProfile = profile || {};

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-parchment)' }}>

      {/* Cover Image */}
      <div style={{
        height: '220px', position: 'relative', overflow: 'hidden',
        background: displayProfile.coverImageUrl
          ? `url(${displayProfile.coverImageUrl}) center/cover`
          : 'linear-gradient(135deg, #2c1f0e 0%, #c1614f 60%, #e6a817 100%)',
      }}>
        {isOwnProfile && (
          <label style={{
            position: 'absolute', bottom: '1rem', right: '1rem',
            background: 'rgba(0,0,0,0.5)', color: 'white',
            padding: '0.4rem 0.75rem', borderRadius: '0.5rem',
            fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
            backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)',
          }}>
            {uploadingImg === 'cover' ? 'Uploading…' : '📷 Change Cover'}
            <input type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => e.target.files[0] && handleImageUpload('cover', e.target.files[0])} />
          </label>
        )}
      </div>

      {/* Profile Header */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: '1.25rem',
          marginTop: '-4rem', marginBottom: '1.5rem', flexWrap: 'wrap',
        }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: '7rem', height: '7rem', borderRadius: '50%',
              border: '4px solid var(--color-parchment)',
              overflow: 'hidden', background: 'var(--color-terracotta)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-warm)',
            }}>
              {displayProfile.avatarUrl
                ? <img src={displayProfile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: 'white', fontWeight: 700, fontSize: '2.5rem' }}>{displayProfile.displayName?.[0] || '?'}</span>
              }
            </div>
            {isOwnProfile && (
              <label style={{
                position: 'absolute', bottom: '0.25rem', right: '0.25rem',
                width: '1.75rem', height: '1.75rem', borderRadius: '50%',
                background: 'var(--color-terracotta)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', border: '2px solid var(--color-parchment)', fontSize: '0.7rem',
              }}>
                {uploadingImg === 'avatar' ? '…' : '📷'}
                <input type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => e.target.files[0] && handleImageUpload('avatar', e.target.files[0])} />
              </label>
            )}
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
                {displayProfile.displayName}
              </h1>
              {displayProfile.isVerifiedChef && (
                <span style={{
                  background: 'var(--color-saffron)', color: 'var(--color-ink)',
                  fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px',
                }}>
                  ✓ Verified Chef
                </span>
              )}
            </div>
            <p style={{ color: 'var(--color-terracotta)', fontWeight: 500, fontSize: '0.9rem', margin: '0.125rem 0' }}>
              {displayProfile.culinaryTitle || roleLabels[displayProfile.role] || ''}
            </p>
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.8rem', margin: 0 }}>
              @{displayProfile.username}
              {displayProfile.location && ` · 📍 ${displayProfile.location}`}
              {displayProfile.yearsOfExperience > 0 && ` · ${displayProfile.yearsOfExperience}y experience`}
            </p>
          </div>

          {/* Follow / Edit button */}
          <div style={{ paddingBottom: '0.5rem' }}>
            {isOwnProfile ? (
              <Link to="/settings" style={{
                padding: '0.625rem 1.5rem', borderRadius: '0.75rem',
                border: '1.5px solid rgba(44,31,14,0.2)',
                color: 'var(--color-ink)', textDecoration: 'none',
                fontSize: '0.875rem', fontWeight: 500, display: 'block', transition: 'all 0.2s',
              }}>
                ✏️ Edit Profile
              </Link>
            ) : isAuthenticated ? (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                style={{
                  padding: '0.625rem 1.5rem', borderRadius: '0.75rem',
                  background: following ? 'transparent' : 'var(--color-terracotta)',
                  border: following ? '1.5px solid rgba(44,31,14,0.2)' : 'none',
                  color: following ? 'var(--color-ink-muted)' : 'white',
                  fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {followLoading ? '…' : following ? 'Following' : '+ Follow'}
              </button>
            ) : null}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <StatBox value={displayProfile.recipeCount || recipes.length} label="Recipes" />
          <StatBox value={displayProfile.followerCount || 0} label="Followers" onClick={() => setFollowModal('followers')} />
          <StatBox value={displayProfile.followingCount || 0} label="Following" onClick={() => setFollowModal('following')} />
        </div>

        {/* Bio / philosophy */}
        {(displayProfile.bio || displayProfile.culinaryPhilosophy) && (
          <div style={{
            background: 'white', border: '1px solid rgba(44,31,14,0.1)',
            borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem',
          }}>
            {displayProfile.culinaryPhilosophy && (
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: '1rem',
                fontStyle: 'italic', color: 'var(--color-ink)', lineHeight: 1.7,
                marginBottom: displayProfile.bio ? '0.75rem' : 0,
              }}>
                "{displayProfile.culinaryPhilosophy}"
              </p>
            )}
            {displayProfile.bio && (
              <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
                {displayProfile.bio}
              </p>
            )}
          </div>
        )}

        {/* Cuisine specialties */}
        {displayProfile.cuisineSpecialties?.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {displayProfile.cuisineSpecialties.map(c => (
              <span key={c} className="tag">{c}</span>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid rgba(44,31,14,0.1)', marginBottom: '1.5rem' }}>
          {[
            { key: 'recipes',   label: `Recipes (${recipes.length})` },
            { key: 'activity',  label: 'Activity' },
            { key: 'skills',    label: 'Skills' },
            { key: 'portfolio', label: 'Portfolio' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.75rem 1.25rem', border: 'none', background: 'none',
                cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
                color: activeTab === tab.key ? 'var(--color-terracotta)' : 'var(--color-ink-muted)',
                borderBottom: activeTab === tab.key ? '2px solid var(--color-terracotta)' : '2px solid transparent',
                marginBottom: '-2px', transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* RECIPES TAB */}
        {activeTab === 'recipes' && (
          <div>
            {recipes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🍽️</p>
                <p style={{ color: 'var(--color-ink-muted)' }}>
                  {isOwnProfile ? "You haven't published any recipes yet." : 'No published recipes yet.'}
                </p>
                {isOwnProfile && (
                  <Link to="/recipe/new" style={{
                    display: 'inline-block', marginTop: '1rem',
                    padding: '0.625rem 1.5rem', borderRadius: '0.75rem',
                    background: 'var(--color-terracotta)', color: 'white',
                    textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem',
                  }}>
                    + Share Your First Recipe
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', paddingBottom: '3rem' }}>
                {recipes.map(recipe => <RecipeCard key={recipe._id} recipe={recipe} />)}
              </div>
            )}
          </div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === 'activity' && (
          <ActivityTab profileUser={displayProfile} />
        )}

        {/* SKILLS TAB */}
        {activeTab === 'skills' && (
          <div style={{ paddingBottom: '3rem' }}>
            <SkillsSection
              profileUser={displayProfile}
              toast={toast}
            />
          </div>
        )}

        {/* PORTFOLIO TAB */}
        {activeTab === 'portfolio' && (
          <div style={{ paddingBottom: '3rem' }}>
            {!displayProfile.portfolio || displayProfile.portfolio.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📋</p>
                <p style={{ color: 'var(--color-ink-muted)' }}>No experience listed yet.</p>
              </div>
            ) : (
              <div style={{ paddingLeft: '0.5rem' }}>
                {displayProfile.portfolio.map((item, i) => <PortfolioCard key={item._id || i} item={item} />)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Follow modal */}
      {followModal && (
        <FollowModal
          type={followModal}
          userId={displayProfile._id}
          onClose={() => setFollowModal(null)}
        />
      )}
    </div>
  );
};