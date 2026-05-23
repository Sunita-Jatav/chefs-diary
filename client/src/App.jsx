// src/App.jsx — Root component with routing
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar }    from './components/layout/Navbar';
import { HomePage }  from './pages/HomePage';
import { useToast }  from './hooks/useToast';
import { ToastContainer } from './components/ui/Toast';

// Lazy-load heavier pages to keep the initial bundle small
import { lazy, Suspense } from 'react';
const RecipeEditorPage = lazy(() => import('./pages/RecipeEditorPage').then(m => ({ default: m.RecipeEditorPage })));
const RecipePage       = lazy(() => import('./pages/RecipePage').then(m => ({ default: m.RecipePage })));
const ChefProfilePage  = lazy(() => import('./pages/ChefProfilePage').then(m => ({ default: m.ChefProfilePage })));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-4xl animate-pulse">🍳</div>
  </div>
);

function App() {
  const { toasts, toast } = useToast();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-parchment">
        <Navbar />

        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"             element={<HomePage />} />
            <Route path="/recipe/new"   element={<RecipeEditorPage toast={toast} />} />
            <Route path="/recipe/:slug" element={<RecipePage toast={toast} />} />
            <Route path="/@:username"   element={<ChefProfilePage />} />
            <Route path="*"             element={
              <div className="min-h-screen flex items-center justify-center text-center px-4">
                <div>
                  <p className="font-display text-6xl mb-4">404</p>
                  <p className="font-body text-ink-muted">This page doesn't exist.</p>
                </div>
              </div>
            } />
          </Routes>
        </Suspense>

        <ToastContainer toasts={toasts} />
      </div>
    </BrowserRouter>
  );
}

export default App;