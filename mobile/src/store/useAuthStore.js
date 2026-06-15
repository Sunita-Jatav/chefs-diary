import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UseAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: (userData, token) => {
        set({
          user: userData,
          token: token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      updateUser: (updatedFields) => {
        set((state) => ({
          user: { ...state.user, ...updatedFields },
        }));
      },

      setLoading: (loading) => set({ isLoading: loading }),

      isOwner: (authorId) => {
        const { user } = get();
        return user && user.id === authorId?.toString();
      },
    }),
    {
      name: 'chefs-diary-auth-mobile',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default UseAuthStore;
