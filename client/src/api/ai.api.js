// src/api/ai.api.js
// Note: SSE streaming endpoints use fetch(), not axios.
// Axios doesn't support SSE natively — fetch() with a ReadableStream does.
// The non-streaming endpoints (prompts, substitutions) use axios normally.

import api from './axiosInstance';
import useAuthStore from '../store/useAuthStore';

export const aiAPI = {
  // Non-streaming — use axios
  getStoryPrompts:   (data) => api.post('/api/ai/story/prompts', data),
  getSubstitutions:  (data) => api.post('/api/ai/substitutions', data),
  translateRecipe:   (data) => api.post('/api/ai/translate', data),

  // Streaming — use fetch() with SSE
  // These return a Response object; the caller uses a ReadableStream to consume tokens
  streamStory: async (data) => {
    const token = useAuthStore.getState().token;
    return fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai/story/stream`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  },

  streamAssistant: async (data) => {
    const token = useAuthStore.getState().token;
    return fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai/assistant/stream`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  },
};