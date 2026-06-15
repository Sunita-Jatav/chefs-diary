// src/api/recipe.api.js
import api from './axiosInstance';

export const recipeAPI = {
  // Public
  getAll:      (params)       => api.get('/api/recipes', { params }),
  getBySlug:   (slug)         => api.get(`/api/recipes/${slug}`),
  getByUser:   (username, params) => api.get(`/api/recipes/user/${username}`, { params }),

  // Protected
  getMyRecipes:(params)       => api.get('/api/recipes/my/drafts', { params }),
  create:      (data)         => api.post('/api/recipes', data),
  update:      (id, data)     => api.put(`/api/recipes/${id}`, data),
  delete:      (id)           => api.delete(`/api/recipes/${id}`),
  toggleLike:  (id)           => api.post(`/api/recipes/${id}/like`),
  toggleSave:  (id)           => api.post(`/api/recipes/${id}/save`),
  rateRecipe:  (id, rating)   => api.post(`/api/recipes/${id}/rate`, { rating }),
};