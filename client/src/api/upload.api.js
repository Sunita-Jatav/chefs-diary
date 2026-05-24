// src/api/upload.api.js
import useAuthStore from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// We use fetch with FormData instead of axios because
// axios requires extra config for multipart/form-data.
const uploadFile = async (endpoint, file) => {
  const token   = useAuthStore.getState().token;
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_URL}${endpoint}`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}` },
    body:    formData,
  });

  const data = await response.json();
  if (!data.success) throw new Error(data.message || 'Upload failed');
  return data;
};

export const uploadAPI = {
  recipeImage: (file) => uploadFile('/api/upload/recipe-image', file),
  avatar:      (file) => uploadFile('/api/upload/avatar',       file),
  cover:       (file) => uploadFile('/api/upload/cover',        file),
};