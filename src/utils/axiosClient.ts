import axios, { AxiosError, AxiosResponse } from 'axios';
import { supabase } from './supabaseClient';

// ✅ FIX: Use import.meta.env instead of process.env
const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const axiosClient = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosClient.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.warn('⚠️ Session error:', error);
        return config;
      }

      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (err) {
      console.error('❌ Error getting session:', err);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError) {
          console.error('❌ Refresh failed:', refreshError);
          return Promise.reject(error);
        }

        if (data?.session?.access_token) {
          originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`;
          return axiosClient(originalRequest);
        }
      } catch (refreshErr) {
        console.error('❌ Refresh error:', refreshErr);
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
