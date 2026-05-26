// src/store/authStore.js — Zustand global auth state
//
// WHY Zustand over Context API?
// Context re-renders every component subscribed to it on any state change.
// Zustand uses selector subscriptions — components only re-render when
// the specific slice of state they care about changes.
// For auth state read by 50+ components, this is a meaningful performance win.


import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const UseAuthStore = create(
  // persist middleware saves the store to localStorage automatically.
  // On page refresh, the user stays logged in without an extra API call.
  persist(
    (set, get) => ({
      // ── State ───────────────────────────────────────────────────
      user:            null,
      token:           null,
      isAuthenticated: false,
      isLoading:       false,

      // ── Actions ─────────────────────────────────────────────────

      // Called after successful login or register API response
      login: (userData, token) => {
        set({
          user:            userData,
          token:           token,
          isAuthenticated: true,
        });
      },

      // Called on logout button or 401 response from API
      logout: () => {
        set({
          user:            null,
          token:           null,
          isAuthenticated: false,
        });
      },

      // Called after profile update API response
      updateUser: (updatedFields) => {
        set((state) => ({
          user: { ...state.user, ...updatedFields },
        }));
      },

      setLoading: (loading) => set({ isLoading: loading }),

      // Convenience getter — avoids importing user and checking null everywhere
      isOwner: (authorId) => {
        const { user } = get();
        return user && user.id === authorId?.toString();
      },
    }),
    {
      name:    'chefs-diary-auth', // localStorage key
      // Only persist token and user — not loading state
      partialize: (state) => ({
        user:            state.user,
        token:           state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default UseAuthStore ;