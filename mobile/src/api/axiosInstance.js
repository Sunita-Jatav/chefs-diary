import axios from 'axios';
import UseAuthStore from '../store/useAuthStore';
import { router } from 'expo-router';

const axiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = UseAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      UseAuthStore.getState().logout();
      router.replace('/');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
