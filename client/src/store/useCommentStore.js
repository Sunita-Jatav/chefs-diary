// store/useCommentStore.js
import { create } from 'zustand';
import api from '../lib/axios';

export const useCommentStore = create((set) => ({
  comments: [],
  loading: false,
  fetchComments: async (recipeId) => {
    set({ loading: true });
    const { data } = await api.get(`/recipes/${recipeId}/comments`);
    set({ comments: data, loading: false });
  },
  addComment: async (recipeId, text, parentComment = null) => {
    const { data } = await api.post(`/recipes/${recipeId}/comments`, { text, parentComment });
    set((s) => ({ comments: [data, ...s.comments] }));
  },
  deleteComment: async (recipeId, commentId) => {
    await api.delete(`/recipes/${recipeId}/comments/${commentId}`);
    set((s) => ({ comments: s.comments.filter((c) => c._id !== commentId) }));
  },
}));

export default useCommentStore;