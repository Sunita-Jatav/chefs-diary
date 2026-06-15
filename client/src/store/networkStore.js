// client/src/store/networkStore.js
import { create } from 'zustand';
import api from '../api/axiosInstance'; // your existing axios instance

const useNetworkStore = create((set, get) => ({
  posts: [],
  page: 1,
  hasMore: true,
  loading: false,
  filter: 'all',

  setFilter: (filter) => set({ filter, posts: [], page: 1, hasMore: true }),

  fetchPosts: async (reset = false) => {
    const { filter, page, loading, hasMore } = get();
    if (loading || (!hasMore && !reset)) return;

    const currentPage = reset ? 1 : page;
    set({ loading: true });

    try {
      const { data } = await api.get('/api/network/feed', {
        params: { type: filter, page: currentPage },
      });

      set(state => ({
        posts: reset ? data.posts : [...state.posts, ...data.posts],
        page: currentPage + 1,
        hasMore: data.hasMore,
        loading: false,
      }));
    } catch (err) {
      set({ loading: false });
    }
  },

  createPost: async (payload) => {
    const { data } = await api.post('/api/network/posts', payload);
    set(state => ({ posts: [data, ...state.posts] }));
    return data;
  },

  deletePost: async (id) => {
    await api.delete(`/api/network/posts/${id}`);
    set(state => ({ posts: state.posts.filter(p => p._id !== id) }));
  },

  toggleLike: async (id) => {
    const { data } = await api.post(`/api/network/posts/${id}/like`);
    set(state => ({
      posts: state.posts.map(p =>
        p._id === id ? { ...p, isLiked: data.liked, likeCount: data.likeCount } : p
      ),
    }));
  },
}));

export default useNetworkStore;