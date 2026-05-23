// src/api/axiosInstance.js — Configured Axios singleton
//
// This single instance is imported by all API modules.
// The interceptors run automatically on every request/response.

import axios from 'axios';
import useAuthStore from '../store/authStore';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 15000, // 15 second timeout — generous for AI endpoints
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor ────────────────────────────────────────────
// Automatically attaches the JWT token to every outgoing request.
// Without this, every API call would need to manually add the header.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ───────────────────────────────────────────
// Handles 401 responses globally — logs out the user when the token expires.
// Without this, expired tokens would cause confusing failures across the app.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — force logout
      useAuthStore.getState().logout();
      // Redirect to home (using window.location since we're outside React)
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;