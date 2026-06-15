// src/pages/RecipePage.jsx — Full recipe view

import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { recipeAPI }     from '../api/recipe.api';
import { aiAPI }         from '../api/ai.api';
import { useGroqStream } from '../hooks/useGroqStream';
import UseAuthStore      from '../store/useAuthStore';
import Comments from '../components/recipe/Comments';
import { VoiceStepNav } from '../components/ui/VoiceStepNav';
import { Helmet } from 'react-helmet-async';
import { Share } from 'lucide-react';
import { TranslationModule } from '../components/ui/TranslationModule';
import { ShareModal } from '../components/ui/ShareModal';
import { SaveModal } from '../components/ui/SaveModal';


const moodEmoji = {
  nostalgic:    { emoji: '🌙', color: '#7c6fa0' },
  celebratory:  { emoji: '🎉', color: '#c1614f' },
  comforting:   { emoji: '🫂', color: '#7a9e72' },
  adventurous:  { emoji: '🌍', color: '#e6a817' },
  healing:      { emoji: '🌿', color: '#4a6e42' },
  romantic:     { emoji: '🌹', color: '#c1614f' },
  spiritual:    { emoji: '🕊️', color: '#7a9e72' },
  playful:      { emoji: '✨', color: '#e6a817' },
};

const MetaBadge = ({ icon, text, subtle }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
    padding: '0.3rem 0.75rem', borderRadius: '9999px',
    background: subtle ? 'rgba(44,31,14,0.06)' : 'white',
    border: '1px solid rgba(44,31,14,0.1)',
    fontSize: '0.8rem', color: 'var(--color-ink-muted)', fontWeight: 500,
  }}>
    <span>{icon}</span><span>{text}</span>
  </div>
);

const SectionDivider = ({ title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2.5rem 0 1.5rem' }}>
    <h2 style={{
      fontFamily: 'var(--font-display)', fontSize: '1.5rem',
      fontWeight: 700, color: 'var(--color-ink)', whiteSpace: 'nowrap',
    }}>
      {title}
    </h2>
    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(44,31,14,0.15), transparent)' }} />
  </div>
);

