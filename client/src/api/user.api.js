// src/api/user.api.js
import api from './axiosInstance';

export const userAPI = {
  getUserActivity: (username) => api.get(`/api/users/${username}/activity`),
  getUserStats: (username) => api.get(`/api/users/${username}/stats`),
};
