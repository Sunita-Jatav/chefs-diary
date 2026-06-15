// src/components/ui/AuthModal.jsx
// Login + Register in one modal — tab-switched.

import { useState } from 'react';
import { authAPI }  from '../../api/auth.api';
import useAuthStore from '../../store/useAuthStore';

export const AuthModal = ({ onClose }) => {
  const [tab,     setTab]     = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const login = useAuthStore(s => s.login);

  const [form, setForm] = useState({
    email: '', password: '', username: '', displayName: '', role: 'home_cook',
  });

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = tab === 'login'
        ? await authAPI.login({ email: form.email, password: form.password })
        : await authAPI.register(form);

      const { token, user } = res.data.data;
      login(user, token);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal card */}
      <div
        className="card p-8 w-full max-w-md mx-4 fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="font-display text-3xl font-bold text-ink">
            Chef's Diary
          </h2>
          <p className="text-ink-muted text-sm mt-1">
            Where recipes become memories
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-parchment-100 rounded-xl p-1 mb-6">
          {['login', 'register'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium font-body transition-all ${
                tab === t
                  ? 'bg-white shadow-warm-sm text-ink'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {t === 'login' ? 'Sign In' : 'Join'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <>
              <input
                name="displayName" placeholder="Your full name"
                value={form.displayName} onChange={handleChange}
                className="input" required
              />
              <input
                name="username" placeholder="Username (e.g. chef_arjun)"
                value={form.username} onChange={handleChange}
                className="input" required
              />
              <select
                name="role" value={form.role} onChange={handleChange}
                className="input"
              >
                <option value="home_cook">Home Cook</option>
                <option value="professional_chef">Professional Chef</option>
                <option value="food_blogger">Food Blogger</option>
                <option value="culinary_student">Culinary Student</option>
              </select>
            </>
          )}

          <input
            name="email" type="email" placeholder="Email address"
            value={form.email} onChange={handleChange}
            className="input" required
          />
          <input
            name="password" type="password" placeholder="Password"
            value={form.password} onChange={handleChange}
            className="input" required
          />

          {error && (
            <p className="text-terracotta text-sm font-body bg-terracotta/10 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit" disabled={loading}
            className="btn-primary w-full justify-center disabled:opacity-60"
          >
            {loading
              ? 'Please wait…'
              : tab === 'login' ? 'Sign In' : 'Create Account'
            }
          </button>
        </form>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-muted hover:text-ink text-xl leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
};