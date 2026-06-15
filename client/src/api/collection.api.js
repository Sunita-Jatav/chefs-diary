import { api } from './axios.config';

export const collectionAPI = {
  create: (data) => api.post('/api/collections', data),
  getMyCollections: () => api.get('/api/collections'),
  getById: (id) => api.get(`/api/collections/${id}`),
  toggleRecipe: (collectionId, recipeId) => 
    api.post(`/api/collections/${collectionId}/toggle`, { recipeId }),
  delete: (id) => api.delete(`/api/collections/${id}`),
};
