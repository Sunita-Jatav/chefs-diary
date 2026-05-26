// src/pages/RecipeEditorPage.jsx — Chef's Diary Recipe Editor
// Four-step editor with live Groq AI story streaming.
//
// ARCHITECTURE:
//   - Single page, tab-switched — no routing between steps
//   - All form state in one useState object for easy serialization
//   - AI panel lives as a sidebar on step 4, collapsed on steps 1-3
//   - useGroqStream hook handles SSE token-by-token rendering
//   - Draft auto-save on step navigation (localStorage backup)

import { useState, useEffect, useCallback } from 'react';
import { useNavigate }   from 'react-router-dom';
import { recipeAPI }     from '../api/recipe.api';
import { aiAPI }         from '../api/ai.api';
import { useGroqStream } from '../hooks/useGroqStream';
import UseAuthStore      from '../store/useauthStore';

// ─── Constants ──────────────────────────────────────────────────────────────
const MOODS = [
  { value: '',            label: 'No mood' },
  { value: 'nostalgic',   label: '🌙 Nostalgic'   },
  { value: 'celebratory', label: '🎉 Celebratory'  },
  { value: 'comforting',  label: '🫂 Comforting'   },
  { value: 'adventurous', label: '🌍 Adventurous'  },
  { value: 'healing',     label: '🌿 Healing'      },
  { value: 'romantic',    label: '🌹 Romantic'     },
  { value: 'spiritual',   label: '🕊️ Spiritual'   },
  { value: 'playful',     label: '✨ Playful'      },
];

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'professional'];

const CUISINES = [
  'Indian', 'Hyderabadi', 'Punjabi', 'Bengali', 'South Indian',
  'Italian', 'French', 'Japanese', 'Chinese', 'Mexican',
  'Mediterranean', 'Middle Eastern', 'Thai', 'Korean', 'Fusion',
];

const STEPS = ['Basics', 'Ingredients', 'Steps', 'Story & AI'];

// ─── Empty form template ────────────────────────────────────────────────────
const emptyForm = {
  title:       '',
  description: '',
  cuisineType: [],
  dietaryTags: [],
  difficulty:  'beginner',
  servings:    4,
  prepTime:    '',
  cookTime:    '',
  restTime:    '',
  ingredients: [{ name: '', quantity: '', unit: '', notes: '', isOptional: false }],
  steps:       [{ order: 1, instruction: '', duration: '', tips: '' }],
  emotionalContext: {
    story:          '',
    mood:           '',
    culturalOrigin: '',
    regionOfOrigin: '',
    occasion:       '',
  },
  dedication: {
    dedicatedTo:  '',
    relationship: '',
    message:      '',
  },
  familyLegacy: {
    isHeirloom:          false,
    estimatedGeneration: '',
    familyName:          '',
  },
  status:     'draft',
  visibility: 'public',
};

// ─── Sub-components ─────────────────────────────────────────────────────────

// Step indicator at the top
const StepTabs = ({ currentStep, onStepClick, completedSteps }) => (
  <div className="flex gap-1 mb-8 bg-parchment-100 p-1 rounded-xl overflow-x-auto">
    {STEPS.map((label, i) => {
      const isActive    = currentStep === i;
      const isCompleted = completedSteps.includes(i);
      return (
        <button
          key={i}
          onClick={() => onStepClick(i)}
          style={{
            flex: 1,
            padding: '0.625rem 1rem',
            borderRadius: '0.625rem',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.875rem',
            transition: 'all 0.2s',
            background: isActive
              ? 'var(--color-terracotta)'
              : isCompleted
                ? 'var(--color-sage-light)'
                : 'transparent',
            color: isActive
              ? 'white'
              : isCompleted
                ? 'var(--color-sage-dark)'
                : 'var(--color-ink-muted)',
          }}
        >
          {isCompleted && !isActive ? '✓ ' : `${i + 1}. `}{label}
        </button>
      );
    })}
  </div>
);

// Section header
const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-6">
    <h2 style={{
      fontFamily: 'var(--font-display)',
      fontSize: '1.75rem',
      fontWeight: 700,
      color: 'var(--color-ink)',
      marginBottom: '0.25rem',
    }}>
      {title}
    </h2>
    {subtitle && (
      <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>{subtitle}</p>
    )}
  </div>
);

