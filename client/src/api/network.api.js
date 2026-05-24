// src/api/network.api.js
import api from './axiosInstance';

export const networkAPI = {
  toggleFollow:    (userId) => api.post(`/api/network/follow/${userId}`),
  getFollowStatus: (userId) => api.get(`/api/network/follow-status/${userId}`),
  getFollowers:    (userId, params) => api.get(`/api/network/followers/${userId}`, { params }),
  getFollowing:    (userId, params) => api.get(`/api/network/following/${userId}`, { params }),
  getSuggestions:  ()       => api.get('/api/network/suggestions'),
};