// ─── Cooking Assistant ────────────────────────────────────────────
// ─── Cooking Assistant ────────────────────────────────────────────
const CookingAssistant = ({ recipe }) => {
  const [isOpen,   setIsOpen]   = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `Hi! I'm Sous, your cooking companion for "${recipe.title}". Ask me anything about this recipe — timing, techniques, substitutions.`,
  }]);
  const messagesEndRef = useRef(null);
  const { streamedText, isStreaming, startStream, reset } = useGroqStream();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedText]);

  const sendMessage = async () => {
    if (!chatInput.trim() || isStreaming) return;

    const userMessage    = { role: 'user', content: chatInput.trim() };
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setChatInput('');
    reset();

    const finalResponse = await startStream(() =>
      aiAPI.streamAssistant({
        conversationHistory: updatedHistory.map(m => ({
          role:    m.role,
          content: m.content,
        })),
        recipeContext: {
          title:       recipe.title,
          prepTime:    recipe.prepTime,
          cookTime:    recipe.cookTime,
          servings:    recipe.servings,
          difficulty:  recipe.difficulty,
          ingredients: recipe.ingredients,
          steps:       recipe.steps,
        },
      })
    );

    if (finalResponse) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: finalResponse },
      ]);
    }
    reset();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem',
          width: '3.5rem', height: '3.5rem', borderRadius: '50%',
          background: 'var(--color-ink)', color: 'white', border: 'none',
          fontSize: '1.4rem', cursor: 'pointer', boxShadow: 'var(--shadow-warm-lg)',
          zIndex: 40, transition: 'transform 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        title="Open Sous — AI cooking assistant"
      >
        👨‍🍳
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem',
      width: '360px', height: '500px', background: '#fdfaf4',
      borderRadius: '1rem', boxShadow: 'var(--shadow-warm-lg)',
      border: '1px solid rgba(44,31,14,0.12)',
      display: 'flex', flexDirection: 'column', zIndex: 40, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '0.875rem 1rem', borderBottom: '1px solid rgba(44,31,14,0.1)',
        background: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '0.5rem',
      }}>
        <span style={{ fontSize: '1.1rem' }}>👨‍🍳</span>
        <div style={{ flex: 1 }}>
          <p style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>Sous</p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', margin: 0 }}>
            AI cooking companion · Powered by Groq
          </p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '1.2rem' }}
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '1rem',
        display: 'flex', flexDirection: 'column', gap: '0.75rem',
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%', padding: '0.625rem 0.875rem',
              borderRadius: msg.role === 'user' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
              background: msg.role === 'user' ? 'var(--color-terracotta)' : 'white',
              color: msg.role === 'user' ? 'white' : 'var(--color-ink)',
              fontSize: '0.85rem', lineHeight: 1.6,
              boxShadow: '0 1px 4px rgba(44,31,14,0.08)',
              border: msg.role === 'assistant' ? '1px solid rgba(44,31,14,0.08)' : 'none',
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Live streaming bubble */}
        {isStreaming && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              maxWidth: '80%', padding: '0.625rem 0.875rem',
              borderRadius: '1rem 1rem 1rem 0.25rem', background: 'white',
              color: 'var(--color-ink)', fontSize: '0.85rem', lineHeight: 1.6,
              boxShadow: '0 1px 4px rgba(44,31,14,0.08)',
              border: '1px solid rgba(44,31,14,0.08)',
            }}>
              {streamedText || 'Thinking…'}
              {streamedText && (
                <span style={{
                  display: 'inline-block', width: '2px', height: '0.85em',
                  background: 'var(--color-terracotta)', marginLeft: '2px',
                  verticalAlign: 'text-bottom',
                  animation: 'blink 0.7s step-end infinite',
                }} />
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input — uses lifted chatInput state */}
      <div style={{
        padding: '0.75rem', borderTop: '1px solid rgba(44,31,14,0.1)',
        display: 'flex', gap: '0.5rem',
      }}>
        <input
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about this recipe…"
          disabled={isStreaming}
          style={{
            flex: 1, padding: '0.5rem 0.75rem', borderRadius: '0.625rem',
            border: '1px solid rgba(44,31,14,0.15)', background: 'white',
            fontSize: '0.85rem', color: 'var(--color-ink)', outline: 'none',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={isStreaming || !chatInput.trim()}
          style={{
            width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem',
            border: 'none',
            background: isStreaming || !chatInput.trim() ? 'rgba(44,31,14,0.1)' : 'var(--color-terracotta)',
            color: 'white',
            cursor: isStreaming || !chatInput.trim() ? 'not-allowed' : 'pointer',
            fontSize: '1rem', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s',
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────
export const RecipePage = ({ toast }) => {
  const { slug } = useParams();
  const { user, isAuthenticated } = UseAuthStore();

  const [recipe,         setRecipe]         = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [liked,          setLiked]          = useState(false);
  const [likeCount,      setLikeCount]      = useState(0);
  const [saved,          setSaved]          = useState(false);
  const [isSaveModalOpen,setIsSaveModalOpen] = useState(false);
  const [userRating,     setUserRating]     = useState(0);
  const [activeStep,     setActiveStep]     = useState(0);      // FIX: single declaration, starts at 0
  const [substitution,   setSubstitution]   = useState(null);
  const [subLoading,     setSubLoading]     = useState(false);
  const [subRestriction, setSubRestriction] = useState('vegan');
  const [translatedRecipe, setTranslatedRecipe] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => { fetchRecipe(); }, [slug]);

  const fetchRecipe = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await recipeAPI.getBySlug(slug);
      const { recipe: r, userInteraction } = res.data.data;
      setRecipe(r);
      setLikeCount(r.likeCount || 0);
      if (userInteraction) {
        setLiked(userInteraction.hasLiked);
        setSaved(userInteraction.hasSaved);
        setUserRating(userInteraction.userRating || 0);
      }
    } catch {
      setError('Recipe not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) { toast?.error('Sign in to like recipes.'); return; }
    try {
      const res = await recipeAPI.toggleLike(recipe._id);
      setLiked(res.data.data.liked);
      setLikeCount(res.data.data.likeCount);
    } catch { toast?.error('Failed to update like.'); }
  };

  const handleSave = () => {
    if (!isAuthenticated) { toast?.error('Sign in to save recipes.'); return; }
    setIsSaveModalOpen(true);
  };

  const handleRate = async (rating) => {
    if (!isAuthenticated) { toast?.error('Sign in to rate recipes.'); return; }
    try {
      const res = await recipeAPI.rateRecipe(recipe._id, rating);
      setUserRating(res.data.data.userRating);
      setRecipe(prev => ({ ...prev, averageRating: res.data.data.averageRating, ratingCount: res.data.data.ratingCount }));
      toast?.success(res.data.message);
    } catch { toast?.error('Failed to submit rating.'); }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${displayRecipe.title} | Chef's Diary`,
      text: `Check out this amazing recipe for ${displayRecipe.title}!`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setIsShareModalOpen(true);
        }
      }
    } else {
      setIsShareModalOpen(true);
    }
  };

  const handleSubstitution = async () => {
    if (!isAuthenticated) { toast?.error('Sign in to use AI features.'); return; }
    setSubLoading(true);
    setSubstitution(null);
    try {
      const aiRes = await aiAPI.getSubstitutions({
        ingredients: recipe.ingredients,
        restriction: subRestriction,
        recipeId:    recipe._id,
      });
      setSubstitution(aiRes.data.data);
    } catch {
      toast?.error('Failed to generate substitutions.');
    } finally {
      setSubLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍳</div>
          <p style={{ color: 'var(--color-ink-muted)' }}>Loading recipe…</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div>
          <p style={{ fontSize: '4rem', marginBottom: '1rem' }}>🍽️</p>
          <p style={{ color: 'var(--color-ink-muted)' }}>Recipe not found.</p>
          <Link to="/" style={{ color: 'var(--color-terracotta)', marginTop: '1rem', display: 'block' }}>← Back to Discover</Link>
        </div>
      </div>
    );
  }

  const mood    = recipe.emotionalContext?.mood;
  const moodCfg = moodEmoji[mood];
  const isOwner = user?.id === recipe.author?._id?.toString();
  const displayRecipe = translatedRecipe || recipe;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-parchment)' }}>
      <Helmet>
        <title>{displayRecipe.title} | Chef's Diary</title>
        <meta property="og:title" content={displayRecipe.title} />
        <meta property="og:description" content={displayRecipe.emotionalContext?.story?.slice(0, 150) || 'Check out this amazing recipe!'} />
        {displayRecipe.coverImageUrl && <meta property="og:image" content={displayRecipe.coverImageUrl} />}
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* Hero */}
      <div style={{
        background: recipe.coverImageUrl
          ? `linear-gradient(to bottom, rgba(44,31,14,0.3), rgba(44,31,14,0.7)), url(${recipe.coverImageUrl}) center/cover`
          : 'linear-gradient(135deg, var(--color-ink) 0%, #5c3d1e 100%)',
        minHeight: '420px', display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end', padding: '3rem 1rem 2.5rem',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {recipe.emotionalContext?.culturalOrigin && (
              <span style={{
                padding: '0.25rem 0.75rem', borderRadius: '9999px',
                background: 'rgba(230,168,23,0.9)', color: 'var(--color-ink)',
                fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                {recipe.emotionalContext.culturalOrigin}
              </span>
            )}
            {moodCfg && (
              <span style={{
                padding: '0.25rem 0.75rem', borderRadius: '9999px',
                background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.8rem',
              }}>
                {moodCfg.emoji} {mood}
              </span>
            )}
            {recipe.emotionalContext?.isAIGenerated && (
              <span style={{
                padding: '0.25rem 0.75rem', borderRadius: '9999px',
                background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem',
              }}>
                ✨ AI-assisted story
              </span>
            )}
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 700, color: 'white', lineHeight: 1.15, marginBottom: '1rem',
          }}>
            {displayRecipe.title}
          </h1>

          {recipe.dedication?.dedicatedTo && (
            <p style={{
              color: 'rgba(255,255,255,0.8)', fontStyle: 'italic',
              fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '1.25rem',
            }}>
              For {recipe.dedication.dedicatedTo}
              {recipe.dedication.relationship ? `, ${recipe.dedication.relationship}` : ''}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to={`/@${recipe.author?.username}`} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              color: 'white', textDecoration: 'none',
            }}>
              <div style={{
                width: '2rem', height: '2rem', borderRadius: '50%',
                background: 'var(--color-terracotta)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: '0.875rem',
              }}>
                {recipe.author?.displayName?.[0] || '?'}
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{recipe.author?.displayName}</span>
            </Link>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {recipe.averageRating > 0 && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>⭐ {recipe.averageRating.toFixed(1)} ({recipe.ratingCount})</span>}
              {recipe.totalTime && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>⏱ {recipe.totalTime} min</span>}
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>👥 Serves {recipe.servings}</span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', textTransform: 'capitalize' }}>📊 {recipe.difficulty}</span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>👁 {recipe.viewCount} views</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div style={{
        background: 'white', borderBottom: '1px solid rgba(44,31,14,0.1)',
        padding: '0.75rem 1rem', display: 'flex', justifyContent: 'center',
      }}>
        <div style={{ maxWidth: '800px', width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={handleLike} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid',
            borderColor: liked ? 'var(--color-terracotta)' : 'rgba(44,31,14,0.15)',
            background: liked ? 'rgba(193,97,79,0.08)' : 'transparent',
            color: liked ? 'var(--color-terracotta)' : 'var(--color-ink-muted)',
            cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.2s',
          }}>
            {liked ? '♥' : '♡'} {likeCount}
          </button>

          <button onClick={handleSave} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid',
            borderColor: saved ? 'var(--color-saffron)' : 'rgba(44,31,14,0.15)',
            background: saved ? 'rgba(230,168,23,0.08)' : 'transparent',
            color: saved ? 'var(--color-saffron-dark)' : 'var(--color-ink-muted)',
            cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.2s',
          }}>
            {saved ? 'Saved' : 'Save'}
          </button>
          
          <button onClick={handleShare} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid',
            borderColor: 'rgba(44,31,14,0.15)', background: 'transparent',
            color: 'var(--color-ink-muted)', cursor: 'pointer', fontSize: '0.875rem', 
            fontWeight: 500, transition: 'all 0.2s',
          }}>
            <Share size={16} /> Share
          </button>
          
          <div style={{ width: '1px', height: '1.5rem', background: 'rgba(44,31,14,0.1)', margin: '0 0.25rem' }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => handleRate(star)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontSize: '1.25rem', padding: '0 0.1rem',
                  color: star <= userRating ? 'var(--color-saffron)' : 'rgba(44,31,14,0.15)',
                  transition: 'transform 0.1s',
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                title={`Rate ${star} stars`}
              >
                ★
              </button>
            ))}
          </div>

          <div style={{ marginLeft: 'auto' }}>
            <TranslationModule 
              recipe={recipe} 
              onTranslate={(translated) => setTranslatedRecipe(translated)} 
            />
          </div>

          {isOwner && (
            <Link to={`/recipe/${recipe._id}/edit`} style={{
              padding: '0.5rem 1rem', borderRadius: '0.625rem',
              border: '1px solid rgba(44,31,14,0.15)',
              color: 'var(--color-ink-muted)', textDecoration: 'none',
              fontSize: '0.875rem', fontWeight: 500,
            }}>
              ✏️ Edit
            </Link>
          )}
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem 6rem' }}>

        {displayRecipe.description && (
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontStyle: 'italic',
            color: 'var(--color-ink-muted)', lineHeight: 1.7, marginBottom: '2rem',
          }}>
            {displayRecipe.description}
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {recipe.prepTime  && <MetaBadge icon="🥄" text={`Prep ${recipe.prepTime}m`} />}
          {recipe.cookTime  && <MetaBadge icon="🔥" text={`Cook ${recipe.cookTime}m`} />}
          {recipe.restTime  && <MetaBadge icon="⏸"  text={`Rest ${recipe.restTime}m`} />}
          {recipe.cuisineType?.map(c => <MetaBadge key={c} icon="🌍" text={c} subtle />)}
        </div>

        {/* Emotional story */}
        {recipe.emotionalContext?.story && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(230,168,23,0.06) 0%, rgba(193,97,79,0.04) 100%)',
            border: '1px solid rgba(230,168,23,0.2)',
            borderLeft: '4px solid var(--color-saffron)',
            borderRadius: '0 0.75rem 0.75rem 0',
            padding: '1.5rem', marginBottom: '2.5rem',
          }}>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: '1.1rem',
              lineHeight: 1.9, color: 'var(--color-ink)', fontStyle: 'italic', margin: 0,
            }}>
              "{recipe.emotionalContext.story}"
            </p>
            {recipe.dedication?.message && (
              <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
                — {recipe.dedication.message}
              </p>
            )}
            {recipe.emotionalContext?.occasion && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-ink-muted)', fontWeight: 500 }}>
                🕐 {recipe.emotionalContext.occasion}
              </p>
            )}
          </div>
        )}

        {/* Ingredients */}
        <SectionDivider title="Ingredients" />

        {isAuthenticated && (
          <div style={{
            background: 'white', border: '1px solid rgba(44,31,14,0.1)',
            borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', fontWeight: 500 }}>
              ✨ AI Substitutions
            </span>
            <select
              value={subRestriction}
              onChange={e => setSubRestriction(e.target.value)}
              style={{
                padding: '0.375rem 0.75rem', borderRadius: '0.5rem',
                border: '1px solid rgba(44,31,14,0.15)', fontSize: '0.8rem',
                color: 'var(--color-ink)', background: 'white', cursor: 'pointer',
              }}
            >
              <option value="vegan">Vegan</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="gluten-free">Gluten-Free</option>
              <option value="nut-free">Nut-Free</option>
              <option value="dairy-free">Dairy-Free</option>
            </select>
            <button
              onClick={handleSubstitution}
              disabled={subLoading}
              style={{
                padding: '0.375rem 1rem', borderRadius: '0.5rem', border: 'none',
                background: subLoading ? '#ccc' : 'var(--color-terracotta)',
                color: 'white', fontSize: '0.8rem', fontWeight: 600,
                cursor: subLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
              }}
            >
              {subLoading ? 'Generating…' : 'Generate'}
            </button>
          </div>
        )}

        {substitution && (
          <div style={{
            background: 'rgba(122,158,114,0.08)', border: '1px solid rgba(122,158,114,0.3)',
            borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem',
          }}>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-sage-dark)', marginBottom: '0.75rem' }}>
              {subRestriction.charAt(0).toUpperCase() + subRestriction.slice(1)} substitutions:
            </p>
            {substitution.substitutions?.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--color-ink-muted)', minWidth: '8rem', fontWeight: 500 }}>{s.original}</span>
                <span style={{ color: 'var(--color-ink-muted)' }}>→</span>
                <div>
                  <span style={{ color: 'var(--color-ink)', fontWeight: 500 }}>{s.substitute}</span>
                  {s.note && <span style={{ color: 'var(--color-ink-muted)', fontSize: '0.78rem' }}> · {s.note}</span>}
                </div>
              </div>
            ))}
            {substitution.overallNote && (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', fontStyle: 'italic', marginTop: '0.5rem', borderTop: '1px solid rgba(122,158,114,0.2)', paddingTop: '0.5rem' }}>
                {substitution.overallNote}
              </p>
            )}
          </div>
        )}

        <div style={{
          background: 'white', border: '1px solid rgba(44,31,14,0.1)',
          borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '2rem',
        }}>
          {(displayRecipe.ingredients || recipe.ingredients)?.map((ing, i) => {
            // translated recipe returns an array of strings, while original is an array of objects
            const isString = typeof ing === 'string';
            return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', padding: '0.75rem 1.25rem',
              borderBottom: i < (displayRecipe.ingredients || recipe.ingredients).length - 1 ? '1px solid rgba(44,31,14,0.06)' : 'none',
              background: i % 2 === 0 ? 'white' : 'rgba(245,237,224,0.3)',
            }}>
              <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'var(--color-terracotta)', flexShrink: 0, marginRight: '0.875rem' }} />
              {isString ? (
                <span style={{ color: 'var(--color-ink)', fontSize: '0.9rem', flex: 1 }}>{ing}</span>
              ) : (
                <>
                  <span style={{ fontWeight: 600, color: 'var(--color-terracotta)', minWidth: '5rem', fontSize: '0.9rem' }}>
                    {ing.quantity} {ing.unit}
                  </span>
                  <span style={{ color: 'var(--color-ink)', fontSize: '0.9rem', flex: 1 }}>{ing.name}</span>
                  {ing.notes && <span style={{ color: 'var(--color-ink-muted)', fontSize: '0.78rem', fontStyle: 'italic' }}>{ing.notes}</span>}
                  {ing.isOptional && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-ink-muted)', background: 'rgba(44,31,14,0.06)', padding: '0.1rem 0.4rem', borderRadius: '9999px', marginLeft: '0.5rem' }}>
                      optional
                    </span>
                  )}
                </>
              )}
            </div>
          )})}
        </div>

        {/* Steps */}
        <SectionDivider title="Method" />

        <VoiceStepNav
          steps={displayRecipe.steps?.map(s => typeof s === 'string' ? s : s.instruction) ?? []}
          currentStep={activeStep}
          onStepChange={setActiveStep}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {(displayRecipe.steps || recipe.steps)?.map((step, i) => {
            const isString = typeof step === 'string';
            const instruction = isString ? step : step.instruction;
            const order = isString ? i + 1 : step.order;
            
            return (
            <div
              key={i}
              onClick={() => setActiveStep(activeStep === i ? 0 : i)}
              style={{
                background: 'white', border: '1px solid',
                borderColor: activeStep === i ? 'var(--color-terracotta)' : 'rgba(44,31,14,0.1)',
                borderRadius: '0.75rem', padding: '1.25rem', cursor: 'pointer',
                transition: 'all 0.2s', boxShadow: activeStep === i ? 'var(--shadow-warm)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{
                  width: '2.25rem', height: '2.25rem', borderRadius: '50%',
                  background: activeStep === i ? 'var(--color-terracotta)' : 'rgba(193,97,79,0.1)',
                  color: activeStep === i ? 'white' : 'var(--color-terracotta)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.875rem', flexShrink: 0, transition: 'all 0.2s',
                }}>
                  {step.order}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: 'var(--color-ink)', lineHeight: 1.7, margin: 0, fontSize: '0.95rem' }}>
                    {instruction}
                  </p>
                  {activeStep === i && !isString && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {step.duration && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-saffron-dark)', fontWeight: 600, background: 'rgba(230,168,23,0.1)', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                          ⏱ {step.duration}
                        </span>
                      )}
                      {step.tips && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--color-ink-muted)', fontStyle: 'italic', margin: 0, width: '100%' }}>
                          💡 {step.tips}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {!isString && step.duration && activeStep !== i && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {step.duration}
                  </span>
                )}
              </div>
            </div>
          )})}
        </div>

        {recipe.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            {recipe.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
          </div>
        )}

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(44,31,14,0.1)' }}>
          <Link to="/" style={{ color: 'var(--color-terracotta)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
            ← Back to Discover
          </Link>
        </div>

        {/* Two-column: steps summary + comments */}
        <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
          <div /> {/* left column intentionally empty — steps are already above */}
          <div style={{ position: 'sticky', top: '5rem' }}>
            <Comments recipeId={recipe._id} />
          </div>
        </div>

      </div>
      {recipe && (
        <CookingAssistant recipe={recipe} />
      )}
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        url={window.location.href}
        title={displayRecipe.title}
      />
      <SaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        recipeId={recipe._id}
        toast={toast}
      />
    </div>
  );
};