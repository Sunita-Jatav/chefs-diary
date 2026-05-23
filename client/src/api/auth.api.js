// src/api/auth.api.js
import api from './axiosInstance';

export const authAPI = {
  register: (data)        => api.post('/api/auth/register', data),
  login:    (data)        => api.post('/api/auth/login',    data),
  getMe:    ()            => api.get('/api/auth/me'),
  updateProfile: (data)   => api.patch('/api/auth/profile', data),
  changePassword: (data)  => api.patch('/api/auth/change-password', data),
};