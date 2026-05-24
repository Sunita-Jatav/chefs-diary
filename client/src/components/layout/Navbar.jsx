// src/components/layout/Navbar.jsx
import { useState }    from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore    from '../../store/authStore';
import { AuthModal }   from '../ui/AuthModal';
import { Settings } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showAuth,   setShowAuth]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-parchment/90 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🍳</span>
            <span className="font-display text-xl font-bold text-ink group-hover:text-terracotta transition-colors">
              Chef's Diary
            </span>
          </Link>

          {/* Center nav links */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/"         className="btn-ghost text-sm">Discover</Link>
            <Link to="/network"  className="btn-ghost text-sm">Network</Link>
            {isAuthenticated && (
              <Link to="/recipe/new" className="btn-ghost text-sm">+ Recipe</Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="w-9 h-9 rounded-full bg-terracotta flex items-center justify-center text-white text-sm font-medium font-body">
                    {user?.displayName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="hidden sm:block font-body text-sm text-ink">
                    {user?.displayName?.split(' ')[0]}
                  </span>
                </button>

                {/* Dropdown */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 card py-2 fade-in">
                    <Link
                      to={`/@${user?.username}`}
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm font-body text-ink hover:bg-parchment-100"
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/recipe/new"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm font-body text-ink hover:bg-parchment-100"
                    >
                      New Recipe
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm font-body text-ink hover:bg-parchment-100"
                    >
                      <Settings className="inline mr-2" />
                      Settings
                    </Link>
                    <hr className="my-1 border-[var(--border)]" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm font-body text-terracotta hover:bg-parchment-100"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="btn-primary text-sm py-2 px-5"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
};