// Field wrapper
const Field = ({ label, hint, children, required }) => (
  <div style={{ marginBottom: '1.25rem' }}>
    <label style={{
      display: 'block',
      fontWeight: 500,
      fontSize: '0.875rem',
      color: 'var(--color-ink)',
      marginBottom: '0.375rem',
    }}>
      {label} {required && <span style={{ color: 'var(--color-terracotta)' }}>*</span>}
    </label>
    {children}
    {hint && (
      <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginTop: '0.25rem' }}>
        {hint}
      </p>
    )}
  </div>
);

// ─── STEP 1: Basics ─────────────────────────────────────────────────────────
const Step1Basics = ({ form, update }) => {
  const toggleCuisine = (c) => {
    const current = form.cuisineType;
    update('cuisineType',
      current.includes(c) ? current.filter(x => x !== c) : [...current, c]
    );
  };

  return (
    <div>
      <SectionHeader
        title="The Recipe"
        subtitle="Start with the essentials — what is this dish?"
      />

      <Field label="Recipe Title" required>
        <input
          className="input"
          placeholder="e.g. Nani ki Biryani, Sunday Pasta, Monsoon Chai"
          value={form.title}
          onChange={e => update('title', e.target.value)}
        />
      </Field>

      <Field label="Description" hint="A one or two sentence introduction to the dish.">
        <textarea
          className="input"
          rows={3}
          placeholder="What makes this dish special? What will someone experience eating it?"
          value={form.description}
          onChange={e => update('description', e.target.value)}
          style={{ resize: 'vertical' }}
        />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Field label="Difficulty">
          <select className="input" value={form.difficulty} onChange={e => update('difficulty', e.target.value)}>
            {DIFFICULTIES.map(d => (
              <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
            ))}
          </select>
        </Field>

        <Field label="Servings">
          <input
            className="input" type="number" min={1} max={100}
            value={form.servings}
            onChange={e => update('servings', parseInt(e.target.value) || 1)}
          />
        </Field>

        <Field label="Prep Time (minutes)">
          <input
            className="input" type="number" min={0}
            placeholder="30"
            value={form.prepTime}
            onChange={e => update('prepTime', e.target.value)}
          />
        </Field>

        <Field label="Cook Time (minutes)">
          <input
            className="input" type="number" min={0}
            placeholder="60"
            value={form.cookTime}
            onChange={e => update('cookTime', e.target.value)}
          />
        </Field>
      </div>

      <Field label="Cuisine Type" hint="Select all that apply.">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
          {CUISINES.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => toggleCuisine(c)}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 500,
                border: '1px solid',
                cursor: 'pointer',
                transition: 'all 0.15s',
                borderColor: form.cuisineType.includes(c)
                  ? 'var(--color-terracotta)'
                  : 'rgba(44,31,14,0.15)',
                background: form.cuisineType.includes(c)
                  ? 'var(--color-terracotta)'
                  : 'white',
                color: form.cuisineType.includes(c)
                  ? 'white'
                  : 'var(--color-ink-muted)',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Visibility">
        <select
          className="input"
          value={form.visibility}
          onChange={e => update('visibility', e.target.value)}
        >
          <option value="public">Public — visible to everyone</option>
          <option value="connections_only">Connections only</option>
          <option value="private">Private — only you</option>
        </select>
      </Field>
    </div>
  );
};

