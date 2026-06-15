// client/src/components/ui/TranslationModule.jsx
import { useState } from 'react';
import { aiAPI } from '../../api/ai.api';

const LANGUAGES = [
  { code: 'en', label: 'English (Original)' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'it', label: 'Italian' },
  { code: 'de', label: 'German' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ja', label: 'Japanese' },
];

export function TranslationModule({ recipe, onTranslate, toast }) {
  const [loading, setLoading] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');

  const handleTranslate = async (lang) => {
    setCurrentLang(lang);
    if (lang === 'en') {
      onTranslate(null); // Revert to original
      return;
    }

    setLoading(true);
    try {
      const targetLabel = LANGUAGES.find(l => l.code === lang).label;
      const res = await aiAPI.translateRecipe({ recipe, targetLanguage: targetLabel });
      onTranslate(res.data.data);
      toast?.success(`Translated to ${targetLabel}`);
    } catch (err) {
      toast?.error('Failed to translate recipe.');
      setCurrentLang('en');
      onTranslate(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontSize: '1.2rem', title: 'Translate Recipe' }}>🌍</span>
      <select
        value={currentLang}
        onChange={(e) => handleTranslate(e.target.value)}
        disabled={loading}
        style={{
          padding: '0.4rem 1.5rem 0.4rem 0.75rem',
          borderRadius: '0.5rem',
          border: '1px solid rgba(44,31,14,0.15)',
          fontSize: '0.85rem',
          fontWeight: 500,
          color: 'var(--color-ink)',
          background: loading ? 'rgba(44,31,14,0.05)' : 'white',
          cursor: loading ? 'wait' : 'pointer',
          outline: 'none',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%232c1f0e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.5rem center',
          backgroundSize: '1rem',
        }}
      >
        {LANGUAGES.map(l => (
          <option key={l.code} value={l.code}>
            {loading && currentLang === l.code ? 'Translating...' : l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