// ─── STEP 2: Ingredients ────────────────────────────────────────────────────
const Step2Ingredients = ({ form, update }) => {
  const updateIngredient = (i, field, value) => {
    const updated = [...form.ingredients];
    updated[i] = { ...updated[i], [field]: value };
    update('ingredients', updated);
  };

  const addIngredient = () => {
    update('ingredients', [
      ...form.ingredients,
      { name: '', quantity: '', unit: '', notes: '', isOptional: false },
    ]);
  };

  const removeIngredient = (i) => {
    if (form.ingredients.length === 1) return;
    update('ingredients', form.ingredients.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <SectionHeader
        title="Ingredients"
        subtitle="List every ingredient your recipe needs."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {form.ingredients.map((ing, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 2fr auto',
              gap: '0.5rem',
              alignItems: 'center',
              background: 'white',
              border: '1px solid rgba(44,31,14,0.1)',
              borderRadius: '0.75rem',
              padding: '0.75rem',
            }}
          >
            <input
              className="input"
              placeholder="Ingredient name *"
              value={ing.name}
              onChange={e => updateIngredient(i, 'name', e.target.value)}
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
            />
            <input
              className="input"
              placeholder="Qty"
              value={ing.quantity}
              onChange={e => updateIngredient(i, 'quantity', e.target.value)}
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
            />
            <input
              className="input"
              placeholder="Unit"
              value={ing.unit}
              onChange={e => updateIngredient(i, 'unit', e.target.value)}
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
            />
            <input
              className="input"
              placeholder="Notes (optional)"
              value={ing.notes}
              onChange={e => updateIngredient(i, 'notes', e.target.value)}
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
            />
            <button
              type="button"
              onClick={() => removeIngredient(i)}
              style={{
                width: '2rem', height: '2rem',
                borderRadius: '50%',
                border: '1px solid rgba(193,97,79,0.3)',
                background: 'white',
                color: 'var(--color-terracotta)',
                cursor: form.ingredients.length === 1 ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: form.ingredients.length === 1 ? 0.3 : 1,
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addIngredient}
        style={{
          marginTop: '1rem',
          padding: '0.625rem 1.25rem',
          borderRadius: '0.75rem',
          border: '1.5px dashed var(--color-terracotta)',
          background: 'transparent',
          color: 'var(--color-terracotta)',
          fontWeight: 500,
          fontSize: '0.875rem',
          cursor: 'pointer',
          width: '100%',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.target.style.background = 'rgba(193,97,79,0.05)'}
        onMouseLeave={e => e.target.style.background = 'transparent'}
      >
        + Add Ingredient
      </button>
    </div>
  );
};

// ─── STEP 3: Steps ──────────────────────────────────────────────────────────
const Step3Steps = ({ form, update }) => {
  const updateStep = (i, field, value) => {
    const updated = [...form.steps];
    updated[i] = { ...updated[i], [field]: value };
    update('steps', updated);
  };

  const addStep = () => {
    update('steps', [
      ...form.steps,
      { order: form.steps.length + 1, instruction: '', duration: '', tips: '' },
    ]);
  };

  const removeStep = (i) => {
    if (form.steps.length === 1) return;
    const updated = form.steps
      .filter((_, idx) => idx !== i)
      .map((s, idx) => ({ ...s, order: idx + 1 }));
    update('steps', updated);
  };

  const moveStep = (i, direction) => {
    const updated = [...form.steps];
    const target  = i + direction;
    if (target < 0 || target >= updated.length) return;
    [updated[i], updated[target]] = [updated[target], updated[i]];
    updated.forEach((s, idx) => { s.order = idx + 1; });
    update('steps', updated);
  };

  return (
    <div>
      <SectionHeader
        title="Cooking Steps"
        subtitle="Walk someone through making this dish, step by step."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {form.steps.map((step, i) => (
          <div
            key={i}
            style={{
              background: 'white',
              border: '1px solid rgba(44,31,14,0.1)',
              borderRadius: '0.75rem',
              padding: '1rem',
            }}
          >
            {/* Step header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: '2rem', height: '2rem',
                borderRadius: '50%',
                background: 'var(--color-terracotta)',
                color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.875rem',
                flexShrink: 0,
              }}>
                {step.order}
              </div>
              <div style={{ flex: 1 }} />
              {/* Move buttons */}
              <button type="button" onClick={() => moveStep(i, -1)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)', fontSize: '1rem' }}>
                ↑
              </button>
              <button type="button" onClick={() => moveStep(i, 1)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)', fontSize: '1rem' }}>
                ↓
              </button>
              <button
                type="button" onClick={() => removeStep(i)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-terracotta)', fontSize: '1.1rem',
                  opacity: form.steps.length === 1 ? 0.3 : 1,
                }}
              >
                ×
              </button>
            </div>

            <textarea
              className="input"
              rows={3}
              placeholder={`Describe step ${step.order} in detail…`}
              value={step.instruction}
              onChange={e => updateStep(i, 'instruction', e.target.value)}
              style={{ resize: 'vertical', marginBottom: '0.5rem', fontSize: '0.9rem' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <input
                className="input"
                placeholder="Duration (e.g. 15 minutes)"
                value={step.duration}
                onChange={e => updateStep(i, 'duration', e.target.value)}
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
              />
              <input
                className="input"
                placeholder="Pro tip (optional)"
                value={step.tips}
                onChange={e => updateStep(i, 'tips', e.target.value)}
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button" onClick={addStep}
        style={{
          marginTop: '1rem',
          padding: '0.625rem 1.25rem',
          borderRadius: '0.75rem',
          border: '1.5px dashed var(--color-terracotta)',
          background: 'transparent',
          color: 'var(--color-terracotta)',
          fontWeight: 500, fontSize: '0.875rem',
          cursor: 'pointer', width: '100%',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.target.style.background = 'rgba(193,97,79,0.05)'}
        onMouseLeave={e => e.target.style.background = 'transparent'}
      >
        + Add Step
      </button>
    </div>
  );
};

// ─── STEP 4: Story & AI Panel ────────────────────────────────────────────────
const Step4Story = ({ form, update, updateNested }) => {
  const { streamedText, isStreaming, error, startStream, stopStream, reset } = useGroqStream();
  const [prompts,        setPrompts]        = useState([]);
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [aiPanelOpen,    setAiPanelOpen]    = useState(true);

  // Load story-starter prompts when this step mounts
  useEffect(() => {
    if (form.title) loadPrompts();
  }, []);

  const loadPrompts = async () => {
    if (!form.title) return;
    setPromptsLoading(true);
    try {
      const res = await aiAPI.getStoryPrompts({
        title:          form.title,
        culturalOrigin: form.emotionalContext.culturalOrigin,
        mood:           form.emotionalContext.mood,
        dedication:     form.dedication,
      });
      setPrompts(res.data.data.prompts || []);
    } catch {
      setPrompts([]);
    } finally {
      setPromptsLoading(false);
    }
  };

  const handleGenerateStory = async () => {
    reset();
    await startStream(() =>
      aiAPI.streamStory({
        title:          form.title,
        ingredients:    form.ingredients.filter(i => i.name),
        culturalOrigin: form.emotionalContext.culturalOrigin,
        mood:           form.emotionalContext.mood,
        dedication:     form.dedication,
      })
    );
  };

  const handleUseStory = () => {
    updateNested('emotionalContext', 'story', streamedText);
    updateNested('emotionalContext', 'isAIGenerated', true);
    reset();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

      {/* ── LEFT: Emotional context form ── */}
      <div>
        <SectionHeader
          title="The Story"
          subtitle="This is Chef's Diary's heart — the memory behind the dish."
        />

        <Field label="Mood">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {MOODS.map(m => (
              <button
                key={m.value} type="button"
                onClick={() => updateNested('emotionalContext', 'mood', m.value)}
                style={{
                  padding: '0.3rem 0.7rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  border: '1px solid',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  borderColor: form.emotionalContext.mood === m.value
                    ? 'var(--color-saffron)' : 'rgba(44,31,14,0.15)',
                  background: form.emotionalContext.mood === m.value
                    ? 'var(--color-saffron)' : 'white',
                  color: form.emotionalContext.mood === m.value
                    ? 'var(--color-ink)' : 'var(--color-ink-muted)',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Cultural Origin" hint="e.g. Hyderabadi, Sicilian, Bengali">
          <input
            className="input"
            placeholder="Where does this dish come from?"
            value={form.emotionalContext.culturalOrigin}
            onChange={e => updateNested('emotionalContext', 'culturalOrigin', e.target.value)}
          />
        </Field>

        <Field label="Occasion" hint="When is this dish made? e.g. Eid morning, Sunday brunch">
          <input
            className="input"
            placeholder="The moment this dish belongs to"
            value={form.emotionalContext.occasion}
            onChange={e => updateNested('emotionalContext', 'occasion', e.target.value)}
          />
        </Field>

        {/* Dedication */}
        <div style={{
          background: 'rgba(230,168,23,0.08)',
          border: '1px solid rgba(230,168,23,0.25)',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1.25rem',
        }}>
          <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-ink)', marginBottom: '0.75rem' }}>
            🕯️ Dedication (optional)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              className="input"
              placeholder="Dedicated to..."
              value={form.dedication.dedicatedTo}
              onChange={e => updateNested('dedication', 'dedicatedTo', e.target.value)}
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
            />
            <input
              className="input"
              placeholder="Relationship"
              value={form.dedication.relationship}
              onChange={e => updateNested('dedication', 'relationship', e.target.value)}
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
            />
          </div>
          <textarea
            className="input"
            rows={2}
            placeholder="A message for them..."
            value={form.dedication.message}
            onChange={e => updateNested('dedication', 'message', e.target.value)}
            style={{ resize: 'none', fontSize: '0.85rem' }}
          />
        </div>

        <Field label="Your Story" hint="Write your memory, or use AI to generate one →">
          <textarea
            className="input"
            rows={8}
            placeholder="Every Sunday morning I would wake up to the smell of whole spices..."
            value={form.emotionalContext.story}
            onChange={e => updateNested('emotionalContext', 'story', e.target.value)}
            style={{ resize: 'vertical', lineHeight: 1.7 }}
          />
        </Field>
      </div>

      {/* ── RIGHT: AI Story Panel ── */}
      <div>
        <div style={{
          background: 'linear-gradient(135deg, #fdfaf4 0%, rgba(230,168,23,0.06) 100%)',
          border: '1px solid rgba(230,168,23,0.25)',
          borderRadius: '1rem',
          padding: '1.25rem',
          position: 'sticky',
          top: '5rem',
        }}>
          {/* Panel header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.25rem' }}>✨</span>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'var(--color-ink)',
            }}>
              AI Story Generator
            </h3>
            <span style={{
              marginLeft: 'auto',
              fontSize: '0.7rem',
              background: 'var(--color-saffron)',
              color: 'var(--color-ink)',
              padding: '0.15rem 0.5rem',
              borderRadius: '9999px',
              fontWeight: 600,
            }}>
              Powered by Groq
            </span>
          </div>

          {/* Story prompts */}
          {prompts.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Story starters — click to use
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {prompts.map((prompt, i) => (
                  <button
                    key={i} type="button"
                    onClick={() => updateNested('emotionalContext', 'story', prompt + ' ')}
                    style={{
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(44,31,14,0.1)',
                      background: 'white',
                      fontSize: '0.8rem',
                      color: 'var(--color-ink)',
                      cursor: 'pointer',
                      lineHeight: 1.5,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-saffron)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(44,31,14,0.1)'}
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {promptsLoading && (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', marginBottom: '1rem' }}>
              Loading story starters…
            </p>
          )}

          {/* Generate button */}
          <button
            type="button"
            onClick={isStreaming ? stopStream : handleGenerateStory}
            disabled={!form.title}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.75rem',
              border: 'none',
              background: isStreaming
                ? 'var(--color-ink)'
                : !form.title
                  ? '#ccc'
                  : 'var(--color-terracotta)',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: !form.title ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginBottom: '1rem',
            }}
          >
            {isStreaming
              ? '⏹ Stop Generating'
              : '✨ Generate My Story'
            }
          </button>

          {!form.title && (
            <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', textAlign: 'center', marginBottom: '1rem' }}>
              Add a recipe title in Step 1 first
            </p>
          )}

          {/* Streaming output */}
          {(streamedText || isStreaming) && (
            <div style={{
              background: 'white',
              border: '1px solid rgba(44,31,14,0.1)',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '1rem',
              minHeight: '8rem',
            }}>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--color-ink)',
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
              }}>
                {streamedText}
                {isStreaming && (
                  <span style={{
                    display: 'inline-block',
                    width: '2px',
                    height: '1em',
                    background: 'var(--color-terracotta)',
                    marginLeft: '2px',
                    animation: 'blink 0.7s step-end infinite',
                    verticalAlign: 'text-bottom',
                  }} />
                )}
              </p>
            </div>
          )}

          {/* Use story button — appears when streaming is done */}
          {streamedText && !isStreaming && (
            <button
              type="button"
              onClick={handleUseStory}
              style={{
                width: '100%',
                padding: '0.625rem',
                borderRadius: '0.75rem',
                border: '1.5px solid var(--color-sage)',
                background: 'var(--color-sage-light)',
                color: 'var(--color-sage-dark)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '0.5rem',
              }}
            >
              ✓ Use This Story
            </button>
          )}

          {streamedText && !isStreaming && (
            <button
              type="button"
              onClick={() => { reset(); handleGenerateStory(); }}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(44,31,14,0.1)',
                background: 'transparent',
                color: 'var(--color-ink-muted)',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              ↺ Regenerate
            </button>
          )}

          {error && (
            <p style={{ color: 'var(--color-terracotta)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── MAIN PAGE COMPONENT ─────────────────────────────────────────────────────
export const RecipeEditorPage = ({ toast }) => {
  const { isAuthenticated } = UseAuthStore();
  const navigate = useNavigate();

  const [currentStep,    setCurrentStep]    = useState(0);
  const [form,           setForm]           = useState(emptyForm);
  const [saving,         setSaving]         = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated]);

  // ── Form update helpers ────────────────────────────────────────
  const update = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateNested = useCallback((parent, field, value) => {
    setForm(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
    }));
  }, []);

  // ── Step navigation ────────────────────────────────────────────
  const goToStep = (i) => {
    // Mark current step as completed when navigating forward
    if (i > currentStep) {
      setCompletedSteps(prev => [...new Set([...prev, currentStep])]);
    }
    setCurrentStep(i);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextStep = () => {
    if (currentStep === 0 && !form.title.trim()) {
      toast?.error('Please add a recipe title before continuing.');
      return;
    }
    if (currentStep === 1) {
      const hasIngredients = form.ingredients.some(i => i.name.trim());
      if (!hasIngredients) {
        toast?.error('Please add at least one ingredient.');
        return;
      }
    }
    if (currentStep === 2) {
      const hasSteps = form.steps.some(s => s.instruction.trim());
      if (!hasSteps) {
        toast?.error('Please add at least one cooking step.');
        return;
      }
    }
    goToStep(currentStep + 1);
  };

  // ── Save handlers ──────────────────────────────────────────────
  const buildPayload = (status) => {
    // Clean up empty ingredients and steps
    const cleanIngredients = form.ingredients.filter(i => i.name.trim());
    const cleanSteps       = form.steps
      .filter(s => s.instruction.trim())
      .map((s, i) => ({ ...s, order: i + 1 }));

    return {
      ...form,
      ingredients: cleanIngredients,
      steps:       cleanSteps,
      prepTime:    form.prepTime ? parseInt(form.prepTime) : null,
      cookTime:    form.cookTime ? parseInt(form.cookTime) : null,
      restTime:    form.restTime ? parseInt(form.restTime) : null,
      status,
    };
  };

  const handleSaveDraft = async () => {
    if (!form.title.trim()) {
      toast?.error('Please add a title to save a draft.');
      return;
    }
    setSaving(true);
    try {
      const res = await recipeAPI.create(buildPayload('draft'));
      toast?.success('Draft saved!');
      navigate(`/recipe/${res.data.data.recipe.slug}`);
    } catch (err) {
      toast?.error(err.response?.data?.message || 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!form.title.trim()) {
      toast?.error('Please add a recipe title.');
      return;
    }
    const hasIngredients = form.ingredients.some(i => i.name.trim());
    const hasSteps       = form.steps.some(s => s.instruction.trim());
    if (!hasIngredients || !hasSteps) {
      toast?.error('Please add ingredients and steps before publishing.');
      return;
    }
    setSaving(true);
    try {
      const res = await recipeAPI.create(buildPayload('published'));
      toast?.success('Recipe published!');
      navigate(`/recipe/${res.data.data.recipe.slug}`);
    } catch (err) {
      toast?.error(err.response?.data?.message || 'Failed to publish recipe.');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-parchment)' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>

        {/* Page header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--color-saffron)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '0.25rem',
          }}>
            New Recipe
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.5rem',
            fontWeight: 700,
            color: 'var(--color-ink)',
          }}>
            Share Your Story
          </h1>
        </div>

        {/* Step tabs */}
        <StepTabs
          currentStep={currentStep}
          onStepClick={goToStep}
          completedSteps={completedSteps}
        />

        {/* Step content */}
        <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          {currentStep === 0 && <Step1Basics    form={form} update={update} />}
          {currentStep === 1 && <Step2Ingredients form={form} update={update} />}
          {currentStep === 2 && <Step3Steps     form={form} update={update} />}
          {currentStep === 3 && (
            <Step4Story
              form={form}
              update={update}
              updateNested={updateNested}
            />
          )}
        </div>

        {/* Navigation footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          {/* Back */}
          <div>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep(s => s - 1)}
                className="btn-secondary"
              >
                ← Back
              </button>
            )}
          </div>

          {/* Right side actions */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Save draft — available from step 1 onwards */}
            {currentStep >= 0 && (
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="btn-secondary"
              >
                {saving ? 'Saving…' : '💾 Save Draft'}
              </button>
            )}

            {/* Next step or Publish */}
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn-primary"
              >
                Next: {STEPS[currentStep + 1]} →
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                disabled={saving}
                style={{
                  padding: '0.625rem 2rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: saving ? '#ccc' : 'var(--color-ink)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {saving ? 'Publishing…' : '🚀 Publish Recipe'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};